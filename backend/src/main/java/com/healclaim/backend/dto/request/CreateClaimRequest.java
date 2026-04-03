package com.healclaim.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateClaimRequest {
    @NotBlank
    private String patientQrToken;
    @NotBlank
    private String treatmentDescription;
    @NotBlank
    private String admissionDate;
    @NotBlank
    private String dischargeDate;
    @NotNull @DecimalMin("1")
    private BigDecimal claimedAmount;
    private String diagnosisCode;
}