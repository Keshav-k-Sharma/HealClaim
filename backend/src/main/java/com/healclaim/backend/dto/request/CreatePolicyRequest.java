package com.healclaim.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePolicyRequest {
    @NotBlank
    private String policyName;
    @NotBlank
    private String coverageType;
    @NotNull @DecimalMin("1000")
    private BigDecimal maxCoverage;
    private String description;
    private boolean isActive = true;
}