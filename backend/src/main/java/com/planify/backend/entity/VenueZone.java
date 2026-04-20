package com.planify.backend.entity;

import com.planify.backend.entity.BaseEntity;
import com.planify.backend.entity.Booking;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "venue_zones")
@Getter
@Setter
@NoArgsConstructor
public class VenueZone extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "max_persons", nullable = false)
    private Integer maxPersons;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToOne(mappedBy = "zone", cascade = CascadeType.ALL, orphanRemoval = true)
    private ZoneConfig config;

    @OneToMany(mappedBy = "zone", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Booking> bookings = new ArrayList<>();
}