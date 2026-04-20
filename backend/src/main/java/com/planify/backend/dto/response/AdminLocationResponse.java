package com.planify.backend.dto.response;

import com.planify.backend.entity.enums.LocationStatus;
import com.planify.backend.entity.enums.LocationType;

import java.time.LocalDateTime;

public record AdminLocationResponse(
        Long id,
        String publicId,
        String displayName,
        String companyName,
        String cui,
        String legalAddress,
        String contactPhone,
        String ownerEmail,
        LocationType type,
        String address,
        LocationStatus status,
        String rejectReason,
        String blockedReason,
        LocalDateTime createdAt,
        LocalDateTime verifiedAt,
        int photoCount
) {}
