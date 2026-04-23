package com.planify.backend.dto.response;

import java.util.List;
import java.util.Map;

public record ZoneSummaryResponse(
        Long id,
        String name,
        Integer capacity,
        Integer maxPersons,
        List<Integer> allowedDurations,
        Map<String, String> schedule
) {}