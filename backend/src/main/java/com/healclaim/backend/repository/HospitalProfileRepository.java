package com.healclaim.backend.repository;

import com.healclaim.backend.entity.HospitalProfile;
import com.healclaim.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface HospitalProfileRepository extends JpaRepository<HospitalProfile, UUID> {
    Optional<HospitalProfile> findByUser(User user);
    Optional<HospitalProfile> findByUserId(UUID userId);
}