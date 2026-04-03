package com.healclaim.backend.controller;

import com.healclaim.backend.dto.response.*;
import com.healclaim.backend.entity.PatientDocument;
import com.healclaim.backend.entity.PatientProfile;
import com.healclaim.backend.entity.Policy;
import com.healclaim.backend.enums.DocumentType;
import com.healclaim.backend.exception.ResourceNotFoundException;
import com.healclaim.backend.repository.PatientProfileRepository;
import com.healclaim.backend.repository.PolicyRepository;
import com.healclaim.backend.security.SecurityUser;
import com.healclaim.backend.service.ClaimService;
import com.healclaim.backend.service.PatientService;
import com.healclaim.backend.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;
    private final PatientProfileRepository patientProfileRepository;
    private final ClaimService claimService;
    private final S3Service s3Service;
    private final PolicyRepository policyRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> getProfile(
            @AuthenticationPrincipal SecurityUser user
    ) {
        PatientProfile profile = patientService.getProfileByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(patientService.toResponse(profile)));
    }

    @GetMapping("/qr")
    public ResponseEntity<ApiResponse<Map<String, String>>> getQrToken(
            @AuthenticationPrincipal SecurityUser user
    ) {
        PatientProfile profile = patientService.getProfileByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("qrCodeToken", profile.getQrCodeToken())));
    }

    @GetMapping("/by-qr")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> getByQr(
            @RequestParam String token
    ) {
        PatientProfile profile = patientService.getProfileByQrToken(token);
        return ResponseEntity.ok(ApiResponse.success(patientService.toResponse(profile)));
    }

    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<List<PatientDocumentResponse>>> getDocuments(
            @AuthenticationPrincipal SecurityUser user
    ) {
        PatientProfile profile = patientService.getProfileByUserId(user.getId());
        List<PatientDocumentResponse> docs = patientService.getDocuments(profile)
                .stream()
                .map(d -> PatientDocumentResponse.builder()
                        .id(d.getId())
                        .patientId(profile.getId())
                        .docType(d.getDocType())
                        .s3Key(d.getS3Key())
                        .fileName(d.getFileName())
                        .uploadedAt(d.getUploadedAt())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success(docs));
    }

    @GetMapping("/documents/presign")
    public ResponseEntity<ApiResponse<PresignedUrlResponse>> presignDocumentUpload(
            @AuthenticationPrincipal SecurityUser user,
            @RequestParam String docType,
            @RequestParam String fileName,
            @RequestParam String contentType
    ) {
        PatientProfile profile = patientService.getProfileByUserId(user.getId());
        String s3Key = "patients/" + profile.getId() + "/documents/"
                + docType + "/" + System.currentTimeMillis() + "_" + fileName;
        String url = s3Service.generatePresignedPutUrl(s3Key, contentType);
        return ResponseEntity.ok(ApiResponse.success(
                PresignedUrlResponse.builder()
                        .uploadUrl(url)
                        .s3Key(s3Key)
                        .expiresInSeconds(900)
                        .build()));
    }

    @PostMapping("/documents/confirm")
    public ResponseEntity<ApiResponse<PatientDocumentResponse>> confirmDocumentUpload(
            @AuthenticationPrincipal SecurityUser user,
            @RequestParam String docType,
            @RequestParam String s3Key,
            @RequestParam String fileName
    ) {
        PatientProfile profile = patientService.getProfileByUserId(user.getId());
        PatientDocument doc = patientService.saveDocument(
                profile, DocumentType.valueOf(docType), s3Key, fileName);
        return ResponseEntity.ok(ApiResponse.success(
                PatientDocumentResponse.builder()
                        .id(doc.getId())
                        .patientId(profile.getId())
                        .docType(doc.getDocType())
                        .s3Key(doc.getS3Key())
                        .fileName(doc.getFileName())
                        .uploadedAt(doc.getUploadedAt())
                        .build()));
    }

    @GetMapping("/policies/available")
    public ResponseEntity<ApiResponse<List<PolicyResponse>>> getAvailablePolicies() {
        List<PolicyResponse> policies = policyRepository.findAll()
                .stream()
                .filter(Policy::isActive)
                .map(p -> PolicyResponse.builder()
                        .id(p.getId())
                        .insurerId(p.getInsurer().getId())
                        .insurerName(p.getInsurer().getCompanyName())
                        .policyName(p.getPolicyName())
                        .coverageType(p.getCoverageType())
                        .maxCoverage(p.getMaxCoverage())
                        .description(p.getDescription())
                        .s3KeyDocument(p.getS3KeyDocument())
                        .isActive(p.isActive())
                        .createdAt(p.getCreatedAt())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success(policies));
    }

    @PutMapping("/me/policy")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> linkPolicy(
            @AuthenticationPrincipal SecurityUser user,
            @RequestParam UUID policyId
    ) {
        PatientProfile profile = patientService.getProfileByUserId(user.getId());
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found."));
        profile.setActivePolicy(policy);
        PatientProfile saved = patientProfileRepository.save(profile);
        return ResponseEntity.ok(ApiResponse.success(patientService.toResponse(saved)));
    }
}