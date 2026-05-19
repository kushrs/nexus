package com.nexus.logconsumer.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiLogDTO {
    private Long id;
    private String requestId;
    private String endpoint;
    private String method;
    private Integer statusCode;
    private Long responseTime;
    private Long userId;
    private String ipAddress;
    private String timestamp;
}
