package com.nexus.gateway.filter;

import com.nexus.gateway.config.SmartRoutingConfig;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SmartRoutingFilter implements GlobalFilter, Ordered {

    private final SmartRoutingConfig smartRoutingConfig;
    private final ReactiveStringRedisTemplate redisTemplate;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
        if (route == null) {
            return chain.filter(exchange);
        }

        String routeId = route.getId();
        SmartRoutingConfig.ServiceConfig serviceConfig = smartRoutingConfig.getServices().get(routeId);

        // If smart routing is not configured for this route, skip dynamic load balancing
        if (serviceConfig == null || serviceConfig.getInstances() == null || serviceConfig.getInstances().isEmpty()) {
            exchange.getAttributes().put("targetInstance", routeId);
            return chain.filter(exchange);
        }

        List<String> instances = serviceConfig.getInstances();

        // Query Redis for health scores of all candidate instances
        return Flux.fromIterable(instances)
                .flatMap(instance -> {
                    String instanceId = resolveInstanceId(instance);
                    return redisTemplate.opsForValue().get("health_score:" + instanceId)
                            .map(Double::parseDouble)
                            .defaultIfEmpty(100.0) // default score if none recorded yet
                            .map(score -> new InstanceScore(instance, instanceId, score));
                })
                .collectList()
                .flatMap(scoredInstances -> {
                    // Select instance with highest health score
                    InstanceScore best = scoredInstances.stream()
                            .max(Comparator.comparingDouble(InstanceScore::getScore))
                            .orElse(new InstanceScore(instances.get(0), resolveInstanceId(instances.get(0)), 100.0));

                    log.debug("Smart Routing selected healthiest instance: {} with score {}", best.instanceId, best.score);
                    exchange.getAttributes().put("targetInstance", best.instanceId);

                    try {
                        URI originalUrl = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR);
                        if (originalUrl != null) {
                            URI targetInstanceUri = new URI(best.uri);
                            URI newUrl = UriComponentsBuilder.fromUri(originalUrl)
                                    .scheme(targetInstanceUri.getScheme())
                                    .host(targetInstanceUri.getHost())
                                    .port(targetInstanceUri.getPort())
                                    .build(true)
                                    .toUri();
                            exchange.getAttributes().put(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR, newUrl);
                        }
                    } catch (Exception e) {
                        log.error("Failed to rewrite gateway target URI: {}", e.getMessage());
                    }

                    return chain.filter(exchange);
                });
    }

    /**
     * Map configured physical candidate URIs to human-readable instance IDs.
     */
    private String resolveInstanceId(String uri) {
        if (uri.contains("8081") || uri.contains("auth-service")) return "auth-service";
        if (uri.contains("8082") || uri.contains("user-service-1")) return "user-service-1";
        if (uri.contains("8092") || uri.contains("user-service-2")) return "user-service-2";
        if (uri.contains("8083") || uri.contains("payment-service-1")) return "payment-service-1";
        if (uri.contains("8093") || uri.contains("payment-service-2")) return "payment-service-2";
        if (uri.contains("8084") || uri.contains("notification-service-1")) return "notification-service-1";
        if (uri.contains("8094") || uri.contains("notification-service-2")) return "notification-service-2";
        return "unknown-service";
    }

    @Override
    public int getOrder() {
        // Run at order 10001, immediately after RouteToRequestUrlFilter (10000)
        return 10001;
    }

    @Data
    @AllArgsConstructor
    private static class InstanceScore {
        private String uri;
        private String instanceId;
        private double score;
    }
}
