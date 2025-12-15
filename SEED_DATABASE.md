# Seed Database Guide

## Problem
Products are not showing in the API because the MongoDB Atlas database hasn't been seeded yet.

---

## Solution 1: Seed via Docker (Recommended)

### Step 1: Connect to Backend Container

```bash
docker exec -it ecommerce-backend sh
```

### Step 2: Run Seed Script

```bash
node scripts/seed.js
```

Expected output:
```
Connected to MongoDB
Cleared existing data
Categories created: 6
Products created: 13
✅ Database seeded successfully!

Test Credentials:
Admin: admin@example.com / admin123456
User: user@example.com / user123456
```

### Step 3: Exit Container

```bash
exit
```

### Step 4: Verify Products

```bash
curl http://localhost:5000/api/products
```

Should now return 13 products.

---

## Solution 2: Seed via Local Development

If running locally (not Docker):

```bash
cd backend
node scripts/seed.js
```

---

## Solution 3: Create Seed Endpoint (Optional)

Add a seed endpoint to `backend/src/routes/seedRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const seedDatabase = require('../scripts/seed');

// POST /api/seed - Seed database (development only)
router.post('/seed', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Seeding not allowed in production'
      });
    }

    await seedDatabase();
    res.json({
      success: true,
      message: 'Database seeded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
```

Then use:
```bash
curl -X POST http://localhost:5000/api/seed
```

---

## Solution 4: Seed on Container Start

Modify `backend/Dockerfile` to seed on startup:

```dockerfile
# ... existing Dockerfile content ...

# Copy seed script
COPY scripts/seed.js ./scripts/seed.js

# Run seed script on startup
CMD ["sh", "-c", "node scripts/seed.js && node server.js"]
```

Then rebuild:
```bash
docker build -t ecommerce-backend:latest backend/
docker-compose up -d
```

---

## What Gets Seeded

### Categories (6)
1. Electronics
2. Clothing
3. Books
4. Home & Garden
5. Sports & Outdoors
6. Toys & Games

### Products (13)
- Laptop
- Smartphone
- Wireless Headphones
- T-Shirt
- Jeans
- Running Shoes
- Novel Book
- Coffee Maker
- Yoga Mat
- Tent
- Board Game
- Action Figure
- Desk Lamp

### Test Users (2)
- **Admin**: admin@example.com / admin123456
- **User**: user@example.com / user123456

---

## Verify Seeding

### Check Products Count

```bash
curl http://localhost:5000/api/products
```

Response should include:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Laptop",
      "price": 999.99,
      "category": "Electronics",
      ...
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 13,
    "pages": 1
  }
}
```

### Check Categories

```bash
curl http://localhost:5000/api/products/categories
```

Should return 6 categories.

### Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "user123456"
  }'
```

Should return JWT token.

---

## Troubleshooting

### Still No Products After Seeding

1. **Check MongoDB Connection**
   ```bash
   docker logs ecommerce-backend | grep "MongoDB"
   ```

2. **Verify Database**
   - Go to MongoDB Atlas dashboard
   - Check if `ecommerce` database exists
   - Check if `products` collection has documents

3. **Check Seed Script Errors**
   ```bash
   docker exec ecommerce-backend node scripts/seed.js
   ```

### Connection String Issues

Verify in `.env`:
```env
MONGODB_URI=mongodb+srv://smahesh-kumarr:1bVAoRpA59O7zzNV@cluster0.tlsbu.mongodb.net/?appName=Cluster0/ecommerce
```

### Permission Errors

If you get permission errors in Docker, the logger fix should handle it. If not:

1. Rebuild image:
   ```bash
   docker build --no-cache -t ecommerce-backend:latest backend/
   ```

2. Restart:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## Quick Commands

```bash
# Seed via Docker
docker exec -it ecommerce-backend node scripts/seed.js

# Seed locally
cd backend && node scripts/seed.js

# Check products
curl http://localhost:5000/api/products

# Check categories
curl http://localhost:5000/api/products/categories

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123456"}'

# View backend logs
docker logs -f ecommerce-backend

# Connect to container shell
docker exec -it ecommerce-backend sh
```

---

## Expected Result

After seeding, you should see:

**Frontend** (http://localhost:3000):
- 13 products displayed
- Product cards with images
- Add to cart functionality

**Backend** (http://localhost:5000/api/products):
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Laptop",
      "description": "High-performance laptop",
      "price": 999.99,
      "category": "Electronics",
      "image": "https://...",
      "rating": 4.5,
      "reviews": 120,
      "stock": 50,
      "sku": "LAPTOP-001"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 13,
    "pages": 1
  }
}
```

---

## Next Steps

1. ✅ Seed database
2. Verify products appear
3. Test frontend at http://localhost:3000
4. Test login with test credentials
5. Add products to cart
6. Create order
7. Deploy to Kubernetes

Your application will be fully functional once seeded! 🎉
