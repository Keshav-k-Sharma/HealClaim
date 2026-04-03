package com.healclaim.backend.repository;

import com.healclaim.backend.entity.PatientProfile;
import com.healclaim.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientProfileRepository extends JpaRepository<PatientProfile, UUID> {
    Optional<PatientProfile> findByUser(User user);
    Optional<PatientProfile> findByQrCodeToken(String qrCodeToken);
    Optional<PatientProfile> findByUserId(UUID userId);
}