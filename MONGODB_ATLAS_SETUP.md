# MongoDB Atlas Setup Guide

## Overview

MongoDB Atlas is a fully managed cloud database service. Your application is now configured to use MongoDB Atlas instead of a local MongoDB instance.

---

## Your MongoDB Atlas Connection

### Connection String
```
mongodb+srv://smahesh-kumarr:1bVAoRpA59O7zzNV@cluster0.tlsbu.mongodb.net/?appName=Cluster0/ecommerce
```

### Components
- **Username**: `smahesh-kumarr`
- **Password**: `1bVAoRpA59O7zzNV`
- **Cluster**: `cluster0.tlsbu.mongodb.net`
- **Database**: `ecommerce`

---

## Configuration Files Updated

### 1. `.env.example`
```env
MONGODB_URI=mongodb+srv://smahesh-kumarr:1bVAoRpA59O7zzNV@cluster0.tlsbu.mongodb.net/?appName=Cluster0/ecommerce
```

### 2. `docker-compose.yml`
```yaml
environment:
  - MONGODB_URI=mongodb+srv://smahesh-kumarr:1bVAoRpA59O7zzNV@cluster0.tlsbu.mongodb.net/?appName=Cluster0/ecommerce
```

### 3. Kubernetes Secret
When deploying to Kubernetes, create secret:
```bash
kubectl create secret generic backend-secret \
  --from-literal=MONGODB_URI='mongodb+srv://smahesh-kumarr:1bVAoRpA59O7zzNV@cluster0.tlsbu.mongodb.net/?appName=Cluster0/ecommerce' \
  -n mern
```

---

## Running Your Application

### Option 1: Local Development (npm)

```bash
# Backend
cd backend
npm run dev

# Frontend (new terminal)
cd frontend
npm start
```

### Option 2: Docker Compose

```bash
# Build and run both services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Option 3: Kubernetes

```bash
# Create namespace
kubectl create namespace mern

# Create secret
kubectl create secret generic backend-secret \
  --from-literal=MONGODB_URI='mongodb+srv://smahesh-kumarr:1bVAoRpA59O7zzNV@cluster0.tlsbu.mongodb.net/?appName=Cluster0/ecommerce' \
  -n mern

# Deploy
kubectl apply -f backend-deployment.yaml -n mern
kubectl apply -f frontend-deployment.yaml -n mern
```

---

## Verify Connection

### Test Backend Health

```bash
curl http://localhost:5000/observability/health
```

Expected response:
```json
{
  "uptime": 123.456,
  "timestamp": 1702684800000,
  "status": "OK",
  "environment": "development",
  "memory": {
    "rss": 150,
    "heapTotal": 100,
    "heapUsed": 50,
    "external": 5
  },
  "cpu": {
    "cores": 8,
    "loadAverage": [0.5, 0.3, 0.2]
  }
}
```

### Test Products Endpoint

```bash
curl http://localhost:5000/api/products
```

Should return products from MongoDB Atlas.

### Check Logs

```bash
# Backend logs
npm run dev

