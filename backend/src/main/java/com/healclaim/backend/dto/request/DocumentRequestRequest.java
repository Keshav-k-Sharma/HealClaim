package com.healclaim.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DocumentRequestRequest {
    @NotBlank
    private String description;
}