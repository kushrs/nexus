# 🧪 Nexus Gateway — End-to-End Verification Guide

This guide provides step-by-step instructions to verify that all systems (API Gateway, JWT Auth, Redis Rate Limiting, Kafka Logging, and the React Frontend / AI Optimizer Dashboard) are fully operational and working together in harmony.

---

## 🛠️ Verification Prerequisite: Tools
You can run these checks using:
1. **cURL** (built into Windows PowerShell/Command Prompt)
2. **Postman** (Desktop application)
3. **Your Web Browser**

Ensure your Docker containers (or local services) are running before starting.

---

## 🏃 Step 1: User Registration
We will register a new user account through the API Gateway, which will route the request to the `auth-service` and persist the user to MySQL.

Run the following command in your terminal:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Alice\",\"email\":\"alice@test.com\",\"password\":\"alice123\"}"
```

### Expected Response:
A JSON payload containing the user's details and a JWT Token:
```json
{
  "id": 2,
  "name": "Alice",
  "email": "alice@test.com",
  "role": "USER",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
*Copy the value of the `"token"` field. You will need it to make authenticated requests.*

---

## 🔑 Step 2: User Login
Let's verify that authentication works by exchanging Alice's credentials for a fresh JWT token:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"alice@test.com\",\"password\":\"alice123\"}"
```

### Expected Response:
Another token payload confirming successful credentials matching.

---

## 🔒 Step 3: Accessing Protected Endpoints
Protected endpoints require a valid JWT token. If you request them without a token, or with an invalid token, the API Gateway will block the request and return **`401 Unauthorized`**.

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

## 🛡️ Step 4: Verifying Redis Rate Limiting
The gateway is configured with a rate limit of **100 requests per minute** per user, managed inside Redis.

To test this easily, we can simulate a rapid flood of requests using a loop.

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

## 📥 Step 5: Verifying Kafka & Database Logs
Every request going through the API Gateway produces an `ApiLogEvent` to a Kafka topic named `api-log-events`. The `log-consumer-service` consumes this message and saves it to the MySQL database.

### Verification Check:
1. Connect to your MySQL database (Host: `localhost`, Port: `3307`, Database: `api_management`).
2. Run this query:
   ```sql
   SELECT * FROM api_logs ORDER BY timestamp DESC LIMIT 5;
   ```
3. If you see records containing the requests you just made (Alice's requests, endpoints visited, response times), then **Kafka messaging and database persistence are fully operational!**

---

## 📊 Step 6: Verifying React Dashboard & UI
1. Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**.
2. Login using the administrator credentials:
   - **Email**: `admin@nexus.com`
   - **Password**: `admin123`
3. **Observe the dashboard**:
   - Check if the metrics (Total Requests, Response Times, Error Rates) are updating in real-time.
   - You should see the spike of requests you generated in **Step 4** visible in the charts!

---

## 🤖 Step 7: Verifying the AI Traffic Optimizer
1. Inside the dashboard, navigate to the **AI Optimizer** page from the sidebar.
2. Look at the graphs:
   - **Traffic Forecasting**: Ensure it plots a predicted traffic slope (calculated via linear regression based on your request activity).
   - **Anomalies Table**: If you performed the rate limiting test (Step 4), you should see anomalies flagged (e.g. high request counts or traffic bursts) with details about the offending IP address.
3. **Enforce a Policy**:
   - Find a flagged IP address/User.
   - Click **Throttle** or **Block IP**.
   - Verify that a dynamic rule is set up, which pushes the block policy to Redis and instantly halts further requests from that source.