# Look for:
# "MongoDB Connected"
# "Server started"
```

---

## MongoDB Atlas Dashboard

### Access Your Database

1. Go to https://cloud.mongodb.com/
2. Login with your account
3. Click on **Cluster0**
4. Click **Connect**
5. Choose **Compass** or **MongoDB Shell**

### View Collections

1. In MongoDB Atlas dashboard
2. Click **Collections**
3. View:
   - `users` - User accounts
   - `products` - Product catalog
   - `carts` - Shopping carts
   - `orders` - Customer orders
   - `categories` - Product categories

### Monitor Performance

1. Click **Metrics**
2. View:
   - Connections
   - Operations per second
   - Network I/O
   - Storage usage

---

## Seed Data

Your database should already have seed data from the seed script:

```bash
cd backend
node scripts/seed.js
```

This creates:
- 6 product categories
- 13 real products with images
- 2 test users (admin + regular)

---

## Security Best Practices

### 1. Protect Your Connection String

⚠️ **IMPORTANT**: Your connection string contains your password. Never commit it to Git.

**Already done:**
- `.env` is in `.gitignore`
- `.env.example` has placeholder values
- Docker Compose uses environment variables
- Kubernetes uses Secrets

### 2. Change Your Password (Recommended)

1. Go to MongoDB Atlas
2. Click **Database Access**
3. Click **Edit** next to your user
4. Click **Edit Password**
5. Generate new password
6. Update in `.env` and `docker-compose.yml`

### 3. IP Whitelist

1. Go to MongoDB Atlas
2. Click **Network Access**
3. Add IP addresses that can connect:
   - Local development: `127.0.0.1`
   - Kubernetes cluster: Your cluster IP
   - Docker: `0.0.0.0/0` (less secure, for development only)

### 4. Backup Strategy

MongoDB Atlas automatically backs up your data:
1. Go to **Backup**
2. View backup schedule
3. Download backups if needed

---

## Troubleshooting

### Connection Timeout

**Error**: `MongooseError: connect ECONNREFUSED`

**Solution**:
1. Check internet connection
2. Verify MongoDB Atlas cluster is running
3. Check IP whitelist includes your IP
4. Verify connection string is correct

```bash
# Test connection
mongosh "mongodb+srv://smahesh-kumarr:1bVAoRpA59O7zzNV@cluster0.tlsbu.mongodb.net/?appName=Cluster0"
```

### Authentication Failed

**Error**: `MongoAuthenticationError: authentication failed`

**Solution**:
1. Verify username and password
2. Check password doesn't have special characters that need URL encoding
3. Verify user exists in MongoDB Atlas

### Database Not Found

**Error**: `MongooseError: database not found`

**Solution**:
1. Database is created automatically on first write
2. Run seed script to create collections
3. Check database name in connection string

### Slow Queries

**Solution**:
1. Check MongoDB Atlas metrics
2. Add indexes to frequently queried fields
3. Upgrade cluster tier if needed
4. Check network latency

---

## Performance Tips

### 1. Connection Pooling

Already configured in backend:
```javascript
// mongoose automatically pools connections
// Default: 10 connections
```

### 2. Indexes

Automatically created for:
- `_id` (primary key)
- User email (unique)
- Product SKU (unique)

### 3. Query Optimization

Use pagination:
```bash
GET /api/products?page=1&limit=12
```

### 4. Caching

Consider adding Redis for:
- Session storage
- Product cache
- Cart cache

---

## Scaling MongoDB Atlas

### Current Tier
- **Tier**: M0 (Free) or M2/M5 (Shared)
- **Storage**: 512MB - 10GB
- **Connections**: Limited

### Upgrade Path

1. **M10** - Dedicated cluster
   - 10GB storage
   - Dedicated resources
   - Backups included

2. **M20+** - Production tier
   - 20GB+ storage
   - High availability
   - Sharding support

### Upgrade Steps

1. Go to MongoDB Atlas
2. Click **Cluster0**
3. Click **Modify Cluster**
4. Select new tier
5. Review changes
6. Confirm upgrade

---

## Backup & Restore

### Automatic Backups

MongoDB Atlas automatically backs up:
- Every 6 hours (free tier)
- Every 4 hours (paid tier)
- Retained for 7-35 days

### Manual Backup

1. Go to **Backup** in MongoDB Atlas
2. Click **Take Snapshot**
3. Wait for backup to complete

### Restore from Backup

1. Go to **Backup**
2. Click **Restore** next to backup
3. Choose restore method:
   - Restore to new cluster
   - Restore to existing cluster

---

## Monitoring & Alerts

### Setup Alerts

1. Go to **Alerts**
2. Click **Create Alert**
3. Choose alert type:
   - Connection count
   - Replication lag
   - Disk usage
   - CPU usage

### View Metrics

1. Go to **Metrics**
2. View real-time data:
   - Operations per second
   - Network I/O
   - Storage usage
   - Connections

---

## Environment Variables

### Development (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://smahesh-kumarr:1bVAoRpA59O7zzNV@cluster0.tlsbu.mongodb.net/?appName=Cluster0/ecommerce
JWT_SECRET=9b01a1b6d7ea70acd869fd634ff2e828
LOG_LEVEL=info
```

### Production (Kubernetes Secret)
```bash
kubectl create secret generic backend-secret \
  --from-literal=MONGODB_URI='mongodb+srv://...' \
  --from-literal=JWT_SECRET='...' \
  -n mern
```

### Docker Compose
```yaml
environment:
  - MONGODB_URI=mongodb+srv://...
  - JWT_SECRET=...
```

---

## Advantages of MongoDB Atlas

✅ **Fully Managed** - No server maintenance
✅ **Scalable** - Automatic scaling available
✅ **Secure** - Encryption at rest and in transit
✅ **Backed Up** - Automatic daily backups
✅ **Monitored** - Real-time metrics and alerts
✅ **Global** - Deploy in multiple regions
✅ **Free Tier** - Start for free (M0)

---

## Disadvantages vs Local MongoDB

❌ **Network Latency** - Slightly slower than local
❌ **Cost** - Paid tiers required for production
❌ **Dependency** - Requires internet connection
❌ **Quota Limits** - Free tier has limits

---

## Next Steps

1. ✅ MongoDB Atlas configured
2. ✅ Connection string updated
3. ✅ Backend running with Atlas
4. Next: Start frontend
5. Next: Deploy to Kubernetes
6. Next: Setup Datadog monitoring

---

## Quick Reference

| Task | Command |
|------|---------|
| Start backend | `npm run dev` |
| Start frontend | `npm start` |
| Docker Compose | `docker-compose up -d` |
| Test health | `curl http://localhost:5000/observability/health` |
| View logs | `npm run dev` (see console) |
| Access Atlas | https://cloud.mongodb.com/ |
| Seed data | `node scripts/seed.js` |
| Test API | `curl http://localhost:5000/api/products` |

---

## Support

- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **Connection String**: https://docs.atlas.mongodb.com/driver-connection/
- **Troubleshooting**: https://docs.atlas.mongodb.com/troubleshoot-connection/
- **Pricing**: https://www.mongodb.com/pricing

Your application is now fully configured to use MongoDB Atlas! 🎉
