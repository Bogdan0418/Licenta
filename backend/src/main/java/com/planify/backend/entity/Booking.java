package com.planify.backend.entity;

import com.planify.backend.entity.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
public class Booking extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private VenueZone zone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "group_size", nullable = false)
    private Integer groupSize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.CONFIRMED;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "is_event")
    private boolean isEvent;

    @Column(name = "guest_count")
    private Integer guestCount;

    @Column(name = "event_start_time")
    private LocalDateTime eventStartTime;

    @Column(name = "event_end_time")
    private LocalDateTime eventEndTime;

    @Column(name = "event_end_date")
    private LocalDate eventEndDate;

    @Column(name = "event_description", columnDefinition = "TEXT")
    private String eventDescription;

    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;
}
