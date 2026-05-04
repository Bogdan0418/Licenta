package com.planify.backend.service;

import com.planify.backend.dto.response.LocationSummaryResponse;
import com.planify.backend.entity.*;
import com.planify.backend.entity.enums.ReviewerType;
import com.planify.backend.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final UserFavoriteRepository favoriteRepository;
    private final LocationRepository locationRepository;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       BookingRepository bookingRepository,
                       ReviewRepository reviewRepository,
                       UserFavoriteRepository favoriteRepository,
                       LocationRepository locationRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
        this.favoriteRepository = favoriteRepository;
        this.locationRepository = locationRepository;
    }

    @Transactional
    public void deleteAccount(Long userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilizatorul nu a fost găsit."));

        // 1. Validare parolă
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Parola incorectă!");
        }

        // 2. Ștergem toate locațiile favorite salvate de utilizator
        List<UserFavorite> favorites = favoriteRepository.findByUserId(userId);
        favoriteRepository.deleteAll(favorites);

        // 3. Extragem toate rezervările făcute de utilizator
        List<Booking> userBookings = bookingRepository.findByUserIdOrderByBookingDateDescStartTimeDesc(userId);

        for (Booking booking : userBookings) {
            // Ștergem orice recenzie asociată cu această rezervare (fie lăsată de user, fie primită de la locație)
            Optional<Review> userReview = reviewRepository.findByBookingIdAndReviewerType(booking.getId(), ReviewerType.USER);
            userReview.ifPresent(reviewRepository::delete);

            Optional<Review> locReview = reviewRepository.findByBookingIdAndReviewerType(booking.getId(), ReviewerType.LOCATION);
            locReview.ifPresent(reviewRepository::delete);
        }

        // 4. Ștergem rezervările
        bookingRepository.deleteAll(userBookings);

        // 5. La final, ștergem utilizatorul (și restul datelor dacă există cascade ON DELETE în DB)
        userRepository.delete(user);
    }

    @Transactional
    public void addFavorite(Long userId, String locationPublicId) {
        Location location = locationRepository.findByPublicId(locationPublicId)
                .orElseThrow(() -> new IllegalArgumentException("Locația nu a fost găsită."));

        if (!favoriteRepository.existsByUserIdAndLocationId(userId, location.getId())) {
            User user = userRepository.findById(userId).orElseThrow();
            UserFavorite favorite = new UserFavorite();
            favorite.setId(new UserFavoriteId(userId, location.getId()));
            favorite.setUser(user);
            favorite.setLocation(location);
            favoriteRepository.save(favorite);
        }
    }

    @Transactional
    public void removeFavorite(Long userId, String locationPublicId) {
        Location location = locationRepository.findByPublicId(locationPublicId)
                .orElseThrow(() -> new IllegalArgumentException("Locația nu a fost găsită."));

        favoriteRepository.deleteByUserIdAndLocationId(userId, location.getId());
    }

    public boolean isFavorite(Long userId, String locationPublicId) {
        Location location = locationRepository.findByPublicId(locationPublicId)
                .orElseThrow(() -> new IllegalArgumentException("Locația nu a fost găsită."));
        return favoriteRepository.existsByUserIdAndLocationId(userId, location.getId());
    }

    @Transactional(readOnly = true)
    public List<LocationSummaryResponse> getUserFavorites(Long userId) {
        List<UserFavorite> favorites = favoriteRepository.findByUserId(userId);

        return favorites.stream()
                .map(UserFavorite::getLocation)
                .map(loc -> {
                    // Extragem prima poza (daca exista) - ajusteaza in functie de cum sunt salvate in Entity
                    String firstPhotoUrl = (loc.getPhotos() != null && !loc.getPhotos().isEmpty())
                            ? "/uploads/" + loc.getPhotos().get(0).getFilePath() : null;

                    // Extragem facilitatile
                    List<String> facilities = loc.getFacilities() != null
                            ? loc.getFacilities().stream().map(f -> f.getFacility()).toList()
                            : List.of();

                    return new LocationSummaryResponse(
                            loc.getId(),
                            loc.getPublicId(),
                            loc.getDisplayName(),
                            loc.getType(),
                            loc.getAddress(),
                            loc.getLatitude(),
                            loc.getLongitude(),
                            loc.getRating(),
                            loc.getRatingCount(),
                            firstPhotoUrl,
                            facilities,
                            null // distanceKm este null pentru favorite
                    );
                })
                .toList();
    }
}
