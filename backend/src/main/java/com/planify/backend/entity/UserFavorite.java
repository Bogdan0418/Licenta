package com.planify.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_favorites")
@Getter
@Setter
@NoArgsConstructor
public class UserFavorite {

    @EmbeddedId
    private UserFavoriteId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("locationId")
    @JoinColumn(name = "location_id")
    private Location location;

    @Column(name = "saved_at", nullable = false)
    private LocalDateTime savedAt = LocalDateTime.now();
}