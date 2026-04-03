package com.healclaim.backend.controller;

import com.healclaim.backend.dto.request.CreatePolicyRequest;
import com.healclaim.backend.dto.response.*;
import com.healclaim.backend.entity.Policy;
import com.healclaim.backend.security.SecurityUser;
import com.healclaim.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/policies")
@RequiredArgsConstructor
public class PolicyController {

    private final PolicyService policyService;
    private final S3Service     s3Service;

    @PostMapping
    public ResponseEntity<ApiResponse<PolicyResponse>> createPolicy(
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody CreatePolicyRequest req
    ) {
        Policy policy = policyService.createPolicy(user.getId(), req);
        return ResponseEntity.ok(ApiResponse.success(policyService.toResponse(policy)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PolicyResponse>>> getPolicies(
            @AuthenticationPrincipal SecurityUser user
    ) {
        List<PolicyResponse> policies = policyService.getPoliciesForInsurer(user.getId())
                .stream().map(policyService::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(policies));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<PolicyResponse>>> getActivePolicies() {
        List<PolicyResponse> policies = policyService.getActivePolicies()
                .stream().map(policyService::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(policies));
    }

    @PostMapping("/{id}/document/presign")
    public ResponseEntity<ApiResponse<PresignedUrlResponse>> presignPolicyDocument(
            @PathVariable UUID id,
            @RequestParam String fileName,
            @RequestParam String contentType
    ) {
        String s3Key = "policies/" + id + "/" + System.currentTimeMillis() + "_" + fileName;
        String url = s3Service.generatePresignedPutUrl(s3Key, contentType);
        return ResponseEntity.ok(ApiResponse.success(
                PresignedUrlResponse.builder()
                        .uploadUrl(url)
                        .s3Key(s3Key)
                        .expiresInSeconds(900)
                        .build()));
    }

    @PostMapping("/{id}/document/confirm")
    public ResponseEntity<ApiResponse<PolicyResponse>> confirmPolicyDocument(
            @PathVariable UUID id,
            @RequestParam String s3Key
    ) {
        Policy policy = policyService.updatePolicyDocument(id, s3Key);
        return ResponseEntity.ok(ApiResponse.success(policyService.toResponse(policy)));
    }
}