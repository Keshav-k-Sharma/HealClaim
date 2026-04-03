package com.healclaim.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class PatientProfileResponse {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String nationalId;
    private String qrCodeToken;
    private UUID activePolicyId;
    private String activePolicyName;
    private String insurerName;
}