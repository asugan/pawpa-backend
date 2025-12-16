# Docker Deployment Roadmap for PawPa Backend

## Overview

This document outlines the comprehensive plan for creating Docker deployment configurations
optimized for Coolify deployment of the PawPa Backend application.

## Project Analysis

- **Application Type**: Node.js/Express TypeScript backend
- **Database**: SQLite with better-sqlite3 (native module)
- **Authentication**: Better-Auth library
- **ORM**: Drizzle ORM with migrations
- **Build Tool**: tsup for ES module compilation

## Coolify Research Results (Context7 MCP - 2024/2025)

### Latest Coolify Documentation Findings

Based on research from Coolify's official documentation and examples:

**Environment Variables in Coolify:**

- Coolify supports standard Docker Compose environment variable syntax
- Environment variables are configured through the Coolify UI
- No special `${VAR:?}` syntax required in docker-compose.yml (this was outdated)
- Coolify handles environment variable injection automatically

**Docker Compose Usage:**

- Coolify uses `docker compose` with multiple files: `docker-compose.yml` and
  `docker-compose.prod.yml`
- Environment files specified with `--env-file` parameter
- Standard Docker Compose syntax is fully supported

**Application Deployment Examples:**

- Environment variables set directly in Dockerfile: `ENV VAR_NAME=${SUBDOMAIN}.${DOMAIN_NAME}`
- Coolify automatically injects variables like `${SUBDOMAIN}`, `${DOMAIN_NAME}`
- Standard port exposure and health check configurations

## Deployment Requirements

### Coolify Compatibility (Updated 2024/2025)

- ✅ Standard Docker Compose environment variable syntax
- ✅ Environment variables configured via Coolify UI
- ✅ Health check endpoint configured (`/health`)
- ✅ Port 3000 exposure
- ✅ Database persistence via volume mounting
- ✅ Multi-stage Docker build for optimization
- ✅ Non-root user execution for security
- ✅ Standard Docker Compose file structure

### Key Specifications Found

- Health check: 30s interval, 10s timeout, 3 retries
- Final image size should not exceed 400MB
- Database directory: `/app/data` with persistent volume
- Required environment variable: `AUTH_SECRET`
- Default `NODE_ENV`: production
- Coolify automatically handles environment variable injection

## Implementation Plan

### Phase 1: Core Docker Configuration

1. **Create optimized Dockerfile**
   - Multi-stage build process
   - Node.js Alpine Linux base
   - Separate build and runtime stages
   - Non-root user configuration
   - Native module compilation support (better-sqlite3)

2. **Create docker-compose.yml**
   - Standard Docker Compose configuration for Coolify
   - Environment variable definitions with standard syntax
   - Volume mounting for database persistence
   - Health check configuration
   - Port mapping (3000:3000)

### Phase 2: Environment Configuration

3. **Environment Variables Setup**
   - Required: `AUTH_SECRET` (configured in Coolify UI)
   - Optional with defaults: `NODE_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGIN`
   - Rate limiting: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`
   - Coolify will inject environment variables automatically

4. **Create .env.docker.example**
   - Template for Coolify environment variables
   - Documentation for each variable
   - Security considerations for sensitive values

### Phase 3: Database & Persistence

5. **Database Configuration**
   - SQLite database path: `/app/data/pawpa.db`
   - Automatic migration on startup
   - Volume persistence across container restarts
   - Data directory creation and permissions

### Phase 4: Validation & Documentation

6. **Configuration Validation**
   - Docker build process testing
   - Environment variable validation
   - Health check endpoint verification
   - Database persistence testing

7. **Deployment Documentation**
   - Step-by-step Coolify deployment guide
   - Environment variable configuration instructions
   - Troubleshooting common issues
   - Production deployment best practices

## Technical Specifications

### Dockerfile Structure

```dockerfile
# Multi-stage build
# Stage 1: Build
FROM node:20-alpine AS builder
# Dependencies and compilation

# Stage 2: Runtime
FROM node:20-alpine AS runtime
# Production dependencies and application
```

### Docker Compose Configuration

```yaml
services:
  pawpa-backend:
    build: .
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      AUTH_SECRET: ${AUTH_SECRET}
      DATABASE_URL: ${DATABASE_URL:-/app/data/pawpa.db}
      CORS_ORIGIN: ${CORS_ORIGIN:-*}
      RATE_LIMIT_WINDOW_MS: ${RATE_LIMIT_WINDOW_MS:-900000}
      RATE_LIMIT_MAX_REQUESTS: ${RATE_LIMIT_MAX_REQUESTS:-100}
    volumes:
      - app_data:/app/data
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3
```

### Environment Variables Matrix

| Variable                  | Required | Coolify Configuration             | Default            | Description             |
| ------------------------- | -------- | --------------------------------- | ------------------ | ----------------------- |
| `NODE_ENV`                | No       | Configured in Coolify UI          | production         | Environment mode        |
| `PORT`                    | No       | Configured in Coolify UI          | 3000               | Server port             |
| `DATABASE_URL`            | No       | Configured in Coolify UI          | /app/data/pawpa.db | SQLite database path    |
| `AUTH_SECRET`             | Yes      | Required in Coolify UI            | -                  | Better-Auth secret key  |
| `CORS_ORIGIN`             | No       | Configured in Coolify UI          | \*                 | CORS allowed origin     |
| `RATE_LIMIT_WINDOW_MS`    | No       | Configured in Coolify UI          | 900000             | Rate limit window       |
| `RATE_LIMIT_MAX_REQUESTS` | No       | Configured in Coolify UI          | 100                | Max requests per window |
| `RATE_LIMIT_MAX_REQUESTS` | No       | `${RATE_LIMIT_MAX_REQUESTS:-100}` | 100                | Max requests per window |

## Security Considerations

- Non-root user execution
- Minimal Alpine Linux base image
- Environment variable validation
- Health check for container monitoring
- Volume permissions for database access

## Performance Optimizations

- Multi-stage build to reduce image size
- Production dependencies only in runtime stage
- Efficient layer caching
- Native module compilation optimization

## Next Steps

1. Implement Dockerfile with multi-stage build
2. Create docker-compose.yml with Coolify syntax
3. Set up environment variable templates
4. Configure database persistence
5. Validate and test deployment
6. Create comprehensive documentation

## Success Criteria

- ✅ Docker image builds successfully under 400MB
- ✅ Application starts with proper environment variables
- ✅ Health check endpoint responds correctly
- ✅ Database persists across container restarts
- ✅ Coolify deployment works seamlessly
- ✅ All required environment variables are validated
- ✅ Documentation covers all deployment scenarios
