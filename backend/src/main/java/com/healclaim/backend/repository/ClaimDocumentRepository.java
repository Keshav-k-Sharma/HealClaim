package com.healclaim.backend.repository;

import com.healclaim.backend.entity.Claim;
import com.healclaim.backend.entity.ClaimDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClaimDocumentRepository extends JpaRepository<ClaimDocument, UUID> {
    List<ClaimDocument> findByClaimOrderByUploadedAtAsc(Claim claim);
}