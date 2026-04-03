package com.healclaim.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "policies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Policy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insurer_id", nullable = false)
    private InsurerProfile insurer;

    @Column(name = "policy_name", nullable = false)
    private String policyName;

    @Column(name = "coverage_type", nullable = false)
    private String coverageType;

    @Column(name = "max_coverage", nullable = false)
    private BigDecimal maxCoverage;

    private String description;

    @Column(name = "s3_key_document")
    private String s3KeyDocument;

    @Column(name = "is_active")
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}