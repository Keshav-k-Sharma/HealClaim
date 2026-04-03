package com.healclaim.backend.controller;

import com.healclaim.backend.dto.request.ClaimDecisionRequest;
import com.healclaim.backend.dto.request.CreateClaimRequest;
import com.healclaim.backend.dto.request.DocumentRequestRequest;
import com.healclaim.backend.dto.request.UpdateClaimStatusRequest;
import com.healclaim.backend.dto.response.*;
import com.healclaim.backend.entity.Claim;
import com.healclaim.backend.entity.ClaimDocument;
import com.healclaim.backend.entity.DocumentRequest;
import com.healclaim.backend.entity.HospitalProfile;
import com.healclaim.backend.enums.UserRole;
import com.healclaim.backend.exception.UnauthorizedException;
import com.healclaim.backend.repository.ClaimDocumentRepository;
import com.healclaim.backend.repository.ClaimStatusHistoryRepository;
import com.healclaim.backend.repository.DocumentRequestRepository;
import com.healclaim.backend.repository.HospitalProfileRepository;
import com.healclaim.backend.security.SecurityUser;
import com.healclaim.backend.service.AIPredictionService;
import com.healclaim.backend.service.ClaimSecurityService;
import com.healclaim.backend.service.ClaimService;
import com.healclaim.backend.service.S3Service;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;
    private final ClaimSecurityService claimSecurityService;
    private final ClaimDocumentRepository claimDocumentRepository;
    private final ClaimStatusHistoryRepository statusHistoryRepository;
    private final AIPredictionService aiPredictionService;
    private final DocumentRequestRepository documentRequestRepository;
    private final HospitalProfileRepository hospitalProfileRepository;
    private final S3Service s3Service;

    // ── Hospital: create claim ──
    @PostMapping
    public ResponseEntity<ApiResponse<ClaimResponse>> createClaim(
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody CreateClaimRequest req
    ) {
        claimSecurityService.requireRole(user, UserRole.HOSPITAL);
        Claim claim = claimService.createClaim(user.getId(), req);
        return ResponseEntity.ok(ApiResponse.success(claimService.toResponse(claim)));
    }

    // ── Hospital: submit bundle ──
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<ClaimResponse>> submitBundle(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable UUID id
    ) {
        claimSecurityService.requireRole(user, UserRole.HOSPITAL);
        Claim claim = claimService.submitBundle(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(claimService.toResponse(claim)));
    }

    // ── Patient: get my claims ──
    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<ClaimResponse>>> getMyClaims(
            @AuthenticationPrincipal SecurityUser user
    ) {
        claimSecurityService.requireRole(user, UserRole.PATIENT);
        List<ClaimResponse> claims = claimService.getClaimsForPatient(user.getId())
                .stream().map(claimService::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(claims));
    }

    // ── Hospital + Insurer: get all claims ──
    @GetMapping
    public ResponseEntity<ApiResponse<List<ClaimResponse>>> getClaims(
            @AuthenticationPrincipal SecurityUser user
    ) {
        claimSecurityService.requireRole(user, UserRole.HOSPITAL, UserRole.INSURER);
        String role = user.getRole();
        List<ClaimResponse> claims = switch (role) {
            case "HOSPITAL" -> claimService.getClaimsForHospital(user.getId())
                    .stream().map(claimService::toResponse).toList();
            case "INSURER" -> claimService.getClaimsForInsurer(user.getId())
                    .stream().map(claimService::toResponse).toList();
            default -> List.of();
        };
        return ResponseEntity.ok(ApiResponse.success(claims));
    }

    // ── All roles: get single claim (with ownership check) ──
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClaimResponse>> getClaim(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable UUID id
    ) {
        Claim claim = claimSecurityService.getClaimWithOwnershipCheck(id, user);
        return ResponseEntity.ok(ApiResponse.success(claimService.toResponse(claim)));
    }

    // ── Patient: make decision ──
    @PostMapping("/{id}/decision")
    public ResponseEntity<ApiResponse<ClaimResponse>> makeDecision(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable UUID id,
            @Valid @RequestBody ClaimDecisionRequest req
    ) {
        claimSecurityService.requireRole(user, UserRole.PATIENT);
        Claim claim = claimService.makeDecision(id, user.getId(), req);
        return ResponseEntity.ok(ApiResponse.success(claimService.toResponse(claim)));
    }

    // ── Insurer: update status ──
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ClaimResponse>> updateStatus(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateClaimStatusRequest req
    ) {
        claimSecurityService.requireRole(user, UserRole.INSURER);
        Claim claim = claimService.updateStatus(id, user.getId(), req);
        return ResponseEntity.ok(ApiResponse.success(claimService.toResponse(claim)));
    }

    // ── Insurer: request documents ──
    @PostMapping("/{id}/document-requests")
    public ResponseEntity<ApiResponse<DocumentRequestResponse>> requestDocuments(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable UUID id,
            @Valid @RequestBody DocumentRequestRequest req
    ) {
        claimSecurityService.requireRole(user, UserRole.INSURER);
        DocumentRequest dr = claimService.requestDocuments(id, user.getId(), req);
        return ResponseEntity.ok(ApiResponse.success(
                DocumentRequestResponse.builder()
                        .id(dr.getId())
                        .claimId(dr.getClaim().getId())
                        .requestedBy(dr.getRequestedBy().getId())
                        .requestedByName(dr.getRequestedBy().getEmail())
                        .description(dr.getDescription())
                        .status(dr.getStatus())
                        .createdAt(dr.getCreatedAt())
                        .build()));
    }

    // ── Hospital: fulfill document request ──
    @PostMapping("/{id}/document-requests/{reqId}/fulfill")
    public ResponseEntity<ApiResponse<Void>> fulfillRequest(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable UUID id,
            @PathVariable UUID reqId
    ) {
        claimSecurityService.requireRole(user, UserRole.HOSPITAL);
        claimService.fulfillDocumentRequest(id, reqId, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Document request fulfilled.", null));
    }

    // ── All roles: get documents (with ownership check) ──
    @GetMapping("/{id}/documents")
    public ResponseEntity<ApiResponse<List<ClaimDocumentResponse>>> getDocuments(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable UUID id
    ) {
        Claim claim = claimSecurityService.getClaimWithOwnershipCheck(id, user);
        List<ClaimDocumentResponse> docs = claimDocumentRepository
                .findByClaimOrderByUploadedAtAsc(claim)
                .stream()
                .map(d -> ClaimDocumentResponse.builder()
                        .id(d.getId())
                        .claimId(d.getClaim().getId())
                        .uploadedBy(d.getUploadedBy().getId())
                        .uploadedByName(d.getUploadedBy().getEmail())
                        .docType(d.getDocType())
                        .source(d.getSource())
                        .s3Key(d.getS3Key())
                        .fileName(d.getFileName())
                        .uploadedAt(d.getUploadedAt())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success(docs));
    }

    // ── All roles: get status history (with ownership check) ──
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<ClaimStatusHistoryResponse>>> getHistory(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable UUID id
    ) {
        Claim claim = claimSecurityService.getClaimWithOwnershipCheck(id, user);
        List<ClaimStatusHistoryResponse> history = statusHistoryRepository
                .findByClaimOrderByChangedAtAsc(claim)
                .stream()
                .map(h -> ClaimStatusHistoryResponse.builder()
                        .id(h.getId())
                        .claimId(h.getClaim().getId())
                        .fromStatus(h.getFromStatus())
                        .toStatus(h.getToStatus())
                        .changedBy(h.getChangedBy().getId())
                        .changedByName(h.getChangedBy().getEmail())
                        .note(h.getNote())
                        .changedAt(h.getChangedAt())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    // ── All roles: get AI predictions (with ownership check) ──
    @GetMapping("/{id}/predictions")
    public ResponseEntity<ApiResponse<AIPredictionResponse>> getPredictions(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable UUID id
    ) {
        claimSecurityService.getClaimWithOwnershipCheck(id, user);
        AIPredictionResponse predictions = aiPredictionService.getPredictions(id);
        return ResponseEntity.ok(ApiResponse.success(predictions));
    }

    // ── Hospital: presign document upload ──
    @PostMapping("/{id}/documents/presign")
    public ResponseEntity<ApiResponse<PresignedUrlResponse>> presignClaimDocument(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable UUID id,
            @RequestParam String fileName,
            @RequestParam String contentType
    ) {
        claimSecurityService.requireRole(user, UserRole.HOSPITAL);
        claimSecurityService.getClaimWithOwnershipCheck(id, user);
        String s3Key = "claims/" + id + "/documents/"
                + System.currentTimeMillis() + "_" + fileName;
        String url = s3Service.generatePresignedPutUrl(s3Key, contentType);
        return ResponseEntity.ok(ApiResponse.success(
                PresignedUrlResponse.builder()
                        .uploadUrl(url)
                        .s3Key(s3Key)
                        .expiresInSeconds(900)
                        .build()));
    }

    // ── Hospital: confirm claim document upload ──
    @PostMapping("/{id}/documents/confirm")
    public ResponseEntity<ApiResponse<ClaimDocumentResponse>> confirmClaimDocument(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable UUID id,
            @RequestParam String docType,
            @RequestParam String s3Key,
            @RequestParam String fileName,
            @RequestParam String source
    ) {
        claimSecurityService.requireRole(user, UserRole.HOSPITAL);
        Claim claim = claimSecurityService.getClaimWithOwnershipCheck(id, user);
        HospitalProfile hospital = hospitalProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new UnauthorizedException("Hospital profile not found."));

        ClaimDocument doc = claimDocumentRepository.save(
                ClaimDocument.builder()
                        .claim(claim)
                        .uploadedBy(hospital.getUser())
                        .docType(com.healclaim.backend.enums.DocumentType.valueOf(docType))
                        .source(com.healclaim.backend.enums.DocumentSource.valueOf(source))
                        .s3Key(s3Key)
                        .fileName(fileName)
                        .build());

        return ResponseEntity.ok(ApiResponse.success(
                ClaimDocumentResponse.builder()
                        .id(doc.getId())
                        .claimId(doc.getClaim().getId())
                        .uploadedBy(doc.getUploadedBy().getId())
                        .uploadedByName(doc.getUploadedBy().getEmail())
                        .docType(doc.getDocType())
                        .source(doc.getSource())
                        .s3Key(doc.getS3Key())
                        .fileName(doc.getFileName())
                        .uploadedAt(doc.getUploadedAt())
                        .build()));
    }

    // ── All roles: get document requests (with ownership check) ──
    @GetMapping("/{id}/document-requests")
    public ResponseEntity<ApiResponse<List<DocumentRequestResponse>>> getDocumentRequests(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable UUID id
    ) {
        Claim claim = claimSecurityService.getClaimWithOwnershipCheck(id, user);
        List<DocumentRequestResponse> requests = documentRequestRepository
                .findByClaimOrderByCreatedAtDesc(claim)
                .stream()
                .map(r -> DocumentRequestResponse.builder()
                        .id(r.getId())
                        .claimId(r.getClaim().getId())
                        .requestedBy(r.getRequestedBy().getId())
                        .requestedByName(r.getRequestedBy().getEmail())
                        .description(r.getDescription())
                        .status(r.getStatus())
                        .createdAt(r.getCreatedAt())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success(requests));
    }
}