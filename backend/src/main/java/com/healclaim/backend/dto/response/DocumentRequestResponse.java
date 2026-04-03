package com.healclaim.backend.dto.response;

import com.healclaim.backend.enums.RequestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DocumentRequestResponse {
    private UUID id;
    private UUID claimId;
    private UUID requestedBy;
    private String requestedByName;
    private String description;
    private RequestStatus status;
    private LocalDateTime createdAt;
}