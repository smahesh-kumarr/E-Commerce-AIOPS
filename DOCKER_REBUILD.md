# Docker Rebuild Instructions

## Issue
The Docker container is using the old logger code that tries to create a `logs` directory without checking permissions first.

## Solution
Rebuild the Docker images with the fixed logger code.

---

## Step 1: Stop Running Containers

```bash
docker-compose down
```

Or if containers are stuck:

```bash
docker-compose down -v
docker ps -a
docker rm -f ecommerce-backend ecommerce-frontend
```

---

## Step 2: Rebuild Backend Image

```bash
docker build -t ecommerce-backend:latest backend/
```

Expected output:
```
[+] Building 45.2s (16/16) FINISHED
 => [internal] load build context
 => [stage-1 1/8] FROM node:18-alpine
 => ...
 => => naming to docker.io/library/ecommerce-backend:latest
```

---

## Step 3: Rebuild Frontend Image

```bash
docker build -t ecommerce-frontend:latest frontend/
```

---

## Step 4: Start with Docker Compose

```bash
docker-compose up -d
```

Or with logs:

```bash
docker-compose up
```

---

## Step 5: Verify

Check if backend is running:

```bash
docker logs ecommerce-backend
```

Should see:
```
2025-12-15T17:31:53.587Z [info] Server started
2025-12-15T17:31:53.617Z [info] MongoDB Connected
```

---

## What Was Fixed in Logger

The updated logger (`backend/src/observability/logger.js`) now:

1. **Checks permissions** before creating logs directory
2. **Gracefully handles errors** - doesn't crash if it can't create directory
3. **Always logs to console** - works in Docker with non-root user
4. **Optionally logs to files** - only if permissions allow

---

## Quick Commands

```bash
# Stop all containers
docker-compose down

# Rebuild both images
docker build -t ecommerce-backend:latest backend/
docker build -t ecommerce-frontend:latest frontend/

# Start again
docker-compose up -d

# Check logs
docker logs ecommerce-backend
docker logs ecommerce-frontend

# Test endpoints
curl http://localhost:5000/api/products
curl http://localhost:3000
```

---

## Alternative: Use Docker Buildkit (Faster)

```bash
DOCKER_BUILDKIT=1 docker build -t ecommerce-backend:latest backend/
DOCKER_BUILDKIT=1 docker build -t ecommerce-frontend:latest frontend/
```

---

## If Still Having Issues

1. **Remove all containers and images:**
   ```bash
   docker-compose down -v
   docker system prune -a
   ```

2. **Rebuild from scratch:**
   ```bash
   docker build --no-cache -t ecommerce-backend:latest backend/
   docker build --no-cache -t ecommerce-frontend:latest frontend/
   docker-compose up
   ```

3. **Check Docker daemon:**
   ```bash
   docker ps
   docker images
   ```

---

## Verify Fixed Logger

The logger now handles Docker permission issues:

```javascript
// Create logs directory if it doesn't exist and we have permissions
const logsDir = path.join(process.cwd(), 'logs');
const canCreateLogs = (() => {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    return true;
  } catch (err) {
    console.warn('Warning: Cannot create logs directory, file logging disabled:', err.message);
    return false;
  }
})();

// Only add file transports if we can create the logs directory
if (canCreateLogs) {
  transports.push(
    new winston.transports.File({...}),
    new winston.transports.File({...})
  );
}
```

This ensures:
- ✅ No crashes on permission errors
- ✅ Console logging always works
- ✅ File logging is optional
- ✅ Works with non-root Docker user

---

## Expected Result

After rebuild:

```
ecommerce-backend | 2025-12-15T17:31:53.587Z [info] Server started
ecommerce-backend | 2025-12-15T17:31:53.617Z [info] MongoDB Connected
ecommerce-frontend | INFO  Accepting connections at http://localhost:3000
```

Both services running without errors! ✅
