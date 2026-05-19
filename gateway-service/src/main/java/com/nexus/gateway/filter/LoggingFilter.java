package com.nexus.gateway.filter;

import com.nexus.gateway.dto.ApiLogEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Global Logging Filter that captures every request/response through the gateway.
 * 
 * Produces ApiLogEvent messages to Kafka for async processing by log-consumer-service.
 * Records: endpoint, method, status code, response time, user info, IP address.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LoggingFilter implements GlobalFilter, Ordered {

    private final KafkaTemplate<String, ApiLogEvent> kafkaTemplate;

    private static final String TOPIC = "api-log-events";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();
        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().name();

        // Store requestId for tracing
        exchange.getAttributes().put("requestId", requestId);

        return chain.filter(exchange)
                .then(Mono.fromRunnable(() -> {
                    long responseTime = System.currentTimeMillis() - startTime;
                    int statusCode = exchange.getResponse().getStatusCode() != null
                            ? exchange.getResponse().getStatusCode().value()
                            : 500;

                    Long userId = exchange.getAttribute("userId");
                    String ip = extractClientIp(exchange);

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

                    // Send to Kafka asynchronously
                    kafkaTemplate.send(TOPIC, requestId, event)
                            .whenComplete((result, ex) -> {
                                if (ex != null) {
                                    log.error("Failed to send log event to Kafka: {}", ex.getMessage());
                                }
                            });

                    log.info("[{}] {} {} -> {} ({}ms, user: {})",
                            requestId, method, path, statusCode, responseTime, userId);
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
        // Highest priority to wrap the entire request lifecycle
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
