const client = require('prom-client');

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const authLoginTotal = new client.Counter({
  name: 'auth_login_total',
  help: 'Total login attempts',
  labelNames: ['status']
});

const authSignupTotal = new client.Counter({
  name: 'auth_signup_total',
  help: 'Total signup attempts',
  labelNames: ['status']
});

const authFailureTotal = new client.Counter({
  name: 'auth_failure_total',
  help: 'Total authentication failures',
  labelNames: ['reason']
});

const productViewTotal = new client.Counter({
  name: 'product_view_total',
  help: 'Total product views',
  labelNames: ['product_id', 'category']
});

const searchQueryTotal = new client.Counter({
  name: 'search_query_total',
  help: 'Total search queries',
  labelNames: ['query']
});

const cartAddTotal = new client.Counter({
  name: 'cart_add_total',
  help: 'Total items added to cart',
  labelNames: ['product_id']
});

const cartRemoveTotal = new client.Counter({
  name: 'cart_remove_total',
  help: 'Total items removed from cart',
  labelNames: ['product_id']
});

const checkoutAttemptTotal = new client.Counter({
  name: 'checkout_attempt_total',
  help: 'Total checkout attempts',
  labelNames: ['status']
});

const checkoutSuccessTotal = new client.Counter({
  name: 'checkout_success_total',
  help: 'Total successful checkouts'
});

const orderCreatedTotal = new client.Counter({
  name: 'order_created_total',
  help: 'Total orders created',
  labelNames: ['status']
});

const orderFailedTotal = new client.Counter({
  name: 'order_failed_total',
  help: 'Total failed orders',
  labelNames: ['reason']
});

const adminActionTotal = new client.Counter({
  name: 'admin_action_total',
  help: 'Total admin actions',
  labelNames: ['action', 'resource']
});

const databaseConnectionStatus = new client.Gauge({
  name: 'database_connection_status',
  help: 'Database connection status (1 = connected, 0 = disconnected)'
});

const activeUsersGauge = new client.Gauge({
  name: 'active_users_gauge',
  help: 'Number of active users'
});

const cartSizeHistogram = new client.Histogram({
  name: 'cart_size_distribution',
  help: 'Distribution of cart sizes',
  buckets: [1, 5, 10, 20, 50]
});

const orderValueHistogram = new client.Histogram({
  name: 'order_value_distribution',
  help: 'Distribution of order values in dollars',
  buckets: [10, 50, 100, 500, 1000, 5000]
});

module.exports = {
  httpRequestDuration,
  httpRequestTotal,
  authLoginTotal,
  authSignupTotal,
  authFailureTotal,
  productViewTotal,
  searchQueryTotal,
  cartAddTotal,
  cartRemoveTotal,
  checkoutAttemptTotal,
  checkoutSuccessTotal,
  orderCreatedTotal,
  orderFailedTotal,
  adminActionTotal,
  databaseConnectionStatus,
  activeUsersGauge,
  cartSizeHistogram,
  orderValueHistogram,
  register: client.register
};
