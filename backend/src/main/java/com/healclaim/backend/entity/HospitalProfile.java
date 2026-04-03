package com.healclaim.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "hospital_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HospitalProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "hospital_name", nullable = false)
    private String hospitalName;

    @Column(name = "registration_no", nullable = false)
    private String registrationNo;

    @Column(nullable = false)
    private String address;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}