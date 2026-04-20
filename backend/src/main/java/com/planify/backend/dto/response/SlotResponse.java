package com.planify.backend.dto.response;

import java.time.LocalTime;

public record SlotResponse(
        LocalTime startTime,
        LocalTime endTime,
        int locuriLibere,
        boolean disponibil
) {}