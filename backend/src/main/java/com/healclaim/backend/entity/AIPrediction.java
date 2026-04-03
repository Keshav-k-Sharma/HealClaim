package com.healclaim.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_predictions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AIPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", unique = true, nullable = false)
    private Claim claim;

    @Column(name = "approval_likelihood", precision = 4, scale = 3)
    private BigDecimal approvalLikelihood;

    @Column(name = "estimated_payout", precision = 15, scale = 2)
    private BigDecimal estimatedPayout;

    @Column(name = "estimated_payout_min", precision = 15, scale = 2)
    private BigDecimal estimatedPayoutMin;

    @Column(name = "estimated_payout_max", precision = 15, scale = 2)
    private BigDecimal estimatedPayoutMax;

    @Column(name = "fraud_score", precision = 4, scale = 3)
    private BigDecimal fraudScore;

    @Column(name = "cost_benchmark", precision = 15, scale = 2)
    private BigDecimal costBenchmark;

    @Column(columnDefinition = "TEXT")
    private String reasoning;

    @CreationTimestamp
    @Column(name = "generated_at", updatable = false)
    private LocalDateTime generatedAt;
}