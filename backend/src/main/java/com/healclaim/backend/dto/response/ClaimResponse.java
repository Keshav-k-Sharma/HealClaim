package com.healclaim.backend.dto.response;

import com.healclaim.backend.enums.ClaimStatus;
import com.healclaim.backend.enums.PaymentChoice;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ClaimResponse {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private UUID hospitalId;
    private String hospitalName;
    private UUID insurerId;
    private String insurerName;
    private UUID policyId;
    private String policyName;
    private ClaimStatus status;
    private PaymentChoice paymentChoice;
    private String treatmentDescription;
    private LocalDate admissionDate;
    private LocalDate dischargeDate;
    private String diagnosisCode;
    private BigDecimal claimedAmount;
    private BigDecimal approvedAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}