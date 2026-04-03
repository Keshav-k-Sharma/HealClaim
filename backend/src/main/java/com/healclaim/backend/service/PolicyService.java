package com.healclaim.backend.service;

import com.healclaim.backend.dto.request.CreatePolicyRequest;
import com.healclaim.backend.dto.response.PolicyResponse;
import com.healclaim.backend.entity.InsurerProfile;
import com.healclaim.backend.entity.Policy;
import com.healclaim.backend.exception.ResourceNotFoundException;
import com.healclaim.backend.repository.InsurerProfileRepository;
import com.healclaim.backend.repository.PolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PolicyService {

    private final PolicyRepository         policyRepository;
    private final InsurerProfileRepository insurerProfileRepository;

    @Transactional
    public Policy createPolicy(UUID insurerUserId, CreatePolicyRequest req) {
        InsurerProfile insurer = insurerProfileRepository.findByUserId(insurerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Insurer profile not found."));

        return policyRepository.save(Policy.builder()
                .insurer(insurer)
                .policyName(req.getPolicyName())
                .coverageType(req.getCoverageType())
                .maxCoverage(req.getMaxCoverage())
                .description(req.getDescription())
                .isActive(req.isActive())
                .build());
    }

    public List<Policy> getPoliciesForInsurer(UUID insurerUserId) {
        InsurerProfile insurer = insurerProfileRepository.findByUserId(insurerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Insurer profile not found."));
        return policyRepository.findByInsurer(insurer);
    }

    @Transactional
    public Policy updatePolicyDocument(UUID policyId, String s3Key) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found."));
        policy.setS3KeyDocument(s3Key);
        return policyRepository.save(policy);
    }

    public Policy getPolicy(UUID policyId) {
        return policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found."));
    }

    public List<Policy> getActivePolicies() {
        return policyRepository.findAll().stream()
                .filter(Policy::isActive)
                .toList();
    }

    public PolicyResponse toResponse(Policy p) {
        return PolicyResponse.builder()
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
                .build();
    }
}