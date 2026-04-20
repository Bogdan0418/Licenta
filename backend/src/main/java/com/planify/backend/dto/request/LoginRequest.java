package com.planify.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Email-ul este obligatoriu")
        @Email(message = "Format email invalid")
        String email,

        @NotBlank(message = "Parola este obligatorie")
        String password
) {}
