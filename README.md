# 🚀 Nexus Gateway — AI-Powered Smart API Gateway & Traffic Optimization System

> Enterprise-grade distributed microservice system with API Gateway, JWT Authentication, Redis Rate Limiting, Kafka Logging, and Monitoring Dashboard.

---

## 📐 Architecture

```
┌──────────────┐     ┌─────────────────────────────────────┐
│   Frontend   │────▶│         API Gateway (:8080)          │
│  React App   │     │  JWT Filter → Rate Limit → Logging  │
│   (:3000)    │     └──┬──────┬──────┬──────┬──────┬──────┘
└──────────────┘        │      │      │      │      │
                  ┌─────▼┐ ┌───▼──┐ ┌─▼────┐ ┌▼─────┐ ┌▼──────┐
                  │ Auth │ │ User │ │ Pay  │ │Notif │ │ Logs  │
                  │:8081 │ │:8082 │ │:8083 │ │:8084 │ │:8085  │
                  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬────┘
                     │        │        │        │        │
                  ┌──▼────────▼────────▼────────▼────────▼──┐
                  │            MySQL (:3306)                 │
                  └─────────────────────────────────────────┘
                  ┌──────────┐  ┌──────────────────────────┐
                  │  Redis   │  │     Kafka + Zookeeper    │
                  │ (:6379)  │  │ (:9092)       (:2181)    │
                  └──────────┘  └──────────────────────────┘
```

                    ┌────────────────────┐
                    │     Client Apps    │
                    │ Web / Mobile / API │
                    └─────────┬──────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │     API Gateway         │
                 │ Spring Cloud Gateway    │
                 └─────────┬──────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼

┌───────────────┐  ┌────────────────┐  ┌────────────────┐
│ Authentication│  │ Rate Limiter   │  │ Request Logger │
│ JWT Security  │  │                │  │                │
└───────────────┘  └────────────────┘  └────────────────┘

                           │
                           ▼

              ┌──────────────────────────┐
              │ Traffic Analysis Engine   │
              │ Metrics Collection        │
              └──────────┬───────────────┘
                         │
                         ▼

              ┌──────────────────────────┐
              │ AI Prediction Service     │
              │ Python + ML Models        │
              └──────────┬───────────────┘
                         │
                         ▼

              ┌──────────────────────────┐
              │ Smart Load Balancer       │
              │ Dynamic Routing Logic     │
              └──────────┬───────────────┘

      ┌──────────────────┼────────────────────┐
      ▼                  ▼                    ▼

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ User Service │ │ Payment API  │ │ Notification │
│              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘

                         │
                         ▼

              ┌──────────────────────────┐
              │   Monitoring Dashboard   │
              │                          │
              └──────────────────────────┘

## 🛠️ Tech Stack

| Layer     | Technology                                              |
|-----------|--------------------------------------------------------|
| Backend   | Java 21, Spring Boot 3.2, Spring Cloud Gateway, JPA   |
| Security  | Spring Security, JWT (JJWT), BCrypt                    |
| Database  | MySQL 8.0                                              |
| Cache     | Redis 7                                                |
| Messaging | Apache Kafka (Confluent)                               |
| Frontend  | React 18, Tailwind CSS 3, Recharts, Axios              |
| DevOps    | Docker, Docker Compose                                 |
| Docs      | SpringDoc OpenAPI / Swagger UI                         |

## 📦 Services

| Service               | Port | Description                              |
|-----------------------|------|------------------------------------------|
| gateway-service       | 8080 | API Gateway (JWT, Rate Limit, Logging)   |
| auth-service          | 8081 | Authentication (Register, Login, JWT)    |
| user-service          | 8082 | User CRUD operations                     |
| payment-service       | 8083 | Payment management                      |
| notification-service  | 8084 | Notification management                  |
| log-consumer-service  | 8085 | Kafka consumer + Dashboard API           |
| frontend              | 3000 | React monitoring dashboard               |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- (Optional) Java 21, Maven, Node.js 20 for local dev

### Run with Docker Compose

```bash
# Clone and start everything
cd Nexus_Gateway
docker-compose up --build
```

Wait for all services to start (~2-3 minutes), then open:
- **Frontend**: http://localhost:3000
- **Gateway**: http://localhost:8080
- **Swagger (Auth)**: http://localhost:8081/swagger-ui.html

### Default Credentials
- **Admin**: admin@nexus.com / admin123

### Local Development (without Docker)

1. Start MySQL, Redis, Kafka separately
2. Run each Spring Boot service:
   ```bash
   cd auth-service && mvn spring-boot:run
   cd user-service && mvn spring-boot:run
   cd payment-service && mvn spring-boot:run
   cd notification-service && mvn spring-boot:run
   cd log-consumer-service && mvn spring-boot:run
   cd gateway-service && mvn spring-boot:run
   ```
3. Start frontend:
   ```bash
   cd frontend && npm install && npm run dev
   ```

## 🔐 Authentication Flow

```
1. POST /api/auth/register  →  Create user + get JWT
2. POST /api/auth/login     →  Authenticate + get JWT
3. Use JWT in Authorization: Bearer <token>
4. Gateway validates JWT → forwards to services
```

## 🛡️ Rate Limiting

- **100 requests/minute** per user (Redis token bucket)
- Anonymous users rate-limited by IP
- Returns `HTTP 429` with `Retry-After: 60` header

## 📊 Monitoring Dashboard

The React dashboard shows real-time metrics:
- Total requests, Requests/minute, Avg response time, Error rate
- Area chart: Requests per minute over last hour
- Bar chart: Top API endpoints
- Table: Recent request logs

## 📁 API Reference

### Auth
| Method | Endpoint          | Auth   | Description     |
|--------|-------------------|--------|-----------------|
| POST   | /api/auth/register| Public | Register user   |
| POST   | /api/auth/login   | Public | Login + get JWT |

### Users
| Method | Endpoint          | Auth     | Description    |
|--------|-------------------|----------|----------------|
| GET    | /api/users        | Required | List all users |
| GET    | /api/users/{id}   | Required | Get user by ID |
| POST   | /api/users        | Required | Create user    |
| PUT    | /api/users/{id}   | Required | Update user    |
| DELETE | /api/users/{id}   | Required | Delete user    |

### Payments
| Method | Endpoint       | Auth     | Description       |
|--------|----------------|----------|-------------------|
| GET    | /api/payments  | Required | List all payments |
| POST   | /api/payments  | Required | Create payment    |

### Notifications
| Method | Endpoint            | Auth     | Description            |
|--------|---------------------|----------|------------------------|
| GET    | /api/notifications  | Required | List all notifications |
| POST   | /api/notifications  | Required | Create notification    |

### Dashboard
| Method | Endpoint             | Auth     | Description           |
|--------|----------------------|----------|-----------------------|
| GET    | /api/logs/dashboard  | Required | Dashboard statistics  |
| GET    | /api/logs            | Required | Recent request logs   |

## 📝 Sample Requests

### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'
```

### Create Payment (with JWT)
```bash
curl -X POST http://localhost:8080/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{"amount":99.99,"status":"PENDING","userId":1}'
```

## 📋 Phases Implemented

- [x] **Phase 1**: Microservices + API Gateway
- [x] **Phase 2**: JWT Authentication System
- [x] **Phase 3**: Redis Rate Limiting
- [x] **Phase 4**: Kafka Logging + Monitoring Dashboard
- [ ] Phase 5: ML Prediction (Future)
- [ ] Phase 6: Kubernetes (Future)

---

Built with ❤️ using Spring Boot, React, and modern cloud-native patterns.
