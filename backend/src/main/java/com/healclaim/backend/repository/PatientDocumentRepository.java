package com.healclaim.backend.repository;

import com.healclaim.backend.entity.PatientDocument;
import com.healclaim.backend.entity.PatientProfile;
import com.healclaim.backend.enums.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientDocumentRepository extends JpaRepository<PatientDocument, UUID> {
    List<PatientDocument> findByPatient(PatientProfile patient);
    Optional<PatientDocument> findByPatientAndDocType(PatientProfile patient, DocumentType docType);
}