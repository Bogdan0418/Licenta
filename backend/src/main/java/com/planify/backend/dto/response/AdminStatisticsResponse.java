package com.planify.backend.dto.response;

public record AdminStatisticsResponse(
        long totalUsers,
        long blockedUsers,
        long totalLocations,
        long pendingLocations,
        long verifiedLocations,
        long totalBookings,
        long reportedReviews
) {}