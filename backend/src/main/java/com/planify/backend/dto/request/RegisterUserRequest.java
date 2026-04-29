package com.planify.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record RegisterUserRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String phone,
        @NotNull LocalDate birthDate,
        @NotBlank String username,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password
) {}