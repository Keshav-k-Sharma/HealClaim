package com.healclaim.backend.entity;

import com.healclaim.backend.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false)
    private Claim claim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    private RequestStatus status = RequestStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}