package com.planify.backend.service;

import com.planify.backend.dto.response.*;
import com.planify.backend.entity.*;
import com.planify.backend.entity.enums.LocationStatus;
import com.planify.backend.entity.enums.UserStatus;
import com.planify.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public AdminService(LocationRepository locationRepository,
                        UserRepository userRepository,
                        ReviewRepository reviewRepository,
                        AuditLogRepository auditLogRepository,
                        LocationPhotoRepository photoRepository) {
        this.locationRepository = locationRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.auditLogRepository = auditLogRepository;
        this.photoRepository = photoRepository;
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

        reviewRepository.delete(review);

        saveAuditLog(adminId, "DELETE_REVIEW",
                "REVIEW", reviewId,
                "Review-ul #" + reviewId + " a fost șters");
    }

    // Review-uri raportate
    public List<ReviewResponse> getReportedReviews() {
        return reviewRepository.findByIsReportedTrue()
                .stream()
                .map(r -> new ReviewResponse(
                        r.getId(),
                        r.getReviewerType(),
                        r.getRating(),
                        r.getComment(),
                        r.getCreatedAt(),
                        r.getReviewerType().name(),
                        r.getBooking().getId()
                ))
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
                photoCount
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
}
