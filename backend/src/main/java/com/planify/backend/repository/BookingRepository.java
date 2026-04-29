package com.planify.backend.repository;

import com.planify.backend.entity.Booking;
import com.planify.backend.entity.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    // Toate rezervarile unei locatii (pentru istoric)
    List<Booking> findByZoneLocationIdOrderByBookingDateDescStartTimeDesc(Long locationId);

    // Toate rezervarile unei zone pentru o zi - folosit la generarea sloturilor
    @Query("""
        SELECT b FROM Booking b
        WHERE b.zone.id = :zoneId
          AND b.bookingDate = :date
          AND b.status = 'CONFIRMED'
        """)
    List<Booking> findConfirmedByZoneAndDate(
            @Param("zoneId") Long zoneId,
            @Param("date") LocalDate date
    );

    // Verificare suprapunere - pentru validarea la creare rezervare
    @Query("""
        SELECT COALESCE(SUM(b.groupSize), 0) FROM Booking b
        WHERE b.zone.id = :zoneId
          AND b.bookingDate = :date
          AND b.status = 'CONFIRMED'
          AND b.startTime < :endTime
          AND b.endTime > :startTime
        """)
    int countOverlapping(
            @Param("zoneId") Long zoneId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    // Rezervarile unui utilizator - pentru dashboard
    List<Booking> findByUserIdOrderByBookingDateDescStartTimeDesc(Long userId);

    // Rezervarile viitoare ale unui utilizator
    @Query("""
        SELECT b FROM Booking b
        WHERE b.user.id = :userId
          AND b.status = 'CONFIRMED'
          AND (b.bookingDate > :today
               OR (b.bookingDate = :today AND b.startTime > :now))
        ORDER BY b.bookingDate ASC, b.startTime ASC
        """)
    List<Booking> findUpcomingByUser(
            @Param("userId") Long userId,
            @Param("today") LocalDate today,
            @Param("now") LocalTime now
    );

    // Rezervarile unei locatii pentru o zi - pentru agenda zilnica
    @Query("""
        SELECT b FROM Booking b
        WHERE b.zone.location.id = :locationId
          AND b.bookingDate <= :date
          AND COALESCE(b.eventEndDate, b.bookingDate) >= :date
          AND b.status = 'CONFIRMED'
        ORDER BY b.startTime ASC
        """)
    List<Booking> findByLocationAndDate(
            @Param("locationId") Long locationId,
            @Param("date") LocalDate date
    );

    // Numarul de rezervari active ale unui utilizator
    @Query("""
        SELECT COUNT(b) FROM Booking b
        WHERE b.user.id = :userId
          AND b.status = 'CONFIRMED'
        """)
    int countActiveByUser(@Param("userId") Long userId);

    // Rezervari viitoare confirmate ale unei zone - pentru validarea config
    @Query("""
        SELECT COUNT(b) FROM Booking b
        WHERE b.zone.id = :zoneId
          AND b.status = 'CONFIRMED'
          AND b.bookingDate >= :fromDate
        """)
    long countFutureConfirmed(
            @Param("zoneId") Long zoneId,
            @Param("fromDate") LocalDate fromDate
    );
}
