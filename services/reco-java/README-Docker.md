# Docker Setup for Spring Boot Recommendation Service

This document provides instructions for running the Spring Boot recommendation service using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Java 17+ (for local development)

## Quick Start

### 1. Build and Run with Docker Compose

From the project root directory:

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build
```

### 2. Access the Service

- **Spring Boot Service**: http://localhost:8080
- **Health Check**: http://localhost:8080/actuator/health
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### 3. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Development

### Local Development

For local development without Docker:

```bash
cd services/reco-java
./gradlew bootRun
```

### Environment Variables

The service supports the following environment variables:

- `SERVER_PORT`: Port for the Spring Boot service (default: 8080)
- `SPRING_PROFILES_ACTIVE`: Spring profile (default: default, docker for containerized)

### Docker Build

To build the Docker image manually:

```bash
cd services/reco-java
docker build -t reco-service .
docker run -p 8080:8080 reco-service
```

## Production Considerations

### Multi-stage Build

The Dockerfile uses a multi-stage build to:

- Reduce final image size
- Include only runtime dependencies
- Run as non-root user for security

### Health Checks

The service includes health checks that:

- Check application health every 30 seconds
- Use Spring Boot Actuator endpoints
- Support container orchestration

### Security

- Runs as non-root user (`spring:spring`)
- Uses Alpine Linux for minimal attack surface
- Includes proper health checks

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 8080, 27017, 6379 are available
2. **Build failures**: Check Docker daemon is running
3. **Health check failures**: Wait for application startup (40s start period)

### Logs

View service logs:

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs reco-service

# Follow logs
docker-compose logs -f reco-service
```

### Debugging

Access running container:

```bash
docker-compose exec reco-service sh
```
