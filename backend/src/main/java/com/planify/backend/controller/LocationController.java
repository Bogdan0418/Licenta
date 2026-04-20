package com.planify.backend.controller;

import com.planify.backend.dto.request.RegisterLocationRequest;
import com.planify.backend.dto.response.LocationDetailResponse;
import com.planify.backend.dto.response.LocationSummaryResponse;
import com.planify.backend.entity.Location;
import com.planify.backend.entity.enums.LocationType;
import com.planify.backend.service.LocationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
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

    // Inregistrare locatie noua (publica)
//    @PostMapping("/api/auth/register/location")
//    public ResponseEntity<?> registerLocation(
//            @Valid @RequestBody RegisterLocationRequest request) {
//        try {
//            Location location = locationService.registerLocation(request);
//            return ResponseEntity.status(201)
//                    .body("Contul a fost creat cu succes. " +
//                            "Status: PENDING — așteptați aprobarea adminului. " +
//                            "ID: " + location.getPublicId());
//        } catch (IllegalArgumentException e) {
//            return ResponseEntity.badRequest().body(e.getMessage());
//        }
//    }

    // Rute LOCATION (necesita autentificare ca locatie)

    // Toggle status INACTIVE/VERIFIED
    @PutMapping("/api/location/status/toggle")
    public ResponseEntity<?> toggleStatus() {
        // Implementare în Faza 7 (Dashboard Locatie)
        return ResponseEntity.ok("În dezvoltare");
    }
}
