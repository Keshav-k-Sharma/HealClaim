package com.healclaim.backend.service;

import com.healclaim.backend.entity.Claim;
import com.healclaim.backend.enums.UserRole;
import com.healclaim.backend.exception.ResourceNotFoundException;
import com.healclaim.backend.exception.UnauthorizedException;
import com.healclaim.backend.repository.ClaimRepository;
import com.healclaim.backend.repository.HospitalProfileRepository;
import com.healclaim.backend.repository.InsurerProfileRepository;
import com.healclaim.backend.repository.PatientProfileRepository;
import com.healclaim.backend.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClaimSecurityService {

    private final ClaimRepository claimRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final HospitalProfileRepository hospitalProfileRepository;
    private final InsurerProfileRepository insurerProfileRepository;

    /**
     * Fetches a claim and verifies the requesting user has access to it.
     * - PATIENT: must be the patient on the claim
     * - HOSPITAL: must be the hospital that filed the claim
     * - INSURER:  must be the insurer assigned to the claim
     */
    public Claim getClaimWithOwnershipCheck(UUID claimId, SecurityUser user) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found."));

        UserRole role = user.getRole() != null
                ? com.healclaim.backend.enums.UserRole.valueOf(user.getRole())
                : null;

        if (role == null) throw new UnauthorizedException("Invalid role.");

        switch (role) {
            case PATIENT -> {
                var profile = patientProfileRepository.findByUserId(user.getId())
                        .orElseThrow(() -> new UnauthorizedException("Patient profile not found."));
                if (!claim.getPatient().getId().equals(profile.getId())) {
                    throw new UnauthorizedException("You do not have access to this claim.");
                }
            }
            case HOSPITAL -> {
                var profile = hospitalProfileRepository.findByUserId(user.getId())
                        .orElseThrow(() -> new UnauthorizedException("Hospital profile not found."));
                if (!claim.getHospital().getId().equals(profile.getId())) {
                    throw new UnauthorizedException("You do not have access to this claim.");
                }
            }
            case INSURER -> {
                var profile = insurerProfileRepository.findByUserId(user.getId())
                        .orElseThrow(() -> new UnauthorizedException("Insurer profile not found."));
                if (claim.getInsurer() == null ||
                        !claim.getInsurer().getId().equals(profile.getId())) {
                    throw new UnauthorizedException("You do not have access to this claim.");
                }
            }
        }

        return claim;
    }

    /**
     * Verifies user role matches expected role.
     * Use this to block cross-role endpoint access.
     */
    public void requireRole(SecurityUser user, UserRole... allowedRoles) {
        UserRole userRole = com.healclaim.backend.enums.UserRole.valueOf(user.getRole());
        for (UserRole allowed : allowedRoles) {
            if (userRole == allowed) return;
        }
        throw new UnauthorizedException("You do not have permission to perform this action.");
    }
}