package com.nexus.logconsumer.repository;

import com.nexus.logconsumer.entity.ApiLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ApiLogRepository extends JpaRepository<ApiLog, UUID> {

    // Count requests after a given timestamp
    long countByTimestampAfter(LocalDateTime after);

    // Count error requests (4xx, 5xx)
    @Query("SELECT COUNT(a) FROM ApiLog a WHERE a.statusCode >= 400")
    long countErrors();

    // Average latency
    @Query("SELECT COALESCE(AVG(a.latency), 0) FROM ApiLog a")
    double avgLatency();

    // Top APIs by request count
    @Query("SELECT a.endpoint AS endpoint, COUNT(a) AS count FROM ApiLog a " +
           "GROUP BY a.endpoint ORDER BY count DESC")
    List<Object[]> findTopApis(Pageable pageable);

    // Requests per minute in last hour (PostgreSQL to_char format)
    @Query(value = "SELECT to_char(timestamp, 'YYYY-MM-DD HH24:MI') AS minute, COUNT(*) AS count " +
                   "FROM api_logs WHERE timestamp > :since " +
                   "GROUP BY minute ORDER BY minute", nativeQuery = true)
    List<Object[]> requestsPerMinute(@Param("since") LocalDateTime since);

    // Recent requests
    List<ApiLog> findTop50ByOrderByTimestampDesc();
}
