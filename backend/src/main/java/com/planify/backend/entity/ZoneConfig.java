package com.planify.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Entity
@Table(name = "zone_configs")
@Getter
@Setter
@NoArgsConstructor
public class ZoneConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false, unique = true)
    private VenueZone zone;

    @Column(name = "slot_duration_minutes", nullable = false)
    private Integer slotDurationMinutes = 30;

    @Column(name = "booking_duration_minutes", nullable = false)
    private Integer bookingDurationMinutes;

    @Column(name = "open_time", nullable = false)
    private LocalTime openTime;

    @Column(name = "close_time", nullable = false)
    private LocalTime closeTime;

    @Column(name = "active_days", nullable = false)
    private Integer activeDays = 127;// 127 = toate zilele active (bitmask: 1+2+4+8+16+32+64)
}