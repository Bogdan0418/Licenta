package com.planify.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RejectLocationRequest(
        @NotBlank(message = "Motivul respingerii este obligatoriu")
        String reason
) {}