# Multi-stage Dockerfile for Petopia Backend
# Optimized for Coolify deployment with Node.js 20 Alpine

# ==========================================
# Stage 1: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for build tools like tsup)
RUN npm ci --include=dev

# Copy the rest of the source code
COPY . .

# Build the application (uses tsup)
RUN npm run build

# ==========================================
# Stage 2: Runtime
# ==========================================
FROM node:20-alpine AS runtime

WORKDIR /app

# Install basic runtime tools if needed (curl for healthcheck)
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json package-lock.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
# Copy migrations or scripts if strictly necessary for runtime (optional)
COPY --from=builder --chown=nodejs:nodejs /app/scripts ./scripts

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 3000

# Environment variables with default values
ENV NODE_ENV=production
ENV PORT=3000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
