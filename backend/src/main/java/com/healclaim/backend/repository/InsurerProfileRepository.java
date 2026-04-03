package com.healclaim.backend.repository;

import com.healclaim.backend.entity.InsurerProfile;
import com.healclaim.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InsurerProfileRepository extends JpaRepository<InsurerProfile, UUID> {
    Optional<InsurerProfile> findByUser(User user);
    Optional<InsurerProfile> findByUserId(UUID userId);
}