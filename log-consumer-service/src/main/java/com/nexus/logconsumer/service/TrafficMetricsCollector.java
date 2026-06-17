package com.nexus.logconsumer.service;

import com.nexus.logconsumer.entity.TrafficMetrics;
import com.nexus.logconsumer.repository.TrafficMetricsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrafficMetricsCollector {

    private final TrafficMetricsRepository trafficMetricsRepository;
    private final StringRedisTemplate redisTemplate;
    private final Random random = new Random();

    // List of monitored service instances
    private static final List<String> INSTANCE_IDS = List.of(
            "auth-service",
            "user-service-1",
            "user-service-2",
            "payment-service-1",
            "payment-service-2",
            "notification-service-1",
            "notification-service-2"
    );

    /**
     * Poll metrics from Redis and persist to PostgreSQL every 10 seconds.
     */
    @Scheduled(fixedDelay = 10000)
    public void collectMetrics() {
        log.debug("Collecting traffic metrics from Redis...");

        for (String instanceId : INSTANCE_IDS) {
            String countKey = "metrics:" + instanceId + ":request_count";
            String latencyKey = "metrics:" + instanceId + ":latency_sum";
            String errorKey = "metrics:" + instanceId + ":error_count";

            // Read metrics from Redis
            String countStr = redisTemplate.opsForValue().get(countKey);
            String latencyStr = redisTemplate.opsForValue().get(latencyKey);
            String errorStr = redisTemplate.opsForValue().get(errorKey);

            long count = countStr != null ? Long.parseLong(countStr) : 0L;
            long latencySum = latencyStr != null ? Long.parseLong(latencyStr) : 0L;
            long errorCount = errorStr != null ? Long.parseLong(errorStr) : 0L;

            double avgLatency = count > 0 ? (double) latencySum / count : 0.0;

            // Fetch cpu and memory usage
            double[] sysMetrics = getSystemMetrics(instanceId, count);
            double cpuUsage = sysMetrics[0];
            double memoryUsage = sysMetrics[1];

            // Reset Redis counters for the next interval
            redisTemplate.delete(List.of(countKey, latencyKey, errorKey));

            // Calculate Health Score
            double latencyScore = 100.0 * (1.0 - Math.min(1.0, avgLatency / 2000.0));
            double cpuScore = 100.0 - cpuUsage;
            double errorRate = count > 0 ? ((double) errorCount / count) * 100.0 : 0.0;
            double errorRateScore = 100.0 - errorRate;
            double healthScore = (0.5 * latencyScore) + (0.3 * cpuScore) + (0.2 * errorRateScore);

            // Cache health score in Redis (expire after 30 seconds)
            redisTemplate.opsForValue().set("health_score:" + instanceId, String.valueOf(healthScore), 30, java.util.concurrent.TimeUnit.SECONDS);

            // Save to database
            TrafficMetrics metric = TrafficMetrics.builder()
                    .serviceName(instanceId)
                    .request_count(count)
                    .avg_latency(avgLatency)
                    .error_count(errorCount)
                    .cpu_usage(cpuUsage)
                    .memory_usage(memoryUsage)
                    .timestamp(LocalDateTime.now())
                    .build();

            trafficMetricsRepository.save(metric);
            log.debug("Saved metrics for {}: count={}, latency={}, cpu={}%", instanceId, count, avgLatency, cpuUsage);
        }
    }

    /**
     * Fetch CPU and Memory usage for a service.
     * Integrates simple simulated metrics that scale with request activity (DDoS/burst simulation).
     */
    private double[] getSystemMetrics(String instanceId, long requestCount) {
        // Default idle loads
        double cpu = 10.0 + random.nextDouble() * 10.0;      // 10% - 20%
        double memory = 45.0 + random.nextDouble() * 5.0;    // 45% - 50%

        // Scale CPU and memory based on request count to simulate real system behavior
        if (requestCount > 50) {
            cpu += Math.min(75.0, requestCount * 1.2);       // high load simulation
            memory += Math.min(40.0, requestCount * 0.5);
        } else if (requestCount > 10) {
            cpu += requestCount * 0.8;
            memory += requestCount * 0.3;
        }

        // Clip values
        cpu = Math.min(99.0, cpu);
        memory = Math.min(99.0, memory);

        return new double[]{cpu, memory};
    }
}
