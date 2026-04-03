package com.healclaim.backend.service;

import com.healclaim.backend.dto.response.PatientDocumentResponse;
import com.healclaim.backend.dto.response.PatientProfileResponse;
import com.healclaim.backend.entity.*;
import com.healclaim.backend.enums.DocumentType;
import com.healclaim.backend.exception.ResourceNotFoundException;
import com.healclaim.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientProfileRepository  patientProfileRepository;
    private final PatientDocumentRepository patientDocumentRepository;
    private final UserRepository            userRepository;

    public PatientProfile getProfileByUserId(UUID userId) {
        return patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found."));
    }

    public PatientProfile getProfileByQrToken(String token) {
        return patientProfileRepository.findByQrCodeToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found for this QR token."));
    }

    public PatientProfileResponse toResponse(PatientProfile p) {
        return PatientProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .fullName(p.getFullName())
                .nationalId(p.getNationalId())
                .qrCodeToken(p.getQrCodeToken())
                .activePolicyId(p.getActivePolicy() != null ? p.getActivePolicy().getId() : null)
                .activePolicyName(p.getActivePolicy() != null ? p.getActivePolicy().getPolicyName() : null)
                .insurerName(p.getActivePolicy() != null
                        ? p.getActivePolicy().getInsurer().getCompanyName() : null)
                .build();
    }

    @Transactional
    public PatientDocument saveDocument(PatientProfile patient, DocumentType docType,
                                        String s3Key, String fileName) {
        // Replace if same doc type already exists
        patientDocumentRepository.findByPatientAndDocType(patient, docType)
                .ifPresent(patientDocumentRepository::delete);

        return patientDocumentRepository.save(PatientDocument.builder()
                .patient(patient)
                .docType(docType)
                .s3Key(s3Key)
                .fileName(fileName)
                .build());
    }

    public List<PatientDocument> getDocuments(PatientProfile patient) {
        return patientDocumentRepository.findByPatient(patient);
    }
}