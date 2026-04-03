package com.healclaim.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AIPredictionResponse {
    private UUID id;
    private UUID claimId;
    private BigDecimal approvalLikelihood;
    private BigDecimal estimatedPayout;
    private BigDecimal estimatedPayoutMin;
    private BigDecimal estimatedPayoutMax;
    private BigDecimal fraudScore;
    private BigDecimal costBenchmark;
    private String reasoning;
    private LocalDateTime generatedAt;
}