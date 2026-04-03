package com.healclaim.backend.repository;

import com.healclaim.backend.entity.Claim;
import com.healclaim.backend.entity.HospitalProfile;
import com.healclaim.backend.entity.InsurerProfile;
import com.healclaim.backend.entity.PatientProfile;
import com.healclaim.backend.enums.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, UUID> {
    List<Claim> findByPatientOrderByCreatedAtDesc(PatientProfile patient);
    List<Claim> findByHospitalOrderByCreatedAtDesc(HospitalProfile hospital);
    List<Claim> findByInsurerOrderByCreatedAtDesc(InsurerProfile insurer);
    List<Claim> findByHospitalAndStatusOrderByCreatedAtDesc(HospitalProfile hospital, ClaimStatus status);
    List<Claim> findByInsurerAndStatusOrderByCreatedAtDesc(InsurerProfile insurer, ClaimStatus status);
}