require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const logger = require('./src/observability/logger');
const { requestLoggingMiddleware, errorLoggingMiddleware } = require('./src/observability/middleware');

const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const observabilityRoutes = require('./src/routes/observabilityRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLoggingMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.use('/observability', observabilityRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Amazon-like E-Commerce API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      observability: {
        metrics: '/observability/metrics',
        health: '/observability/health',
        ready: '/observability/ready'
      }
    }
  });
});

app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path
  });
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorLoggingMiddleware);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection', {
    message: err.message,
    stack: err.stack
  });
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

module.exports = app;
