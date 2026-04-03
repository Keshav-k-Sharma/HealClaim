package com.healclaim.backend.dto.response;

import com.healclaim.backend.enums.ClaimStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ClaimStatusHistoryResponse {
    private UUID id;
    private UUID claimId;
    private ClaimStatus fromStatus;
    private ClaimStatus toStatus;
    private UUID changedBy;
    private String changedByName;
    private String note;
    private LocalDateTime changedAt;
}