package com.planify.backend.dto.request;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateBookingRequest(

        @NotNull(message = "Zone ID este obligatoriu")
        Long zoneId,

        @NotNull(message = "Data este obligatorie")
        @Future(message = "Data rezervării trebuie să fie în viitor")
        LocalDate bookingDate,

        @NotNull(message = "Ora de start este obligatorie")
        LocalTime startTime,

        @Min(value = 1, message = "Grupul trebuie să aibă cel puțin 1 persoană")
        @Max(value = 500, message = "Numărul de persoane este prea mare")
        int groupSize
) {}
