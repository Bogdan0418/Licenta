package com.planify.backend.dto.response;

import com.planify.backend.entity.enums.BookingStatus;

import java.time.LocalDate;
import java.time.LocalTime;

public record BookingResponse(
        Long id,
        String locationName,
        String zoneName,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        int groupSize,
        BookingStatus status,
        boolean canCancel,
        boolean canReview
) {}
