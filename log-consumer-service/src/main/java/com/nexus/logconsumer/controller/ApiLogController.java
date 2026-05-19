package com.nexus.logconsumer.controller;

import com.nexus.logconsumer.dto.ApiLogDTO;
import com.nexus.logconsumer.dto.DashboardStats;
import com.nexus.logconsumer.service.ApiLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/logs")
@RequiredArgsConstructor
@Tag(name = "API Logs", description = "Monitoring and analytics APIs")
public class ApiLogController {

    private final ApiLogService apiLogService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get dashboard statistics", description = "Returns aggregated metrics for the monitoring dashboard")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        return ResponseEntity.ok(apiLogService.getDashboardStats());
    }

    @GetMapping
    @Operation(summary = "Get recent API logs")
    public ResponseEntity<List<ApiLogDTO>> getAllLogs() {
        return ResponseEntity.ok(apiLogService.getAllLogs());
    }
}
