package com.healclaim.backend.repository;

import com.healclaim.backend.entity.Claim;
import com.healclaim.backend.entity.DocumentRequest;
import com.healclaim.backend.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRequestRepository extends JpaRepository<DocumentRequest, UUID> {
    List<DocumentRequest> findByClaimOrderByCreatedAtDesc(Claim claim);
    List<DocumentRequest> findByClaimAndStatus(Claim claim, RequestStatus status);
}