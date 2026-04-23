package com.planify.backend.dto.response;

import com.planify.backend.entity.enums.LocationType;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record LocationDetailResponse(
        Long id,
        String publicId,
        String displayName,
        LocationType type,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        String description,
        String publicPhone,
        Map<String, String> schedule,
        String instagramUrl,
        String facebookUrl,
        String tiktokUrl,
        BigDecimal rating,
        Integer ratingCount,
        List<String> photoUrls,
        List<String> facilities, // Modificat aici
        List<ZoneSummaryResponse> zones,
        boolean isFavorite
) {}