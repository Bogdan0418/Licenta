package com.planify.backend.controller;

import com.planify.backend.dto.request.CreateReviewRequest;
import com.planify.backend.dto.response.ReviewResponse;
import com.planify.backend.entity.Location;
import com.planify.backend.repository.LocationRepository;
import com.planify.backend.security.JwtService;
import com.planify.backend.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
public class ReviewController {

    private final ReviewService reviewService;
    private final JwtService jwtService;
    private final LocationRepository locationRepository; // 1. Am adăugat repository-ul

    public ReviewController(ReviewService reviewService,
                            JwtService jwtService,
                            LocationRepository locationRepository) {
        this.reviewService = reviewService;
        this.jwtService = jwtService;
        this.locationRepository = locationRepository;
    }

    // Utilizatorul lasa review locatiei
    @PostMapping("/api/user/reviews")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<?> addUserReview(
            @Valid @RequestBody CreateReviewRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = extractUserId(httpRequest); // Folosim extragerea pentru user
            ReviewResponse review = reviewService.addUserReview(request, userId);
            return ResponseEntity.status(201).body(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Locatia lasa rating clientului
    @PostMapping("/api/location/reviews")
    @PreAuthorize("hasAuthority('LOCATION')")
    public ResponseEntity<?> addLocationReview(
            @Valid @RequestBody CreateReviewRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long locationId = extractLocationId(httpRequest); // Folosim extragerea pentru locație
            ReviewResponse review = reviewService.addLocationReview(request, locationId);
            return ResponseEntity.status(201).body(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Review-urile publice ale unei locatii
    @GetMapping("/api/locations/public/{locationId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getLocationReviews(
            @PathVariable Long locationId) {
        return ResponseEntity.ok(reviewService.getLocationReviews(locationId));
    }

    // Raportare review inadecvat
    @PostMapping("/api/user/reviews/{reviewId}/report")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<?> reportReview(
            @PathVariable Long reviewId,
            HttpServletRequest httpRequest) {
        try {
            Long userId = extractUserId(httpRequest); // Folosim extragerea pentru user
            reviewService.reportReview(reviewId, userId);
            return ResponseEntity.ok("Review-ul a fost raportat");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/api/user/reviews/received")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<List<ReviewResponse>> getReceivedReviews(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest); // Folosim extragerea pentru user
        return ResponseEntity.ok(reviewService.getUserReceivedReviews(userId));
    }

    @GetMapping("/api/user/reviews/given")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<List<ReviewResponse>> getGivenReviews(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest); // Folosim extragerea pentru user
        return ResponseEntity.ok(reviewService.getUserGivenReviews(userId));
    }

    // Review-urile pe care locatia le-a PRIMIT
    @GetMapping("/api/location/reviews/received")
    @PreAuthorize("hasAuthority('LOCATION')")
    public ResponseEntity<List<ReviewResponse>> getLocationReceivedReviews(HttpServletRequest httpRequest) {
        Long locationId = extractLocationId(httpRequest); // Folosim extragerea pentru locație
        return ResponseEntity.ok(reviewService.getLocationReviews(locationId));
    }

    // Review-urile pe care locatia le-a OFERIT clienților
    @GetMapping("/api/location/reviews/given")
    @PreAuthorize("hasAuthority('LOCATION')")
    public ResponseEntity<List<ReviewResponse>> getLocationGivenReviews(HttpServletRequest httpRequest) {
        Long locationId = extractLocationId(httpRequest); // Folosim extragerea pentru locație
        return ResponseEntity.ok(reviewService.getLocationGivenReviews(locationId));
    }

    // Raportare review de către LOCAȚIE
    @PostMapping("/api/location/reviews/{reviewId}/report")
    @PreAuthorize("hasAuthority('LOCATION')")
    public ResponseEntity<?> reportReviewLocation(
            @PathVariable Long reviewId,
            HttpServletRequest httpRequest) {
        try {
            Long locationId = extractLocationId(httpRequest); // Folosim extragerea pentru locație
            reviewService.reportReview(reviewId, locationId);
            return ResponseEntity.ok("Review-ul a fost raportat de locație");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- HELPER METODE ---

    // Extrage ID-ul pentru un UTILIZATOR (Client)
    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token);
        return Long.parseLong(publicId.substring(1));
    }

    // Extrage ID-ul real pentru o LOCAȚIE, căutând în baza de date
    private Long extractLocationId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token);

        Location location = locationRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Locația nu a fost găsită."));

        return location.getId();
    }
}