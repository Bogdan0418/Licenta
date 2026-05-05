package com.planify.backend.service;

import com.planify.backend.dto.response.*;
import com.planify.backend.entity.*;
import com.planify.backend.entity.enums.LocationStatus;
import com.planify.backend.entity.enums.ReviewerType;
import com.planify.backend.entity.enums.UserRole;
import com.planify.backend.entity.enums.UserStatus;
import com.planify.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.planify.backend.dto.response.AdminStatisticsResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final AuditLogRepository auditLogRepository;
    private final LocationPhotoRepository photoRepository;
    private final BookingRepository bookingRepository;

    public AdminService(LocationRepository locationRepository,
                        UserRepository userRepository,
                        ReviewRepository reviewRepository,
                        AuditLogRepository auditLogRepository,
                        LocationPhotoRepository photoRepository,
                        BookingRepository bookingRepository) {
        this.locationRepository = locationRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.auditLogRepository = auditLogRepository;
        this.photoRepository = photoRepository;
        this.bookingRepository = bookingRepository;
    }

    // Lista locatiilor PENDING
    public List<AdminLocationResponse> getPendingLocations() {
        return locationRepository.findByStatus(LocationStatus.PENDING)
                .stream()
                .map(this::toAdminLocationResponse)
                .collect(Collectors.toList());
    }

    // Aprobare locatie
    @Transactional
    public void approveLocation(Long locationId, Long adminId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Locația nu a fost găsită"));

        if (location.getStatus() != LocationStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Locația nu este în status PENDING");
        }

        location.setStatus(LocationStatus.VERIFIED);
        location.setVerifiedAt(LocalDateTime.now());
        location.setRejectReason(null);
        locationRepository.save(location);

        saveAuditLog(adminId, "APPROVE_LOCATION",
                "LOCATION", locationId,
                "Locația " + location.getPublicId() +
                        " (" + location.getDisplayName() + ") a fost aprobată");
    }

    // Respingere locatie
    @Transactional
    public void rejectLocation(Long locationId, String reason, Long adminId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Locația nu a fost găsită"));

        location.setStatus(LocationStatus.PENDING);
        location.setRejectReason(reason);
        locationRepository.save(location);

        saveAuditLog(adminId, "REJECT_LOCATION",
                "LOCATION", locationId,
                "Locația " + location.getPublicId() +
                        " respinsă. Motiv: " + reason);
    }

    // Blocare locatie
    @Transactional
    public void blockLocation(Long locationId, String reason, Long adminId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Locația nu a fost găsită"));

        location.setStatus(LocationStatus.BLOCKED);
        location.setBlockedReason(reason);
        locationRepository.save(location);

        saveAuditLog(adminId, "BLOCK_LOCATION",
                "LOCATION", locationId,
                "Locația " + location.getPublicId() +
                        " blocată. Motiv: " + reason);
    }

    // Deblocare locatie
    @Transactional
    public void unblockLocation(Long locationId, Long adminId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Locația nu a fost găsită"));

        location.setStatus(LocationStatus.VERIFIED);
        location.setBlockedReason(null);
        locationRepository.save(location);

        saveAuditLog(adminId, "UNBLOCK_LOCATION",
                "LOCATION", locationId,
                "Locația " + location.getPublicId() + " a fost deblocată");
    }

    // Cautare utilizator dupa publicId
    public AdminUserResponse getUserByPublicId(String publicId) {
        User user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Utilizatorul nu a fost găsit"));
        return toAdminUserResponse(user);
    }

    // Cautare locatie dupa publicId
    public AdminLocationResponse getLocationByPublicId(String publicId) {
        Location location = locationRepository.findByPublicId(publicId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Locația nu a fost găsită"));
        return toAdminLocationResponse(location);
    }

    // Blocare utilizator
    @Transactional
    public void blockUser(Long userId, String reason, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Utilizatorul nu a fost găsit"));

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new IllegalArgumentException(
                    "Utilizatorul este deja blocat");
        }

        user.setStatus(UserStatus.BLOCKED);
        userRepository.save(user);

        saveAuditLog(adminId, "BLOCK_USER",
                "USER", userId,
                "Utilizatorul " + user.getPublicId() +
                        " blocat. Motiv: " + reason);
    }

    // Deblocare utilizator
    @Transactional
    public void unblockUser(Long userId, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Utilizatorul nu a fost găsit"));

        if (user.getStatus() != UserStatus.BLOCKED) {
            throw new IllegalArgumentException(
                    "Utilizatorul nu este blocat");
        }

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        saveAuditLog(adminId, "UNBLOCK_USER",
                "USER", userId,
                "Utilizatorul " + user.getPublicId() +
                        " a fost deblocat");
    }

    // Stergere review raportat
    @Transactional
    public void deleteReview(Long reviewId, Long adminId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Review-ul nu a fost găsit"));

        // 1. Păstrăm o referință către locație ÎNAINTE să ștergem recenzia
        // (Ajustează linia asta dacă relația ta din entitate e diferită, ex: review.getBooking().getZone().getLocation())
        Location location = review.getBooking().getZone().getLocation();

        // 2. Ștergem recenzia
        reviewRepository.delete(review);

        // 3. Extragem toate recenziile rămase pentru această locație
        // (Asigură-te că ai o metodă findByLocationId în ReviewRepository)
        List<Review> remainingReviews = reviewRepository.findByLocationId(location.getId());

        // 4. Recalculăm numărul și media
        int newCount = remainingReviews.size();
        double newAverage = 0.0;

        if (newCount > 0) {
            newAverage = remainingReviews.stream()
                    .mapToDouble(Review::getRating) // Presupunând că ai metoda getRating() care întoarce o valoare numerică
                    .average()
                    .orElse(0.0);
        }

        // 5. Actualizăm și salvăm locația
        location.setRatingCount(newCount);
        // Din ce am văzut în CalendarService, folosești BigDecimal pentru rating.
        location.setRating(new java.math.BigDecimal(String.format("%.2f", newAverage)));

        locationRepository.save(location); // Asigură-te că ai LocationRepository injectat în această clasă!

        // 6. Salvăm audit log-ul
        saveAuditLog(adminId, "DELETE_REVIEW",
                "REVIEW", reviewId,
                "Review-ul #" + reviewId + " a fost șters");
    }

    // Review-uri raportate
    @Transactional(readOnly = true)
    public List<AdminReportedReviewResponse> getReportedReviews() {
        return reviewRepository.findByIsReportedTrue()
                .stream()
                .map(r -> {
                    Long authorId;
                    String authorPublicId;
                    String authorName;

                    if (r.getReviewerType() == ReviewerType.USER) {
                        User u = r.getBooking().getUser();
                        authorId = u.getId();
                        authorPublicId = u.getPublicId();
                        authorName = u.getFirstName() + " " + u.getLastName();
                    } else {
                        Location l = r.getBooking().getZone().getLocation();
                        authorId = l.getId();
                        authorPublicId = l.getPublicId();
                        authorName = l.getDisplayName();
                    }

                    return new AdminReportedReviewResponse(
                            r.getId(),
                            r.getReviewerType().name(),
                            authorId,
                            authorPublicId,
                            authorName,
                            r.getRating(),
                            r.getComment(),
                            r.getCreatedAt(),
                            r.getBooking().getId()
                    );
                })
                .collect(Collectors.toList());
    }

    // Audit log
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditLog() {
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc()
                .stream()
                .map(a -> new AuditLogResponse(
                        a.getId(),
                        a.getAdmin().getPublicId(),
                        a.getAction(),
                        a.getTargetType(),
                        a.getTargetId(),
                        a.getDetails(),
                        a.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    // Toate locatiile (pentru monitorizare)
    public List<AdminLocationResponse> getAllLocations() {
        return locationRepository.findAll()
                .stream()
                .map(this::toAdminLocationResponse)
                .collect(Collectors.toList());
    }

    // Helper: salvare audit log
    private void saveAuditLog(Long adminId, String action,
                              String targetType, Long targetId,
                              String details) {
        User admin = userRepository.findById(adminId)
                .orElseThrow();

        AuditLog log = new AuditLog();
        log.setAdmin(admin);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setDetails(details);
        log.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(log);
    }

    // Helper: Location -> AdminLocationResponse
    private AdminLocationResponse toAdminLocationResponse(Location l) {
        int photoCount = photoRepository.countByLocationId(l.getId());
        return new AdminLocationResponse(
                l.getId(),
                l.getPublicId(),
                l.getDisplayName(),
                l.getCompanyName(),
                l.getCui(),
                l.getLegalAddress(),
                l.getContactPhone(),
                l.getOwnerEmail(),
                l.getType(),
                l.getAddress(),
                l.getStatus(),
                l.getRejectReason(),
                l.getBlockedReason(),
                l.getCreatedAt(),
                l.getVerifiedAt(),
                photoCount,
                l.getRating()
        );
    }

    // Helper: User -> AdminUserResponse
    private AdminUserResponse toAdminUserResponse(User u) {
        return new AdminUserResponse(
                u.getId(),
                u.getPublicId(),
                u.getFirstName(),
                u.getLastName(),
                u.getUsername(),
                u.getEmail(),
                u.getPhone(),
                u.getBirthDate(),
                u.getRole(),
                u.getStatus(),
                u.getRating(),
                u.getRatingCount(),
                u.getCreatedAt()
        );
    }

    // Obținerea statisticilor pentru Dashboard-ul de Admin
    @Transactional(readOnly = true)
    public AdminStatisticsResponse getStatistics() {
        long totalUsers = userRepository.countByRoleNot(UserRole.ADMIN);
        long blockedUsers = userRepository.countByStatus(UserStatus.BLOCKED);

        long totalLocations = locationRepository.count();
        long pendingLocations = locationRepository.countByStatus(LocationStatus.PENDING);
        long verifiedLocations = locationRepository.countByStatus(LocationStatus.VERIFIED);

        long totalBookings = bookingRepository.count();

        long reportedReviews = reviewRepository.countByIsReportedTrue();

        return new AdminStatisticsResponse(
                totalUsers,
                blockedUsers,
                totalLocations,
                pendingLocations,
                verifiedLocations,
                totalBookings,
                reportedReviews
        );
    }

    public AdminBlockedAccountsResponse getBlockedAccounts() {
        List<AdminUserResponse> users = userRepository.findByStatus(UserStatus.BLOCKED)
                .stream().map(this::toAdminUserResponse).toList();

        List<AdminLocationResponse> locations = locationRepository.findByStatus(LocationStatus.BLOCKED)
                .stream().map(this::toAdminLocationResponse).toList();

        return new AdminBlockedAccountsResponse(users, locations);
    }

    // Toți utilizatorii (pentru explorator)
    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .filter(u -> u.getRole() != UserRole.ADMIN)
                .map(this::toAdminUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminLocationResponse> getLowRatingLocations() {
        BigDecimal threshold = new BigDecimal("2.0");
        // Luăm doar locațiile verificate care au probleme
        return locationRepository.findByRatingLessThanAndStatus(threshold, LocationStatus.VERIFIED)
                .stream()
                .map(this::toAdminLocationResponse) // Refolosim metoda deja existentă
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getLowRatingUsers() {
        BigDecimal threshold = new BigDecimal("2.0");
        return userRepository.findByRatingLessThan(threshold)
                .stream()
                .map(this::toAdminUserResponse) // Refolosim metoda deja existentă
                .toList();
    }
}
