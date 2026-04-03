package com.healclaim.backend.service;

import com.healclaim.backend.dto.request.*;
import com.healclaim.backend.dto.response.AuthResponse;
import com.healclaim.backend.entity.*;
import com.healclaim.backend.enums.UserRole;
import com.healclaim.backend.exception.InvalidStateException;
import com.healclaim.backend.exception.ResourceNotFoundException;
import com.healclaim.backend.repository.*;
import com.healclaim.backend.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository           userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final HospitalProfileRepository hospitalProfileRepository;
    private final InsurerProfileRepository  insurerProfileRepository;
    private final PasswordEncoder          passwordEncoder;
    private final JwtService               jwtService;
    private final AuthenticationManager    authenticationManager;
    private final EmailService             emailService;

    @Transactional
    public void registerPatient(RegisterPatientRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new InvalidStateException("Email already registered.");
        }
        String verificationToken = UUID.randomUUID().toString();
        User user = userRepository.save(User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(UserRole.PATIENT)
                .isVerified(false)
                .verificationToken(verificationToken)
                .build());

        patientProfileRepository.save(PatientProfile.builder()
                .user(user)
                .fullName(req.getFullName())
                .nationalId(req.getNationalId())
                .qrCodeToken(UUID.randomUUID().toString())
                .build());

        emailService.sendVerificationEmail(user.getEmail(), req.getFullName(), verificationToken);
    }

    @Transactional
    public void registerHospital(RegisterHospitalRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new InvalidStateException("Email already registered.");
        }
        String verificationToken = UUID.randomUUID().toString();
        User user = userRepository.save(User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(UserRole.HOSPITAL)
                .isVerified(false)
                .verificationToken(verificationToken)
                .build());

        hospitalProfileRepository.save(HospitalProfile.builder()
                .user(user)
                .hospitalName(req.getHospitalName())
                .registrationNo(req.getRegistrationNo())
                .address(req.getAddress())
                .build());

        emailService.sendVerificationEmail(user.getEmail(), req.getHospitalName(), verificationToken);
    }

    @Transactional
    public void registerInsurer(RegisterInsurerRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new InvalidStateException("Email already registered.");
        }
        String verificationToken = UUID.randomUUID().toString();
        User user = userRepository.save(User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(UserRole.INSURER)
                .isVerified(false)
                .verificationToken(verificationToken)
                .build());

        insurerProfileRepository.save(InsurerProfile.builder()
                .user(user)
                .companyName(req.getCompanyName())
                .registrationNo(req.getRegistrationNo())
                .build());

        emailService.sendVerificationEmail(user.getEmail(), req.getCompanyName(), verificationToken);
    }

    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired verification token."));
        user.setVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
    }

    public AuthResponse login(LoginRequest req) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );
        SecurityUser securityUser = (SecurityUser) auth.getPrincipal();
        String token = jwtService.generateToken(
                securityUser.getId(),
                securityUser.getEmail(),
                securityUser.getRole()
        );
        return AuthResponse.builder()
                .accessToken(token)
                .role(UserRole.valueOf(securityUser.getRole()))
                .userId(securityUser.getId())
                .build();
    }
}