package com.nexus.logconsumer.service;

import com.nexus.logconsumer.dto.AnomalyEvent;
import com.nexus.logconsumer.dto.MlPredictionResponse;
import com.nexus.logconsumer.dto.PolicyApplyRequest;
import com.nexus.logconsumer.entity.ApiLog;
import com.nexus.logconsumer.repository.ApiLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MlPredictionService {

    private final ApiLogRepository apiLogRepository;
    private final StringRedisTemplate redisTemplate;

    private static final String POLICY_PREFIX = "rate_limit_policy:";
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /**
     * Forecast request traffic for the next 10 minutes using Simple Linear Regression.
     */
    public MlPredictionResponse getTrafficPrediction() {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        List<Object[]> rpmRaw = apiLogRepository.requestsPerMinute(oneHourAgo);

        List<Double> historicalCounts = rpmRaw.stream()
                .map(row -> Double.valueOf(row[1].toString()))
                .collect(Collectors.toList());

        List<Map<String, Object>> predictedTraffic = new ArrayList<>();
        
        // Populate historical data in response first
        for (Object[] row : rpmRaw) {
            Map<String, Object> point = new HashMap<>();
            point.put("minute", row[0].toString());
            point.put("requests", Double.valueOf(row[1].toString()));
            point.put("isPredicted", false);
            predictedTraffic.add(point);
        }

        int n = historicalCounts.size();
        double slope = 0.0;
        double intercept = 0.0;
        double growthRate = 0.0;

        if (n >= 2) {
            double sumX = 0.0;
            double sumY = 0.0;
            double sumXY = 0.0;
            double sumX2 = 0.0;

            for (int i = 0; i < n; i++) {
                sumX += i;
                sumY += historicalCounts.get(i);
                sumXY += i * historicalCounts.get(i);
                sumX2 += i * i;
            }

            double denominator = (n * sumX2) - (sumX * sumX);
            if (denominator != 0) {
                slope = ((n * sumXY) - (sumX * sumY)) / denominator;
                intercept = (sumY - (slope * sumX)) / n;
            }

            // Estimate growth rate from first half to second half
            double firstHalfAvg = historicalCounts.subList(0, n / 2).stream().mapToDouble(Double::doubleValue).average().orElse(1.0);
            double secondHalfAvg = historicalCounts.subList(n / 2, n).stream().mapToDouble(Double::doubleValue).average().orElse(1.0);
            growthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100.0 : 0.0;
        } else {
            // Default to average if too little data
            intercept = historicalCounts.stream().mapToDouble(Double::doubleValue).average().orElse(10.0);
            slope = 0.0;
        }

        // Generate predictions for the next 10 minutes
        LocalDateTime lastTime = LocalDateTime.now();
        Random rand = new Random();
        for (int k = 0; k < 10; k++) {
            double predictedVal = (slope * (n + k)) + intercept;
            // Add a small realistic fluctuation (noise) of up to +/- 5%
            double noise = predictedVal * (rand.nextDouble() * 0.1 - 0.05);
            long finalVal = Math.max(0, Math.round(predictedVal + noise));

            LocalDateTime predMinute = lastTime.plusMinutes(k + 1);
            Map<String, Object> point = new HashMap<>();
            point.put("minute", predMinute.format(TIME_FORMATTER));
            point.put("requests", finalVal);
            point.put("isPredicted", true);
            predictedTraffic.add(point);
        }

        // Determine System Load Forecast
        double maxPredicted = predictedTraffic.stream()
                .filter(p -> (boolean) p.get("isPredicted"))
                .mapToDouble(p -> Double.valueOf(p.get("requests").toString()))
                .max().orElse(0.0);

        String systemLoad = "NORMAL";
        String recommendation = "Traffic is stable. Standard rate limit policy is sufficient.";

        if (maxPredicted > 300) {
            systemLoad = "CRITICAL";
            recommendation = "CRITICAL: Looming traffic spike detected. Enable active rate limits & restrict suspicious IP pools immediately.";
        } else if (maxPredicted > 150) {
            systemLoad = "HIGH";
            recommendation = "WARNING: Elevated traffic load expected. Adjust IP-level limits to 50 req/min to prevent latency degradation.";
        } else if (maxPredicted > 80) {
            systemLoad = "ELEVATED";
            recommendation = "NOTICE: Minor traffic increase expected. Monitor system performance indicators.";
        }

        return MlPredictionResponse.builder()
                .predictedTraffic(predictedTraffic)
                .systemLoadForecast(systemLoad)
                .growthRate(Math.round(growthRate * 100.0) / 100.0)
                .recommendation(recommendation)
                .build();
    }

    /**
     * Scan recent logs for anomalies (Latency spikes via Z-score, request flooding by IP).
     */
    public List<AnomalyEvent> detectAnomalies() {
        List<AnomalyEvent> anomalies = new ArrayList<>();
        List<ApiLog> recentLogs = apiLogRepository.findTop50ByOrderByTimestampDesc();
        if (recentLogs.isEmpty()) {
            return anomalies;
        }

        // 1. LATENCY ANOMALY DETECTION (Z-Score)
        double avgResponse = apiLogRepository.avgResponseTime();
        
        // Calculate Standard Deviation of response time in the last 100 logs
        double sumSquareDiff = 0;
        int count = 0;
        for (ApiLog logItem : recentLogs) {
            if (logItem.getResponseTime() != null) {
                double diff = logItem.getResponseTime() - avgResponse;
                sumSquareDiff += diff * diff;
                count++;
            }
        }
        
        double stdDev = count > 1 ? Math.sqrt(sumSquareDiff / (count - 1)) : 10.0;
        if (stdDev < 5.0) stdDev = 5.0; // avoid divide by zero/tiny std dev

        for (ApiLog apiLog : recentLogs) {
            if (apiLog.getResponseTime() != null && apiLog.getResponseTime() > 100) { // ignore fast requests
                double zScore = (apiLog.getResponseTime() - avgResponse) / stdDev;
                if (zScore > 2.5) {
                    anomalies.add(AnomalyEvent.builder()
                            .timestamp(apiLog.getTimestamp() != null ? apiLog.getTimestamp().format(TIME_FORMATTER) : LocalDateTime.now().format(TIME_FORMATTER))
                            .requestId(apiLog.getRequestId())
                            .endpoint(apiLog.getEndpoint())
                            .method(apiLog.getMethod())
                            .responseTime(apiLog.getResponseTime())
                            .ipAddress(apiLog.getIpAddress())
                            .anomalyType("LATENCY_SPIKE")
                            .severity(zScore > 4.0 ? "HIGH" : "MEDIUM")
                            .anomalyScore(Math.round(zScore * 100.0) / 100.0)
                            .recommendation("Endpoint is processing slowly. Apply throttle/rate-limit on user ID: " + (apiLog.getUserId() != null ? apiLog.getUserId() : "Anonymous") + " to protect downstream services.")
                            .build());
                }
            }
        }

        // 2. REQUEST FLOOD ANOMALY (DDoS detection)
        // Check if any IP has unusually high activity in the recent logs
        Map<String, Long> ipCounts = recentLogs.stream()
                .filter(l -> l.getIpAddress() != null && !l.getIpAddress().equals("127.0.0.1") && !l.getIpAddress().equals("0:0:0:0:0:0:0:1") && !l.getIpAddress().equals("localhost"))
                .collect(Collectors.groupingBy(ApiLog::getIpAddress, Collectors.counting()));

        for (Map.Entry<String, Long> entry : ipCounts.entrySet()) {
            if (entry.getValue() > 15) { // 15 requests in the last 50 logs is high concentration
                anomalies.add(AnomalyEvent.builder()
                        .timestamp(LocalDateTime.now().format(TIME_FORMATTER))
                        .requestId("N/A")
                        .endpoint("Multiple")
                        .method("ANY")
                        .responseTime(0L)
                        .ipAddress(entry.getKey())
                        .anomalyType("REQUEST_FLOOD")
                        .severity(entry.getValue() > 25 ? "HIGH" : "MEDIUM")
                        .anomalyScore(entry.getValue().doubleValue())
                        .recommendation("Suspicious high traffic density. Block IP address " + entry.getKey() + " immediately.")
                        .build());
            }
        }

        // Sort by timestamp descending
        anomalies.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return anomalies;
    }

    /**
     * Apply traffic optimization policy by storing dynamic limits in Redis.
     */
    public boolean applyPolicy(PolicyApplyRequest request) {
        String key;
        if ("GLOBAL".equalsIgnoreCase(request.getTargetType())) {
            key = POLICY_PREFIX + "global";
        } else if ("IP".equalsIgnoreCase(request.getTargetType())) {
            key = POLICY_PREFIX + "ip:" + request.getTargetValue();
        } else if ("USER".equalsIgnoreCase(request.getTargetType())) {
            key = POLICY_PREFIX + "user:" + request.getTargetValue();
        } else {
            log.error("Invalid policy target type: {}", request.getTargetType());
            return false;
        }

        // Set value in Redis (limit)
        redisTemplate.opsForValue().set(key, String.valueOf(request.getLimit()));
        
        // If duration is specified, apply expiry
        if (request.getDurationMinutes() != null && request.getDurationMinutes() > 0) {
            redisTemplate.expire(key, request.getDurationMinutes(), TimeUnit.MINUTES);
            log.info("Applied policy limit {} on {} for {} minutes", request.getLimit(), key, request.getDurationMinutes());
        } else {
            log.info("Applied persistent policy limit {} on {}", request.getLimit(), key);
        }

        return true;
    }
}
