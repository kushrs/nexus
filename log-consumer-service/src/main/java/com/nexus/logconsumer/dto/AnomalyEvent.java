package com.nexus.logconsumer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnomalyEvent {
    private String timestamp;
    private String requestId;
    private String endpoint;
    private String method;
    private Long responseTime;
    private String ipAddress;
    private String anomalyType; // LATENCY_SPIKE, REQUEST_FLOOD
    private String severity; // LOW, MEDIUM, HIGH
    private double anomalyScore; // Z-score or load score
    private String recommendation;
}
