package com.healclaim.backend.service;

import com.healclaim.backend.dto.request.*;
import com.healclaim.backend.dto.response.*;
import com.healclaim.backend.entity.*;
import com.healclaim.backend.enums.*;
import com.healclaim.backend.exception.*;
import com.healclaim.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository              claimRepository;
    private final ClaimDocumentRepository      claimDocumentRepository;
    private final ClaimStatusHistoryRepository statusHistoryRepository;
    private final DocumentRequestRepository    documentRequestRepository;
    private final PatientProfileRepository     patientProfileRepository;
    private final HospitalProfileRepository    hospitalProfileRepository;
    private final InsurerProfileRepository     insurerProfileRepository;
    private final PatientService               patientService;
    private final EmailService                 emailService;
    private final AIPredictionService          aiPredictionService;

    @Transactional
    public Claim createClaim(UUID hospitalUserId, CreateClaimRequest req) {
        HospitalProfile hospital = hospitalProfileRepository.findByUserId(hospitalUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found."));

        PatientProfile patient = patientService.getProfileByQrToken(req.getPatientQrToken());

        Claim claim = claimRepository.save(Claim.builder()
                .patient(patient)
                .hospital(hospital)
                .insurer(patient.getActivePolicy() != null
                        ? patient.getActivePolicy().getInsurer() : null)
                .policy(patient.getActivePolicy())
                .status(ClaimStatus.DRAFT)
                .treatmentDescription(req.getTreatmentDescription())
                .admissionDate(LocalDate.parse(req.getAdmissionDate()))
                .dischargeDate(LocalDate.parse(req.getDischargeDate()))
                .claimedAmount(req.getClaimedAmount())
                .diagnosisCode(req.getDiagnosisCode())
                .build());

        recordHistory(claim, null, ClaimStatus.DRAFT, hospital.getUser(), null);
        return claim;
    }

    @Transactional
    public Claim submitBundle(UUID claimId, UUID hospitalUserId) {
        Claim claim = getClaim(claimId);
        HospitalProfile hospital = hospitalProfileRepository.findByUserId(hospitalUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found."));

        if (claim.getStatus() != ClaimStatus.DRAFT) {
            throw new InvalidStateException("Only DRAFT claims can be submitted.");
        }

        claim.setStatus(ClaimStatus.PENDING_DECISION);
        claimRepository.save(claim);
        recordHistory(claim, ClaimStatus.DRAFT, ClaimStatus.PENDING_DECISION, hospital.getUser(), null);

        // Notify patient
        emailService.sendDecisionRequiredEmail(
                claim.getPatient().getUser().getEmail(),
                claim.getPatient().getFullName(),
                claim.getHospital().getHospitalName()
        );
        aiPredictionService.generatePredictions(claim);

        return claim;
    }

    @Transactional
    public Claim makeDecision(UUID claimId, UUID patientUserId, ClaimDecisionRequest req) {
        Claim claim = getClaim(claimId);
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found."));

        if (claim.getStatus() != ClaimStatus.PENDING_DECISION) {
            throw new InvalidStateException("Decision can only be made on PENDING_DECISION claims.");
        }
        if (!claim.getPatient().getId().equals(patient.getId())) {
            throw new UnauthorizedException("You are not the patient on this claim.");
        }

        claim.setPaymentChoice(req.getChoice());

        if (req.getChoice() == PaymentChoice.CASH) {
            claim.setStatus(ClaimStatus.CASH_PAID);
            recordHistory(claim, ClaimStatus.PENDING_DECISION, ClaimStatus.CASH_PAID,
                    patient.getUser(), "Patient chose cash payment.");
        } else {
            if (claim.getInsurer() == null) {
                throw new InvalidStateException("No insurer linked — cannot proceed with insurance.");
            }
            claim.setStatus(ClaimStatus.SUBMITTED_TO_INSURER);
            recordHistory(claim, ClaimStatus.PENDING_DECISION, ClaimStatus.SUBMITTED_TO_INSURER,
                    patient.getUser(), "Patient chose insurance.");

            // Trigger AI predictions async

        }

        return claimRepository.save(claim);
    }

    @Transactional
    public Claim updateStatus(UUID claimId, UUID insurerUserId, UpdateClaimStatusRequest req) {
        Claim claim = getClaim(claimId);
        InsurerProfile insurer = insurerProfileRepository.findByUserId(insurerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Insurer profile not found."));

        if (!claim.getInsurer().getId().equals(insurer.getId())) {
            throw new UnauthorizedException("This claim does not belong to your organization.");
        }

        ClaimStatus from = claim.getStatus();
        ClaimStatus to   = req.getStatus();

        validateTransition(from, to);

        claim.setStatus(to);
        if (req.getApprovedAmount() != null) {
            claim.setApprovedAmount(req.getApprovedAmount());
        }
        claimRepository.save(claim);
        recordHistory(claim, from, to, insurer.getUser(), req.getNote());

        // Notify patient on terminal states
        if (to == ClaimStatus.APPROVED || to == ClaimStatus.REJECTED) {
            emailService.sendClaimStatusEmail(
                    claim.getPatient().getUser().getEmail(),
                    claim.getPatient().getFullName(),
                    claimId.toString(),
                    to.name(),
                    req.getNote()
            );
        }

        return claim;
    }

    @Transactional
    public DocumentRequest requestDocuments(UUID claimId, UUID insurerUserId,
                                            DocumentRequestRequest req) {
        Claim claim = getClaim(claimId);
        InsurerProfile insurer = insurerProfileRepository.findByUserId(insurerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Insurer profile not found."));

        claim.setStatus(ClaimStatus.DOCUMENTS_REQUESTED);
        claimRepository.save(claim);
        recordHistory(claim, ClaimStatus.UNDER_REVIEW, ClaimStatus.DOCUMENTS_REQUESTED,
                insurer.getUser(), req.getDescription());

        return documentRequestRepository.save(DocumentRequest.builder()
                .claim(claim)
                .requestedBy(insurer.getUser())
                .description(req.getDescription())
                .status(RequestStatus.PENDING)
                .build());
    }

    @Transactional
    public void fulfillDocumentRequest(UUID claimId, UUID requestId, UUID hospitalUserId) {
        Claim claim = getClaim(claimId);
        HospitalProfile hospital = hospitalProfileRepository.findByUserId(hospitalUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found."));

        DocumentRequest docReq = documentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Document request not found."));

        docReq.setStatus(RequestStatus.FULFILLED);
        documentRequestRepository.save(docReq);

        claim.setStatus(ClaimStatus.UNDER_REVIEW);
        claimRepository.save(claim);
        recordHistory(claim, ClaimStatus.DOCUMENTS_REQUESTED, ClaimStatus.UNDER_REVIEW,
                hospital.getUser(), "Hospital fulfilled document request.");
    }

    public List<Claim> getClaimsForPatient(UUID patientUserId) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found."));
        return claimRepository.findByPatientOrderByCreatedAtDesc(patient);
    }

    public List<Claim> getClaimsForHospital(UUID hospitalUserId) {
        HospitalProfile hospital = hospitalProfileRepository.findByUserId(hospitalUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found."));
        return claimRepository.findByHospitalOrderByCreatedAtDesc(hospital);
    }

    public List<Claim> getClaimsForInsurer(UUID insurerUserId) {
        InsurerProfile insurer = insurerProfileRepository.findByUserId(insurerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Insurer profile not found."));
        return claimRepository.findByInsurerOrderByCreatedAtDesc(insurer);
    }

    public Claim getClaim(UUID claimId) {
        return claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found."));
    }

    public ClaimResponse toResponse(Claim c) {
        return ClaimResponse.builder()
                .id(c.getId())
                .patientId(c.getPatient().getId())
                .patientName(c.getPatient().getFullName())
                .hospitalId(c.getHospital().getId())
                .hospitalName(c.getHospital().getHospitalName())
                .insurerId(c.getInsurer() != null ? c.getInsurer().getId() : null)
                .insurerName(c.getInsurer() != null ? c.getInsurer().getCompanyName() : null)
                .policyId(c.getPolicy() != null ? c.getPolicy().getId() : null)
                .policyName(c.getPolicy() != null ? c.getPolicy().getPolicyName() : null)
                .status(c.getStatus())
                .paymentChoice(c.getPaymentChoice())
                .treatmentDescription(c.getTreatmentDescription())
                .admissionDate(c.getAdmissionDate())
                .dischargeDate(c.getDischargeDate())
                .diagnosisCode(c.getDiagnosisCode())
                .claimedAmount(c.getClaimedAmount())
                .approvedAmount(c.getApprovedAmount())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private void recordHistory(Claim claim, ClaimStatus from, ClaimStatus to,
                               User changedBy, String note) {
        statusHistoryRepository.save(ClaimStatusHistory.builder()
                .claim(claim)
                .fromStatus(from)
                .toStatus(to)
                .changedBy(changedBy)
                .note(note)
                .build());
    }

    private void validateTransition(ClaimStatus from, ClaimStatus to) {
        boolean valid = switch (from) {
            case SUBMITTED_TO_INSURER -> to == ClaimStatus.UNDER_REVIEW;
            case UNDER_REVIEW -> to == ClaimStatus.APPROVED
                    || to == ClaimStatus.REJECTED
                    || to == ClaimStatus.DOCUMENTS_REQUESTED;
            case DOCUMENTS_REQUESTED -> to == ClaimStatus.UNDER_REVIEW;
            default -> false;
        };
        if (!valid) {
            throw new InvalidStateException(
                    "Invalid status transition from " + from + " to " + to);
        }
    }
}