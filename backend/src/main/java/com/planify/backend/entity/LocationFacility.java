package com.planify.backend.entity;

import com.planify.backend.entity.enums.Facility;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "location_facilities")
@Getter
@Setter
@NoArgsConstructor
public class LocationFacility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Facility facility;
}