package com.planify.backend.service;

import com.planify.backend.entity.Booking;
import com.planify.backend.entity.Review;
import com.planify.backend.entity.User;
import com.planify.backend.entity.UserFavorite;
import com.planify.backend.entity.enums.ReviewerType;
import com.planify.backend.repository.BookingRepository;
import com.planify.backend.repository.ReviewRepository;
import com.planify.backend.repository.UserFavoriteRepository;
import com.planify.backend.repository.UserRepository;
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

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       BookingRepository bookingRepository,
                       ReviewRepository reviewRepository,
                       UserFavoriteRepository favoriteRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
        this.favoriteRepository = favoriteRepository;
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
}
