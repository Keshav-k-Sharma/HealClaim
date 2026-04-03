package com.healclaim.backend.repository;

import com.healclaim.backend.entity.Claim;
import com.healclaim.backend.entity.ClaimStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClaimStatusHistoryRepository extends JpaRepository<ClaimStatusHistory, UUID> {
    List<ClaimStatusHistory> findByClaimOrderByChangedAtAsc(Claim claim);
}