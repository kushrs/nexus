package com.nexus.logconsumer.service;

import com.nexus.logconsumer.dto.ApiLogDTO;
import com.nexus.logconsumer.dto.ApiLogEvent;
import com.nexus.logconsumer.dto.DashboardStats;
import com.nexus.logconsumer.entity.ApiLog;
import com.nexus.logconsumer.repository.ApiLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApiLogService {

    private final ApiLogRepository apiLogRepository;

    /**
     * Persist a log event received from Kafka.
     */
    public void saveLogEvent(ApiLogEvent event) {
        UUID id;
        try {
            id = UUID.fromString(event.getRequestId());
        } catch (Exception e) {
            id = UUID.randomUUID();
        }

        UUID uId = null;
        if (event.getUserId() != null && !event.getUserId().trim().isEmpty() && !"null".equalsIgnoreCase(event.getUserId())) {
            try {
                uId = UUID.fromString(event.getUserId());
            } catch (Exception e) {
                log.warn("Invalid user ID string: {}", event.getUserId());
            }
        }

        ApiLog apiLog = ApiLog.builder()
                .id(id)
                .endpoint(event.getEndpoint())
                .method(event.getMethod())
                .statusCode(event.getStatusCode())
                .latency(event.getResponseTime())
                .userId(uId)
                .ipAddress(event.getIpAddress())
                .timestamp(LocalDateTime.ofInstant(
                        Instant.ofEpochMilli(event.getTimestamp()),
                        ZoneId.systemDefault()))
                .build();

        apiLogRepository.save(apiLog);
        log.debug("Saved API log: {} {} -> {}", event.getMethod(), event.getEndpoint(), event.getStatusCode());
    }

    /**
     * Build aggregated dashboard statistics.
     */
    public DashboardStats getDashboardStats() {
        long totalRequests = apiLogRepository.count();
        double avgResponseTime = apiLogRepository.avgLatency();
        long totalErrors = apiLogRepository.countErrors();
        double errorRate = totalRequests > 0 ? (double) totalErrors / totalRequests * 100 : 0;

        LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);
        long requestsLastMinute = apiLogRepository.countByTimestampAfter(oneMinuteAgo);

        // Top APIs (top 10)
        List<Object[]> topApisRaw = apiLogRepository.findTopApis(PageRequest.of(0, 10));
        List<Map<String, Object>> topApis = topApisRaw.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            map.put("endpoint", row[0]);
            map.put("count", row[1]);
            return map;
        }).collect(Collectors.toList());

        // Requests per minute (last hour)
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        List<Object[]> rpmRaw = apiLogRepository.requestsPerMinute(oneHourAgo);
        List<Map<String, Object>> requestsPerMinute = rpmRaw.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            map.put("minute", row[0]);
            map.put("count", row[1]);
            return map;
        }).collect(Collectors.toList());

        // Recent requests
        List<ApiLogDTO> recentRequests = apiLogRepository.findTop50ByOrderByTimestampDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());

        return DashboardStats.builder()
                .totalRequests(totalRequests)
                .avgResponseTime(Math.round(avgResponseTime * 100.0) / 100.0)
                .errorRate(Math.round(errorRate * 100.0) / 100.0)
                .requestsLastMinute(requestsLastMinute)
                .topApis(topApis)
                .requestsPerMinute(requestsPerMinute)
                .recentRequests(recentRequests)
                .build();
    }

    public List<ApiLogDTO> getAllLogs() {
        return apiLogRepository.findTop50ByOrderByTimestampDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private ApiLogDTO toDTO(ApiLog log) {
        return ApiLogDTO.builder()
                .id(log.getId())
                .requestId(log.getId() != null ? log.getId().toString() : null)
                .endpoint(log.getEndpoint())
                .method(log.getMethod())
                .statusCode(log.getStatusCode())
                .latency(log.getLatency())
                .userId(log.getUserId())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getTimestamp() != null ? log.getTimestamp().toString() : null)
                .build();
    }
}
