package com.planify.backend.controller;

import com.planify.backend.dto.response.LocationDetailResponse;
import com.planify.backend.dto.response.LocationSummaryResponse;
import com.planify.backend.entity.Location;
import com.planify.backend.entity.enums.Facility;
import com.planify.backend.entity.enums.LocationType;
import com.planify.backend.repository.LocationFacilityRepository;
import com.planify.backend.repository.LocationPhotoRepository;
import com.planify.backend.repository.LocationRepository;
import com.planify.backend.security.JwtService;
import com.planify.backend.service.LocationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class LocationController {

    private final LocationService locationService;
    private final LocationRepository locationRepository;
    private final JwtService jwtService;
    private final LocationPhotoRepository photoRepository;
    private final LocationFacilityRepository facilityRepository;

    public LocationController(LocationService locationService,
                              LocationRepository locationRepository,
                              JwtService jwtService,
                              LocationPhotoRepository photoRepository,
                              LocationFacilityRepository facilityRepository) {
        this.locationService = locationService;
        this.locationRepository = locationRepository;
        this.jwtService = jwtService;
        this.photoRepository = photoRepository;
        this.facilityRepository = facilityRepository;
    }

    // --- RUTE PUBLICE ---

    @GetMapping("/api/locations/public/search")
    public ResponseEntity<List<LocationSummaryResponse>> search(
            @RequestParam(required = false) LocationType type,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm) {
        return ResponseEntity.ok(locationService.searchLocations(type, searchTerm, lat, lng, radiusKm));
    }

    @GetMapping("/api/locations/public/{id}")
    public ResponseEntity<LocationDetailResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(locationService.getLocationDetail(id, null));
    }


    // --- RUTE LOCATION (necesită autentificare) ---

    @PutMapping("/api/location/status/toggle")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<?> toggleStatus() {
        return ResponseEntity.ok("În dezvoltare");
    }

    // Obține profilul propriu pentru Dashboard (cu poze și descriere)
    // Obține profilul propriu pentru Dashboard (cu poze și descriere)
    @GetMapping("/api/location/profile")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<?> getMyProfile(HttpServletRequest request) {
        Long locationId = extractLocationId(request);
        Location location = locationRepository.findById(locationId).orElseThrow();

        // REZOLVAREA E AICI: Am forțat Map.<String, Object>of(...)
        List<Map<String, Object>> photos = photoRepository.findByLocationIdOrderByDisplayOrderAsc(locationId)
                .stream()
                .map(p -> Map.<String, Object>of("id", p.getId(), "url", "/uploads/" + p.getFilePath()))
                .collect(Collectors.toList());

        List<String> facilities = facilityRepository.findByLocationId(locationId).stream()
                .map(lf -> lf.getFacility().name())
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "id", location.getId(),
                "displayName", location.getDisplayName(),
                "description", location.getDescription() != null ? location.getDescription() : "",
                "rating", location.getRating(),
                "ratingCount", location.getRatingCount(),
                "photos", photos,
                "facilities", facilities
        ));
    }

    // Încarcă o poză nouă
    @PostMapping("/api/location/photos")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<?> uploadPhoto(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        try {
            Long locationId = extractLocationId(request);
            locationService.uploadPhoto(locationId, file);
            return ResponseEntity.ok(Map.of("message", "Poza a fost încărcată cu succes."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Șterge o poză existentă
    @DeleteMapping("/api/location/photos/{photoId}")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<?> deletePhoto(@PathVariable Long photoId, HttpServletRequest request) {
        try {
            Long locationId = extractLocationId(request);
            locationService.deletePhoto(photoId, locationId);
            return ResponseEntity.ok(Map.of("message", "Poza a fost ștearsă."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Actualizează descrierea (și opțional facilitățile)
    @PutMapping("/api/location/profile")
    @PreAuthorize("hasRole('LOCATION')")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> updates, HttpServletRequest request) {
        try {
            Long locationId = extractLocationId(request);
            String description = (String) updates.get("description");

            List<Facility> facilities = null;
            if (updates.containsKey("facilities")) {
                List<String> facilityStrings = (List<String>) updates.get("facilities");
                facilities = facilityStrings.stream().map(Facility::valueOf).collect(Collectors.toList());
            }

            locationService.updateProfile(locationId, description, facilities);
            return ResponseEntity.ok(Map.of("message", "Profil actualizat cu succes."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Metodă ajutătoare pentru extragerea ID-ului din token
    private Long extractLocationId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token);
        return Long.parseLong(publicId.substring(1));
    }
}