import logging
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
import joblib

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml-service")

app = FastAPI(
    title="API Gateway ML Prediction Service",
    description="Traffic spike, overload probability, and anomaly detection microservice.",
    version="1.0.0"
)

# Model paths
MODEL_REG_PATH = "model_reg.joblib"
MODEL_ISO_PATH = "model_iso.joblib"

# Global references to models
model_reg: Optional[RandomForestRegressor] = None
model_iso: Optional[IsolationForest] = None

# Input feature schema
class FeatureData(BaseModel):
    request_count: float
    avg_latency: float
    error_rate: float
    cpu_usage: float
    memory_usage: float
    hour_of_day: int

# Prediction response schema
class PredictionResponse(BaseModel):
    overload_probability: float
    anomaly: bool
    score: float

# Helper to generate synthetic data and bootstrap models
def bootstrap_models():
    global model_reg, model_iso
    logger.info("Bootstrapping models with synthetic traffic data...")
    
    # Create synthetic dataset
    np.random.seed(42)
    n_samples = 200
    
    request_count = np.random.randint(10, 500, n_samples)
    avg_latency = np.random.uniform(20.0, 1500.0, n_samples)
    error_rate = np.random.uniform(0.0, 100.0, n_samples)
    cpu_usage = np.random.uniform(5.0, 95.0, n_samples)
    memory_usage = np.random.uniform(10.0, 90.0, n_samples)
    hour_of_day = np.random.randint(0, 24, n_samples)
    
    df = pd.DataFrame({
        'request_count': request_count,
        'avg_latency': avg_latency,
        'error_rate': error_rate,
        'cpu_usage': cpu_usage,
        'memory_usage': memory_usage,
        'hour_of_day': hour_of_day
    })
    
    # Heuristics formula to calculate target overload probability
    # Higher load, latency, error rate, CPU, and memory increase overload probability
    overload_prob = (
        0.3 * (df['cpu_usage'] / 100.0) +
        0.25 * (df['error_rate'] / 100.0) +
        0.25 * (df['avg_latency'] / 1500.0) +
        0.2 * (df['request_count'] / 500.0)
    )
    overload_prob = np.clip(overload_prob, 0.0, 1.0)
    
    # Train RandomForestRegressor
    model_reg = RandomForestRegressor(n_estimators=50, random_state=42)
    model_reg.fit(df, overload_prob)
    joblib.dump(model_reg, MODEL_REG_PATH)
    
    # Train IsolationForest for anomaly detection
    model_iso = IsolationForest(contamination=0.05, random_state=42)
    model_iso.fit(df)
    joblib.dump(model_iso, MODEL_ISO_PATH)
    
    logger.info("Bootstrapping completed and models saved.")

# Load models on startup
@app.on_event("startup")
def startup_event():
    global model_reg, model_iso
    if os.path.exists(MODEL_REG_PATH) and os.path.exists(MODEL_ISO_PATH):
        try:
            model_reg = joblib.load(MODEL_REG_PATH)
            model_iso = joblib.load(MODEL_ISO_PATH)
            logger.info("Loaded models from disk.")
        except Exception as e:
            logger.error(f"Failed to load models: {e}. Re-bootstrapping...")
            bootstrap_models()
    else:
        bootstrap_models()

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "models_loaded": model_reg is not None and model_iso is not None
    }

@app.post("/predict", response_model=PredictionResponse)
def predict(features: FeatureData):
    global model_reg, model_iso
    if model_reg is None or model_iso is None:
        raise HTTPException(status_code=503, detail="Models are not initialized")
    
    # Create df row for prediction
    input_data = pd.DataFrame([{
        'request_count': features.request_count,
        'avg_latency': features.avg_latency,
        'error_rate': features.error_rate,
        'cpu_usage': features.cpu_usage,
        'memory_usage': features.memory_usage,
        'hour_of_day': features.hour_of_day
    }])
    
    # 1. Predict overload probability (RandomForestRegressor)
    overload_probability = float(model_reg.predict(input_data)[0])
    # Ensure overload_probability lies strictly within [0.0, 1.0]
    overload_probability = max(0.0, min(1.0, overload_probability))
    
    # 2. Anomaly detection (IsolationForest)
    anomaly_prediction = model_iso.predict(input_data)[0]  # returns 1 for normal, -1 for anomaly
    anomaly = bool(anomaly_prediction == -1)
    
    # Convert isolation forest score to [0.0, 1.0] anomaly confidence
    # decision_function returns negative values for anomalies and positive for inliers
    raw_score = float(model_iso.decision_function(input_data)[0])
    anomaly_score = max(0.0, min(1.0, 0.5 - raw_score))  # normalize so lower raw_score gives higher anomaly_score
    
    logger.debug(f"Input: {features.dict()} -> Overload: {overload_probability}, Anomaly: {anomaly} (score={anomaly_score})")
    
    return PredictionResponse(
        overload_probability=overload_probability,
        anomaly=anomaly,
        score=round(anomaly_score, 2)
    )

@app.post("/train")
def train(dataset: List[FeatureData]):
    global model_reg, model_iso
    if not dataset:
        raise HTTPException(status_code=400, detail="Empty dataset provided for training")
    
    logger.info(f"Re-training models with {len(dataset)} items...")
    
    # Build dataframe
    records = []
    for item in dataset:
        records.append({
            'request_count': item.request_count,
            'avg_latency': item.avg_latency,
            'error_rate': item.error_rate,
            'cpu_usage': item.cpu_usage,
            'memory_usage': item.memory_usage,
            'hour_of_day': item.hour_of_day
        })
    df = pd.DataFrame(records)
    
    # Calculate targets for regressor
    overload_prob = (
        0.3 * (df['cpu_usage'] / 100.0) +
        0.25 * (df['error_rate'] / 100.0) +
        0.25 * (df['avg_latency'] / 1500.0) +
        0.2 * (df['request_count'] / 500.0)
    )
    overload_prob = np.clip(overload_prob, 0.0, 1.0)
    
    try:
        # Fit models
        new_reg = RandomForestRegressor(n_estimators=50, random_state=42)
        new_reg.fit(df, overload_prob)
        
        new_iso = IsolationForest(contamination=0.05, random_state=42)
        new_iso.fit(df)
        
        # Save models
        joblib.dump(new_reg, MODEL_REG_PATH)
        joblib.dump(new_iso, MODEL_ISO_PATH)
        
        # Update references in memory
        model_reg = new_reg
        model_iso = new_iso
        
        logger.info("Models re-trained and updated successfully.")
        return {"success": True, "message": f"Successfully trained models on {len(dataset)} samples"}
    except Exception as e:
        logger.error(f"Error during model training: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
