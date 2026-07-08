package com.planify.backend.controller;

import com.planify.backend.dto.response.LocationDetailResponse;
import com.planify.backend.dto.response.LocationSummaryResponse;
import com.planify.backend.entity.Location;
import com.planify.backend.entity.enums.LocationType;
import com.planify.backend.repository.LocationFacilityRepository;
import com.planify.backend.repository.LocationPhotoRepository;
import com.planify.backend.repository.LocationRepository;
import com.planify.backend.security.JwtService;
import com.planify.backend.service.CalendarService;
import com.planify.backend.service.LocationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.planify.backend.dto.response.DashboardChartsResponse;
import org.springframework.web.server.ResponseStatusException;

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
    private final CalendarService calendarService;

    public LocationController(LocationService locationService,
                              LocationRepository locationRepository,
                              JwtService jwtService,
                              LocationPhotoRepository photoRepository,
                              LocationFacilityRepository facilityRepository, CalendarService calendarService) {
        this.locationService = locationService;
        this.locationRepository = locationRepository;
        this.jwtService = jwtService;
        this.photoRepository = photoRepository;
        this.facilityRepository = facilityRepository;
        this.calendarService = calendarService;
    }

    @GetMapping("/api/locations/public/search")
    public ResponseEntity<List<LocationSummaryResponse>> search(
            @RequestParam(required = false) LocationType type,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) Boolean allowsEvents) { // <-- Parametrul NOU
        return ResponseEntity.ok(locationService.searchLocations(type, searchTerm, lat, lng, radiusKm, allowsEvents));
    }

    @GetMapping("/api/locations/public/{id}")
    public ResponseEntity<LocationDetailResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(locationService.getLocationDetail(id, null));
    }

    @PutMapping("/api/location/status/toggle")
    @PreAuthorize("hasAuthority('LOCATION')")
    public ResponseEntity<?> toggleStatus() {
        return ResponseEntity.ok("În dezvoltare");
    }

    @GetMapping("/api/location/profile")
    @PreAuthorize("hasAuthority('LOCATION')")
    public ResponseEntity<?> getMyProfile(HttpServletRequest request) {
        Long locationId = extractLocationId(request);
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Locația nu a fost găsită în baza de date."));

        List<Map<String, Object>> photos = photoRepository.findByLocationIdOrderByDisplayOrderAsc(locationId)
                .stream()
                .map(p -> Map.<String, Object>of("id", p.getId(), "url", "/uploads/" + p.getFilePath()))
                .collect(Collectors.toList());

        List<String> facilities = facilityRepository.findByLocationId(locationId).stream()
                .map(lf -> lf.getFacility())
                .collect(Collectors.toList());

        // AICI ESTE SECRETUL: Adăugăm fallback-uri ( ? : ) la toate variabilele care ar putea fi nule
        return ResponseEntity.ok(Map.of(
                "id", location.getId(),
                "displayName", location.getDisplayName() != null ? location.getDisplayName() : "",
                "description", location.getDescription() != null ? location.getDescription() : "",
                "rating", location.getRating() != null ? location.getRating() : 0.0,
                "ratingCount", location.getRatingCount() != null ? location.getRatingCount() : 0,
                "photos", photos,
                "facilities", facilities
        ));
    }

    @PostMapping("/api/location/photos")
    @PreAuthorize("hasAuthority('LOCATION')")
    public ResponseEntity<?> uploadPhoto(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        try {
            Long locationId = extractLocationId(request);
            locationService.uploadPhoto(locationId, file);
            return ResponseEntity.ok(Map.of("message", "Poza a fost încărcată cu succes."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/api/location/photos/{photoId}")
    @PreAuthorize("hasAuthority('LOCATION')")
    public ResponseEntity<?> deletePhoto(@PathVariable Long photoId, HttpServletRequest request) {
        try {
            Long locationId = extractLocationId(request);
            locationService.deletePhoto(photoId, locationId);
            return ResponseEntity.ok(Map.of("message", "Poza a fost ștearsă."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/api/location/profile")
    @PreAuthorize("hasAuthority('LOCATION')")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> updates, HttpServletRequest request) {
        try {
            Long locationId = extractLocationId(request);
            String description = (String) updates.get("description");

            List<String> facilities = null;
            if (updates.containsKey("facilities")) {
                facilities = (List<String>) updates.get("facilities"); // Preluam direct string-urile
            }

            locationService.updateProfile(locationId, description, facilities);
            return ResponseEntity.ok(Map.of("message", "Profil actualizat cu succes."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private Long extractLocationId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token); // Aici obținem direct "L54"

        // Căutăm locația direct după publicId ("L54"), evitând orice desincronizare de Primary Key
        Location location = locationRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Locația nu a fost găsită în baza de date."));

        // Returnăm ID-ul intern real (ex: 28) pentru a fi folosit mai departe de celelalte rute
        return location.getId();
    }

    @DeleteMapping("/api/location/account")
    @PreAuthorize("hasAuthority('LOCATION')")
    public ResponseEntity<?> deleteAccount(@RequestBody Map<String, String> requestBody, HttpServletRequest request) {
        try {
            Long locationId = extractLocationId(request);
            String password = requestBody.get("password");

            if (password == null || password.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Parola este obligatorie."));
            }

            locationService.deleteAccount(locationId, password);
            return ResponseEntity.ok(Map.of("message", "Contul a fost șters cu succes."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "A apărut o eroare la ștergerea contului."));
        }
    }

    @GetMapping("/api/location/{locationId}/charts")
    @PreAuthorize("hasAuthority('LOCATION')")
    // @PreAuthorize("hasRole('LOCATION')") -> asigură-te că ruta este securizată cum ai tu logica
    public ResponseEntity<DashboardChartsResponse> getLocationCharts(@PathVariable Long locationId) {
        DashboardChartsResponse response = calendarService.getDashboardChartsData(locationId);
        return ResponseEntity.ok(response);
    }
}