package com.planify.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_security")
@Getter
@Setter
@NoArgsConstructor
public class AdminSecurity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "recovery_keys_hash", nullable = false, columnDefinition = "TEXT")
    private String recoveryKeysHash;// Stocat ca JSON array de hash-uri: ["hash1","hash2",...]

    @Column(name = "mfa_last_used_at")
    private LocalDateTime mfaLastUsedAt;
}