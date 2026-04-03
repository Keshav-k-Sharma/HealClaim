package com.healclaim.backend.controller;

import com.healclaim.backend.dto.response.ApiResponse;
import com.healclaim.backend.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final S3Service s3Service;

    @GetMapping("/view-url")
    public ResponseEntity<ApiResponse<Map<String, String>>> getViewUrl(
            @RequestParam String s3Key
    ) {
        String url = s3Service.generatePresignedGetUrl(s3Key);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("url", url, "expiresInSeconds", "900")
        ));
    }
}