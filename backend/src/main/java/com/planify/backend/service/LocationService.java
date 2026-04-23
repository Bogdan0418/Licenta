package com.planify.backend.service;

import com.planify.backend.dto.request.RegisterLocationRequest;
import com.planify.backend.dto.response.LocationDetailResponse;
import com.planify.backend.dto.response.LocationSummaryResponse;
import com.planify.backend.dto.response.ZoneSummaryResponse;
import com.planify.backend.entity.Location;
import com.planify.backend.entity.LocationFacility;
import com.planify.backend.entity.LocationPhoto;
import com.planify.backend.entity.enums.LocationStatus;
import com.planify.backend.entity.enums.LocationType;
import com.planify.backend.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LocationService {

    private final LocationRepository locationRepository;
    private final LocationPhotoRepository photoRepository;
    private final LocationFacilityRepository facilityRepository;
    private final VenueZoneRepository zoneRepository;
    private final UserFavoriteRepository favoriteRepository;
    private final PasswordEncoder passwordEncoder;

    public LocationService(LocationRepository locationRepository,
                           LocationPhotoRepository photoRepository,
                           LocationFacilityRepository facilityRepository,
                           VenueZoneRepository zoneRepository,
                           UserFavoriteRepository favoriteRepository,
                           PasswordEncoder passwordEncoder) {
        this.locationRepository = locationRepository;
        this.photoRepository = photoRepository;
        this.facilityRepository = facilityRepository;
        this.zoneRepository = zoneRepository;
        this.favoriteRepository = favoriteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Location registerLocation(RegisterLocationRequest req) {
        if (locationRepository.existsByOwnerEmail(req.ownerEmail())) {
            throw new IllegalArgumentException("Există deja un cont cu acest email");
        }
        if (locationRepository.existsByCui(req.cui())) {
            throw new IllegalArgumentException("Există deja un cont cu acest CUI");
        }

        long count = locationRepository.count();
        String publicId = "L" + (count + 1);

        Location location = new Location();
        location.setPublicId(publicId);
        location.setOwnerEmail(req.ownerEmail());
        location.setPasswordHash(passwordEncoder.encode(req.password()));
        location.setCompanyName(req.companyName());
        location.setCui(req.cui());
        location.setLegalAddress(req.legalAddress());
        location.setContactPhone(req.contactPhone());
        location.setDisplayName(req.displayName());
        location.setType(req.type());
        location.setAddress(req.address());
        location.setStatus(LocationStatus.PENDING);

        if (req.latitude() != null) location.setLatitude(BigDecimal.valueOf(req.latitude()));
        if (req.longitude() != null) location.setLongitude(BigDecimal.valueOf(req.longitude()));

        location.setDescription(req.description());
        location.setPublicPhone(req.publicPhone());
        location.setSchedule(req.schedule());
        location.setInstagramUrl(req.instagramUrl());
        location.setFacebookUrl(req.facebookUrl());
        location.setTiktokUrl(req.tiktokUrl());

        Location saved = locationRepository.save(location);

        if (req.facilities() != null) {
            for (String facility : req.facilities()) {
                LocationFacility lf = new LocationFacility();
                lf.setLocation(saved);
                lf.setFacility(facility);
                facilityRepository.save(lf);
            }
        }
        return saved;
    }

    public List<LocationSummaryResponse> searchLocations(LocationType type, String searchTerm, Double lat, Double lng, Double radiusKm) {
        List<Location> locations;
        if (lat != null && lng != null) {
            double radius = radiusKm != null ? radiusKm : 10.0;
            locations = locationRepository.findNearbyLocations(lat, lng, radius);
            if (type != null) {
                LocationType finalType = type;
                locations = locations.stream().filter(l -> l.getType() == finalType).collect(Collectors.toList());
            }
        } else {
            locations = locationRepository.searchLocations(type != null ? type.name() : null, searchTerm);
        }
        return locations.stream().map(l -> toSummary(l, lat, lng)).collect(Collectors.toList());
    }

    public LocationDetailResponse getLocationDetail(Long id, Long userId) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Locația nu a fost găsită"));

        List<String> photoUrls = photoRepository.findByLocationIdOrderByDisplayOrderAsc(id).stream()
                .map(p -> "/uploads/" + p.getFilePath())
                .collect(Collectors.toList());

        List<String> facilities = facilityRepository.findByLocationId(id).stream()
                .map(LocationFacility::getFacility)
                .collect(Collectors.toList());

        List<ZoneSummaryResponse> zones = zoneRepository.findByLocationIdAndIsActiveTrue(id).stream()
                .map(z -> new ZoneSummaryResponse(
                        z.getId(), z.getName(), z.getCapacity(), z.getMaxPersons(),
                        z.getConfig() != null ? z.getConfig().getAllowedDurationsList() : List.of(60),
                        z.getConfig() != null ? z.getConfig().getOpenTime().toString() : null,
                        z.getConfig() != null ? z.getConfig().getCloseTime().toString() : null
                )).collect(Collectors.toList());

        boolean isFavorite = userId != null && favoriteRepository.existsByUserIdAndLocationId(userId, id);

        return new LocationDetailResponse(
                location.getId(), location.getPublicId(), location.getDisplayName(), location.getType(),
                location.getAddress(), location.getLatitude(), location.getLongitude(), location.getDescription(),
                location.getPublicPhone(), location.getSchedule(), location.getInstagramUrl(), location.getFacebookUrl(),
                location.getTiktokUrl(), location.getRating(), location.getRatingCount(), photoUrls, facilities, zones, isFavorite
        );
    }

    private LocationSummaryResponse toSummary(Location l, Double userLat, Double userLng) {
        String firstPhoto = photoRepository.findByLocationIdOrderByDisplayOrderAsc(l.getId()).stream()
                .findFirst().map(p -> "/uploads/" + p.getFilePath()).orElse(null);

        List<String> facilityNames = facilityRepository.findByLocationId(l.getId()).stream()
                .map(LocationFacility::getFacility).collect(Collectors.toList());

        Double distance = null;
        if (userLat != null && userLng != null && l.getLatitude() != null && l.getLongitude() != null) {
            distance = calculateDistance(userLat, userLng, l.getLatitude().doubleValue(), l.getLongitude().doubleValue());
        }

        return new LocationSummaryResponse(
                l.getId(), l.getPublicId(), l.getDisplayName(), l.getType(), l.getAddress(),
                l.getLatitude(), l.getLongitude(), l.getRating(), l.getRatingCount(), firstPhoto, facilityNames, distance
        );
    }

    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10.0) / 10.0;
    }

    @Transactional
    public LocationPhoto uploadPhoto(Long locationId, MultipartFile file) throws Exception {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Locația nu a fost găsită"));

        Path uploadPath = Paths.get("uploads");
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        LocationPhoto photo = new LocationPhoto();
        photo.setLocation(location);
        photo.setFilePath(fileName);
        photo.setDisplayOrder((int) photoRepository.countByLocationId(locationId));

        return photoRepository.save(photo);
    }

    @Transactional
    public void deletePhoto(Long photoId, Long locationId) throws Exception {
        LocationPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Poza nu exista"));

        if (!photo.getLocation().getId().equals(locationId)) {
            throw new SecurityException("Nu ai permisiunea de a sterge aceasta poza");
        }

        try {
            Files.deleteIfExists(Paths.get("uploads", photo.getFilePath()));
        } catch (Exception ignored) {}

        photoRepository.delete(photo);
    }

    @Transactional
    public void updateProfile(Long locationId, String description, List<String> facilities) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Locația nu a fost găsită"));

        location.setDescription(description);

        if (facilities != null && !facilities.isEmpty()) {
            facilityRepository.deleteByLocationId(locationId);
            for (String f : facilities) {
                LocationFacility lf = new LocationFacility();
                lf.setLocation(location);
                lf.setFacility(f);
                facilityRepository.save(lf);
            }
        }
        locationRepository.save(location);
    }
}