# ============================================================================
# REDHACK AI v2.1 - Production Multi-Stage Dockerfile
# ============================================================================

# Stage 1: Build & Assets Compilation
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Compile frontend (Vite) and backend server bundle (esbuild)
RUN npm run build

# Stage 2: Production Execution Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime utilities for healthcheck
RUN apk add --no-cache curl

# Copy production artifacts
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

# Create non-root user for security
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.ts"]
