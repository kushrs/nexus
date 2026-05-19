package com.nexus.logconsumer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", length = 100)
    private String requestId;

    @Column(length = 255)
    private String endpoint;

    @Column(length = 20)
    private String method;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "response_time")
    private Long responseTime;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;
}
