package com.healclaim.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class HospitalProfileResponse {
    private UUID id;
    private UUID userId;
    private String hospitalName;
    private String registrationNo;
    private String address;
}