package com.nexus.gateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "smart-routing")
@Data
public class SmartRoutingConfig {
    private Map<String, ServiceConfig> services = new HashMap<>();

    @Data
    public static class ServiceConfig {
        private List<String> instances;
    }
}
