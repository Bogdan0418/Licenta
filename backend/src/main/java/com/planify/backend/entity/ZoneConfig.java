package com.planify.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

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

    // Stocăm duratele ca string separat prin virgulă: "60,90,120"
    @Column(name = "allowed_durations", nullable = false)
    private String allowedDurations = "60";

    @Column(name = "open_time", nullable = false)
    private LocalTime openTime;

    @Column(name = "close_time", nullable = false)
    private LocalTime closeTime;

    @Column(name = "active_days", nullable = false)
    private Integer activeDays = 127; // 127 = toate zilele active

    // Helper methods pentru a lucra usor cu liste de Integers
    public List<Integer> getAllowedDurationsList() {
        if (this.allowedDurations == null || this.allowedDurations.isEmpty()) {
            return List.of(60);
        }
        return Arrays.stream(this.allowedDurations.split(","))
                .map(Integer::parseInt)
                .collect(Collectors.toList());
    }

    public void setAllowedDurationsList(List<Integer> durations) {
        if (durations == null || durations.isEmpty()) {
            this.allowedDurations = "60";
        } else {
            this.allowedDurations = durations.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));
        }
    }
}