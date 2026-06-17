package com.nexus.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

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
    private String userId;
    private String ipAddress;
    private long timestamp;
}
