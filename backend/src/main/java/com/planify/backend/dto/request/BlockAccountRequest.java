package com.planify.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record BlockAccountRequest(
        @NotBlank(message = "Motivul blocării este obligatoriu")
        String reason
) {}