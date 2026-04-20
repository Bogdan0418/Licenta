package com.planify.backend.dto.request;

import com.planify.backend.entity.enums.Facility;
import com.planify.backend.entity.enums.LocationType;
import jakarta.validation.constraints.*;

import java.util.List;
import java.util.Map;

public record RegisterLocationRequest(

        // Date legale
        @NotBlank String companyName,
        @NotBlank String cui,
        @NotBlank String legalAddress,
        @NotBlank String contactPhone,

        // Profil public
        @NotBlank String displayName,
        @NotNull LocationType type,
        @NotBlank String address,
        Double latitude,
        Double longitude,
        String description,
        String publicPhone,
        Map<String, String> schedule,
        String instagramUrl,
        String facebookUrl,
        String tiktokUrl,

        List<Facility> facilities,

        // Date cont
        @NotBlank @Email String ownerEmail,
        @NotBlank @Size(min = 8) String password
) {}
