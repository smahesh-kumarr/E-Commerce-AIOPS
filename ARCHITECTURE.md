# Architecture & Design Patterns

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React.js (SPA)                                          │   │
│  │  - Components: Header, Footer, ProductCard              │   │
│  │  - Pages: Home, Product Details, Cart, Checkout, Orders │   │
│  │  - Context API: Auth, Cart State Management             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (HTTP/REST)
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway Layer                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express.js Server                                       │   │
│  │  - CORS, Body Parser, Error Handling                    │   │
│  │  - Request Logging Middleware                           │   │
│  │  - Authentication Middleware (JWT)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Routes & Controllers                                    │   │
│  │  ├── Auth Routes (signup, login, getMe)                │   │
│  │  ├── Product Routes (CRUD, search, filter)             │   │
│  │  ├── Cart Routes (add, remove, update)                 │   │
│  │  ├── Order Routes (create, list, update status)        │   │
│  │  └── Observability Routes (metrics, health, ready)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Services Layer                                          │   │
│  │  ├── AuthService (signup, login, token generation)      │   │
│  │  ├── ProductService (CRUD, search, filtering)           │   │
│  │  ├── CartService (add, remove, update, calculate)       │   │
│  │  └── OrderService (create, retrieve, update status)     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Data Access Layer                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Mongoose Models & Schemas                               │   │
│  │  ├── User (authentication, profile)                     │   │
│  │  ├── Product (catalog, inventory)                       │   │
│  │  ├── Category (product organization)                    │   │
│  │  ├── Cart (shopping cart items)                         │   │
│  │  └── Order (order history, status)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  MongoDB (NoSQL Database)                                │   │
│  │  - Collections: users, products, categories, carts, orders
│  │  - Indexes for performance optimization                 │   │
│  │  - Replication & Backup                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Observability Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Application Metrics                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  prom-client Library                                       │  │
│  │  - Counters (requests, events)                            │  │
│  │  - Gauges (active users, memory)                          │  │
│  │  - Histograms (latency, order values)                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    Metrics Endpoint                               │
│  /observability/metrics (Prometheus text format)                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    Prometheus Server                              │
│  - Scrapes metrics every 15 seconds                              │
│  - Time-series database storage                                  │
│  - PromQL query language                                         │
└──────────────────────────────────────────────────────────────────┘
                    ↙                          ↘
┌──────────────────────────┐    ┌──────────────────────────────┐
│    Grafana Dashboards    │    │   Datadog Integration        │
│  - Visualization         │    │  - Log aggregation           │
│  - Custom dashboards     │    │  - Alerting                  │
│  - Alerting rules        │    │  - APM & tracing             │
└──────────────────────────┘    └──────────────────────────────┘
```

## Design Patterns Used

### 1. MVC (Model-View-Controller)

**Backend:**
- **Models**: Mongoose schemas (User, Product, Cart, Order)
- **Views**: JSON API responses
- **Controllers**: Request handlers with business logic

**Frontend:**
- **Models**: Context API state
- **Views**: React components
- **Controllers**: Event handlers and API calls

### 2. Service Layer Pattern

Separates business logic from controllers:

```javascript
// Controller
const signup = async (req, res) => {
  const result = await authService.signup(req.body);
  res.json(result);
};

// Service
const signup = async (userData) => {
  // Business logic here
  const user = await User.create(userData);
  const token = generateToken(user._id);
  return { user, token };
};
```

### 3. Repository Pattern

Data access abstraction through models:

```javascript
// Models act as repositories
const user = await User.findById(id);
const products = await Product.find({ category });
```

### 4. Middleware Pattern

Request processing pipeline:

```javascript
app.use(cors());
app.use(express.json());
app.use(requestLoggingMiddleware);
app.use(protect); // Auth middleware
```

### 5. Factory Pattern

Token generation:

```javascript
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};
```

### 6. Observer Pattern

Event-driven logging and metrics:

```javascript
// Metrics are collected as events occur
metrics.authLoginTotal.inc({ status: 'success' });
logger.info('User login successful', { userId });
```

### 7. Context API Pattern (Frontend)

Global state management:

```javascript
const AuthContext = createContext();
const { user, login, logout } = useAuth();
```

## Data Flow

### Authentication Flow

```
User Input (Email, Password)
        ↓
Login Controller
        ↓
AuthService.login()
        ↓
User.findOne() + password verification
        ↓
Generate JWT Token
        ↓
Return { user, token }
        ↓
Store in localStorage
        ↓
Set Authorization header for future requests
```

### Product Browsing Flow

```
User clicks "Browse Products"
        ↓
