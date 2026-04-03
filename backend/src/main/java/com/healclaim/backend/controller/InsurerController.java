package com.healclaim.backend.controller;

import com.healclaim.backend.dto.response.ApiResponse;
import com.healclaim.backend.dto.response.InsurerProfileResponse;
import com.healclaim.backend.entity.InsurerProfile;
import com.healclaim.backend.exception.ResourceNotFoundException;
import com.healclaim.backend.repository.InsurerProfileRepository;
import com.healclaim.backend.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/insurers")
@RequiredArgsConstructor
public class InsurerController {

    private final InsurerProfileRepository insurerProfileRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<InsurerProfileResponse>> getProfile(
            @AuthenticationPrincipal SecurityUser user
    ) {
        InsurerProfile profile = insurerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Insurer profile not found."));

        return ResponseEntity.ok(ApiResponse.success(
                InsurerProfileResponse.builder()
                        .id(profile.getId())
                        .userId(profile.getUser().getId())
                        .companyName(profile.getCompanyName())
                        .registrationNo(profile.getRegistrationNo())
                        .build()
        ));
    }
}