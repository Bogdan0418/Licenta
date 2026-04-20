package com.planify.backend.service;

import com.planify.backend.dto.request.CreateReviewRequest;
import com.planify.backend.dto.response.ReviewResponse;
import com.planify.backend.entity.*;
import com.planify.backend.entity.enums.BookingStatus;
import com.planify.backend.entity.enums.ReviewerType;
import com.planify.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         BookingRepository bookingRepository,
                         UserRepository userRepository,
                         LocationRepository locationRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
    }

    // Utilizatorul recenzeaza locatia
    @Transactional
    public ReviewResponse addUserReview(CreateReviewRequest req,
                                        Long userId) {

        Booking booking = bookingRepository.findById(req.bookingId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Rezervarea nu a fost găsită"));

        // Verifica ca rezervarea ii apartine utilizatorului
        if (!booking.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Nu poți lăsa review pentru această rezervare");
        }

        // Rezervarea trebuie sa fie COMPLETED
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new IllegalArgumentException(
                    "Poți lăsa review doar după finalizarea rezervării");
        }

        // Nu poti da review de doua ori
        if (reviewRepository.existsByBookingIdAndReviewerType(
                req.bookingId(), ReviewerType.USER)) {
            throw new IllegalArgumentException(
                    "Ai lăsat deja un review pentru această rezervare");
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setReviewerType(ReviewerType.USER);
        review.setRating(req.rating());
        review.setComment(req.comment());

        Review saved = reviewRepository.save(review);

        // Recalculeaza ratingul locatiei
        recalculateLocationRating(
                booking.getZone().getLocation().getId());

        return toResponse(saved);
    }

    // Locatia recenzeaza utilizatorul
    @Transactional
    public ReviewResponse addLocationReview(CreateReviewRequest req,
                                            Long locationId) {

        Booking booking = bookingRepository.findById(req.bookingId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Rezervarea nu a fost găsită"));

        // Verifica ca rezervarea este a acestei locatii
        if (!booking.getZone().getLocation().getId().equals(locationId)) {
            throw new IllegalArgumentException(
                    "Nu poți lăsa review pentru această rezervare");
        }

        // Rezervarea trebuie sa fie COMPLETED
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new IllegalArgumentException(
                    "Poți lăsa review doar după finalizarea rezervării");
        }

        // Nu poti da review de doua ori
        if (reviewRepository.existsByBookingIdAndReviewerType(
                req.bookingId(), ReviewerType.LOCATION)) {
            throw new IllegalArgumentException(
                    "Ai lăsat deja un rating pentru acest client");
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setReviewerType(ReviewerType.LOCATION);
        review.setRating(req.rating());
        review.setComment(req.comment());

        Review saved = reviewRepository.save(review);

        // Recalculeaza ratingul utilizatorului
        recalculateUserRating(booking.getUser().getId());

        return toResponse(saved);
    }

    // Vizualizare review-uri ale unei locatii (public)
    @Transactional(readOnly = true)
    public List<ReviewResponse> getLocationReviews(Long locationId) {
        return reviewRepository.findReviewsForLocation(locationId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Raportare review inadecvat
    @Transactional
    public void reportReview(Long reviewId, Long reporterId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Review-ul nu a fost găsit"));
        review.setIsReported(true);
        reviewRepository.save(review);
    }

    // Recalculare rating locatie
    private void recalculateLocationRating(Long locationId) {
        Double avg = reviewRepository
                .calculateAverageRatingForLocation(locationId);
        int count = reviewRepository.countReviewsForLocation(locationId);

        Location location = locationRepository.findById(locationId)
                .orElseThrow();

        if (avg != null) {
            location.setRating(
                    BigDecimal.valueOf(avg)
                            .setScale(2, RoundingMode.HALF_UP));
        }
        location.setRatingCount(count);
        locationRepository.save(location);
    }

    // Recalculare rating utilizator
    private void recalculateUserRating(Long userId) {
        Double avg = reviewRepository
                .calculateAverageRatingForUser(userId);

        User user = userRepository.findById(userId).orElseThrow();

        if (avg != null) {
            user.setRating(
                    BigDecimal.valueOf(avg)
                            .setScale(2, RoundingMode.HALF_UP));
        }
        userRepository.save(user);
    }

    // Helper: Review -> ReviewResponse
    private ReviewResponse toResponse(Review r) {
        String reviewerName;

        if (r.getReviewerType() == ReviewerType.USER) {
            User user = r.getBooking().getUser();
            reviewerName = user.getFirstName() + " " + user.getLastName();
        } else {
            reviewerName = r.getBooking().getZone()
                    .getLocation().getDisplayName();
        }

        return new ReviewResponse(
                r.getId(),
                r.getReviewerType(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt(),
                reviewerName,
                r.getBooking().getId()
        );
    }
}
