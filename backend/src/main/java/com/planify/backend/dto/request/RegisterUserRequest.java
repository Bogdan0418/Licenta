package com.planify.backend.dto.request;

import jakarta.validation.constraints.*;

public record RegisterUserRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String phone,
        @NotBlank String cnp,
        @NotBlank String username,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password
) {}
