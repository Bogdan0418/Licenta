package com.planify.backend.dto.response;

import java.util.List;

public record AdminBlockedAccountsResponse(
        List<AdminUserResponse> blockedUsers,
        List<AdminLocationResponse> blockedLocations
) {}