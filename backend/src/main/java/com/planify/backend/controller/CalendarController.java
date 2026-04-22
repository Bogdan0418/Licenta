package com.planify.backend.controller;

import com.planify.backend.dto.request.CreateBookingRequest;
import com.planify.backend.dto.request.CreateZoneRequest;
import com.planify.backend.dto.response.BookingResponse;
import com.planify.backend.dto.response.SlotResponse;
import com.planify.backend.entity.VenueZone;
import com.planify.backend.security.JwtService;
import com.planify.backend.service.CalendarService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
public class CalendarController {

    private final CalendarService calendarService;
    private final JwtService jwtService;

    public CalendarController(CalendarService calendarService,
                              JwtService jwtService) {
        this.calendarService = calendarService;
        this.jwtService = jwtService;
    }

    // PUBLICE

    // Sloturi disponibile pentru o zona si o data
    @GetMapping("/api/locations/public/zones/{zoneId}/slots")
    public ResponseEntity<List<SlotResponse>> getSlots(
            @PathVariable Long zoneId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {
        return ResponseEntity.ok(
                calendarService.getAvailableSlots(zoneId, date));
    }

    // USER

    // Creare rezervare
    @PostMapping("/api/user/bookings")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = extractUserId(httpRequest);
            BookingResponse booking =
                    calendarService.createBooking(request, userId);
            return ResponseEntity.status(201).body(booking);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Anulare rezervare
    @DeleteMapping("/api/user/bookings/{bookingId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long bookingId,
            HttpServletRequest httpRequest) {
        try {
            Long userId = extractUserId(httpRequest);
            BookingResponse booking =
                    calendarService.cancelBooking(bookingId, userId);
            return ResponseEntity.ok(booking);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Rezervarile mele
    @GetMapping("/api/user/bookings")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<BookingResponse>> getMyBookings(
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(calendarService.getUserBookings(userId));
    }

    // LOCATION

    // Creare zona
    @PostMapping("/api/location/zones")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<?> createZone(
            @Valid @RequestBody CreateZoneRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long locationId = extractLocationId(httpRequest);
            VenueZone zone =
                    calendarService.createZone(request, locationId);
            return ResponseEntity.status(201)
                    .body("Zona a fost creată cu succes. ID: " + zone.getId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Agenda zilnica
    @GetMapping("/api/location/agenda")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<List<BookingResponse>> getAgenda(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date,
            HttpServletRequest httpRequest) {
        Long locationId = extractLocationId(httpRequest);
        return ResponseEntity.ok(
                calendarService.getLocationAgenda(locationId, date));
    }

    // Marcare no-show
    @PostMapping("/api/location/bookings/{bookingId}/no-show")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<?> markNoShow(
            @PathVariable Long bookingId,
            HttpServletRequest httpRequest) {
        try {
            Long locationId = extractLocationId(httpRequest);
            calendarService.markNoShow(bookingId, locationId);
            return ResponseEntity.ok("Neprezentarea a fost marcată");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Helper: extrage userId din JWT
    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token);
        return Long.parseLong(publicId.substring(1));
    }

    private Long extractLocationId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token);
        return Long.parseLong(publicId.substring(1));
    }

    // Toate rezervarile (istoric) pentru o locatie
    @GetMapping("/api/location/bookings")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<List<BookingResponse>> getLocationBookings(
            HttpServletRequest httpRequest) {
        Long locationId = extractLocationId(httpRequest);
        return ResponseEntity.ok(calendarService.getLocationBookings(locationId));
    }
}
