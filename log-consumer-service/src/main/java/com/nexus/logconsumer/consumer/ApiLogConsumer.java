package com.nexus.logconsumer.consumer;

import com.nexus.logconsumer.dto.ApiLogEvent;
import com.nexus.logconsumer.service.ApiLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer that listens for API log events produced by the gateway.
 * Persists each event to MySQL for dashboard analytics.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApiLogConsumer {

    private final ApiLogService apiLogService;

    @KafkaListener(topics = "api-log-events", groupId = "log-consumer-group")
    public void consume(ApiLogEvent event) {
        log.debug("Received log event: {} {} -> {}",
                event.getMethod(), event.getEndpoint(), event.getStatusCode());
        apiLogService.saveLogEvent(event);
    }
}
