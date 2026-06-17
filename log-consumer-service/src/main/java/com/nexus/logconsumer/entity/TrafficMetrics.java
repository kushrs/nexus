package com.nexus.logconsumer.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "traffic_metrics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrafficMetrics {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "service_name", nullable = false, length = 100)
    private String serviceName;

    @Column(name = "request_count")
    private Long request_count;

    @Column(name = "avg_latency")
    private Double avg_latency;

    @Column(name = "error_count")
    private Long error_count;

    @Column(name = "cpu_usage")
    private Double cpu_usage;

    @Column(name = "memory_usage")
    private Double memory_usage;

    @CreationTimestamp
    private LocalDateTime timestamp;
}
