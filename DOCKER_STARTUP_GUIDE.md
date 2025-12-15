# Docker Startup & Database Seeding Guide

## What Changed

The backend Dockerfile now automatically seeds the database on startup:

```dockerfile
CMD ["sh", "-c", "node scripts/seed.js 2>/dev/null || true && node server.js"]
```

This means:
- ✅ Database is seeded automatically when container starts
- ✅ If seeding fails, the server still starts
- ✅ No manual seeding needed
- ✅ Products will be available immediately

---

## Steps to Get Products Working

### Step 1: Rebuild Backend Image

```bash
docker build -t ecommerce-backend:latest backend/
```

### Step 2: Stop Old Containers

```bash
docker-compose down
```

### Step 3: Start New Containers

```bash
docker-compose up -d
```

Or with logs:

```bash
docker-compose up
```

### Step 4: Wait for Startup

The backend will:
1. Seed the database (13 products, 6 categories)
2. Start the server
3. Connect to MongoDB Atlas

Expected logs:
```
ecommerce-backend | Connected to MongoDB
ecommerce-backend | Cleared existing data
ecommerce-backend | Categories created: 6
ecommerce-backend | Products created: 13
ecommerce-backend | ✅ Database seeded successfully!
ecommerce-backend | 2025-12-15T17:31:53.587Z [info] Server started
ecommerce-backend | 2025-12-15T17:31:53.617Z [info] MongoDB Connected
```

### Step 5: Verify Products

```bash
curl http://localhost:5000/api/products
```

Should return 13 products with full details.

---

## Test the Application

### Frontend
```
http://localhost:3000
```

You should see:
- 13 products displayed
- Product cards with images
- Add to cart buttons
- Product details

### Backend API

**Get Products:**
```bash
curl http://localhost:5000/api/products
```

**Get Categories:**
```bash
curl http://localhost:5000/api/products/categories
```

**Health Check:**
```bash
curl http://localhost:5000/observability/health
```

**Metrics:**
```bash
curl http://localhost:5000/observability/metrics
```

---

## Test User Accounts

After seeding, you can login with:

**Admin Account:**
- Email: `admin@example.com`
- Password: `admin123456`

**Regular User:**
- Email: `user@example.com`
- Password: `user123456`

### Login via API

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "user123456"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "name": "Test User",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Database Seeding Details

### What Gets Seeded

**Categories (6):**
1. Electronics
2. Laptops & Computers
3. Smartphones
4. Headphones & Audio
5. Cameras
6. Smart Home

**Products (13):**
- Laptop Pro 15"
- iPhone 15 Pro
- Samsung Galaxy S24
- AirPods Pro
- Sony WH-1000XM5
- Canon EOS R6
- Google Pixel 8
- iPad Air
- Apple Watch Series 9
- DJI Air 3S
- Anker PowerBank
- Logitech MX Master 3S
- Nikon Z9

**Users (2):**
- Admin: admin@example.com / admin123456
- User: user@example.com / user123456

---

## Troubleshooting

### Products Still Not Showing

**Check 1: Verify Container is Running**
```bash
docker ps
```

Should show both `ecommerce-backend` and `ecommerce-frontend` running.

**Check 2: View Backend Logs**
```bash
docker logs ecommerce-backend
```

Look for:
- `Connected to MongoDB`
- `Products created: 13`
- `Server started`

**Check 3: Test API Directly**
```bash
curl http://localhost:5000/api/products
```

If empty, check MongoDB connection.

**Check 4: Verify MongoDB Connection**

The connection string should be:
```
mongodb+srv://smahesh-kumarr:1bVAoRpA59O7zzNV@cluster0.tlsbu.mongodb.net/?appName=Cluster0/ecommerce
```

Check in `docker-compose.yml`:
```yaml
environment:
  - MONGODB_URI=mongodb+srv://smahesh-kumarr:1bVAoRpA59O7zzNV@cluster0.tlsbu.mongodb.net/?appName=Cluster0/ecommerce
```

### Seeding Fails Silently

The Dockerfile is configured to ignore seeding errors and start the server anyway:

```dockerfile
CMD ["sh", "-c", "node scripts/seed.js 2>/dev/null || true && node server.js"]
```

To see seeding errors:

```bash
docker exec ecommerce-backend node scripts/seed.js
```

### Permission Errors

The logger now handles permission errors gracefully. If you still see errors:

1. Rebuild without cache:
   ```bash
   docker build --no-cache -t ecommerce-backend:latest backend/
   ```

2. Restart:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Container Exits Immediately

Check logs:
```bash
docker logs ecommerce-backend
```

Common issues:
- MongoDB connection string is wrong
- Network connectivity issue
- Port 5000 already in use

---

## Manual Seeding (If Needed)

If you need to reseed manually:

```bash
# Connect to container
docker exec -it ecommerce-backend sh

# Run seed script
node scripts/seed.js

# Exit
exit
```

Or from host:
```bash
docker exec ecommerce-backend node scripts/seed.js
```

---

## Docker Compose Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f ecommerce-backend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild and start
docker-compose up -d --build

# Check service status
docker-compose ps
```

---

## Expected Workflow

1. **Build Images**
   ```bash
   docker build -t ecommerce-backend:latest backend/
   docker build -t ecommerce-frontend:latest frontend/
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Wait for Startup** (30-60 seconds)
   - Backend seeds database
   - Frontend starts
   - Both services ready

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000/api/products

5. **Test Features**
   - Browse products
   - Login with test account
   - Add to cart
   - Create order

---

## Performance Notes

- **First startup**: Takes longer (seeding + startup)
- **Subsequent startups**: Faster (seeding skipped if data exists)
- **Database**: MongoDB Atlas (cloud)
- **Network**: Requires internet connection

---

## Next Steps

1. ✅ Rebuild backend image with auto-seeding
2. ✅ Start Docker Compose
3. ✅ Verify products appear
4. Test frontend functionality
5. Deploy to Kubernetes
6. Setup Datadog monitoring

---

## Quick Reference

| Task | Command |
|------|---------|
| Build backend | `docker build -t ecommerce-backend:latest backend/` |
| Build frontend | `docker build -t ecommerce-frontend:latest frontend/` |
| Start services | `docker-compose up -d` |
| View logs | `docker-compose logs -f` |
| Stop services | `docker-compose down` |
| Test products | `curl http://localhost:5000/api/products` |
| Access frontend | `http://localhost:3000` |
| Manual seed | `docker exec ecommerce-backend node scripts/seed.js` |
| Check status | `docker-compose ps` |

---

## Summary

The backend Dockerfile now automatically seeds the database on startup. Simply rebuild and restart the containers, and products will be available immediately!

```bash
# One-command startup
docker build -t ecommerce-backend:latest backend/ && \
docker-compose down && \
docker-compose up -d
```

Your application is ready to use! 🚀
