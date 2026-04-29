package com.planify.backend.dto.request;

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

        List<String> facilities,

        // --- CÂMPURI NOI PENTRU EVENIMENTE ---
        boolean allowsEvents, // Casuta de bifat (true/false)
        boolean onlyEvents,
        @Min(value = 0, message = "Capacitatea nu poate fi negativă")
        Integer maxEventCapacity, // Numărul maxim de persoane

        List<String> eventTypes, // Lista: Nuntă, Botez, Conferință, etc.
        // -------------------------------------

        // Date cont
        @NotBlank @Email String ownerEmail,
        @NotBlank @Size(min = 8) String password
) {}