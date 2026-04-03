package com.healclaim.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PolicyResponse {
    private UUID id;
    private UUID insurerId;
    private String insurerName;
    private String policyName;
    private String coverageType;
    private BigDecimal maxCoverage;
    private String description;
    private String s3KeyDocument;
    private boolean isActive;
    private LocalDateTime createdAt;
}