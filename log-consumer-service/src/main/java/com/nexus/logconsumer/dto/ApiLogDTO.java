package com.nexus.logconsumer.dto;

import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiLogDTO {
    private UUID id;
    private String requestId;
    private String endpoint;
    private String method;
    private Integer statusCode;
    private Long latency;
    private UUID userId;
    private String ipAddress;
    private String timestamp;
}
