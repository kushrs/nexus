# 🚀 Nexus Gateway — AI-Powered Smart API Gateway & Traffic Optimization System

Enterprise-grade distributed microservice system with an API Gateway, JWT Authentication, Redis Rate Limiting, Kafka Logging, and a Monitoring Dashboard.

---

## 📐 Architecture & Port Mapping

```
┌──────────────┐     ┌─────────────────────────────────────┐
│   Frontend   │────▶│         API Gateway (:8080)          │
│  React App   │     │  JWT Filter → Rate Limit → Logging  │
│   (:3000)    │     └──┬──────┬──────┬──────┬──────┬──────┘
│              │        │      │      │      │      │
└──────────────┘     ┌──▼───┐┌──▼───┐┌──▼───┐┌──▼───┐┌──▼───┐
                     │ Auth ││ User ││ Pay  ││Notif ││ Logs  │
                     │:8081 ││:8082 ││:8083 ││:8084 ││:8085  │
                     └──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘
                        │       │       │       │       │
                     ┌──▼───────▼───────▼───────▼───────▼───┐
                     │            MySQL (:3307)             │
                     └──────────────────────────────────────┘
                     ┌──────────┐  ┌────────────────────────┐
                     │  Redis   │  │   Kafka + Zookeeper    │
                     │ (:6379)  │  │ (:9092)       (:2181)  │
                     └──────────┘  └────────────────────────┘
```

### 📦 Services Directory & Port Matrix

| Service | Host Port | Internal Docker Port | Description |
| :--- | :--- | :--- | :--- |
| **frontend** | `3000` | `80` | React monitoring dashboard & configuration UI |
| **gateway-service** | `8080` | `8080` | Spring Cloud Gateway (filters JWT, Redis Rate Limit, produces Kafka Logs) |
| **auth-service** | `8081` | `8081` | Core Identity & Authentication (Register, Login, JWT issuing) |
| **user-service** | `8082` | `8082` | Account & profile management |
| **payment-service** | `8083` | `8083` | Transactions processing service |
| **notification-service**| `8084` | `8084` | User messaging & dispatch system |
| **log-consumer-service**| `8085` | `8085` | Kafka consumer + AI Anomaly/Forecasting + Dashboard API |
| **MySQL Database** | `3307` | `3306` | Persistent relational store *(Mapped to 3307 on host to avoid port conflict)* |
| **Redis Cache** | `6379` | `6379` | Token bucket rate limiting cache & dynamic policies store |
| **Apache Kafka** | `9092` | `29092` | Event broker for gateway request logs |
| **Zookeeper** | `2181` | `2181` | Kafka coordination service |

---

## 🛠️ Prerequisites & Installation

Depending on how you wish to run the project, install the following tools:

### Option A: Running with Docker (Recommended)
If you want to run everything isolated in containers, you only need:
1. **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/) (includes Docker Compose).

### Option B: Running Locally (Without Docker)
If you have slow internet or want to run services directly on your host machine, install:
1. **Java Development Kit (JDK) 21**: [Download here](https://adoptium.net/temurin/releases/?version=21) (Ensure `JAVA_HOME` environment variable is set).
2. **Apache Maven 3.8+**: [Download here](https://maven.apache.org/download.cgi) (Ensure added to your system `PATH`).
3. **Node.js LTS (v20+)**: [Download here](https://nodejs.org/) (Includes `npm`).
4. **MySQL Community Server 8.0**: [Download here](https://dev.mysql.com/downloads/mysql/).
5. **Redis Server** (For Windows, you can run it via WSL, or download a native port like Memurai or Redis-Windows).
6. **Apache Kafka & Zookeeper**: [Download here](https://kafka.apache.org/downloads).

---

## 🚀 How to Run the Application

### 🐳 Method 1: Using Docker Compose (Quickest)

Since Docker builds everything inside container environments, you only need to run:

1. **Start all services**:
   ```bash
   docker compose up --build
   ```
2. **Verify it is running**:
   Wait 2-3 minutes. Once the terminal stops outputting compilation logs and you see logs like `Tomcat started on port(s)...` and `partitions assigned: [api-log-events-0]`, everything is up!
3. **Access points**:
   - **Frontend UI Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **API Gateway**: [http://localhost:8080](http://localhost:8080)
   - **MySQL database (from Host)**: Host: `localhost`, Port: `3307`, User: `root`, Password: `root123`, DB: `api_management`

---

### 💻 Method 2: Running Locally (No Docker)

If you need to bypass Docker downloads, follow this setup sequence:

#### Step 1: Start Infrastructure Dependencies
Ensure your local databases and message brokers are started:
1. Start your local **MySQL Server** (on port `3306`). Create a database named `api_management`:
   ```sql
   CREATE DATABASE api_management;
   ```
2. Start your local **Redis Server** (on port `6379`).
3. Start **Zookeeper** and then **Kafka** (broker on port `9092`).

#### Step 2: Configure Environment Override
Since your local databases are running on their default ports, you do not need to change anything! The Spring Boot services are pre-configured to fall back to `localhost` defaults if they are run outside of Docker.

#### Step 3: Run Backend Services (Start in 6 Separate Terminals)
Run the following Maven commands in order:
```bash
# 1. Start Auth Service
cd auth-service && mvn spring-boot:run

# 2. Start User Service
cd ../user-service && mvn spring-boot:run

# 3. Start Payment Service
cd ../payment-service && mvn spring-boot:run

# 4. Start Notification Service
cd ../notification-service && mvn spring-boot:run

# 5. Start Log Consumer & AI Analytics Service
cd ../log-consumer-service && mvn spring-boot:run

# 6. Start API Gateway (Run last)
cd ../gateway-service && mvn spring-boot:run
```

#### Step 4: Run the React Frontend (In a 7th Terminal)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Credentials
To access the dashboard or authenticate requests, use the seeded administrator credentials:
* **Admin Email**: `admin@nexus.com`
* **Password**: `admin123`

---

## 🧪 Verification & End-to-End Testing
To verify that the system is fully operational (e.g. Gateway routes requests, generates JWTs, applies rate limits, logs to Kafka, and updates the AI Optimizer dashboard), please read the step-by-step verification guide:

👉 **[VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md)**