ProductAPI.getAll(filters)
        ↓
GET /api/products?search=...&category=...
        ↓
ProductController.getAllProducts()
        ↓
ProductService.getAllProducts()
        ↓
Product.find(query)
        ↓
Metrics: product_view_total++
        ↓
Return paginated results
        ↓
Display in ProductCard components
```

### Checkout Flow

```
User clicks "Checkout"
        ↓
Validate cart (not empty)
        ↓
Fill shipping address
        ↓
Select payment method
        ↓
OrderController.createOrder()
        ↓
OrderService.createOrder()
        ↓
Validate inventory
        ↓
Create Order document
        ↓
Reduce product stock
        ↓
Clear cart
        ↓
Metrics: checkout_success_total++, order_created_total++
        ↓
Redirect to order confirmation
```

## Database Schema Design

### User Collection

```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: String (user/admin),
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Collection

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  originalPrice: Number,
  category: ObjectId (ref: Category),
  images: [{
    url: String,
    alt: String
  }],
  stock: Number,
  rating: Number,
  reviews: [{
    userId: ObjectId,
    rating: Number,
    comment: String,
    createdAt: Date
  }],
  sku: String (unique),
  tags: [String],
  viewCount: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Collection

```javascript
{
  _id: ObjectId,
  orderNumber: String (unique),
  userId: ObjectId (ref: User),
  items: [{
    productId: ObjectId,
    quantity: Number,
    price: Number
  }],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  subtotal: Number,
  tax: Number,
  shippingCost: Number,
  totalAmount: Number,
  status: String (pending/confirmed/shipped/delivered/cancelled),
  paymentStatus: String (pending/completed/failed),
  paymentMethod: String,
  createdAt: Date,
  updatedAt: Date
}
```

## API Design Principles

### RESTful Conventions

```
GET    /api/products           - List all products
GET    /api/products/:id       - Get single product
POST   /api/products           - Create product (admin)
PUT    /api/products/:id       - Update product (admin)
DELETE /api/products/:id       - Delete product (admin)
```

### Response Format

```javascript
// Success Response
{
  success: true,
  data: { /* resource data */ },
  pagination: { page, limit, total, pages }
}

// Error Response
{
  success: false,
  message: "Error description"
}
```

### Status Codes

- `200 OK` - Successful GET, PUT
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Performance Considerations

### Database Indexing

```javascript
// Text search index
productSchema.index({ name: 'text', description: 'text' });

// Category filtering
productSchema.index({ category: 1 });

// Status queries
orderSchema.index({ status: 1 });

// User lookups
userSchema.index({ email: 1 });
```

### Query Optimization

```javascript
// Use select to limit fields
Product.find().select('name price rating');

// Pagination
Product.find().skip(skip).limit(limit);

// Lean for read-only queries
Product.find().lean();
```

### Caching Strategy

- Frontend: localStorage for auth tokens
- Backend: Consider Redis for frequently accessed data
- HTTP: Cache headers for static assets

## Security Architecture

### Authentication

- JWT tokens with expiration
- Secure password hashing (bcryptjs)
- Token refresh mechanism

### Authorization

- Role-based access control (RBAC)
- Route protection middleware
- Resource ownership validation

### Data Protection

- HTTPS/TLS encryption
- Environment variables for secrets
- Input validation and sanitization
- SQL injection prevention (MongoDB)

## Scalability Considerations

### Horizontal Scaling

- Stateless API servers
- Load balancing
- Database replication
- Session storage (Redis)

### Vertical Scaling

- Database indexing
- Query optimization
- Caching layers
- Connection pooling

### Monitoring for Scale

- Metrics collection (prom-client)
- Structured logging
- Performance baselines
- Alerting thresholds

## Error Handling Strategy

### Backend

```javascript
try {
  // Business logic
} catch (error) {
  logger.error('Operation failed', { error, context });
  res.status(statusCode).json({ success: false, message });
}
```

### Frontend

```javascript
try {
  const response = await api.get('/endpoint');
} catch (error) {
  setError(error.response?.data?.message || 'Unknown error');
}
```

## Testing Strategy

### Unit Tests

- Service layer functions
- Utility functions
- Validation logic

### Integration Tests

- API endpoints
- Database operations
- Authentication flow

### E2E Tests

- User workflows
- Complete checkout process
- Admin operations

## Deployment Architecture

### Development

- Local MongoDB
- npm dev servers
- Hot reload enabled

### Staging

- Docker containers
- MongoDB Atlas
- Prometheus + Grafana

### Production

- Kubernetes cluster
- Managed MongoDB
- Datadog monitoring
- CDN for static assets
