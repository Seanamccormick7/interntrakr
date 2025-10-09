# InternTrackr – Dev Quickstart

## Prerequisites

- **Node.js 20.19.0** (LTS)
  - If you use nvm: `nvm install 20.19.0 && nvm use 20.19.0`
- **npm 10+**
- **Docker Desktop** (for MongoDB + Redis)

## Setup

```bash
git clone <repo>
cd interntrackr

# Node version ( recommended )
# with nvm: nvm use 20.19.0

# Install deps for all workspaces (api + web)
npm install

# Environment variables for API
cp apps/api/.env.example apps/api/.env

# Start infra (MongoDB + Redis)
docker compose up -d   # Mongo @ 27017, Redis @ 6379

# Run the API and Web in separate terminals
npm run dev:api        # http://localhost:4000/ping  -> {"message":"pong"}
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
