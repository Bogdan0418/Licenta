package com.planify.backend.dto.response;

import java.time.LocalDateTime;

public record AuditLogResponse(
        Long id,
        String adminPublicId,
        String action,
        String targetType,
        Long targetId,
        String details,
        LocalDateTime createdAt
) {}