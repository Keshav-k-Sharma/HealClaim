package com.healclaim.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class InsurerProfileResponse {
    private UUID id;
    private UUID userId;
    private String companyName;
    private String registrationNo;
}