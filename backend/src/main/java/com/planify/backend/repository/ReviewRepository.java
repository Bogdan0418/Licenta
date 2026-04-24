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

    boolean existsByBookingIdAndReviewerType(Long bookingId, ReviewerType reviewerType);
    long countByIsReportedTrue();

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

    @Query("""
        SELECT AVG(r.rating) FROM Review r
        WHERE r.booking.zone.location.id = :locationId
          AND r.reviewerType = 'USER'
          AND r.isReported = false
        """)
    Double calculateAverageRatingForLocation(@Param("locationId") Long locationId);

    @Query("""
        SELECT AVG(r.rating) FROM Review r
        WHERE r.booking.user.id = :userId
          AND r.reviewerType = 'LOCATION'
        """)
    Double calculateAverageRatingForUser(@Param("userId") Long userId);

    @Query("""
        SELECT COUNT(r) FROM Review r
        WHERE r.booking.zone.location.id = :locationId
          AND r.reviewerType = 'USER'
          AND r.isReported = false
        """)
    int countReviewsForLocation(@Param("locationId") Long locationId);

    @Query("""
        SELECT COUNT(r) FROM Review r
        WHERE r.booking.user.id = :userId
          AND r.reviewerType = 'LOCATION'
        """)
    int countReviewsForUser(@Param("userId") Long userId);

    @Query("""
        SELECT r FROM Review r
        JOIN FETCH r.booking b
        JOIN FETCH b.zone z
        JOIN FETCH z.location l
        WHERE b.user.id = :userId
          AND r.reviewerType = 'USER'
        ORDER BY r.createdAt DESC
        """)
    List<Review> findReviewsGivenByUser(@Param("userId") Long userId);

    @Query("""
        SELECT r FROM Review r
        JOIN FETCH r.booking b
        JOIN FETCH b.user u
        JOIN FETCH b.zone z
        JOIN FETCH z.location l
        WHERE l.id = :locationId
          AND r.reviewerType = 'LOCATION'
        ORDER BY r.createdAt DESC
        """)
    List<Review> findReviewsGivenByLocation(@Param("locationId") Long locationId);

    List<Review> findByIsReportedTrue();

    Optional<Review> findByBookingIdAndReviewerType(Long bookingId, ReviewerType reviewerType);
}