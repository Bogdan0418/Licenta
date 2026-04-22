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

    @Transactional
    public ReviewResponse addUserReview(CreateReviewRequest req, Long userId) {
        Booking booking = bookingRepository.findById(req.bookingId())
                .orElseThrow(() -> new IllegalArgumentException("Rezervarea nu a fost găsită"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Nu poți lăsa review pentru această rezervare");
        }
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new IllegalArgumentException("Poți lăsa review doar după finalizarea rezervării");
        }
        if (reviewRepository.existsByBookingIdAndReviewerType(req.bookingId(), ReviewerType.USER)) {
            throw new IllegalArgumentException("Ai lăsat deja un review pentru această rezervare");
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setReviewerType(ReviewerType.USER);
        review.setRating(req.rating());
        review.setComment(req.comment());

        Review saved = reviewRepository.save(review);
        recalculateLocationRating(booking.getZone().getLocation().getId());

        return toResponse(saved);
    }

    @Transactional
    public ReviewResponse addLocationReview(CreateReviewRequest req, Long locationId) {
        Booking booking = bookingRepository.findById(req.bookingId())
                .orElseThrow(() -> new IllegalArgumentException("Rezervarea nu a fost găsită"));

        if (!booking.getZone().getLocation().getId().equals(locationId)) {
            throw new IllegalArgumentException("Nu poți lăsa review pentru această rezervare");
        }
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new IllegalArgumentException("Poți lăsa review doar după finalizarea rezervării");
        }
        if (reviewRepository.existsByBookingIdAndReviewerType(req.bookingId(), ReviewerType.LOCATION)) {
            throw new IllegalArgumentException("Ai lăsat deja un rating pentru acest client");
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setReviewerType(ReviewerType.LOCATION);
        review.setRating(req.rating());
        review.setComment(req.comment());

        Review saved = reviewRepository.save(review);
        recalculateUserRating(booking.getUser().getId());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getLocationReviews(Long locationId) {
        return reviewRepository.findReviewsForLocation(locationId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getUserReceivedReviews(Long userId) {
        return reviewRepository.findReviewsForUser(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getUserGivenReviews(Long userId) {
        return reviewRepository.findReviewsGivenByUser(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getLocationGivenReviews(Long locationId) {
        return reviewRepository.findReviewsGivenByLocation(locationId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void reportReview(Long reviewId, Long reporterId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review-ul nu a fost găsit"));
        review.setIsReported(true);
        reviewRepository.save(review);
    }

    private void recalculateLocationRating(Long locationId) {
        Double avg = reviewRepository.calculateAverageRatingForLocation(locationId);
        int count = reviewRepository.countReviewsForLocation(locationId);

        Location location = locationRepository.findById(locationId).orElseThrow();
        if (avg != null) {
            location.setRating(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));
        }
        location.setRatingCount(count);
        locationRepository.save(location);
    }

    private void recalculateUserRating(Long userId) {
        Double avg = reviewRepository.calculateAverageRatingForUser(userId);
        int count = reviewRepository.countReviewsForUser(userId);

        User user = userRepository.findById(userId).orElseThrow();
        if (avg != null) {
            user.setRating(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));
        }
        user.setRatingCount(count);
        userRepository.save(user);
    }

    private ReviewResponse toResponse(Review r) {
        String reviewerName;
        if (r.getReviewerType() == ReviewerType.USER) {
            User user = r.getBooking().getUser();
            reviewerName = user.getFirstName() + " " + user.getLastName();
        } else {
            reviewerName = r.getBooking().getZone().getLocation().getDisplayName();
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