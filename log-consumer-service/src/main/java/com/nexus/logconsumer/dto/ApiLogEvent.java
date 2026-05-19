package com.nexus.logconsumer.dto;

import lombok.*;
import java.io.Serializable;

/**
 * Mirrors the event produced by gateway-service's LoggingFilter.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiLogEvent implements Serializable {
    private String requestId;
    private String endpoint;
    private String method;
    private int statusCode;
    private long responseTime;
    private Long userId;
    private String ipAddress;
    private long timestamp;
}
