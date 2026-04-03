package com.healclaim.backend.dto.response;

import com.healclaim.backend.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private UserRole role;
    private UUID userId;
}