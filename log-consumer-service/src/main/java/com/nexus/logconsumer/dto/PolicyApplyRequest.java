package com.nexus.logconsumer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyApplyRequest {
    private String targetType; // GLOBAL, IP, USER
    private String targetValue; // e.g. "127.0.0.1", "5", or empty for GLOBAL
    private Integer limit; // rate limit per minute, 0 or negative for block
    private Integer durationMinutes; // policy duration, e.g. 15, 60 or -1 for permanent
}
