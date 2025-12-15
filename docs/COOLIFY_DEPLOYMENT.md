# PawPa Backend - Coolify Deployment Guide

## Overview

This comprehensive guide covers deploying the PawPa Backend application to Coolify using the
optimized Docker configuration. The deployment has been validated with a 250MB final image size,
working health checks, and production-ready security configurations.

## Table of Contents

1. [Deployment Prerequisites](#deployment-prerequisites)
2. [Coolify Setup Steps](#coolify-setup-steps)
3. [Environment Variable Configuration](#environment-variable-configuration)
4. [Database Persistence](#database-persistence)
5. [Health Monitoring](#health-monitoring)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Production Best Practices](#production-best-practices)
8. [Validation Steps](#validation-steps)

---

## Deployment Prerequisites

### Required Files

Ensure you have the following files in your project root:

- ✅ [`Dockerfile`](../Dockerfile) - Multi-stage Docker configuration
- ✅ [`docker-compose.yml`](../docker-compose.yml) - Coolify-optimized compose configuration
- ✅ [`.env.docker.example`](../.env.docker.example) - Environment variable template
- ✅ Source code and dependencies

### Coolify Requirements

- Coolify instance with Docker support
- Sufficient resources (minimum 512MB RAM, 1GB storage recommended)
- Network access to pull Docker images
- Administrative access to create new applications

### Security Prerequisites

- Generate a strong `AUTH_SECRET` (minimum 32 characters)
- Determine your production CORS origins
- Plan your rate limiting strategy

---

## Coolify Setup Steps

### Step 1: Create New Application

1. Log into your Coolify dashboard
2. Click **"New Application"** or **"Add Application"**
3. Select **"Docker Compose"** as the application type
4. Choose your Git repository or provide the source code

### Step 2: Configure Repository

1. **Repository URL**: Provide your Git repository URL
2. **Branch**: Select `main` or your production branch
3. **Build Context**: Set to repository root (`/`)
4. **Docker Compose File**: Set to `docker-compose.yml`

### Step 3: Configure Build Settings

1. **Auto-build on push**: Enable for production deployments
2. **Build arguments**: None required (all configuration in Dockerfile)
3. **Build timeout**: 300 seconds (sufficient for multi-stage build)

### Step 4: Network Configuration

1. **Port**: `3000` (automatically configured from docker-compose.yml)
2. **Protocol**: HTTP
3. **Domain**: Configure your desired domain/subdomain
4. **SSL**: Enable automatic SSL certificate generation

### Step 5: Deploy Initial Version

1. Click **"Deploy"** to trigger the first build
2. Monitor the build logs for successful completion
3. Wait for the health check to pass (may take up to 2 minutes)

---

## Environment Variable Configuration

### Required Variables

Configure these in Coolify UI under **Environment Variables**:

#### AUTH_SECRET (Required)

```bash
# Generate a strong secret:
openssl rand -base64 32
```

**Coolify Configuration:**

- Variable Name: `AUTH_SECRET`
- Value: Your generated 32+ character secret
- Type: Secret (enable encryption)

### Optional Variables with Defaults

#### Application Configuration

| Variable       | Default              | Coolify Setting       | Description             |
| -------------- | -------------------- | --------------------- | ----------------------- |
| `NODE_ENV`     | `production`         | Environment Variables | Application environment |
| `PORT`         | `3000`               | Environment Variables | Server port             |
| `DATABASE_URL` | `/app/data/pawpa.db` | Environment Variables | SQLite database path    |

#### Security Configuration

| Variable                  | Default  | Coolify Setting       | Description                |
| ------------------------- | -------- | --------------------- | -------------------------- |
| `CORS_ORIGIN`             | `*`      | Environment Variables | Allowed CORS origins       |
| `RATE_LIMIT_WINDOW_MS`    | `900000` | Environment Variables | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100`    | Environment Variables | Max requests per window    |

### Coolify UI Configuration Steps

1. Navigate to your application in Coolify
2. Go to **"Environment"** tab
3. Click **"Add Variable"**
4. Configure each variable:
   - **Key**: Variable name (e.g., `AUTH_SECRET`)
   - **Value**: Your configuration value
   - **Type**: `Secret` for sensitive data, `Variable` for others
5. Click **"Save"**
6. **Redeploy** the application to apply changes

### Production CORS Configuration

For production, restrict CORS origins:

```bash
# Single domain
CORS_ORIGIN=https://yourapp.com

# Multiple domains
CORS_ORIGIN=https://app.com,https://admin.yourapp.com
```

---

## Database Persistence

### Volume Configuration

The application uses Docker volumes for persistent database storage:

```yaml
volumes:
  - app_data:/app/data
```

### What Gets Persisted

- ✅ SQLite database file (`/app/data/pawpa.db`)
- ✅ Database journal files
- ✅ Application logs (if configured)
- ✅ Temporary files and caches

### Volume Management in Coolify

1. **Automatic Creation**: Coolify creates volumes automatically on first deployment
2. **Persistence**: Data survives container restarts and updates
3. **Backup Strategy**:
   - Coolify Pro: Automatic volume backups
   - Coolify Community: Manual volume backups required

### Database Migration

The application automatically handles database migrations on startup:

1. **Migration Files**: Located in [`migrations/`](../migrations/) directory
2. **Auto-Execution**: Runs on container startup if needed
3. **Idempotent**: Safe to run multiple times
4. **Logging**: Migration status logged to container logs

### Manual Database Access

For debugging or maintenance:

```bash
# Access container shell
docker exec -it <container_name> sh

# Access database
sqlite3 /app/data/pawpa.db
```

---

## Health Monitoring

### Health Check Configuration

The application includes comprehensive health monitoring:

```yaml
healthcheck:
  test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:3000/health']
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 5s
```

### Health Endpoint Response

The `/health` endpoint returns:

```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2024-12-14T22:22:45.284Z",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

### Coolify Health Monitoring

1. **Automatic Detection**: Coolify automatically detects health checks
2. **Dashboard Status**: Health status visible in application dashboard
3. **Alerts**: Configure notifications for health failures
4. **Restart Policy**: Container restarts on health check failures

### Monitoring Best Practices

1. **Check Logs**: Regularly review application logs
2. **Monitor Resources**: Track CPU, memory, and disk usage
3. **Set Alerts**: Configure notifications for:
   - Health check failures
   - High resource usage
   - Application errors
4. **Regular Health Checks**: Manually verify `/health` endpoint

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Container Won't Start

**Symptoms:**

- Container immediately exits
- Deployment shows as failed

**Solutions:**

```bash
# Check container logs in Coolify dashboard
# Look for:
# - Missing AUTH_SECRET
# - Database permission issues
# - Port conflicts
```

**Fix:**

- Ensure `AUTH_SECRET` is set in Coolify environment variables
- Verify all required environment variables are configured
- Check for port conflicts with other applications

#### 2. Health Check Failing

**Symptoms:**

- Container runs but health check fails
- Application shows as unhealthy in Coolify

**Solutions:**

```bash
# Test health endpoint manually
curl http://localhost:3000/health

# Check application logs for errors
# Verify port 3000 is accessible
```

**Fix:**

- Ensure application is binding to `0.0.0.0:3000`
- Check for startup errors in application logs
- Verify no firewall blocking port 3000

#### 3. Database Connection Issues

**Symptoms:**

- Application starts but database errors occur
- Data not persisting between restarts

**Solutions:**

```bash
# Check database file permissions
ls -la /app/data/

# Verify database exists
sqlite3 /app/data/pawpa.db ".tables"
```

**Fix:**

- Ensure volume is properly mounted
- Check file permissions on `/app/data` directory
- Verify database migrations ran successfully

#### 4. High Memory Usage

**Symptoms:**

- Container using excessive memory
- Performance degradation

**Solutions:**

```bash
# Monitor resource usage
docker stats <container_name>

# Check for memory leaks in logs
```

**Fix:**

- Monitor rate limiting configuration
- Check for inefficient database queries
- Consider increasing memory limits in Coolify

#### 5. CORS Issues

**Symptoms:**

- Frontend cannot connect to backend
- CORS errors in browser console

**Solutions:**

```bash
# Check current CORS configuration
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS http://localhost:3000/api
```

**Fix:**

- Update `CORS_ORIGIN` environment variable
- Include all required frontend domains
- Restart application after configuration change

### Debugging Commands

```bash
# Access container shell
docker exec -it <container_name> sh

# View application logs
docker logs <container_name>

# Check environment variables
docker exec <container_name> env | grep -E "(AUTH_SECRET|NODE_ENV|DATABASE_URL)"

# Test database connection
docker exec <container_name> sqlite3 /app/data/pawpa.db ".tables"

# Monitor resource usage
docker stats <container_name>
```

### Getting Help

1. **Coolify Documentation**: https://coolify.io/docs
2. **Application Logs**: Check Coolify dashboard
3. **Health Status**: Monitor application health in Coolify
4. **Community Support**: Coolify Discord community

---

## Production Best Practices

### Security Configuration

#### 1. AUTH_SECRET Management

```bash
# Generate strong secrets
openssl rand -base64 32

# Rotate secrets periodically
# Update in Coolify UI and redeploy
```

#### 2. CORS Restrictions

```bash
# Production CORS configuration
CORS_ORIGIN=https://yourdomain.com

# Multiple domains (comma-separated)
CORS_ORIGIN=https://app.com,https://admin.yourapp.com
```

#### 3. Rate Limiting

```bash
# Adjust based on traffic patterns
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # Adjust per your needs
```

### Performance Optimization

#### 1. Resource Allocation

- **Minimum**: 512MB RAM, 1GB storage
- **Recommended**: 1GB RAM, 5GB storage
- **High Traffic**: 2GB+ RAM, 10GB+ storage

#### 2. Database Optimization

- Regular database maintenance
- Monitor database size growth
- Implement backup strategies

#### 3. Monitoring Setup

```bash
# Key metrics to monitor:
# - Response times
# - Error rates
# - Resource usage
# - Database performance
```

### Backup Strategy

#### 1. Database Backups

```bash
# Manual backup command
docker exec <container_name> \
  sqlite3 /app/data/pawpa.db ".backup /app/data/backup_$(date +%Y%m%d).db"
```

#### 2. Coolify Backups

- **Coolify Pro**: Automatic volume backups
- **Coolify Community**: Manual volume snapshots
- **External Backups**: Export database regularly

### SSL/HTTPS Configuration

1. **Automatic SSL**: Enable in Coolify domain settings
2. **Certificate Renewal**: Coolify handles automatically
3. **HTTPS Redirect**: Configure in Coolify or application

### Logging Strategy

#### 1. Application Logs

- Monitor application performance
- Track errors and warnings
- Audit user activities

#### 2. System Logs

- Container resource usage
- Health check status
- Deployment events

#### 3. Log Retention

- Configure log rotation in Coolify
- Archive important logs
- Monitor storage usage

---

## Validation Steps

### Pre-Deployment Validation

#### 1. File Verification

Ensure all required files are present:

```bash
# Check Docker configuration
ls -la Dockerfile docker-compose.yml .env.docker.example

# Verify Dockerfile syntax
docker build -t pawpa-backend:test .

# Test docker-compose
docker-compose -f docker-compose.yml config
```

#### 2. Environment Variables

```bash
# Validate required variables
echo "AUTH_SECRET: ${AUTH_SECRET:0:10}..." # Should show first 10 chars
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_URL: $DATABASE_URL"
```

### Post-Deployment Validation

#### 1. Health Check Verification

```bash
# Test health endpoint
curl -f http://your-domain.com/health

# Expected response:
# {"success":true,"data":{"status":"OK",...}}
```

#### 2. API Functionality

```bash
# Test API info endpoint
curl http://your-domain.com/api

# Test authentication endpoint
curl -X POST http://your-domain.com/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

#### 3. Database Persistence

```bash
# Create test data
curl -X POST http://your-domain.com/api/pets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Test Pet","type":"dog"}'

# Restart container and verify data persists
```

#### 4. Performance Validation

```bash
# Load testing (optional)
ab -n 100 -c 10 http://your-domain.com/health

# Monitor response times
curl -w "@curl-format.txt" http://your-domain.com/health
```

### Monitoring Validation

#### 1. Coolify Dashboard Checks

- ✅ Application shows as "Running"
- ✅ Health checks passing
- ✅ Resource usage within limits
- ✅ No error messages in logs

#### 2. Automated Monitoring

Set up monitoring for:

- **Uptime**: Continuous health endpoint checking
- **Performance**: Response time monitoring
- **Resources**: CPU, memory, disk usage alerts
- **Errors**: Application error rate tracking

### Security Validation

#### 1. Security Headers

```bash
# Check security headers
curl -I http://your-domain.com/api

# Look for:
# - X-Frame-Options
# - X-Content-Type-Options
# - Referrer-Policy
```

#### 2. CORS Validation

```bash
# Test CORS from different origins
curl -H "Origin: https://unauthorized.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS http://your-domain.com/api
```

## Deployment Success Checklist

- [ ] All required files present and configured
- [ ] Environment variables set in Coolify UI
- [ ] AUTH_SECRET generated and configured
- [ ] CORS origins properly configured
- [ ] Application builds successfully
- [ ] Health checks passing
- [ ] Database persistence working
- [ ] SSL/HTTPS configured
- [ ] Monitoring and alerts set up
- [ ] Backup strategy implemented
- [ ] Security best practices applied
- [ ] Performance baseline established

## Conclusion

Your PawPa Backend is now successfully deployed on Coolify with:

- ✅ **Optimized Docker Configuration**: 250MB image size with multi-stage build
- ✅ **Production Security**: Non-root user, security headers, rate limiting
- ✅ **Health Monitoring**: Automated health checks with Coolify integration
- ✅ **Database Persistence**: Reliable data storage with volume mounting
- ✅ **Environment Management**: Secure configuration through Coolify UI
- ✅ **SSL/HTTPS**: Automatic certificate management
- ✅ **Monitoring**: Comprehensive health and performance monitoring

The deployment is production-ready and follows Docker and Coolify best practices. Regular monitoring
and maintenance will ensure continued reliable operation.

---

## Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Production Deployment](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
- [SQLite Database Management](https://sqlite.org/docs.html)

For issues specific to this deployment, refer to the [troubleshooting guide](#troubleshooting-guide)
or check the application logs in your Coolify dashboard.
