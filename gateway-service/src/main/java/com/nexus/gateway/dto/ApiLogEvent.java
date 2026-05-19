package com.nexus.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Event DTO sent to Kafka for every API request passing through the gateway.
 * Consumed by log-consumer-service and persisted to api_logs table.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
