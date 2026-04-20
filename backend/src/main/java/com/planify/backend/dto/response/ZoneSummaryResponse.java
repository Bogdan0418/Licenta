package com.planify.backend.dto.response;

public record ZoneSummaryResponse(
        Long id,
        String name,
        Integer capacity,
        Integer maxPersons,
        Integer bookingDurationMinutes,
        String openTime,
        String closeTime
) {}
