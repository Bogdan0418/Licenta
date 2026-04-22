package com.planify.backend.controller;

import com.planify.backend.entity.User;
import com.planify.backend.repository.UserRepository;
import com.planify.backend.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@PreAuthorize("hasRole('USER')")
public class UserController {

    // 1. Declararea dependențelor
    private final UserRepository userRepository;
    private final JwtService jwtService;

    // 2. Injectarea lor prin constructor
    public UserController(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        Long userId = extractUserId(request);
        User user = userRepository.findById(userId).orElseThrow();

        // Returnezi un DTO simplu cu rating-ul si alte detalii
        return ResponseEntity.ok(Map.of(
                "rating", user.getRating(),
                "ratingCount", user.getRatingCount()
        ));
    }

    // 3. Metoda ajutătoare pentru extragerea ID-ului utilizatorului din token-ul JWT
    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token);
        // Se elimină prima literă (de ex. 'C') și se convertește restul în Long
        return Long.parseLong(publicId.substring(1));
    }
}