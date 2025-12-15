# Docker Build Guide - Frontend & Backend

## Overview

This guide explains how to build and run Docker images for both the frontend and backend applications separately.

---

## Frontend Dockerfile

### Location
```
frontend/Dockerfile
```

### Dockerfile Content

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build React app
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built app from builder stage
COPY --from=builder /app/build ./build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["serve", "-s", "build", "-l", "3000"]
```

### Features
- **Multi-stage build**: Reduces final image size (build dependencies not included)
- **Alpine Linux**: Lightweight base image (~40MB)
- **Non-root user**: Security best practice
- **Health check**: Kubernetes liveness probe
- **Serve**: Production-ready static file server

### Build Frontend Image

```bash
cd frontend

# Build image
docker build -t ecommerce-frontend:latest .

# Or with registry
docker build -t your-registry/ecommerce-frontend:latest .
```

### Run Frontend Container

```bash
# Run locally
docker run -d \
  --name ecommerce-frontend \
  -p 3000:3000 \
  ecommerce-frontend:latest

# Access at http://localhost:3000
```

### Push to Registry

```bash
# Login to Docker Hub
docker login

# Tag image
docker tag ecommerce-frontend:latest your-username/ecommerce-frontend:latest

# Push
docker push your-username/ecommerce-frontend:latest
```

---

## Backend Dockerfile

### Location
```
backend/Dockerfile
```

### Dockerfile Content

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Copy production dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/observability/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]
```

### Features
- **Multi-stage build**: Optimized for production
- **Alpine Linux**: Lightweight base image (~40MB)
- **dumb-init**: Proper signal handling (SIGTERM)
- **Non-root user**: Security best practice
- **Production dependencies only**: Smaller image size
- **Health check**: Kubernetes liveness probe

### Build Backend Image

```bash
cd backend

# Build image
docker build -t ecommerce-backend:latest .

# Or with registry
docker build -t your-registry/ecommerce-backend:latest .
```

### Run Backend Container

```bash
# Create .env file first
cp .env.example .env

# Run locally
docker run -d \
  --name ecommerce-backend \
  -p 5000:5000 \
  --env-file .env \
  ecommerce-backend:latest

# Access at http://localhost:5000
```

### Push to Registry

```bash
# Login to Docker Hub
docker login

# Tag image
docker tag ecommerce-backend:latest your-username/ecommerce-backend:latest

# Push
docker push your-username/ecommerce-backend:latest
```

---

## Build Both Images

### Script: build-images.sh

Create `build-images.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REGISTRY=${1:-"your-username"}
VERSION=${2:-"latest"}

echo -e "${BLUE}Building Docker images...${NC}"

# Build frontend
echo -e "${BLUE}Building frontend image...${NC}"
cd frontend
docker build -t ${REGISTRY}/ecommerce-frontend:${VERSION} .
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Frontend image built successfully${NC}"
else
  echo "✗ Failed to build frontend image"
  exit 1
fi
cd ..

# Build backend
echo -e "${BLUE}Building backend image...${NC}"
cd backend
docker build -t ${REGISTRY}/ecommerce-backend:${VERSION} .
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Backend image built successfully${NC}"
else
  echo "✗ Failed to build backend image"
  exit 1
fi
cd ..

echo -e "${GREEN}All images built successfully!${NC}"
echo ""
echo "Images created:"
echo "  - ${REGISTRY}/ecommerce-frontend:${VERSION}"
echo "  - ${REGISTRY}/ecommerce-backend:${VERSION}"
echo ""
echo "To push to registry:"
echo "  docker push ${REGISTRY}/ecommerce-frontend:${VERSION}"
echo "  docker push ${REGISTRY}/ecommerce-backend:${VERSION}"
```

Run:
```bash
chmod +x build-images.sh
./build-images.sh your-username latest
```

---

## Push Both Images

### Script: push-images.sh

Create `push-images.sh`:

```bash
#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

REGISTRY=${1:-"your-username"}
VERSION=${2:-"latest"}

echo -e "${BLUE}Pushing Docker images to registry...${NC}"

# Push frontend
echo -e "${BLUE}Pushing frontend image...${NC}"
docker push ${REGISTRY}/ecommerce-frontend:${VERSION}
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Frontend image pushed successfully${NC}"
else
  echo "✗ Failed to push frontend image"
  exit 1
fi

# Push backend
echo -e "${BLUE}Pushing backend image...${NC}"
docker push ${REGISTRY}/ecommerce-backend:${VERSION}
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Backend image pushed successfully${NC}"
else
  echo "✗ Failed to push backend image"
  exit 1
fi

echo -e "${GREEN}All images pushed successfully!${NC}"
```

Run:
```bash
chmod +x push-images.sh
./push-images.sh your-username latest
```

---

## Docker Compose (Local Development)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: ecommerce-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
    depends_on:
      - backend
    networks:
      - ecommerce

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ecommerce-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce
      - JWT_SECRET=your_jwt_secret
      - LOG_LEVEL=info
    depends_on:
      - mongodb
    networks:
      - ecommerce
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/observability/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # MongoDB (optional - use MongoDB Atlas instead)
  mongodb:
    image: mongo:latest
    container_name: ecommerce-mongodb
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongodb_data:/data/db
    networks:
      - ecommerce

networks:
  ecommerce:
    driver: bridge

volumes:
  mongodb_data:
```

Run:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Image Size Comparison

### Frontend Image
```
Stage 1 (Builder):
  - node:18-alpine: ~150MB
  - Dependencies: ~200MB
  - Source code: ~50MB
  - Build output: ~100MB
  Total: ~500MB (discarded)

