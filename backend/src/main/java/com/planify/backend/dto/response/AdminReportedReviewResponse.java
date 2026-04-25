package com.planify.backend.dto.response;

import java.time.LocalDateTime;

public record AdminReportedReviewResponse(
        Long id,
        String reviewerType,
        Long authorId,
        String authorPublicId,
        String authorName,
        Integer rating,
        String comment,
        LocalDateTime createdAt,
        Long bookingId
) {}