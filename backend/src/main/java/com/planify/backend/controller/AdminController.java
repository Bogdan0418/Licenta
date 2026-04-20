package com.planify.backend.controller;

import com.planify.backend.dto.request.BlockAccountRequest;
import com.planify.backend.dto.request.RejectLocationRequest;
import com.planify.backend.dto.response.*;
import com.planify.backend.security.JwtService;
import com.planify.backend.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final JwtService jwtService;

    public AdminController(AdminService adminService,
                           JwtService jwtService) {
        this.adminService = adminService;
        this.jwtService = jwtService;
    }

    // ── Locații PENDING ───────────────────────────────────────────────────
    @GetMapping("/locations/pending")
    public ResponseEntity<List<AdminLocationResponse>> getPendingLocations() {
        return ResponseEntity.ok(adminService.getPendingLocations());
    }

    // ── Toate locațiile ───────────────────────────────────────────────────
    @GetMapping("/locations")
    public ResponseEntity<List<AdminLocationResponse>> getAllLocations() {
        return ResponseEntity.ok(adminService.getAllLocations());
    }

    // ── Aprobare locație ──────────────────────────────────────────────────
    @PostMapping("/locations/{id}/approve")
    public ResponseEntity<?> approveLocation(
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            Long adminId = extractAdminId(request);
            adminService.approveLocation(id, adminId);
            return ResponseEntity.ok("Locația a fost aprobată cu succes");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Respingere locație ────────────────────────────────────────────────
    @PostMapping("/locations/{id}/reject")
    public ResponseEntity<?> rejectLocation(
            @PathVariable Long id,
            @Valid @RequestBody RejectLocationRequest req,
            HttpServletRequest request) {
        try {
            Long adminId = extractAdminId(request);
            adminService.rejectLocation(id, req.reason(), adminId);
            return ResponseEntity.ok("Locația a fost respinsă");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Blocare locație ───────────────────────────────────────────────────
    @PostMapping("/locations/{id}/block")
    public ResponseEntity<?> blockLocation(
            @PathVariable Long id,
            @Valid @RequestBody BlockAccountRequest req,
            HttpServletRequest request) {
        try {
            Long adminId = extractAdminId(request);
            adminService.blockLocation(id, req.reason(), adminId);
            return ResponseEntity.ok("Locația a fost blocată");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Deblocare locație ─────────────────────────────────────────────────
    @PostMapping("/locations/{id}/unblock")
    public ResponseEntity<?> unblockLocation(
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            Long adminId = extractAdminId(request);
            adminService.unblockLocation(id, adminId);
            return ResponseEntity.ok("Locația a fost deblocată");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Căutare cont după publicId ────────────────────────────────────────
    @GetMapping("/accounts/{publicId}")
    public ResponseEntity<?> getAccount(@PathVariable String publicId) {
        try {
            if (publicId.startsWith("C")) {
                return ResponseEntity.ok(
                        adminService.getUserByPublicId(publicId));
            } else if (publicId.startsWith("L")) {
                return ResponseEntity.ok(
                        adminService.getLocationByPublicId(publicId));
            }
            return ResponseEntity.badRequest()
                    .body("ID invalid — trebuie să înceapă cu C sau L");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Blocare utilizator ────────────────────────────────────────────────
    @PostMapping("/users/{id}/block")
    public ResponseEntity<?> blockUser(
            @PathVariable Long id,
            @Valid @RequestBody BlockAccountRequest req,
            HttpServletRequest request) {
        try {
            Long adminId = extractAdminId(request);
            adminService.blockUser(id, req.reason(), adminId);
            return ResponseEntity.ok("Utilizatorul a fost blocat");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Deblocare utilizator ──────────────────────────────────────────────
    @PostMapping("/users/{id}/unblock")
    public ResponseEntity<?> unblockUser(
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            Long adminId = extractAdminId(request);
            adminService.unblockUser(id, adminId);
            return ResponseEntity.ok("Utilizatorul a fost deblocat");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Review-uri raportate ──────────────────────────────────────────────
    @GetMapping("/reviews/reported")
    public ResponseEntity<List<ReviewResponse>> getReportedReviews() {
        return ResponseEntity.ok(adminService.getReportedReviews());
    }

    // ── Ștergere review ───────────────────────────────────────────────────
    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            Long adminId = extractAdminId(request);
            adminService.deleteReview(id, adminId);
            return ResponseEntity.ok("Review-ul a fost șters");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Audit log ─────────────────────────────────────────────────────────
    @GetMapping("/audit-log")
    public ResponseEntity<List<AuditLogResponse>> getAuditLog() {
        return ResponseEntity.ok(adminService.getAuditLog());
    }

    // ── Helper: extrage adminId din JWT ───────────────────────────────────
    private Long extractAdminId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token);
        return Long.parseLong(publicId.substring(1));
    }
}