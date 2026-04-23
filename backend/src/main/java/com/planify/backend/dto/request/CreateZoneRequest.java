package com.planify.backend.dto.request;

import jakarta.validation.constraints.*;
import java.util.List;
import java.util.Map;

public record CreateZoneRequest(

        @NotBlank(message = "Numele zonei este obligatoriu")
        String name,

        @Min(value = 1, message = "Capacitatea minimă este 1")
        int capacity,

        @Min(value = 1, message = "Numărul minim de persoane este 1")
        int maxPersons,

        @NotNull(message = "Trebuie specificată cel puțin o durată")
        @Size(min = 1, message = "Trebuie specificată cel puțin o durată")
        List<Integer> allowedDurations,

        @NotNull(message = "Programul este obligatoriu")
        Map<String, String> schedule
) {}