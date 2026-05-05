package com.planify.backend.dto.response;

import java.util.List;

public record DashboardChartsResponse(
        List<DailyStatsResponse> evolution,
        List<HourlyStatsResponse> peakHours
) {
    public record DailyStatsResponse(String date, int rezervari, int clienti) {}
    public record HourlyStatsResponse(String ora, int trafic) {}
}