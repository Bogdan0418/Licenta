package com.planify.backend.dto.response;

public record AuthResponse(
        String token,
        String publicId,
        String role,
        String email
) {}
