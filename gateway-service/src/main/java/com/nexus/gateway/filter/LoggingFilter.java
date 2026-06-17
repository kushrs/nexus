package com.nexus.gateway.filter;

import com.nexus.gateway.dto.ApiLogEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class LoggingFilter implements GlobalFilter, Ordered {

    private final KafkaTemplate<String, ApiLogEvent> kafkaTemplate;
    private final ReactiveStringRedisTemplate redisTemplate;

    private static final String TOPIC = "api-log-events";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();
        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().name();

        exchange.getAttributes().put("requestId", requestId);

        return chain.filter(exchange)
                .then(Mono.fromRunnable(() -> {
                    long responseTime = System.currentTimeMillis() - startTime;
                    int statusCode = exchange.getResponse().getStatusCode() != null
                            ? exchange.getResponse().getStatusCode().value()
                            : 500;

                    String userId = exchange.getAttribute("userId");
                    String ip = extractClientIp(exchange);

                    // Track metrics per service instance in Redis
                    String targetInstance = exchange.getAttribute("targetInstance");
                    if (targetInstance != null) {
                        String countKey = "metrics:" + targetInstance + ":request_count";
                        String latencyKey = "metrics:" + targetInstance + ":latency_sum";
                        String errorKey = "metrics:" + targetInstance + ":error_count";

                        redisTemplate.opsForValue().increment(countKey)
                                .then(redisTemplate.opsForValue().increment(latencyKey, responseTime))
                                .then(statusCode >= 400 ? redisTemplate.opsForValue().increment(errorKey) : Mono.empty())
                                .subscribe(null, ex -> log.error("Failed to update instance metrics in Redis: {}", ex.getMessage()));
                    }

                    ApiLogEvent event = ApiLogEvent.builder()
                            .requestId(requestId)
                            .endpoint(path)
                            .method(method)
                            .statusCode(statusCode)
                            .responseTime(responseTime)
                            .userId(userId)
                            .ipAddress(ip)
                            .timestamp(System.currentTimeMillis())
                            .build();

                    kafkaTemplate.send(TOPIC, requestId, event)
                            .whenComplete((result, ex) -> {
                                if (ex != null) {
                                    log.error("Failed to send log event to Kafka: {}", ex.getMessage());
                                }
                              else {
                                log.debug("Sent log event to Kafka for request: {}", requestId);
                              }
                            });

                    log.info("[{}] {} {} -> {} ({}ms, user: {}, instance: {})",
                            requestId, method, path, statusCode, responseTime, userId, targetInstance);
                }));
    }

    private String extractClientIp(ServerWebExchange exchange) {
        String xff = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        var remoteAddress = exchange.getRequest().getRemoteAddress();
        return remoteAddress != null ? remoteAddress.getAddress().getHostAddress() : "unknown";
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
