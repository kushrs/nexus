package com.nexus.logconsumer.controller;

import com.nexus.logconsumer.dto.AnomalyEvent;
import com.nexus.logconsumer.dto.MlPredictionResponse;
import com.nexus.logconsumer.dto.PolicyApplyRequest;
import com.nexus.logconsumer.service.MlPredictionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/logs/ml")
@RequiredArgsConstructor
@Tag(name = "ML Optimization", description = "AI-Powered Smart Routing & Traffic Optimization APIs")
public class MlController {

    private final MlPredictionService mlPredictionService;

    @GetMapping("/predictions")
    @Operation(summary = "Get ML traffic predictions", description = "Returns actual and predicted request rates for the next 10 minutes")
    public ResponseEntity<MlPredictionResponse> getTrafficPredictions() {
        return ResponseEntity.ok(mlPredictionService.getTrafficPrediction());
    }

    @GetMapping("/anomalies")
    @Operation(summary = "Get detected anomalies", description = "Returns Z-score latency anomalies and high rate request anomalies")
    public ResponseEntity<List<AnomalyEvent>> getAnomalies() {
        return ResponseEntity.ok(mlPredictionService.detectAnomalies());
    }

    @PostMapping("/policies")
    @Operation(summary = "Apply AI traffic optimization policy", description = "Stores custom rate limit or block rules in Redis")
    public ResponseEntity<Map<String, Object>> applyPolicy(@RequestBody PolicyApplyRequest request) {
        boolean success = mlPredictionService.applyPolicy(request);
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Policy applied successfully in Redis" : "Failed to apply policy"
        ));
    }
}
