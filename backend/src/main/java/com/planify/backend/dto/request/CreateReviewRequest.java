package com.planify.backend.dto.request;

import jakarta.validation.constraints.*;

public record CreateReviewRequest(

        @NotNull(message = "Booking ID este obligatoriu")
        Long bookingId,

        @Min(value = 1, message = "Rating minim este 1")
        @Max(value = 5, message = "Rating maxim este 5")
        int rating,

        @Size(max = 1000, message = "Comentariul nu poate depăși 1000 caractere")
        String comment
) {}
