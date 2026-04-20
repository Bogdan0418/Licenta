package com.planify.backend.dto.response;

import com.planify.backend.entity.enums.UserRole;
import com.planify.backend.entity.enums.UserStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminUserResponse(
        Long id,
        String publicId,
        String firstName,
        String lastName,
        String username,
        String email,
        String phone,
        LocalDate birthDate,
        UserRole role,
        UserStatus status,
        BigDecimal rating,
        Integer ratingCount,
        LocalDateTime createdAt
) {}