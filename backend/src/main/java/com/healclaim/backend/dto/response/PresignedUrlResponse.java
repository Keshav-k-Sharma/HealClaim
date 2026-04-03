package com.healclaim.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PresignedUrlResponse {
    private String uploadUrl;
    private String s3Key;
    private long expiresInSeconds;
}