# Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 14+
- MongoDB (local or Atlas)
- npm or yarn

### Option 1: Docker Compose (Recommended)

```bash
# Clone and navigate
git clone <repo-url>
cd E-Commerce

# Start everything
docker-compose up -d

# Wait 30 seconds for services to start

# Access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

### Option 2: Manual Setup

#### Terminal 1 - MongoDB
```bash
docker run -d -p 27017:27017 mongo:latest
```

#### Terminal 2 - Backend
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

#### Terminal 3 - Frontend
```bash
cd frontend
npm install
npm start
# App opens at http://localhost:3000
```

## First Steps

### 1. Create Account
- Go to http://localhost:3000
- Click "Sign Up"
- Fill in details and create account

### 2. Browse Products
- Home page shows available products
- Use search bar to find products
- Click on product for details

### 3. Add to Cart
- Click "Add to Cart" on product
- View cart by clicking cart icon

### 4. Checkout
- Click "Proceed to Checkout"
- Fill in shipping address
- Select payment method
- Place order

### 5. View Orders
- Click user menu → "My Orders"
- See order history and status

## Admin Features

### Create Admin User
```bash
# In MongoDB
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### Admin Dashboard
- Login as admin
- Click "Admin Dashboard"
- Manage orders and products

## Monitoring

### View Metrics
```bash
# Prometheus metrics
curl http://localhost:5000/observability/metrics

# Health check
curl http://localhost:5000/observability/health

# Readiness check
curl http://localhost:5000/observability/ready
```

### Prometheus Dashboard
- Open http://localhost:9090
- Query metrics with PromQL
- Example: `http_requests_total`

### Grafana Dashboards
- Open http://localhost:3001
- Login: admin / admin
- Add Prometheus as data source
- Create custom dashboards

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### MongoDB Connection Failed
```bash
# Check MongoDB is running
docker ps | grep mongo

# Restart MongoDB
docker restart ecommerce-mongodb
```

### Frontend Can't Connect to Backend
- Check backend is running: `curl http://localhost:5000`
- Verify REACT_APP_API_URL in frontend/.env
- Check CORS is enabled in backend

### Logs
```bash
# Backend logs
docker logs ecommerce-api

# Frontend logs
docker logs ecommerce-web

# View log files
cat backend/logs/combined.log
cat backend/logs/error.log
```

## Sample Data

### Create Sample Products
```bash
# In MongoDB
db.products.insertMany([
  {
    name: "Laptop",
    description: "High-performance laptop",
    price: 999.99,
    originalPrice: 1299.99,
    category: ObjectId("..."),
    stock: 50,
    rating: 4.5,
    sku: "LAPTOP-001",
    tags: ["electronics", "computers"],
    isActive: true
  }
])
```

### Create Sample Category
```bash
db.categories.insertOne({
  name: "Electronics",
  description: "Electronic devices",
  slug: "electronics",
  isActive: true
})
```

## API Testing

### Using cURL

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get products
curl http://localhost:5000/api/products

# Get product details
curl http://localhost:5000/api/products/<product-id>
```

### Using Postman

1. Import API collection from `API.md`
2. Set `{{base_url}}` to `http://localhost:5000/api`
3. Set `{{token}}` from login response
4. Test endpoints

## Next Steps

1. **Read Documentation**
   - [README.md](./README.md) - Project overview
   - [OBSERVABILITY.md](./OBSERVABILITY.md) - Monitoring setup
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
   - [API.md](./API.md) - API reference
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment

2. **Customize**
   - Update product categories
   - Add your own products
   - Customize UI colors/branding
   - Configure Datadog integration

3. **Deploy**
   - Set up Kubernetes cluster
   - Configure MongoDB Atlas
   - Set up Datadog monitoring
   - Deploy to production

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Rebuild images
docker-compose build

# Reset everything
docker-compose down -v
docker-compose up -d

# Access MongoDB
docker exec -it ecommerce-mongodb mongosh

# Backend shell
docker exec -it ecommerce-api sh

# Frontend shell
docker exec -it ecommerce-web sh
```

## Performance Tips

1. **Enable Caching**
   - Use Redis for session storage
   - Cache frequently accessed products
   - Set HTTP cache headers

2. **Database Optimization**
   - Create indexes for common queries
   - Use pagination for large result sets
   - Archive old orders

3. **Frontend Optimization**
   - Code splitting with React.lazy
   - Image optimization
   - Minify CSS/JS
   - Use CDN for static assets

4. **Monitoring**
   - Set up alerts in Datadog
   - Monitor error rates
   - Track conversion metrics
   - Review performance baselines

## Support

- Check logs: `docker-compose logs`
- Review documentation: See docs/ folder
- Check API status: `curl http://localhost:5000`
- Monitor metrics: http://localhost:9090

## What's Next?

- [ ] Customize branding and colors
- [ ] Add more product categories
- [ ] Implement payment gateway
- [ ] Set up email notifications
- [ ] Configure Datadog dashboards
- [ ] Deploy to production
- [ ] Set up CI/CD pipeline
- [ ] Add more tests
