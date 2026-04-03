package com.healclaim.backend.repository;

import com.healclaim.backend.entity.AIPrediction;
import com.healclaim.backend.entity.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AIPredictionRepository extends JpaRepository<AIPrediction, UUID> {
    Optional<AIPrediction> findByClaim(Claim claim);
}