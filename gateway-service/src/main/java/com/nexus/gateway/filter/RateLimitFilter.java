package com.nexus.gateway.filter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Redis-based Rate Limiting Filter using Token Bucket algorithm.
 * 
 * Tracks per-user request counts in Redis with a sliding window.
 * When the limit is exceeded, returns HTTP 429 Too Many Requests.
 * 
 * Anonymous users are rate-limited by IP address.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter implements GlobalFilter, Ordered {

    private final ReactiveStringRedisTemplate redisTemplate;

    @Value("${rate-limit.requests-per-minute:100}")
    private int requestsPerMinute;

    private static final String RATE_LIMIT_PREFIX = "rate_limit:";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Determine the rate limit key (userId or IP for anonymous)
        String key = resolveKey(exchange);
        String policyKey = "rate_limit_policy:" + key.substring(RATE_LIMIT_PREFIX.length());

        return redisTemplate.opsForValue().get(policyKey)
                .switchIfEmpty(redisTemplate.opsForValue().get("rate_limit_policy:global"))
                .map(val -> {
                    try {
                        return Integer.parseInt(val);
                    } catch (NumberFormatException e) {
                        return requestsPerMinute;
                    }
                })
                .defaultIfEmpty(requestsPerMinute)
                .flatMap(limit -> {
                    if (limit <= 0) {
                        log.warn("Access BLOCKED by AI policy for key: {}", key);
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }

                    return redisTemplate.opsForValue()
                            .increment(key)
                            .flatMap(count -> {
                                if (count == 1) {
                                    // First request in window — set expiry to 1 minute
                                    return redisTemplate.expire(key, Duration.ofMinutes(1))
                                            .then(checkLimitAndHeaders(exchange, chain, count, limit, key));
                                }
                                return checkLimitAndHeaders(exchange, chain, count, limit, key);
                            });
                });
    }

    private Mono<Void> checkLimitAndHeaders(ServerWebExchange exchange, GatewayFilterChain chain, Long count, int limit, String key) {
        if (count > limit) {
            log.warn("Rate limit exceeded for key: {} (count: {}, limit: {})", key, count, limit);
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            exchange.getResponse().getHeaders().set("X-RateLimit-Limit", String.valueOf(limit));
            exchange.getResponse().getHeaders().set("X-RateLimit-Remaining", "0");
            exchange.getResponse().getHeaders().set("Retry-After", "60");
            return exchange.getResponse().setComplete();
        }

        exchange.getResponse().getHeaders().set("X-RateLimit-Limit", String.valueOf(limit));
        exchange.getResponse().getHeaders().set("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - count)));
        return chain.filter(exchange);
    }

    /**
     * Resolve the rate limiting key.
     * Uses userId if authenticated, otherwise falls back to IP address.
     */
    private String resolveKey(ServerWebExchange exchange) {
        Long userId = exchange.getAttribute("userId");
        if (userId != null) {
            return RATE_LIMIT_PREFIX + "user:" + userId;
        }
        // Fallback to IP for unauthenticated requests
        String ip = extractClientIp(exchange);
        return RATE_LIMIT_PREFIX + "ip:" + ip;
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
        // Execute after JWT validation but before logging
        return -2;
    }
}
