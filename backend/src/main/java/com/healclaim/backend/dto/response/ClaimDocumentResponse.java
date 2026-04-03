package com.healclaim.backend.dto.response;

import com.healclaim.backend.enums.DocumentSource;
import com.healclaim.backend.enums.DocumentType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ClaimDocumentResponse {
    private UUID id;
    private UUID claimId;
    private UUID uploadedBy;
    private String uploadedByName;
    private DocumentType docType;
    private DocumentSource source;
    private String s3Key;
    private String fileName;
    private LocalDateTime uploadedAt;
}