package com.healclaim.backend.controller;

import com.healclaim.backend.dto.request.*;
import com.healclaim.backend.dto.response.ApiResponse;
import com.healclaim.backend.dto.response.AuthResponse;
import com.healclaim.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/patient")
    public ResponseEntity<ApiResponse<Void>> registerPatient(
            @Valid @RequestBody RegisterPatientRequest req
    ) {
        authService.registerPatient(req);
        return ResponseEntity.ok(ApiResponse.success(
                "Registration successful. Please verify your email.", null));
    }

    @PostMapping("/register/hospital")
    public ResponseEntity<ApiResponse<Void>> registerHospital(
            @Valid @RequestBody RegisterHospitalRequest req
    ) {
        authService.registerHospital(req);
        return ResponseEntity.ok(ApiResponse.success(
                "Registration successful. Please verify your email.", null));
    }

    @PostMapping("/register/insurer")
    public ResponseEntity<ApiResponse<Void>> registerInsurer(
            @Valid @RequestBody RegisterInsurerRequest req
    ) {
        authService.registerInsurer(req);
        return ResponseEntity.ok(ApiResponse.success(
                "Registration successful. Please verify your email.", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest req
    ) {
        AuthResponse response = authService.login(req);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<Void>> verify(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully.", null));
    }
}