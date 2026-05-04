package com.planify.backend.controller;

import com.planify.backend.dto.response.LocationSummaryResponse;
import com.planify.backend.entity.User;
import com.planify.backend.repository.UserRepository;
import com.planify.backend.security.JwtService;
import com.planify.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@PreAuthorize("hasAuthority('USER')")
public class UserController {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final UserService userService;

    public UserController(UserRepository userRepository,
                          JwtService jwtService,
                          UserService userService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        Long userId = extractUserId(request);
        User user = userRepository.findById(userId).orElseThrow();

        return ResponseEntity.ok(Map.of(
                "rating", user.getRating(),
                "ratingCount", user.getRatingCount()
        ));
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(@RequestBody Map<String, String> requestBody, HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            String password = requestBody.get("password");

            if (password == null || password.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Parola este obligatorie."));
            }

            userService.deleteAccount(userId, password);
            return ResponseEntity.ok(Map.of("message", "Contul a fost șters cu succes."));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "A apărut o eroare la ștergerea contului."));
        }
    }

    // --- ENDPOINT-URI PENTRU FAVORITE (Lipseau din fișierul tău) ---

    @PostMapping("/favorites/{locationPublicId}")
    public ResponseEntity<?> addFavorite(@PathVariable String locationPublicId, HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            userService.addFavorite(userId, locationPublicId);
            return ResponseEntity.ok(Map.of("message", "Locația a fost adăugată la favorite."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/favorites/{locationPublicId}")
    public ResponseEntity<?> removeFavorite(@PathVariable String locationPublicId, HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            userService.removeFavorite(userId, locationPublicId);
            return ResponseEntity.ok(Map.of("message", "Locația a fost ștearsă din favorite."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/favorites/{locationPublicId}/check")
    public ResponseEntity<?> checkFavorite(@PathVariable String locationPublicId, HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            boolean isFavorite = userService.isFavorite(userId, locationPublicId);
            return ResponseEntity.ok(Map.of("isFavorite", isFavorite));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/favorites")
    public ResponseEntity<List<LocationSummaryResponse>> getFavorites(HttpServletRequest request) {
        Long userId = extractUserId(request);
        List<LocationSummaryResponse> favorites = userService.getUserFavorites(userId);
        return ResponseEntity.ok(favorites);
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token);
        return Long.parseLong(publicId.substring(1));
    }
}