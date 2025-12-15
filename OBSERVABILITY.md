# E-Commerce Platform - Observability & Monitoring Guide

## Overview

This document provides a comprehensive guide to the observability infrastructure of the Amazon-like e-commerce platform. Observability is implemented as a first-class feature using industry-standard tools and practices.

## Architecture

```
Application (Node.js + Express)
    ↓
prom-client (Metrics Collection)
    ↓
Winston (Structured Logging)
    ↓
Prometheus (Metrics Scraping)
    ↓
Datadog (Visualization & Alerting)
```

## 1. Metrics Collection (prom-client)

### Exposed Endpoints

#### `/observability/metrics` - Prometheus Compatible Metrics
Returns all collected metrics in Prometheus text format.

**Example Response:**
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/products",status_code="200"} 1234

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/api/products",status_code="200",le="0.1"} 500
```

#### `/observability/health` - Health Check Endpoint
Returns application health status including memory, CPU, and uptime.

**Response:**
```json
{
  "uptime": 3600,
  "timestamp": 1702656000000,
  "status": "OK",
  "environment": "production",
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

#### `/observability/ready` - Readiness Probe
Checks if the service is ready to handle requests (database connectivity).

**Response:**
```json
{
  "ready": true,
  "message": "Service is ready",
  "database": "connected"
}
```

### Key Metrics Collected

#### HTTP Request Metrics
- **http_requests_total**: Counter for all HTTP requests
  - Labels: `method`, `route`, `status_code`
  - Use: Track API usage patterns and error rates

- **http_request_duration_seconds**: Histogram of request durations
  - Labels: `method`, `route`, `status_code`
  - Buckets: [0.1s, 0.5s, 1s, 2s, 5s]
  - Use: Monitor API performance and latency

#### Authentication Metrics
- **auth_login_total**: Counter for login attempts
  - Labels: `status` (success/failed)
  - Use: Track authentication success rate

- **auth_signup_total**: Counter for signup attempts
  - Labels: `status` (success/failed)
  - Use: Monitor user registration trends

- **auth_failure_total**: Counter for authentication failures
  - Labels: `reason` (invalid_password, user_not_found, etc.)
  - Use: Identify security issues

#### Product Metrics
- **product_view_total**: Counter for product views
  - Labels: `product_id`, `category`
  - Use: Track popular products

- **search_query_total**: Counter for search queries
  - Labels: `query`
  - Use: Analyze search patterns

#### Cart & Checkout Metrics
- **cart_add_total**: Counter for items added to cart
  - Labels: `product_id`
  - Use: Track conversion funnel

- **cart_remove_total**: Counter for items removed from cart
  - Labels: `product_id`
  - Use: Identify abandoned items

- **cart_size_distribution**: Histogram of cart sizes
  - Buckets: [1, 5, 10, 20, 50]
  - Use: Understand customer shopping patterns

- **checkout_attempt_total**: Counter for checkout attempts
  - Labels: `status` (initiated/failed)
  - Use: Monitor checkout funnel

- **checkout_success_total**: Counter for successful checkouts
  - Use: Track conversion rate

#### Order Metrics
- **order_created_total**: Counter for orders created
  - Labels: `status` (pending/confirmed/etc.)
  - Use: Track order volume

- **order_failed_total**: Counter for failed orders
  - Labels: `reason` (empty_cart, insufficient_stock, etc.)
  - Use: Identify order issues

- **order_value_distribution**: Histogram of order values
  - Buckets: [$10, $50, $100, $500, $1000, $5000]
  - Use: Analyze revenue distribution

#### Admin Metrics
- **admin_action_total**: Counter for admin actions
  - Labels: `action` (create, update, delete), `resource` (product, order)
  - Use: Audit admin activities

#### System Metrics
- **database_connection_status**: Gauge for database connectivity
  - Value: 1 (connected) or 0 (disconnected)
  - Use: Monitor database health

- **active_users_gauge**: Gauge for active users
  - Use: Track concurrent users

## 2. Structured Logging (Winston)

### Log Format

All logs are structured as JSON with the following fields:

```json
{
  "timestamp": "2024-12-15 20:30:45",
  "level": "info",
  "service": "ecommerce-api",
  "message": "User login successful",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "method": "POST",
  "route": "/api/auth/login",
  "statusCode": 200,
  "responseTime": "125.5ms"
}
```

### Log Levels

- **fatal** (0): Critical errors requiring immediate attention
- **error** (1): Errors that need investigation
- **warn** (2): Warning conditions that should be monitored
- **info** (3): Informational messages about normal operations
- **debug** (4): Detailed debugging information
- **trace** (5): Very detailed trace information

### Log Files

- **logs/error.log**: Contains only error and fatal level logs
- **logs/combined.log**: Contains all log levels
- **Console Output** (development only): Colorized logs for local development

### Key Log Events

#### Authentication Logs
```json
{
  "level": "info",
  "message": "User login successful",
  "userId": "...",
  "email": "user@example.com"
}

{
  "level": "warn",
  "message": "Login - Invalid password",
  "email": "user@example.com"
}
```

#### API Request Logs
```json
{
  "level": "info",
  "message": "HTTP Request",
  "method": "GET",
  "route": "/api/products",
  "statusCode": 200,
  "responseTime": "45.2ms",
  "userId": "anonymous"
}
```

#### Database Logs
```json
{
  "level": "info",
  "message": "MongoDB Connected",
  "host": "localhost",
  "database": "ecommerce"
}

{
  "level": "error",
  "message": "MongoDB Connection Failed",
  "error": "ECONNREFUSED"
}
```

## 3. Datadog Integration

### Setup Instructions

1. **Create Datadog Account**
   - Sign up at https://www.datadoghq.com
   - Get your API key from Settings → API Keys

2. **Configure Environment Variables**
   ```bash
   DATADOG_API_KEY=your_api_key_here
   DATADOG_SITE=datadoghq.com  # or datadoghq.eu for EU
   ```

3. **Install Datadog Agent** (for log collection)
   ```bash
   # On your server/container
   DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=<API_KEY> \
   DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_agent.sh)"
   ```

4. **Configure Log Collection**
   - Point logs from `logs/combined.log` to Datadog
   - Datadog will automatically parse JSON logs

### Datadog Dashboard Metrics

#### 1. API Performance Dashboard
- **Request Rate**: `sum:http_requests_total{*}`
- **Error Rate**: `sum:http_requests_total{status_code:5xx}`
- **P95 Latency**: `histogram_quantile(0.95, http_request_duration_seconds)`
- **P99 Latency**: `histogram_quantile(0.99, http_request_duration_seconds)`

#### 2. Authentication Dashboard
- **Login Success Rate**: `sum:auth_login_total{status:success}` / `sum:auth_login_total{*}`
- **Signup Trend**: `sum:auth_signup_total{status:success}`
- **Auth Failures**: `sum:auth_failure_total{*}`
- **Failure Breakdown**: Grouped by `reason`

#### 3. Business Metrics Dashboard
- **Orders Created**: `sum:order_created_total{*}`
- **Checkout Success Rate**: `sum:checkout_success_total{*}` / `sum:checkout_attempt_total{*}`
- **Average Order Value**: `avg:order_value_distribution{*}`
- **Cart Abandonment**: `sum:cart_remove_total{*}` / `sum:cart_add_total{*}`

#### 4. System Health Dashboard
- **Database Status**: `database_connection_status`
- **Memory Usage**: `process_resident_memory_bytes`
- **CPU Usage**: `process_cpu_seconds_total`
- **Uptime**: `process_uptime_seconds`

#### 5. Product Analytics Dashboard
- **Top Products**: `sum:product_view_total{*}` grouped by `product_id`
- **Search Queries**: `sum:search_query_total{*}` grouped by `query`
- **Category Performance**: `sum:product_view_total{*}` grouped by `category`

## 4. Prometheus Configuration

### prometheus.yml Configuration

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ecommerce-api'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/observability/metrics'
```

### Running Prometheus

```bash
# Docker
docker run -d \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Access at http://localhost:9090
```

## 5. Grafana Dashboards

### Dashboard Templates

#### Dashboard 1: API Performance
- Request rate over time
- Error rate trends
- Latency percentiles (p50, p95, p99)
- Top slow endpoints

#### Dashboard 2: Business KPIs
- Daily orders
- Revenue trends
- Conversion funnel
- Customer acquisition

#### Dashboard 3: System Health
- CPU and memory usage
- Database connection status
- Request queue depth
- Error rates by type

## 6. Alerting Rules

### Critical Alerts

```yaml
# High Error Rate
alert: HighErrorRate
expr: |
  (sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
   sum(rate(http_requests_total[5m]))) > 0.05
for: 5m
annotations:
  summary: "High error rate detected (> 5%)"

# Database Disconnected
alert: DatabaseDown
expr: database_connection_status == 0
for: 1m
annotations:
  summary: "Database connection lost"

# High Latency
alert: HighLatency
expr: |
  histogram_quantile(0.95, http_request_duration_seconds) > 1
for: 5m
annotations:
  summary: "API latency is high (p95 > 1s)"
```

## 7. Best Practices

### Metric Naming
- Use snake_case for metric names
- Include units in the name (e.g., `_seconds`, `_total`, `_bytes`)
- Use descriptive labels

### Logging
- Log at appropriate levels (don't log everything as INFO)
- Include context (user ID, request ID, etc.)
- Avoid logging sensitive data (passwords, tokens)
- Use structured logging for easy parsing

### Performance
- Metrics collection has minimal overhead
- Logging is asynchronous
- Metrics are scraped on-demand (not pushed)
- Old logs are rotated to prevent disk space issues

### Security
- Protect Prometheus and Grafana with authentication
- Use HTTPS for Datadog API calls
- Rotate API keys regularly
- Don't commit credentials to version control

## 8. Troubleshooting

### Metrics Not Appearing
1. Check if `/observability/metrics` endpoint is accessible
2. Verify Prometheus scrape configuration
3. Check application logs for errors

### High Memory Usage
1. Check log file sizes (logs/ directory)
2. Verify metrics cardinality (too many label combinations)
3. Reduce histogram bucket count if needed

### Missing Logs
1. Verify log file permissions
2. Check disk space availability
3. Ensure Winston transports are configured correctly

## 9. Sample Queries

### Prometheus PromQL Queries

```promql
# Request rate (requests per second)
rate(http_requests_total[1m])

# Error rate percentage
(sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
 sum(rate(http_requests_total[5m]))) * 100

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Top 5 slowest endpoints
topk(5, histogram_quantile(0.95, http_request_duration_seconds))

# Login success rate
sum(rate(auth_login_total{status="success"}[1h])) /
sum(rate(auth_login_total[1h])) * 100
```

### Datadog Log Queries

```
service:ecommerce-api status:error
service:ecommerce-api @http.status_code:[500 TO 599]
service:ecommerce-api @message:"login"
service:ecommerce-api @responseTime:[1000 TO *]
```

## 10. Monitoring Checklist

- [ ] Prometheus is scraping metrics successfully
- [ ] Datadog is receiving logs
- [ ] Dashboards are created and populated
- [ ] Alerting rules are configured
- [ ] Team is notified of critical alerts
- [ ] Log rotation is configured
- [ ] Metrics retention is set appropriately
- [ ] Performance baselines are established
- [ ] On-call runbooks are created
- [ ] Regular reviews of metrics and logs are scheduled
