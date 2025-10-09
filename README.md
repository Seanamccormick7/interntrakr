# InternTrackr – Dev Quickstart

## Prerequisites

- **Node.js 22.22.0** (LTS)
  - If you use nvm: `nvm install 22.22.0 && nvm use 22.22.0`
- **npm 10+**
- **Docker Desktop** (for MongoDB + PostgreSQL + Redis)

## Setup

```bash
git clone <repo>
cd interntrackr

# Node version (recommended)
# with nvm: nvm use 22.22.0

# Install deps for all workspaces (api + web)
npm install

# Environment variables for API
cp apps/api/.env.example apps/api/.env

# Start infrastructure (MongoDB + PostgreSQL + Redis)
docker compose up -d

# Run the API and Web in separate terminals
npm run dev:api        # http://localhost:4000/ping -> {"message":"pong"}
npm run dev:web        # http://localhost:5173
```

## Security Configuration

The API includes production-ready security middleware:

- **Helmet**: Security headers (XSS, clickjacking, CSP, etc.)
- **CORS**: Strict origin validation with credentials support
- **Rate Limiting**: Per-IP protection against brute force attacks
- **Trust Proxy**: Correct client IP detection behind load balancers

### Environment Variables

Add these to `apps/api/.env` to customize security:

```bash
# CORS - Comma-separated list of allowed origins
# Production: Use your actual frontend URLs
# Development: Include localhost for local dev
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting - Auth endpoints (stricter to prevent brute force)
RATE_AUTH_WINDOW_MS=60000  # 1 minute window
RATE_AUTH_MAX=10           # 10 requests per minute per IP

# Rate Limiting - General API endpoints
RATE_API_WINDOW_MS=60000   # 1 minute window
RATE_API_MAX=120           # 120 requests per minute per IP
```

### Rate Limits (Production Defaults)

| Endpoint              | Limit         | Window | Notes                  |
| --------------------- | ------------- | ------ | ---------------------- |
| `/auth/*`             | 10 req/IP     | 60 sec | Brute force protection |
| `/applications/*`     | 120 req/IP    | 60 sec | General API usage      |
| `/recommendations/*`  | 120 req/IP    | 60 sec | General API usage      |
| `/health`             | ∞ (unlimited) | -      | Monitoring endpoint    |
| `OPTIONS` (preflight) | ∞ (unlimited) | -      | CORS preflight         |

**Notes**:

- In test environment, limits are set much higher (1000/10000) to avoid flaky tests
- Rate limiting is per-IP using `X-Forwarded-For` in production
- 429 responses include `Retry-After` header with seconds to wait

### Security Headers

All responses include:

- `X-Frame-Options: SAMEORIGIN` (clickjacking protection)
- `X-Content-Type-Options: nosniff` (MIME sniffing protection)
- `Strict-Transport-Security` (HTTPS enforcement in production)
- `Cross-Origin-*` headers (isolation protection)
- `Referrer-Policy: no-referrer` (privacy)

### CORS Configuration

- ✅ Credentials (cookies/auth headers) allowed from configured origins
- ✅ Preflight caching: 24 hours
- ✅ Allowed headers: `Content-Type`, `Authorization`, `x-request-id`
- ✅ Server-to-server requests (no Origin header) allowed

### Production Checklist

Before deploying to production:

- [ ] Set `ALLOWED_ORIGINS` to actual frontend URLs (remove localhost)
- [ ] Generate strong `JWT_SECRET` (use: `openssl rand -base64 32`)
- [ ] Review rate limits based on expected traffic
- [ ] Ensure `NODE_ENV=production` is set
- [ ] If behind multiple proxies/load balancers, adjust trust proxy setting

## Database Configuration

InternTrackr supports **dual database engines** via a repository pattern:

- **MongoDB** (default) - NoSQL document database
- **PostgreSQL** - SQL relational database via Prisma

### Switching Databases

Set the `DB_ENGINE` variable in `apps/api/.env`:

```bash
# Use MongoDB (default)
DB_ENGINE=mongo
MONGO_URI=mongodb://localhost:27017/interntrackr

# OR use PostgreSQL
DB_ENGINE=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/interntrackr
```

### PostgreSQL Setup (First Time)

If using PostgreSQL, run migrations after starting the database:

```bash
# Start PostgreSQL
docker compose up -d postgres

# Generate Prisma client and run migrations
cd apps/api
npx prisma generate
npx prisma migrate dev --name init

# Optional: Open Prisma Studio to view data
npx prisma studio
```

### Docker Services

```bash
# Start all services
docker compose up -d

# View running services
docker compose ps

# Services available:
# - MongoDB: localhost:27017
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - Spring Boot (reco-service): localhost:8080
```

## Environment Variables

Key variables in `apps/api/.env`:

| Variable            | Description                            | Default                                                      |
| ------------------- | -------------------------------------- | ------------------------------------------------------------ |
| `DB_ENGINE`         | Database engine: `mongo` or `postgres` | `mongo`                                                      |
| `MONGO_URI`         | MongoDB connection string              | `mongodb://localhost:27017/interntrackr`                     |
| `DATABASE_URL`      | PostgreSQL connection string (Prisma)  | `postgresql://postgres:postgres@localhost:5432/interntrackr` |
| `REDIS_URL`         | Redis connection string                | `redis://localhost:6379`                                     |
| `JWT_SECRET`        | Secret for JWT tokens                  | `replace-me`                                                 |
| `SCORE_SERVICE_URL` | Spring Boot service URL                | `http://localhost:8080`                                      |

## Architecture

### Repository Pattern

The API uses a repository pattern for database abstraction:

- **Interfaces** (`repositories/interfaces.ts`) - Common data contracts
- **MongoDB repos** (`repositories/mongo/`) - Mongoose implementations
- **Prisma repos** (`repositories/prisma/`) - PostgreSQL implementations
- **Factory** (`repositories/factory.ts`) - Returns correct repo based on `DB_ENGINE`

Services use repositories without knowing the underlying database:

```typescript
// Service code works with both databases
const repo = repositoryFactory.getApplicationRepository();
const apps = await repo.find(userId, filters);
```

## Testing

```bash
# Run API tests
npm run test:api

# Run with coverage
npm run test:api -- --coverage
```

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Databases**: MongoDB (Mongoose) + PostgreSQL (Prisma)
- **Cache**: Redis
- **Microservice**: Java 17 + Spring Boot
- **Frontend**: React + TypeScript + Vite
- **Infrastructure**: Docker Compose

## Troubleshooting

### Port Conflicts

If ports are already in use:

```bash
# Check what's using a port (Windows)
netstat -ano | findstr :5432

# Or modify ports in docker-compose.yml
```

### Database Connection Issues

```bash
# Check Docker containers are running
docker compose ps

# View logs
docker compose logs mongo
docker compose logs postgres

# Restart services
docker compose restart mongo postgres
```

### Prisma Issues

```bash
# Regenerate Prisma client
cd apps/api
npx prisma generate

# Reset database and migrations
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name
```

## Quick Commands

```bash
# Start everything
docker compose up -d && npm run dev:api

# Stop everything
docker compose down

# Clean restart
docker compose down -v && docker compose up -d

# Switch to PostgreSQL
echo "DB_ENGINE=postgres" > apps/api/.env
npm run dev:api

# Switch to MongoDB
echo "DB_ENGINE=mongo" > apps/api/.env
npm run dev:api
```
