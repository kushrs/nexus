# 🧪 Nexus Gateway — End-to-End Verification Guide

This guide provides step-by-step instructions to verify that all systems (API Gateway, JWT Auth, Redis Rate Limiting, Kafka Logging, Python ML Service, and the React Frontend / AI Optimizer Dashboard) are fully operational and working together.

---

## 🛠️ Verification Prerequisite: Running the System
Ensure Docker Desktop is running, then start all services from the root folder:
```bash
docker compose up --build
```
Wait 2-3 minutes for compilation, Zookeeper, and Kafka start up. Once ready:
* **Frontend UI**: [http://localhost:3000](http://localhost:3000)
* **API Gateway**: [http://localhost:8080](http://localhost:8080)
* **Python ML Service**: [http://localhost:8000/health](http://localhost:8000/health)
* **PostgreSQL Database**: Port `5432`, Database: `api_management`, Username: `postgres`, Password: `postgres123`

---

## 🏃 Step 1: User Registration (UUID & JWT Verification)
We will register a new user account through the API Gateway, which will route to `auth-service` and persist the user as a UUID record to PostgreSQL.

Run the following command:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Alice\",\"email\":\"alice@test.com\",\"password\":\"alice123\"}"
```

### Expected Response:
A JSON payload containing the user's UUID `userId` and JWT Token:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "alice@test.com",
  "name": "Alice",
  "role": "USER",
  "userId": "d748f32a-5730-4e31-89dc-53be6fd4a1d5"
}
```
*Copy the value of the `"token"` field.*

---

## 🔒 Step 2: Accessing Protected Endpoints
Protected endpoints require a valid JWT token.

### Case A: Request WITHOUT Token (Should Fail)
```bash
curl -i -X GET http://localhost:8080/api/users
```
**Expected Response Status**: `HTTP/1.1 401 Unauthorized`

### Case B: Request WITH Token (Should Succeed)
Replace `<YOUR_TOKEN>` with the token you copied from Step 1:
```bash
curl -i -X GET http://localhost:8080/api/users \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```
**Expected Response Status**: `HTTP/1.1 200 OK` (along with the list of users in JSON).

---

## 🛡️ Step 3: Verifying Redis Rate Limiting
The gateway rate-limits users to **100 requests per minute**, managed inside Redis.

### Command (PowerShell):
Run this in PowerShell to send 110 requests rapidly:
```powershell
for ($i=1; $i -le 110; $i++) {
    $resp = Invoke-WebRequest -Uri "http://localhost:8080/api/users" -Headers @{"Authorization"="Bearer <YOUR_TOKEN>"} -SkipHttpErrorCheck
    Write-Host "Request $i: Status Code" $resp.StatusCode
}
```

### Expected Result:
- The first 100 requests will return `200 OK`.
- Request 101 through 110 will return **`429 Too Many Requests`**.
- Response Headers will contain:
  `X-RateLimit-Remaining: 0`
  `Retry-After: 60`

---

## 📥 Step 4: Verifying Kafka & Database Logs
Every request routes through the Gateway, producing an `ApiLogEvent` to the Kafka topic `api-log-events`. The `log-consumer-service` consumes this message and saves it to PostgreSQL.

### Verification Check:
1. Connect to PostgreSQL (Host: `localhost`, Port: `5432`, Database: `api_management`, Username: `postgres`, Password: `postgres123`).
2. Run this query:
   ```sql
   SELECT * FROM api_logs ORDER BY timestamp DESC LIMIT 5;
   ```
3. You should see records matching the requests you made, featuring UUID primary keys and `latency` in milliseconds.

---

## 🤖 Step 5: Verifying Smart Routing (Load Balancing)
When a request is made to `/api/users/**`, the Gateway's `SmartRoutingFilter` reads the health scores of the candidate instances (`user-service-1` and `user-service-2`) from Redis:
$$\text{Health Score} = 0.5 \times \text{Latency Score} + 0.3 \times \text{CPU Score} + 0.2 \times \text{Error Rate Score}$$
The Gateway forwards the request to the healthiest instance.

Verify load balancing:
1. Check the logs of `nexus-gateway` during requests. You will see lines like:
   `Smart Routing selected healthiest instance: user-service-1 with score 100.0`
2. If `user-service-1` experiences high latency or errors, its health score will decrease, and the Gateway will dynamically switch to `user-service-2`!

---

## 🤖 Step 6: Verifying the Python ML Service & AI Optimizer
1. Inside the dashboard, navigate to the **AI Optimizer** page.
2. The dashboard calls `log-consumer-service` at `/logs/ml/predictions`, which requests predictions from the Python ML service on port 8000.
3. The Python ML service computes:
   - **Overload Probability**: Using a `RandomForestRegressor` trained on system metrics (requests, latency, CPU/memory, error rate).
   - **Anomalies**: Using an `IsolationForest` model to detect system behavior shifts.
4. Verify that these predictions show on the graphs and anomalies appear flagged (like high request bursts or system overloads).
