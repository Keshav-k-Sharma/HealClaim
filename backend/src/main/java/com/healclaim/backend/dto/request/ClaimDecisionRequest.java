package com.healclaim.backend.dto.request;

import com.healclaim.backend.enums.PaymentChoice;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ClaimDecisionRequest {
    @NotNull
    private PaymentChoice choice;
}