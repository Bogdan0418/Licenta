package com.planify.backend.entity;

import com.planify.backend.entity.BaseEntity;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.planify.backend.entity.enums.LocationStatus;
import com.planify.backend.entity.enums.LocationType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "locations")
@Getter
@Setter
@NoArgsConstructor
public class Location extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", unique = true, nullable = false)
    private String publicId;

    @Column(name = "owner_email", unique = true, nullable = false)
    private String ownerEmail;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(nullable = false, unique = true)
    private String cui;

    @Column(name = "legal_address", nullable = false)
    private String legalAddress;

    @Column(name = "contact_phone", nullable = false)
    private String contactPhone;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LocationType type;

    @Column(nullable = false)
    private String address;

    private BigDecimal latitude;
    private BigDecimal longitude;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "public_phone")
    private String publicPhone;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> schedule;

    @Column(name = "instagram_url")
    private String instagramUrl;

    @Column(name = "facebook_url")
    private String facebookUrl;

    @Column(name = "tiktok_url")
    private String tiktokUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LocationStatus status = LocationStatus.PENDING;

    @Column(name = "reject_reason")
    private String rejectReason;

    @Column(name = "blocked_reason")
    private String blockedReason;

    @Column(nullable = false)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "rating_count", nullable = false)
    private Integer ratingCount = 0;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "reset_token", unique = true)
    private String resetToken;

    @Column(name = "reset_token_expires_at")
    private LocalDateTime resetTokenExpiresAt;

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<LocationPhoto> photos = new ArrayList<>();

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LocationFacility> facilities = new ArrayList<>();

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VenueZone> zones = new ArrayList<>();

    @Column(name = "allows_events")
    private boolean allowsEvents;

    @Column(name = "max_event_capacity")
    private Integer maxEventCapacity;

    @ElementCollection
    @CollectionTable(name = "location_event_types", joinColumns = @JoinColumn(name = "location_id"))
    @Column(name = "event_type")
    private List<String> eventTypes; // ex: ["Nunta", "Botez", "Corporate"]

    @Column(name = "only_events")
    private boolean onlyEvents;
}