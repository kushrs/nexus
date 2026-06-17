package com.nexus.logconsumer.service;

import com.nexus.logconsumer.dto.AnomalyEvent;
import com.nexus.logconsumer.dto.MlPredictionResponse;
import com.nexus.logconsumer.dto.PolicyApplyRequest;
import com.nexus.logconsumer.entity.ApiLog;
import com.nexus.logconsumer.repository.ApiLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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

    @Value("${ml-service.url:http://localhost:8000}")
    private String mlServiceUrl;

    private static final String POLICY_PREFIX = "rate_limit_policy:";
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Forecast request traffic and fetch overload probability from Python ML service.
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

            double firstHalfAvg = historicalCounts.subList(0, n / 2).stream().mapToDouble(Double::doubleValue).average().orElse(1.0);
            double secondHalfAvg = historicalCounts.subList(n / 2, n).stream().mapToDouble(Double::doubleValue).average().orElse(1.0);
            growthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100.0 : 0.0;
        } else {
            intercept = historicalCounts.stream().mapToDouble(Double::doubleValue).average().orElse(10.0);
            slope = 0.0;
        }

        // Generate predictions for the next 10 minutes
        LocalDateTime lastTime = LocalDateTime.now();
        Random rand = new Random();
        for (int k = 0; k < 10; k++) {
            double predictedVal = (slope * (n + k)) + intercept;
            double noise = predictedVal * (rand.nextDouble() * 0.1 - 0.05);
            long finalVal = Math.max(0, Math.round(predictedVal + noise));

            LocalDateTime predMinute = lastTime.plusMinutes(k + 1);
            Map<String, Object> point = new HashMap<>();
            point.put("minute", predMinute.format(TIME_FORMATTER));
            point.put("requests", finalVal);
            point.put("isPredicted", true);
            predictedTraffic.add(point);
        }

        // Fetch Overload Probability from Python ML Service
        double overloadProb = 0.0;
        boolean hasAnomaly = false;
        double anomalyScore = 0.0;

        try {
            // Aggregate features from the last 1 minute
            LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);
            long requestCount = apiLogRepository.countByTimestampAfter(oneMinuteAgo);
            double avgLatencyVal = apiLogRepository.avgLatency();
            long errorCount = apiLogRepository.countErrors();
            double totalCount = apiLogRepository.count();
            double errorRate = totalCount > 0 ? ((double) errorCount / totalCount) * 100.0 : 0.0;

            Map<String, Object> payload = Map.of(
                "request_count", (double) requestCount,
                "avg_latency", avgLatencyVal,
                "error_rate", errorRate,
                "cpu_usage", 20.0 + (rand.nextDouble() * 25.0), // simulated system CPU usage
                "memory_usage", 55.0 + (rand.nextDouble() * 10.0), // simulated JVM memory
                "hour_of_day", LocalDateTime.now().getHour()
            );

            Map<String, Object> response = restTemplate.postForObject(mlServiceUrl + "/predict", payload, Map.class);
            if (response != null) {
                overloadProb = (Double) response.get("overload_probability");
                hasAnomaly = (Boolean) response.get("anomaly");
                anomalyScore = (Double) response.get("score");
                log.info("ML Service Response: overload_probability={}, anomaly={}, score={}", overloadProb, hasAnomaly, anomalyScore);
            }
        } catch (Exception e) {
            log.warn("Failed to connect to Python ML Service at {}: {}. Falling back to heuristics.", mlServiceUrl, e.getMessage());
            // Fallback heuristic for overload probability if Python service is down
            double maxPredicted = predictedTraffic.stream()
                    .filter(p -> (boolean) p.get("isPredicted"))
                    .mapToDouble(p -> Double.valueOf(p.get("requests").toString()))
                    .max().orElse(0.0);
            overloadProb = Math.min(1.0, maxPredicted / 400.0);
        }

        // Map system load and recommendations
        String systemLoad = "NORMAL";
        String recommendation = "Traffic is stable. Standard rate limit policy is sufficient.";

        if (overloadProb > 0.75) {
            systemLoad = "CRITICAL";
            recommendation = "CRITICAL: High overload risk (" + Math.round(overloadProb * 100) + "%). Enable active rate limits & restrict suspicious IP pools immediately.";
        } else if (overloadProb > 0.45) {
            systemLoad = "HIGH";
            recommendation = "WARNING: Elevated overload probability (" + Math.round(overloadProb * 100) + "%). Adjust IP-level limits to prevent latency degradation.";
        } else if (overloadProb > 0.20) {
            systemLoad = "ELEVATED";
            recommendation = "NOTICE: Minor load increase expected. Monitor system performance indicators.";
        }

        return MlPredictionResponse.builder()
                .predictedTraffic(predictedTraffic)
                .systemLoadForecast(systemLoad)
                .growthRate(Math.round(growthRate * 100.0) / 100.0)
                .recommendation(recommendation)
                .build();
    }

    /**
     * Scan recent logs for anomalies (combines local heuristics and Python ML Anomaly scores).
     */
    public List<AnomalyEvent> detectAnomalies() {
        List<AnomalyEvent> anomalies = new ArrayList<>();
        List<ApiLog> recentLogs = apiLogRepository.findTop50ByOrderByTimestampDesc();
        if (recentLogs.isEmpty()) {
            return anomalies;
        }

        double avgLatencyVal = apiLogRepository.avgLatency();
        
        // Calculate Standard Deviation of latency in the last logs
        double sumSquareDiff = 0;
        int count = 0;
        for (ApiLog logItem : recentLogs) {
            if (logItem.getLatency() != null) {
                double diff = logItem.getLatency() - avgLatencyVal;
                sumSquareDiff += diff * diff;
                count++;
            }
        }
        
        double stdDev = count > 1 ? Math.sqrt(sumSquareDiff / (count - 1)) : 10.0;
        if (stdDev < 5.0) stdDev = 5.0;

        for (ApiLog apiLog : recentLogs) {
            if (apiLog.getLatency() != null && apiLog.getLatency() > 100) {
                double zScore = (apiLog.getLatency() - avgLatencyVal) / stdDev;
                if (zScore > 2.5) {
                    anomalies.add(AnomalyEvent.builder()
                            .timestamp(apiLog.getTimestamp() != null ? apiLog.getTimestamp().format(TIME_FORMATTER) : LocalDateTime.now().format(TIME_FORMATTER))
                            .requestId(apiLog.getId() != null ? apiLog.getId().toString() : "N/A")
                            .endpoint(apiLog.getEndpoint())
                            .method(apiLog.getMethod())
                            .responseTime(apiLog.getLatency())
                            .ipAddress(apiLog.getIpAddress())
                            .anomalyType("LATENCY_SPIKE")
                            .severity(zScore > 4.0 ? "HIGH" : "MEDIUM")
                            .anomalyScore(Math.round(zScore * 100.0) / 100.0)
                            .recommendation("Endpoint is processing slowly. Apply throttle/rate-limit on user ID: " + (apiLog.getUserId() != null ? apiLog.getUserId() : "Anonymous") + " to protect downstream services.")
                            .build());
                }
            }
        }

        // REQUEST FLOOD ANOMALY (DDoS detection)
        Map<String, Long> ipCounts = recentLogs.stream()
                .filter(l -> l.getIpAddress() != null && !l.getIpAddress().equals("127.0.0.1") && !l.getIpAddress().equals("0:0:0:0:0:0:0:1") && !l.getIpAddress().equals("localhost"))
                .collect(Collectors.groupingBy(ApiLog::getIpAddress, Collectors.counting()));

        for (Map.Entry<String, Long> entry : ipCounts.entrySet()) {
            if (entry.getValue() > 15) {
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

        // Connect with Python ML Service's Isolation Forest anomaly detector
        try {
            LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);
            long requestCount = apiLogRepository.countByTimestampAfter(oneMinuteAgo);
            long errorCount = apiLogRepository.countErrors();
            double totalCount = apiLogRepository.count();
            double errorRate = totalCount > 0 ? ((double) errorCount / totalCount) * 100.0 : 0.0;

            Map<String, Object> payload = Map.of(
                "request_count", (double) requestCount,
                "avg_latency", avgLatencyVal,
                "error_rate", errorRate,
                "cpu_usage", 85.0, // test anomaly conditions
                "memory_usage", 75.0,
                "hour_of_day", LocalDateTime.now().getHour()
            );

            Map<String, Object> response = restTemplate.postForObject(mlServiceUrl + "/predict", payload, Map.class);
            if (response != null && (Boolean) response.get("anomaly")) {
                anomalies.add(AnomalyEvent.builder()
                        .timestamp(LocalDateTime.now().format(TIME_FORMATTER))
                        .requestId("N/A")
                        .endpoint("All Services")
                        .method("ALL")
                        .responseTime(0L)
                        .ipAddress("SYSTEM_OVERLOAD")
                        .anomalyType("SYSTEM_METRIC_ANOMALY")
                        .severity("HIGH")
                        .anomalyScore((Double) response.get("score"))
                        .recommendation("Isolation Forest flagged system metrics anomaly. Overload threshold breached.")
                        .build());
            }
        } catch (Exception e) {
            log.warn("Could not query Isolation Forest anomaly: {}", e.getMessage());
        }

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

        redisTemplate.opsForValue().set(key, String.valueOf(request.getLimit()));
        
        if (request.getDurationMinutes() != null && request.getDurationMinutes() > 0) {
            redisTemplate.expire(key, request.getDurationMinutes(), TimeUnit.MINUTES);
            log.info("Applied policy limit {} on {} for {} minutes", request.getLimit(), key, request.getDurationMinutes());
        } else {
            log.info("Applied persistent policy limit {} on {}", request.getLimit(), key);
        }

        return true;
    }
}
