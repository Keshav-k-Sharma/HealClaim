package com.healclaim.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "patient_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "national_id", nullable = false)
    private String nationalId;

    @Column(name = "qr_code_token", unique = true, nullable = false)
    private String qrCodeToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_policy_id")
    private Policy activePolicy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}