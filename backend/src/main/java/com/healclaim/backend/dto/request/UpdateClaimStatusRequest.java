package com.healclaim.backend.dto.request;

import com.healclaim.backend.enums.ClaimStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateClaimStatusRequest {
    @NotNull
    private ClaimStatus status;
    private String note;
    private BigDecimal approvedAmount;
}