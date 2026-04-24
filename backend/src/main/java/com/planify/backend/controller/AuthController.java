package com.planify.backend.controller;

import com.planify.backend.dto.request.LoginRequest;
import com.planify.backend.dto.request.RegisterLocationRequest;
import com.planify.backend.dto.request.RegisterUserRequest;
import com.planify.backend.dto.response.AuthResponse;
import com.planify.backend.entity.Location;
import com.planify.backend.entity.User;
import com.planify.backend.entity.enums.LocationStatus;
import com.planify.backend.entity.enums.UserRole;
import com.planify.backend.entity.enums.UserStatus;
import com.planify.backend.repository.LocationRepository;
import com.planify.backend.repository.UserRepository;
import com.planify.backend.security.JwtService;
import com.planify.backend.service.LocationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;

import java.util.Map;
import java.util.UUID;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final PasswordEncoder passwordEncoder;
    private final LocationService locationService;

    // Serviciul de email declarat aici
    private final JavaMailSender javaMailSender;

    // Constructorul actualizat care include și JavaMailSender
    public AuthController(AuthenticationManager authenticationManager,
                          JwtService jwtService,
                          UserRepository userRepository,
                          LocationRepository locationRepository,
                          PasswordEncoder passwordEncoder,
                          LocationService locationService,
                          JavaMailSender javaMailSender) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
        this.passwordEncoder = passwordEncoder;
        this.locationService = locationService;
        this.javaMailSender = javaMailSender;
    }

    // ── Login ──────────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()
                    )
            );
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401)
                    .body("Email sau parolă incorectă");
        }

        // Caută în users
        Optional<User> userOpt = userRepository.findByEmail(request.email());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = jwtService.generateToken(
                    user.getEmail(),
                    user.getRole().name(),
                    user.getPublicId()
            );
            return ResponseEntity.ok(new AuthResponse(
                    token,
                    user.getPublicId(),
                    user.getRole().name(),
                    user.getEmail()
            ));
        }

        // Caută în locations
        Optional<Location> locationOpt =
                locationRepository.findByOwnerEmail(request.email());
        if (locationOpt.isPresent()) {
            Location location = locationOpt.get();

            if (location.getStatus() == LocationStatus.PENDING) {
                return ResponseEntity.status(403)
                        .body("Contul tău este în așteptarea aprobării");
            }
            if (location.getStatus() == LocationStatus.BLOCKED) {
                return ResponseEntity.status(403)
                        .body("Contul tău a fost blocat");
            }

            String token = jwtService.generateToken(
                    location.getOwnerEmail(),
                    "LOCATION",
                    location.getPublicId()
            );
            return ResponseEntity.ok(new AuthResponse(
                    token,
                    location.getPublicId(),
                    "LOCATION",
                    location.getOwnerEmail()
            ));
        }

        return ResponseEntity.status(404).body("Contul nu a fost găsit");
    }

    // ── Register Utilizator ────────────────────────────────────────────────
    @PostMapping("/register/user")
    public ResponseEntity<?> registerUser(
            @Valid @RequestBody RegisterUserRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest()
                    .body("Există deja un cont cu acest email");
        }
        if (userRepository.existsByUsername(request.username())) {
            return ResponseEntity.badRequest()
                    .body("Username-ul este deja folosit");
        }
        if (userRepository.existsByPhone(request.phone())) {
            return ResponseEntity.badRequest()
                    .body("Numărul de telefon este deja folosit");
        }

        // Extrage data nașterii din CNP
        // Format CNP: SAAJJZZNNNJJC
        // S=sex/secol, AA=an, JJ=luna, ZZ=zi
        int year  = Integer.parseInt(request.cnp().substring(1, 3));
        int month = Integer.parseInt(request.cnp().substring(3, 5));
        int day   = Integer.parseInt(request.cnp().substring(5, 7));
        int s     = Integer.parseInt(request.cnp().substring(0, 1));

        int fullYear;
        if (s == 1 || s == 2)      fullYear = 1900 + year;
        else if (s == 3 || s == 4) fullYear = 1800 + year;
        else if (s == 5 || s == 6) fullYear = 2000 + year;
        else                       fullYear = 1900 + year;

        LocalDate birthDate = LocalDate.of(fullYear, month, day);

        // Hash CNP după extragerea datei de naștere
        String cnpHash = passwordEncoder.encode(request.cnp());

        if (userRepository.existsByCnpHash(cnpHash)) {
            return ResponseEntity.badRequest()
                    .body("Există deja un cont asociat acestui CNP");
        }

        // Generează public_id
        long count = userRepository.count();
        String publicId = "C" + (count + 1);

        User user = new User();
        user.setPublicId(publicId);
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());
        user.setCnpHash(cnpHash);
        user.setBirthDate(birthDate);
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(true);
        user.setPhoneVerified(true);

        userRepository.save(user);

        return ResponseEntity.status(201)
                .body("Contul a fost creat cu succes. ID: " + publicId);
    }

    // ── Register Locație ───────────────────────────────────────────────────
    @PostMapping("/register/location")
    public ResponseEntity<?> registerLocation(
            @Valid @RequestBody RegisterLocationRequest request) {
        try {
            Location location = locationService.registerLocation(request);
            return ResponseEntity.status(201)
                    .body("Contul a fost creat cu succes. " +
                            "Status: PENDING — așteptați aprobarea adminului. " +
                            "ID: " + location.getPublicId());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Forgot Password ───────────────────────────────────────────────────
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String token = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusHours(1); // Expiră într-o oră

        boolean found = false;

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setResetToken(token);
            user.setResetTokenExpiresAt(expiry);
            userRepository.save(user);
            found = true;
        } else {
            Optional<Location> locOpt = locationRepository.findByOwnerEmail(email);
            if (locOpt.isPresent()) {
                Location loc = locOpt.get();
                loc.setResetToken(token);
                loc.setResetTokenExpiresAt(expiry);
                locationRepository.save(loc);
                found = true;
            }
        }

        if (found) {
            String resetLink = "http://localhost:3000/reset-password?token=" + token;
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Resetare parolă - Planify");
            message.setText("Accesează următorul link pentru a-ți reseta parola: \n" + resetLink);

            // Această linie va trimite efectiv mailul
            javaMailSender.send(message);
        }

        // Returnăm mereu OK pentru a nu dezvălui ce email-uri există în baza de date (Security Best Practice)
        return ResponseEntity.ok("Dacă email-ul există în sistem, vei primi un link de resetare.");
    }

    // ── Reset Password ────────────────────────────────────────────────────
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        // Caută token-ul în Users
        Optional<User> userOpt = userRepository.findAll().stream()
                .filter(u -> token.equals(u.getResetToken()))
                .findFirst();

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body("Link-ul a expirat.");
            }
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            user.setResetToken(null);
            user.setResetTokenExpiresAt(null);
            userRepository.save(user);
            return ResponseEntity.ok("Parola a fost schimbată cu succes.");
        }

        // Caută token-ul în Locations
        Optional<Location> locOpt = locationRepository.findAll().stream()
                .filter(l -> token.equals(l.getResetToken()))
                .findFirst();

        if (locOpt.isPresent()) {
            Location loc = locOpt.get();
            if (loc.getResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body("Link-ul a expirat.");
            }
            loc.setPasswordHash(passwordEncoder.encode(newPassword));
            loc.setResetToken(null);
            loc.setResetTokenExpiresAt(null);
            locationRepository.save(loc);
            return ResponseEntity.ok("Parola a fost schimbată cu succes.");
        }

        return ResponseEntity.badRequest().body("Token invalid.");
    }
}