package com.planify.backend.dto.response;

import java.util.List;

public record ZoneSummaryResponse(
        Long id,
        String name,
        Integer capacity,
        Integer maxPersons,
        List<Integer> allowedDurations,
        String openTime,
        String closeTime
) {}