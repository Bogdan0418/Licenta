package com.planify.backend.repository;

import com.planify.backend.entity.Review;
import com.planify.backend.entity.enums.ReviewerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Verifica daca exista deja un review pentru aceasta rezervare si tip
    boolean existsByBookingIdAndReviewerType(
            Long bookingId, ReviewerType reviewerType);

    // Review-urile primite de o locatie (scrise de utilizatori)
    @Query("""
    SELECT r FROM Review r
    JOIN FETCH r.booking b
    JOIN FETCH b.user u
    JOIN FETCH b.zone z
    JOIN FETCH z.location l
    WHERE l.id = :locationId
      AND r.reviewerType = 'USER'
      AND r.isReported = false
    ORDER BY r.createdAt DESC
    """)
    List<Review> findReviewsForLocation(@Param("locationId") Long locationId);

    // Review-urile primite de un utilizator (scrise de locatii)
    @Query("""
    SELECT r FROM Review r
    JOIN FETCH r.booking b
    JOIN FETCH b.user u
    JOIN FETCH b.zone z
    JOIN FETCH z.location l
    WHERE u.id = :userId
      AND r.reviewerType = 'LOCATION'
    ORDER BY r.createdAt DESC
    """)
    List<Review> findReviewsForUser(@Param("userId") Long userId);

    // Rating mediu pentru o locatie
    @Query("""
        SELECT AVG(r.rating) FROM Review r
        WHERE r.booking.zone.location.id = :locationId
          AND r.reviewerType = 'USER'
          AND r.isReported = false
        """)
    Double calculateAverageRatingForLocation(
            @Param("locationId") Long locationId);

    // Rating mediu pentru un utilizator
    @Query("""
        SELECT AVG(r.rating) FROM Review r
        WHERE r.booking.user.id = :userId
          AND r.reviewerType = 'LOCATION'
        """)
    Double calculateAverageRatingForUser(@Param("userId") Long userId);

    // Numarul de review-uri pentru o locatie
    @Query("""
        SELECT COUNT(r) FROM Review r
        WHERE r.booking.zone.location.id = :locationId
          AND r.reviewerType = 'USER'
          AND r.isReported = false
        """)
    int countReviewsForLocation(@Param("locationId") Long locationId);

    // Review-uri raportate - pentru admin
    List<Review> findByIsReportedTrue();

    // Gaseste review-ul unui booking specific
    Optional<Review> findByBookingIdAndReviewerType(
            Long bookingId, ReviewerType reviewerType);
}
