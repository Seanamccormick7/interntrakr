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
