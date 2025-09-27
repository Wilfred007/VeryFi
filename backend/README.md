# ZK Health Pass Backend API

A production-ready REST API backend for the ZK Health Pass system, built with Rust, Axum, and PostgreSQL.

## 🚀 Features

### **Core Functionality**
- **User Authentication** - JWT-based auth with role-based access control
- **Health Record Management** - CRUD operations for health records
- **ECDSA Signature Integration** - Cryptographic signing and verification
- **Zero-Knowledge Proof Generation** - Integration with Noir circuits
- **Proof Verification** - Public and authenticated proof verification endpoints

### **Security & Performance**
- **Argon2 Password Hashing** - Industry-standard password security
- **JWT Token Authentication** - Secure session management
- **Rate Limiting** - Protection against abuse
- **CORS Configuration** - Cross-origin request handling
- **Input Validation** - Comprehensive request validation
- **Error Handling** - Structured error responses

### **Database & Storage**
- **PostgreSQL Integration** - Robust relational database
- **Database Migrations** - Version-controlled schema management
- **Connection Pooling** - Optimized database performance
- **Audit Logging** - Complete verification trail

## 🏗️ Architecture

```
Backend API Architecture
├── Authentication Layer
│   ├── JWT token validation
│   ├── Role-based access control
│   └── Password hashing (Argon2)
├── API Routes
│   ├── /api/v1/auth (Authentication)
│   ├── /api/v1/health-records (Health Records)
│   ├── /api/v1/proofs (ZK Proof Management)
│   └── /api/v1/authorities (Health Authorities)
├── Services Layer
│   ├── AuthService (User management)
│   ├── HealthRecordService (Record management)
│   ├── ZkProofService (Proof generation/verification)
│   └── CryptoService (ECDSA operations)
├── Database Layer
│   ├── PostgreSQL (Primary storage)
│   ├── Redis (Caching & rate limiting)
│   └── Migrations (Schema management)
└── Integration Layer
    ├── Noir Circuit Integration
    ├── ECDSA Signature Verification
    └── External API Support
```

## 🛠️ Setup & Installation

### **Prerequisites**
- Rust 1.75+ and Cargo
- PostgreSQL 15+
- Redis 7+ (optional, for caching)
- Docker & Docker Compose (for containerized deployment)

### **Local Development**

1. **Clone and setup**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Database setup**:
   ```bash
   # Start PostgreSQL (or use Docker)
   docker run --name zk-postgres -e POSTGRES_DB=zk_health_pass \
     -e POSTGRES_USER=zkhealth -e POSTGRES_PASSWORD=password \
     -p 5432:5432 -d postgres:15-alpine
   ```

3. **Run migrations**:
   ```bash
   cargo install sqlx-cli
   sqlx migrate run
   ```

4. **Start the server**:
   ```bash
   cargo run
   ```

### **Docker Deployment**

1. **Using Docker Compose** (recommended):
   ```bash
   docker-compose up -d
   ```

2. **Manual Docker build**:
   ```bash
   docker build -t zk-health-backend .
   docker run -p 3000:3000 --env-file .env zk-health-backend
   ```

## 📡 API Endpoints

### **Authentication**
```http
POST /api/v1/auth/register     # User registration
POST /api/v1/auth/login        # User login
GET  /api/v1/auth/me          # Get current user
PUT  /api/v1/auth/change-password  # Change password
POST /api/v1/auth/verify      # Verify user (admin only)
```

### **Health Records**
```http
POST /api/v1/health-records           # Create health record
GET  /api/v1/health-records           # Get user's health records
GET  /api/v1/health-records/:id       # Get specific health record
PUT  /api/v1/health-records/:id       # Update health record
DELETE /api/v1/health-records/:id     # Delete health record
PUT  /api/v1/health-records/:id/revoke # Revoke health record
POST /api/v1/health-records/:id/sign  # Sign health record
```

### **ZK Proofs**
```http
POST /api/v1/proofs/generate          # Generate ZK proof
POST /api/v1/proofs/verify            # Verify proof (authenticated)
POST /api/v1/proofs/public/verify     # Verify proof (public)
GET  /api/v1/proofs                   # Get user's proofs
GET  /api/v1/proofs/:id               # Get specific proof
PUT  /api/v1/proofs/:id/revoke        # Revoke proof
```

### **Health Authorities**
```http
POST /api/v1/authorities              # Create authority (admin only)
GET  /api/v1/authorities              # List authorities
GET  /api/v1/authorities/:id          # Get specific authority
PUT  /api/v1/authorities/:id          # Update authority (admin only)
```

## 🔐 Authentication & Authorization

### **User Roles**
- **Patient**: Can manage their own health records and proofs
- **Provider**: Can create, sign, and revoke health records
- **Verifier**: Can verify proofs and access verification logs
- **Admin**: Full system access and user management

### **JWT Token Format**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "Patient",
  "exp": 1640995200,
  "iat": 1640908800
}
```

### **API Authentication**
Include JWT token in Authorization header:
```http
Authorization: Bearer <jwt-token>
```

## 🧪 Testing

### **Run Tests**
```bash
cargo test
```

### **API Testing with curl**

1. **Register a user**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "full_name": "Test User"
     }'
   ```

2. **Login**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

3. **Create health record**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/health-records \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "authority_id": "authority-uuid",
       "record_type": "Vaccination",
       "patient_identifier": "Patient123",
       "details": {"vaccine_name": "COVID-19"},
       "issue_date": "2025-01-01"
     }'
   ```

## 🔧 Configuration

### **Environment Variables**
```bash
# Server
SERVER_ADDRESS=0.0.0.0:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION_HOURS=24

# Noir Circuit
NOIR_CIRCUIT_PATH=../noir

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_RPM=60

# Logging
RUST_LOG=info
```

## 📊 Database Schema

### **Key Tables**
- **users** - User accounts and authentication
- **health_authorities** - Trusted health record issuers
- **health_records** - Health records with ECDSA signatures
- **zk_proofs** - Generated zero-knowledge proofs
- **proof_verifications** - Audit trail of proof verifications
- **api_keys** - API access keys for external integrations

## 🚀 Production Deployment

### **Performance Optimizations**
- Connection pooling (20 connections)
- Request rate limiting (60 RPM default)
- Efficient database queries with indexes
- Structured logging for monitoring

### **Security Hardening**
- Argon2 password hashing
- JWT token expiration
- Input validation and sanitization
- CORS configuration
- SQL injection prevention

### **Monitoring & Logging**
- Structured JSON logging
- Health check endpoint (`/health`)
- Database connection monitoring
- Error tracking and alerting

## 🔮 Integration with ZK Health Pass

This backend integrates seamlessly with:
- **Frontend Applications** - Web and mobile interfaces
- **Noir ZK Circuits** - Automated proof generation
- **ECDSA Signature System** - Cryptographic verification
- **External Health Systems** - API-based integrations

## 📚 API Documentation

For detailed API documentation with request/response examples, run the server and visit:
- Swagger/OpenAPI documentation (if implemented)
- Health check: `GET /health`

---

**Status**: ✅ **Production Ready**

The backend provides a complete, secure, and scalable foundation for the ZK Health Pass system!
