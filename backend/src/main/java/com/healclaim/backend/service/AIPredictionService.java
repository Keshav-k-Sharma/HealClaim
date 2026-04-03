package com.healclaim.backend.service;

import com.healclaim.backend.dto.response.AIPredictionResponse;
import com.healclaim.backend.entity.AIPrediction;
import com.healclaim.backend.entity.Claim;
import com.healclaim.backend.entity.ClaimDocument;
import com.healclaim.backend.entity.PatientDocument;
import com.healclaim.backend.exception.ResourceNotFoundException;
import com.healclaim.backend.repository.AIPredictionRepository;
import com.healclaim.backend.repository.ClaimDocumentRepository;
import com.healclaim.backend.repository.PatientDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIPredictionService {

    private final AIPredictionRepository predictionRepository;
    private final WebClient aiWebClient;
    private final ClaimDocumentRepository claimDocumentRepository;
    private final PatientDocumentRepository patientDocumentRepository;

    @Async
    public void generatePredictions(Claim claim) {
        try {
            // Fetch claim documents
            List<String> claimDocKeys = claimDocumentRepository
                    .findByClaimOrderByUploadedAtAsc(claim)
                    .stream()
                    .map(ClaimDocument::getS3Key)
                    .toList();

            // Fetch patient documents
            List<String> patientDocKeys = patientDocumentRepository
                    .findByPatient(claim.getPatient())
                    .stream()
                    .map(PatientDocument::getS3Key)
                    .toList();

            // Fetch policy document key
            String policyDocKey = claim.getPolicy() != null
                    ? claim.getPolicy().getS3KeyDocument()
                    : null;

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("claim_id", claim.getId().toString());
            requestBody.put("treatment_description", claim.getTreatmentDescription());
            requestBody.put("claimed_amount", claim.getClaimedAmount());
            requestBody.put("diagnosis_code", claim.getDiagnosisCode() != null
                    ? claim.getDiagnosisCode() : "");
            requestBody.put("admission_date", claim.getAdmissionDate().toString());
            requestBody.put("discharge_date", claim.getDischargeDate().toString());
            requestBody.put("coverage_type", claim.getPolicy() != null
                    ? claim.getPolicy().getCoverageType() : "unknown");
            requestBody.put("max_coverage", claim.getPolicy() != null
                    ? claim.getPolicy().getMaxCoverage() : BigDecimal.ZERO);
            requestBody.put("claim_document_keys", claimDocKeys);
            requestBody.put("patient_document_keys", patientDocKeys);
            requestBody.put("policy_document_key", policyDocKey);

            AIPredictionResponse response = aiWebClient.post()
                    .uri("/predict")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(AIPredictionResponse.class)
                    .block();

            if (response != null) {
                AIPrediction prediction = predictionRepository.findByClaim(claim)
                        .orElse(AIPrediction.builder().claim(claim).build());

                prediction.setApprovalLikelihood(response.getApprovalLikelihood());
                prediction.setEstimatedPayout(response.getEstimatedPayout());
                prediction.setEstimatedPayoutMin(response.getEstimatedPayoutMin());
                prediction.setEstimatedPayoutMax(response.getEstimatedPayoutMax());
                prediction.setFraudScore(response.getFraudScore());
                prediction.setCostBenchmark(response.getCostBenchmark());
                prediction.setReasoning(response.getReasoning());

                predictionRepository.save(prediction);
                log.info("AI predictions saved for claim {}", claim.getId());
            }
        } catch (Exception e) {
            log.error("AI prediction failed for claim {}: {}", claim.getId(), e.getMessage());
        }
    }

    public AIPredictionResponse getPredictions(UUID claimId) {
        Claim claimRef = new Claim();
        claimRef.setId(claimId);
        AIPrediction p = predictionRepository.findByClaim(claimRef)
                .orElseThrow(() -> new ResourceNotFoundException("Predictions not available yet."));
        return toResponse(p);
    }

    public AIPredictionResponse toResponse(AIPrediction p) {
        return AIPredictionResponse.builder()
                .id(p.getId())
                .claimId(p.getClaim().getId())
                .approvalLikelihood(p.getApprovalLikelihood())
                .estimatedPayout(p.getEstimatedPayout())
                .estimatedPayoutMin(p.getEstimatedPayoutMin())
                .estimatedPayoutMax(p.getEstimatedPayoutMax())
                .fraudScore(p.getFraudScore())
                .costBenchmark(p.getCostBenchmark())
                .reasoning(p.getReasoning())
                .generatedAt(p.getGeneratedAt())
                .build();
    }
}