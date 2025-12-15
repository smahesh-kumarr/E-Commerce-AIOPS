# API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Sign Up
```
POST /auth/signup
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}

Response (201):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### Get Current User
```
GET /auth/me
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "user",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }
}
```

### Products

#### Get All Products
```
GET /products?page=1&limit=20&search=laptop&category=electronics&minPrice=100&maxPrice=1000

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20)
- search: Search query
- category: Category ID
- minPrice: Minimum price
- maxPrice: Maximum price
- rating: Minimum rating

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Laptop",
      "description": "High-performance laptop",
      "price": 999.99,
      "originalPrice": 1299.99,
      "category": "507f1f77bcf86cd799439012",
      "images": [
        {
          "url": "https://example.com/image.jpg",
          "alt": "Laptop image"
        }
      ],
      "stock": 50,
      "rating": 4.5,
      "sku": "LAPTOP-001",
      "tags": ["electronics", "computers"],
      "viewCount": 1234
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### Get Product Details
```
GET /products/:id

Response (200):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "originalPrice": 1299.99,
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Electronics"
    },
    "images": [...],
    "stock": 50,
    "rating": 4.5,
    "reviews": [
      {
        "userId": "507f1f77bcf86cd799439013",
        "rating": 5,
        "comment": "Great product!",
        "createdAt": "2024-12-15T10:30:00Z"
      }
    ],
    "sku": "LAPTOP-001",
    "tags": ["electronics", "computers"],
    "viewCount": 1235
  }
}
```

#### Create Product (Admin)
```
POST /products
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "originalPrice": 1299.99,
  "category": "507f1f77bcf86cd799439012",
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "alt": "Laptop image"
    }
  ],
  "stock": 50,
  "sku": "LAPTOP-001",
  "tags": ["electronics", "computers"]
}

Response (201):
{
  "success": true,
  "data": { /* product object */ }
}
```

#### Update Product (Admin)
```
PUT /products/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "price": 899.99,
  "stock": 45
}

Response (200):
{
  "success": true,
  "data": { /* updated product */ }
}
```

#### Delete Product (Admin)
```
DELETE /products/:id
Authorization: Bearer <admin-token>

Response (200):
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Cart

#### Get Cart
```
GET /cart
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "items": [
      {
        "productId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Laptop",
          "images": [...]
        },
        "quantity": 1,
        "price": 999.99,
        "addedAt": "2024-12-15T10:30:00Z"
      }
    ],
    "totalItems": 1,
    "totalPrice": 999.99
  }
}
```

#### Add to Cart
```
POST /cart/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "507f1f77bcf86cd799439013",
  "quantity": 1
}

Response (200):
{
  "success": true,
  "data": { /* updated cart */ }
}
```

#### Update Cart Item
```
PUT /cart/:productId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 2
}

Response (200):
{
  "success": true,
  "data": { /* updated cart */ }
}
```

#### Remove from Cart
```
DELETE /cart/:productId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": { /* updated cart */ }
}
```

#### Clear Cart
```
DELETE /cart
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "items": [],
    "totalItems": 0,
    "totalPrice": 0
  }
}
```

### Orders

#### Create Order
```
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card"
}

Response (201):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-1702656000000-ABC123",
    "userId": "507f1f77bcf86cd799439012",
    "items": [...],
    "shippingAddress": {...},
    "subtotal": 999.99,
    "tax": 99.99,
    "shippingCost": 10.00,
    "totalAmount": 1109.98,
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "credit_card",
    "createdAt": "2024-12-15T10:30:00Z"
  }
}
```

#### Get User Orders
```
GET /orders/user/orders?page=1&limit=10
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "ORD-1702656000000-ABC123",
      "items": [...],
      "totalAmount": 1109.98,
      "status": "pending",
      "createdAt": "2024-12-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

#### Get Order Details
```
GET /orders/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-1702656000000-ABC123",
    "userId": {...},
    "items": [...],
    "shippingAddress": {...},
    "billingAddress": {...},
    "subtotal": 999.99,
    "tax": 99.99,
    "shippingCost": 10.00,
    "totalAmount": 1109.98,
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "credit_card",
    "createdAt": "2024-12-15T10:30:00Z"
  }
}
```

#### Update Order Status (Admin)
```
PUT /orders/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "shipped"
}

Valid statuses: pending, confirmed, shipped, delivered, cancelled

Response (200):
{
  "success": true,
  "data": { /* updated order */ }
}
```

#### Get All Orders (Admin)
```
GET /orders?page=1&limit=20
Authorization: Bearer <admin-token>

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "ORD-1702656000000-ABC123",
      "userId": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "totalAmount": 1109.98,
      "status": "pending",
      "createdAt": "2024-12-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Observability

#### Get Metrics (Prometheus Format)
```
GET /observability/metrics

Response (200):
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/products",status_code="200"} 1234
...
```

#### Health Check
```
GET /observability/health

Response (200):
{
  "uptime": 3600,
  "timestamp": 1702656000000,
  "status": "OK",
  "environment": "development",
  "memory": {
    "rss": 128,
    "heapTotal": 256,
    "heapUsed": 150,
    "external": 5
  },
  "cpu": {
    "cores": 4,
    "loadAverage": [0.5, 0.6, 0.4]
  }
}
```

#### Readiness Check
```
GET /observability/ready

Response (200):
{
  "ready": true,
  "message": "Service is ready",
  "database": "connected"
}

Response (503):
{
  "ready": false,
  "message": "Database not connected"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Please fill in all fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

## Rate Limiting

Currently not implemented. Consider adding for production:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Pagination

All list endpoints support pagination:

```
GET /api/products?page=1&limit=20

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20)

Response includes:
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Filtering & Search

### Product Search
```
GET /api/products?search=laptop
```

### Category Filter
```
GET /api/products?category=507f1f77bcf86cd799439012
```

### Price Range
```
GET /api/products?minPrice=100&maxPrice=1000
```

### Rating Filter
```
GET /api/products?rating=4
```

### Combine Filters
```
GET /api/products?search=laptop&category=electronics&minPrice=500&maxPrice=1500&page=1&limit=20
```

## Sorting

Currently sorted by creation date (newest first). Consider adding:

```
GET /api/products?sort=-price  // Descending price
GET /api/products?sort=price   // Ascending price
GET /api/products?sort=-rating // Highest rated first
```

## Examples

### Complete Checkout Flow

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response includes token

# 2. Add to cart
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439013",
    "quantity": 1
  }'

# 3. Create order
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "paymentMethod": "credit_card"
  }'

# 4. Get order details
curl http://localhost:5000/api/orders/<order-id> \
  -H "Authorization: Bearer <token>"
```
