package com.nexus.logconsumer.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

/**
 * Aggregated statistics for the monitoring dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalRequests;
    private double avgResponseTime;
    private double errorRate;
    private long requestsLastMinute;
    private List<Map<String, Object>> topApis;
    private List<Map<String, Object>> requestsPerMinute;
    private List<ApiLogDTO> recentRequests;
}
