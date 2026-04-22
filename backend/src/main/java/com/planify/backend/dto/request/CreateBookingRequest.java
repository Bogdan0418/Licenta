package com.planify.backend.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record CreateBookingRequest(

        @NotNull(message = "ID-ul zonei este obligatoriu")
        Long zoneId,

        @NotNull(message = "Data este obligatorie")
        @FutureOrPresent(message = "Nu poți rezerva în trecut")
        LocalDate bookingDate,

        @NotNull(message = "Ora de început este obligatorie")
        LocalTime startTime,

        @NotNull(message = "Durata rezervării este obligatorie")
        @Min(value = 1, message = "Durata trebuie să fie mai mare de 0")
        Integer duration,  // <-- Acest câmp a fost adăugat!

        @NotNull(message = "Dimensiunea grupului este obligatorie")
        @Min(value = 1, message = "Grupul trebuie să aibă cel puțin o persoană")
        Integer groupSize
) {}