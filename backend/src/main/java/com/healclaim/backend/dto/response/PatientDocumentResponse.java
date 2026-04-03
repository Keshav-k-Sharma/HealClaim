package com.healclaim.backend.dto.response;

import com.healclaim.backend.enums.DocumentType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PatientDocumentResponse {
    private UUID id;
    private UUID patientId;
    private DocumentType docType;
    private String s3Key;
    private String fileName;
    private LocalDateTime uploadedAt;
}