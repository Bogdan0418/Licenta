package com.planify.backend.controller;

import com.planify.backend.dto.request.RegisterLocationRequest;
import com.planify.backend.dto.response.LocationDetailResponse;
import com.planify.backend.dto.response.LocationSummaryResponse;
import com.planify.backend.entity.Location;
import com.planify.backend.entity.enums.LocationType;
import com.planify.backend.repository.LocationRepository;
import com.planify.backend.security.JwtService;
import com.planify.backend.service.LocationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class LocationController {

    private final LocationService locationService;
    // 1. Am adăugat repository-ul și serviciul JWT
    private final LocationRepository locationRepository;
    private final JwtService jwtService;

    // 2. Am actualizat constructorul pentru a le injecta automat
    public LocationController(LocationService locationService,
                              LocationRepository locationRepository,
                              JwtService jwtService) {
        this.locationService = locationService;
        this.locationRepository = locationRepository;
        this.jwtService = jwtService;
    }

    // Rute PUBLICE (/api/locations/public/)

    // Cautare si filtrare locatii
    @GetMapping("/api/locations/public/search")
    public ResponseEntity<List<LocationSummaryResponse>> search(
            @RequestParam(required = false) LocationType type,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm) {

        return ResponseEntity.ok(
                locationService.searchLocations(type, searchTerm, lat, lng, radiusKm)
        );
    }

    // Detalii locatie publica
    @GetMapping("/api/locations/public/{id}")
    public ResponseEntity<LocationDetailResponse> getDetail(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                locationService.getLocationDetail(id, null)
        );
    }

    // Rute LOCATION (necesita autentificare ca locatie)

    // Toggle status INACTIVE/VERIFIED
    @PutMapping("/api/location/status/toggle")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<?> toggleStatus() {
        // Implementare în Faza 7 (Dashboard Locatie)
        return ResponseEntity.ok("În dezvoltare");
    }

    // 3. Noul tău endpoint corectat pentru Profil
    @GetMapping("/api/location/profile")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<?> getMyProfile(HttpServletRequest request) {
        // extrage ID-ul din token
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token);
        Long locationId = Long.parseLong(publicId.substring(1));

        Location location = locationRepository.findById(locationId).orElseThrow();

        return ResponseEntity.ok(Map.of(
                "displayName", location.getDisplayName(),
                "rating", location.getRating(),
                "ratingCount", location.getRatingCount()
        ));
    }
}