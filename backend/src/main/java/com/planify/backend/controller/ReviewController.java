package com.planify.backend.controller;

import com.planify.backend.dto.request.CreateReviewRequest;
import com.planify.backend.dto.response.ReviewResponse;
import com.planify.backend.security.JwtService;
import com.planify.backend.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ReviewController {

    private final ReviewService reviewService;
    private final JwtService jwtService;

    public ReviewController(ReviewService reviewService,
                            JwtService jwtService) {
        this.reviewService = reviewService;
        this.jwtService = jwtService;
    }

    // Utilizatorul lasa review locatiei
    @PostMapping("/api/user/reviews")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> addUserReview(
            @Valid @RequestBody CreateReviewRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = extractId(httpRequest);
            ReviewResponse review =
                    reviewService.addUserReview(request, userId);
            return ResponseEntity.status(201).body(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Locatia lasa rating clientului
    @PostMapping("/api/location/reviews")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<?> addLocationReview(
            @Valid @RequestBody CreateReviewRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long locationId = extractId(httpRequest);
            ReviewResponse review =
                    reviewService.addLocationReview(request, locationId);
            return ResponseEntity.status(201).body(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Review-urile publice ale unei locatii
    @GetMapping("/api/locations/public/{locationId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getLocationReviews(
            @PathVariable Long locationId) {
        return ResponseEntity.ok(
                reviewService.getLocationReviews(locationId));
    }

    // Raportare review inadecvat
    @PostMapping("/api/user/reviews/{reviewId}/report")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> reportReview(
            @PathVariable Long reviewId,
            HttpServletRequest httpRequest) {
        try {
            Long userId = extractId(httpRequest);
            reviewService.reportReview(reviewId, userId);
            return ResponseEntity.ok("Review-ul a fost raportat");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Helper: extrage ID din JWT
    private Long extractId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token);
        return Long.parseLong(publicId.substring(1));
    }

    @GetMapping("/api/user/reviews/received")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ReviewResponse>> getReceivedReviews(HttpServletRequest httpRequest) {
        Long userId = extractId(httpRequest);
        return ResponseEntity.ok(reviewService.getUserReceivedReviews(userId));
    }

    @GetMapping("/api/user/reviews/given")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ReviewResponse>> getGivenReviews(HttpServletRequest httpRequest) {
        Long userId = extractId(httpRequest);
        return ResponseEntity.ok(reviewService.getUserGivenReviews(userId));
    }

    // Review-urile pe care locatia le-a PRIMIT
    @GetMapping("/api/location/reviews/received")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<List<ReviewResponse>> getLocationReceivedReviews(HttpServletRequest httpRequest) {
        Long locationId = extractId(httpRequest);
        // Putem folosi direct metoda existenta
        return ResponseEntity.ok(reviewService.getLocationReviews(locationId));
    }

    // Review-urile pe care locatia le-a OFERIT clienților
    @GetMapping("/api/location/reviews/given")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<List<ReviewResponse>> getLocationGivenReviews(HttpServletRequest httpRequest) {
        Long locationId = extractId(httpRequest);
        return ResponseEntity.ok(reviewService.getLocationGivenReviews(locationId));
    }

    // Raportare review de către LOCAȚIE
    @PostMapping("/api/location/reviews/{reviewId}/report")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<?> reportReviewLocation(
            @PathVariable Long reviewId,
            HttpServletRequest httpRequest) {
        try {
            Long locationId = extractId(httpRequest);
            reviewService.reportReview(reviewId, locationId);
            return ResponseEntity.ok("Review-ul a fost raportat de locație");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}