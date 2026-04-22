package com.planify.backend.dto.request;

import jakarta.validation.constraints.*;
import java.util.List;

public record CreateZoneRequest(

        @NotBlank(message = "Numele zonei este obligatoriu")
        String name,

        @Min(value = 1, message = "Capacitatea minimă este 1")
        int capacity,

        @Min(value = 1, message = "Numărul minim de persoane este 1")
        int maxPersons,

        @NotNull(message = "Trebuie specificată cel puțin o durată")
        @Size(min = 1, message = "Trebuie specificată cel puțin o durată")
        List<Integer> allowedDurations,  // [60, 90, 120]

        @NotBlank
        String openTime,   // "10:00"

        @NotBlank
        String closeTime   // "22:00"
) {}