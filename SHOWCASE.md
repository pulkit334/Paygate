# 🚀 Microservices Payment Platform - Architecture Showcase

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Port 6283)                │
│                                                              │
│  ✓ Express.js Server  ✓ JWT Auth  ✓ Rate Limiting (Redis) │
│  ✓ Security (Helmet)  ✓ Global Error Handling              │
└──┬──────────────────┬──────────────────┬────────────────────┘
   │                  │                  │
   ├─► /api/v1        ├─► /api/v2        └─► /webhook
   │   (Merchant)     │   (Payments)          (Razorpay)
   │                  │
   ▼                  ▼
┌────────────────┐  ┌──────────────────┐
│  Backend 1     │  │   Backend 2      │
│  (Services)    │  │  (Services)      │
└────────┬───────┘  └────────┬─────────┘
         │                   │
         └─────────┬─────────┘
                   ▼
        ┌──────────────────────┐
        │   gRPC Services      │
        │  (Main Processing)   │
        └──────────────────────┘
```

## 🎯 Core Features

### 1. **Advanced API Gateway**
```typescript
✓ Rate Limiting: 
  - General: 100 requests/15 min
  - Payments: 10 requests/60 sec
✓ JWT Authentication
✓ Morgan Request Logging
✓ Security Headers (Helmet)
✓ Redis-backed Rate Limiting
```

### 2. **Dual Backend Architecture**
- **Backend 1**: Merchant Management Services
- **Backend 2**: Specialized Processing Services
- **gRPC Services**: High-performance inter-service communication

### 3. **Global Error Handling**
```
- Custom AppError class
- Centralized error middleware
- Uncaught exception handling
- Unhandled promise rejection handling
```

### 4. **Payment Routes**
- ✅ Merchant creation & management
- ✅ Payment processing
- ✅ Webhook integration (Razorpay)
- ✅ Transaction tracking

## 📊 Performance Optimizations

| Feature | Benefit |
|---------|---------|
| **Redis Caching** | Sub-millisecond response times |
| **gRPC** | Binary protocol, ~7x faster than REST |
| **Rate Limiting** | Protects against abuse |
| **Helmet Security** | 15+ HTTP headers hardened |
| **Microservices** | Independent scaling |

## 🔐 Security Implementation

```
✓ XSS Protection (xss library)
✓ JWT Token-based Auth
✓ API Key Validation
✓ HTTP Security Headers (Helmet)
✓ Rate Limiting per endpoint
✓ Input validation middleware
✓ Secure webhook handling
```

## 📈 Scalability Features

1. **Horizontal Scaling**: Multiple backend instances
2. **Load Distribution**: gRPC for internal services
3. **Redis Cluster**: Distributed rate limiting
4. **Service Isolation**: Independent failure domains

## 🚀 Live Demo Points

### Quick Health Check
```bash
curl http://localhost:6283/health
# Response: { "status": "ok" }
```

### Rate Limiting Demo
```bash
# Send 11 payment requests in 60 seconds
for i in {1..11}; do
  curl -H "Authorization: Bearer TOKEN" \
       http://localhost:6283/api/v2/payment
done
# Response 11: 429 - "Too many payment requests"
```

### Merchant Endpoint
```bash
curl http://localhost:6283/api/v1/merchant
# 100 requests allowed per 15 minutes
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **API Gateway** | Express.js, TypeScript |
| **Auth** | JWT, Custom Middleware |
| **Caching** | Redis |
| **RPC** | gRPC, Protocol Buffers |
| **Logging** | Morgan |
| **Security** | Helmet, XSS protection |
| **Rate Limit** | Redis Store |

## 📝 Key Achievements

✅ **Global Error Handling** - Centralized exception management  
✅ **Microservices Segregation** - Clean service boundaries  
✅ **Production-Ready Security** - Multi-layer protection  
✅ **High Performance** - gRPC + Redis caching  
✅ **Scalable Architecture** - Ready for millions of requests  
✅ **Webhook Support** - Real-time integrations  

## 🎬 Talking Points for Your Audience

> "This isn't just an API—it's a **complete payment infrastructure**. We have rate limiting that automatically scales with Redis, JWT authentication protecting sensitive endpoints, and gRPC services handling the heavy lifting at near-network speed."

> "Our global error handling catches everything—from malformed requests to database failures—and returns meaningful errors to clients instead of generic 500s."

> "The architecture supports millions of transactions. Each service scales independently, and our Redis-backed rate limiter prevents abuse without hitting the database."

---

**Ready to scale.** 🚀
