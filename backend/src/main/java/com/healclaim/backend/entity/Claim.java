package com.healclaim.backend.entity;

import com.healclaim.backend.enums.ClaimStatus;
import com.healclaim.backend.enums.PaymentChoice;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "claims")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientProfile patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private HospitalProfile hospital;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insurer_id")
    private InsurerProfile insurer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id")
    private Policy policy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClaimStatus status = ClaimStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_choice")
    private PaymentChoice paymentChoice;

    @Column(name = "treatment_description", nullable = false)
    private String treatmentDescription;

    @Column(name = "admission_date", nullable = false)
    private LocalDate admissionDate;

    @Column(name = "discharge_date", nullable = false)
    private LocalDate dischargeDate;

    @Column(name = "diagnosis_code")
    private String diagnosisCode;

    @Column(name = "claimed_amount", nullable = false)
    private BigDecimal claimedAmount;

    @Column(name = "approved_amount")
    private BigDecimal approvedAmount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}