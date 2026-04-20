package com.planify.backend.dto.response;

import com.planify.backend.entity.enums.LocationType;

import java.math.BigDecimal;
import java.util.List;

public record LocationSummaryResponse(
        Long id,
        String publicId,
        String displayName,
        LocationType type,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        BigDecimal rating,
        Integer ratingCount,
        String firstPhotoUrl,
        List<String> facilities,
        Double distanceKm  // null daca nu s-a facut cautare geolocatie
) {}
