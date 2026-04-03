package com.healclaim.backend.repository;

import com.healclaim.backend.entity.InsurerProfile;
import com.healclaim.backend.entity.Policy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PolicyRepository extends JpaRepository<Policy, UUID> {
    List<Policy> findByInsurer(InsurerProfile insurer);
    List<Policy> findByInsurerAndIsActiveTrue(InsurerProfile insurer);
}