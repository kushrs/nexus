package com.nexus.logconsumer.repository;

import com.nexus.logconsumer.entity.TrafficMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface TrafficMetricsRepository extends JpaRepository<TrafficMetrics, UUID> {
    
    @Query("SELECT t FROM TrafficMetrics t WHERE t.serviceName = :serviceName ORDER BY t.timestamp DESC")
    List<TrafficMetrics> findLatestByServiceName(@Param("serviceName") String serviceName);
}