Stage 2 (Production):
  - node:18-alpine: ~150MB
  - serve: ~5MB
  - Built app: ~100MB
  Total: ~255MB
```

### Backend Image
```
Stage 1 (Dependencies):
  - node:18-alpine: ~150MB
  - node_modules: ~300MB
  Total: ~450MB (discarded)

Stage 2 (Production):
  - node:18-alpine: ~150MB
  - node_modules: ~300MB
  - Source code: ~50MB
  - dumb-init: ~1MB
  Total: ~501MB
```

---

## Optimization Tips

### Reduce Image Size

1. **Use .dockerignore**

Create `.dockerignore` in both frontend and backend:

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.DS_Store
dist
build
logs
*.log
```

2. **Use Alpine Linux**
   - Reduces base image from ~900MB to ~150MB

3. **Multi-stage builds**
   - Removes build dependencies from final image

4. **Production dependencies only**
   - Use `npm ci --only=production`

### Speed Up Builds

1. **Cache layers**
   ```dockerfile
   # Copy package files first (cached)
   COPY package*.json ./
   RUN npm ci
   
   # Copy source code (invalidates cache if changed)
   COPY . .
   ```

2. **Use BuildKit**
   ```bash
   DOCKER_BUILDKIT=1 docker build -t image:tag .
   ```

3. **Parallel builds**
   ```bash
   docker build -t frontend:latest frontend/ &
   docker build -t backend:latest backend/ &
   wait
   ```

---

## Security Best Practices

### Implemented

✅ **Non-root user**: Runs as `nodejs` instead of `root`
✅ **Health checks**: Kubernetes can detect unhealthy containers
✅ **Signal handling**: `dumb-init` properly handles SIGTERM
✅ **Production dependencies**: No dev dependencies in image
✅ **Alpine Linux**: Smaller attack surface

### Additional Recommendations

1. **Scan for vulnerabilities**
   ```bash
   docker scan ecommerce-frontend:latest
   docker scan ecommerce-backend:latest
   ```

2. **Use specific versions**
   ```dockerfile
   FROM node:18.17.1-alpine
   ```

3. **Regular updates**
   ```bash
   docker pull node:18-alpine
   docker build --no-cache -t image:tag .
   ```

---

## Kubernetes Deployment

### Update Deployments with Image Names

Update `backend-deployment.yaml`:

```yaml
spec:
  template:
    spec:
      containers:
      - name: backend
        image: your-registry/ecommerce-backend:latest
        imagePullPolicy: Always
```

Update `frontend-deployment.yaml`:

```yaml
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: your-registry/ecommerce-frontend:latest
        imagePullPolicy: Always
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace mern

# Create secret for registry (if private)
kubectl create secret docker-registry regcred \
  --docker-server=your-registry \
  --docker-username=your-username \
  --docker-password=your-password \
  -n mern

# Deploy
kubectl apply -f backend-deployment.yaml -n mern
kubectl apply -f backend-service.yaml -n mern
kubectl apply -f frontend-deployment.yaml -n mern
kubectl apply -f frontend-service.yaml -n mern

# Verify
kubectl get pods -n mern
kubectl logs -f deployment/backend -n mern
```

---

## Quick Reference

### Build Commands

```bash
# Build frontend
docker build -t ecommerce-frontend:latest frontend/

# Build backend
docker build -t ecommerce-backend:latest backend/

# Build both
docker build -t ecommerce-frontend:latest frontend/ && \
docker build -t ecommerce-backend:latest backend/
```

### Run Commands

```bash
# Run frontend
docker run -p 3000:3000 ecommerce-frontend:latest

# Run backend
docker run -p 5000:5000 --env-file backend/.env ecommerce-backend:latest

# Run with Docker Compose
docker-compose up -d
```

### Push Commands

```bash
# Tag images
docker tag ecommerce-frontend:latest your-username/ecommerce-frontend:latest
docker tag ecommerce-backend:latest your-username/ecommerce-backend:latest

# Push to registry
docker push your-username/ecommerce-frontend:latest
docker push your-username/ecommerce-backend:latest
```

### Inspect Commands

```bash
# View image details
docker inspect ecommerce-frontend:latest

# View image layers
docker history ecommerce-frontend:latest

# View image size
docker images ecommerce-frontend:latest

# Scan for vulnerabilities
docker scan ecommerce-frontend:latest
```

---

## Troubleshooting

### Build Fails

```bash
# Check Docker daemon
docker ps

# Rebuild without cache
docker build --no-cache -t image:tag .

# Check logs
docker logs container-name
```

### Container Won't Start

```bash
# Check container logs
docker logs container-name

# Inspect container
docker inspect container-name

# Run interactively
docker run -it image:tag /bin/sh
```

### Health Check Failing

```bash
# Test health endpoint manually
docker exec container-name \
  node -e "require('http').get('http://localhost:5000/observability/health', (r) => console.log(r.statusCode))"

# Check health status
docker inspect --format='{{json .State.Health}}' container-name
```

---

## Summary

**Frontend Dockerfile:**
- Multi-stage build (builder + production)
- Alpine Linux base
- Serve for static file serving
- Non-root user
- Health check
- ~255MB final size

**Backend Dockerfile:**
- Multi-stage build (dependencies + production)
- Alpine Linux base
- dumb-init for signal handling
- Non-root user
- Health check
- ~501MB final size

**Build & Deploy:**
1. Build images: `docker build -t image:tag .`
2. Push to registry: `docker push registry/image:tag`
3. Deploy to Kubernetes: `kubectl apply -f deployment.yaml`
4. Verify: `kubectl get pods` and `kubectl logs`

Both Dockerfiles are production-ready and follow security best practices.
