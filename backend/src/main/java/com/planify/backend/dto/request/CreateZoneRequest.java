package com.planify.backend.dto.request;

import jakarta.validation.constraints.*;

public record CreateZoneRequest(

        @NotBlank(message = "Numele zonei este obligatoriu")
        String name,

        @Min(value = 1, message = "Capacitatea minimă este 1")
        int capacity,

        @Min(value = 1, message = "Numărul minim de persoane este 1")
        int maxPersons,

        @NotNull
        Integer bookingDurationMinutes,  // 60, 90 sau 120

        @NotBlank
        String openTime,   // "10:00"

        @NotBlank
        String closeTime   // "22:00"
) {}
