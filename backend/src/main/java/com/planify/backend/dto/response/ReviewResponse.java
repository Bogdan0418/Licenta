package com.planify.backend.dto.response;

import com.planify.backend.entity.enums.ReviewerType;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        ReviewerType reviewerType,
        int rating,
        String comment,
        LocalDateTime createdAt,
        String reviewerName,  // numele celui care a scris review-ul
        Long bookingId,
        Boolean isReported
) {}