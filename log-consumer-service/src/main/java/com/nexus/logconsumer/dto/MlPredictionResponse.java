package com.nexus.logconsumer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MlPredictionResponse {
    private List<Map<String, Object>> predictedTraffic; // list of { "minute": "...", "requests": X, "isPredicted": true }
    private String systemLoadForecast; // NORMAL, ELEVATED, HIGH, CRITICAL
    private double growthRate; // Percentage growth trend
    private String recommendation;
}
