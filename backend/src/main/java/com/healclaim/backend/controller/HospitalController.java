package com.healclaim.backend.controller;

import com.healclaim.backend.dto.response.ApiResponse;
import com.healclaim.backend.dto.response.HospitalProfileResponse;
import com.healclaim.backend.entity.HospitalProfile;
import com.healclaim.backend.exception.ResourceNotFoundException;
import com.healclaim.backend.repository.HospitalProfileRepository;
import com.healclaim.backend.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
public class HospitalController {

    private final HospitalProfileRepository hospitalProfileRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<HospitalProfileResponse>> getProfile(
            @AuthenticationPrincipal SecurityUser user
    ) {
        HospitalProfile profile = hospitalProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found."));

        return ResponseEntity.ok(ApiResponse.success(
                HospitalProfileResponse.builder()
                        .id(profile.getId())
                        .userId(profile.getUser().getId())
                        .hospitalName(profile.getHospitalName())
                        .registrationNo(profile.getRegistrationNo())
                        .address(profile.getAddress())
                        .build()
        ));
    }
}