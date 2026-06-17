package com.nexus.logconsumer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "api_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiLog {
    @Id
    private UUID id;

    @Column(length = 255)
    private String endpoint;

    @Column(length = 20)
    private String method;

    private Long latency;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;
}
