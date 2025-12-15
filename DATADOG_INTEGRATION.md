# Datadog Integration Guide - Complete Setup

## Overview

This guide explains how to connect your Kubernetes-deployed MERN application to Datadog to:
- Collect application logs
- Monitor health check endpoints
- Track HTTP status codes (200, 500, etc.)
- Create alerts and dashboards
- Monitor pod and container metrics

---

## Part 1: Datadog Account Setup

### Step 1: Create Datadog Account

1. Go to https://www.datadoghq.com/
2. Click **Sign Up** (Free tier available)
3. Create account with email
4. Verify email
5. Complete onboarding

### Step 2: Get Your API Key

1. Login to Datadog
2. Navigate to **Organization Settings** → **API Keys**
3. Click **+ New API Key**
4. Name it: `ecommerce-k8s`
5. Copy the key (you'll need this)

### Step 3: Get Your App Key (Optional but Recommended)

1. In same settings, go to **Application Keys**
2. Click **+ New Application Key**
3. Name it: `ecommerce-monitoring`
4. Copy the key

---

## Part 2: Install Datadog Agent in Kubernetes

### Option A: Using Helm (RECOMMENDED - Easiest)

#### Step 1: Add Datadog Helm Repository

```bash
helm repo add datadog https://helm.datadoghq.com
helm repo update
```

#### Step 2: Create Values File

Create file: `datadog-values.yaml`

```yaml
datadog:
  # Your Datadog API Key (from Step 2 above)
  apiKey: "YOUR_DATADOG_API_KEY_HERE"
  
  # Your Datadog site (US or EU)
  site: "datadoghq.com"  # or "datadoghq.eu" for EU
  
  # Enable log collection
  logs:
    enabled: true
    containerCollectAll: true
    
  # Enable APM (Application Performance Monitoring)
  apm:
    enabled: true
    
  # Enable process monitoring
  processAgent:
    enabled: true
    
  # Disable system probe (not needed for this setup)
  systemProbe:
    enabled: false

# Datadog Agent configuration
agents:
  rbac:
    create: true
  serviceAccount:
    create: true

# Cluster Agent configuration
clusterAgent:
  enabled: true
  rbac:
    create: true
  serviceAccount:
    create: true
```

#### Step 3: Install Datadog Agent

```bash
helm install datadog datadog/datadog \
  -f datadog-values.yaml \
  --namespace datadog \
  --create-namespace
```

#### Step 4: Verify Installation

```bash
# Check if Datadog pods are running
kubectl get pods -n datadog

# You should see:
# - datadog-agent-xxxxx (DaemonSet - one per node)
# - datadog-cluster-agent-xxxxx (Cluster Agent)
# - datadog-kube-state-metrics-xxxxx (Metrics)
```

Check agent logs:
```bash
kubectl logs -f daemonset/datadog-agent -n datadog
```

---

### Option B: Manual Installation (If Helm not available)

Create file: `datadog-agent-manual.yaml`

```yaml
---
# Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: datadog

---
# ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: datadog-agent
  namespace: datadog

---
# ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: datadog-agent
rules:
- apiGroups: [""]
  resources: ["nodes", "nodes/proxy", "nodes/metrics", "services", "endpoints", "pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "daemonsets", "replicasets", "statefulsets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["get", "list", "watch"]

---
# ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: datadog-agent
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: datadog-agent
subjects:
- kind: ServiceAccount
  name: datadog-agent
  namespace: datadog

---
# Secret for API Key
apiVersion: v1
kind: Secret
metadata:
  name: datadog-secret
  namespace: datadog
type: Opaque
stringData:
  api-key: "YOUR_DATADOG_API_KEY_HERE"

---
# DaemonSet for Datadog Agent
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: datadog-agent
  namespace: datadog
spec:
  selector:
    matchLabels:
      app: datadog-agent
  template:
    metadata:
      labels:
        app: datadog-agent
    spec:
      serviceAccountName: datadog-agent
      hostNetwork: true
      dnsPolicy: ClusterFirstWithHostNet
      containers:
      - name: datadog-agent
        image: gcr.io/datadoghq/agent:latest
        imagePullPolicy: Always
        
        # Ports
        ports:
        - containerPort: 8125
          protocol: UDP
          name: dogstatsd
        - containerPort: 8126
          protocol: TCP
          name: traceport
        
        # Environment variables
        env:
        - name: DD_API_KEY
          valueFrom:
            secretKeyRef:
              name: datadog-secret
              key: api-key
        - name: DD_SITE
          value: "datadoghq.com"
        - name: DD_LOGS_ENABLED
          value: "true"
        - name: DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL
          value: "true"
        - name: DD_APM_ENABLED
          value: "true"
        - name: DD_PROCESS_AGENT_ENABLED
          value: "true"
        - name: DD_KUBERNETES_KUBELET_HOST
          valueFrom:
            fieldRef:
              fieldPath: status.hostIP
        - name: DD_KUBERNETES_KUBELET_PORT
          value: "10250"
        - name: DD_HEALTH_PORT
          value: "5555"
        
        # Volume mounts
        volumeMounts:
        - name: dockersocket
          mountPath: /var/run/docker.sock
        - name: procdir
          mountPath: /host/proc
          readOnly: true
        - name: cgroups
          mountPath: /host/sys/fs/cgroup
          readOnly: true
        - name: passwd
          mountPath: /etc/passwd
          readOnly: true
        
        # Resource limits
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      
      # Volumes
      volumes:
      - name: dockersocket
        hostPath:
          path: /var/run/docker.sock
      - name: procdir
        hostPath:
          path: /proc
      - name: cgroups
        hostPath:
          path: /sys/fs/cgroup
      - name: passwd
        hostPath:
          path: /etc/passwd
```

Apply:
```bash
kubectl apply -f datadog-agent-manual.yaml
```

---

## Part 3: Configure Application for Datadog

### Step 1: Update Backend Deployment

Modify your `backend-deployment.yaml` to add Datadog environment variables:

```yaml
spec:
  template:
    metadata:
      labels:
        app: backend
      annotations:
        # Tell Datadog to scrape Prometheus metrics
        prometheus.io/scrape: "true"
        prometheus.io/port: "5000"
        prometheus.io/path: "/observability/metrics"
        # Tell Datadog to collect logs
        ad.datadoghq.com/backend.logs: '[{"source":"nodejs","service":"ecommerce-api"}]'
    spec:
      containers:
      - name: backend
        image: your-registry/ecommerce-backend:latest
        
        # Add these environment variables
        env:
        # Datadog Agent host (auto-injected by Datadog)
        - name: DD_AGENT_HOST
          valueFrom:
            fieldRef:
              fieldPath: status.hostIP
        
        # Datadog trace agent port
        - name: DD_TRACE_AGENT_PORT
          value: "8126"
        
        # Enable log injection (adds trace IDs to logs)
        - name: DD_LOGS_INJECTION
          value: "true"
        
        # Service name (for Datadog)
        - name: DD_SERVICE
          value: "ecommerce-api"
        
        # Environment (for Datadog)
        - name: DD_ENV
          value: "production"
        
        # Version (for Datadog)
        - name: DD_VERSION
          value: "1.0.0"
        
        # Enable profiling
        - name: DD_PROFILING_ENABLED
          value: "true"
```

### Step 2: Update Backend Logger

Update `backend/src/observability/logger.js`:

```javascript
const winston = require('winston');
const os = require('os');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  
  // JSON format for Datadog
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  
  // Default metadata for all logs
  defaultMeta: {
    service: process.env.DD_SERVICE || 'ecommerce-api',
    environment: process.env.DD_ENV || 'development',
    version: process.env.DD_VERSION || '1.0.0',
    hostname: os.hostname(),
    pid: process.pid
  },
  
  transports: [
    // Console output (Datadog Agent will collect from here)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}] ${message} ${JSON.stringify(meta)}`;
        })
      )
    }),
    
    // File output (optional, for backup)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

module.exports = logger;
```

### Step 3: Update Request Logging Middleware

Update `backend/src/observability/middleware.js`:

```javascript
const logger = require('./logger');

const requestLoggingMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;
    
    // Log response with status code
    const logLevel = res.statusCode >= 500 ? 'error' : 
                     res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: data?.length || 0
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

const errorLoggingMiddleware = (err, req, res, next) => {
  logger.error('Request error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500
  });
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message
  });
};

module.exports = {
  requestLoggingMiddleware,
  errorLoggingMiddleware
};
```

### Step 4: Update Frontend Deployment

Add Datadog annotations to `frontend-deployment.yaml`:

```yaml
spec:
  template:
    metadata:
      labels:
        app: frontend
      annotations:
        # Tell Datadog to collect logs
        ad.datadoghq.com/frontend.logs: '[{"source":"nodejs","service":"ecommerce-frontend"}]'
```

---

## Part 4: Verify Datadog is Collecting Data

### Check Agent Status

```bash
# Check if agent is running
kubectl get pods -n datadog

# Check agent logs
kubectl logs -f daemonset/datadog-agent -n datadog

# Check agent status
kubectl exec -it <datadog-agent-pod> -n datadog -- agent status
```

### Check Application Logs

```bash
# View backend logs (should be JSON format)
kubectl logs -f deployment/backend -n mern

# Example output:
# {"timestamp":"2025-12-15 21:30:45","level":"info","message":"Incoming request","method":"GET","path":"/api/products","service":"ecommerce-api"}
```

### Verify in Datadog UI

1. Go to https://app.datadoghq.com/
2. Click **Logs** in left sidebar
3. You should see logs from your application
4. Filter by: `service:ecommerce-api`

---

## Part 5: Create Monitors for Status Codes

### Monitor 1: Alert on 500 Errors

In Datadog UI:

1. Go to **Monitors** → **New Monitor**
2. Select **Logs**
3. In query field, enter:
   ```
   service:ecommerce-api status:error
   ```
4. Set alert condition:
   - Alert when: `count` is `above` `5` in the last `5 minutes`
5. Click **Save**

### Monitor 2: Alert on Low Success Rate (200 status codes)

1. Go to **Monitors** → **New Monitor**
2. Select **Metric**
3. In metric field, search for: `trace.web.request.hits`
4. Filter by: `http.status_code:200`
5. Set alert condition:
   - Alert when: `average` is `below` `100` in the last `5 minutes`
6. Click **Save**

### Monitor 3: Health Check Endpoint

1. Go to **Monitors** → **New Monitor**
2. Select **HTTP**
3. URL: `http://YOUR_NODE_IP:30001/observability/health`
4. Check interval: `1 minute`
5. Alert if: `Status code is not 200`
6. Click **Save**

---

## Part 6: Create Dashboard

### Create Custom Dashboard

1. Go to **Dashboards** → **New Dashboard**
2. Name it: `MERN E-Commerce Monitoring`
3. Add widgets:

#### Widget 1: Request Rate
- Type: Timeseries
- Metric: `trace.web.request.hits`
- Group by: `http.method`

#### Widget 2: Error Rate (500s)
- Type: Timeseries
- Metric: `trace.web.request.errors`
- Filter: `http.status_code:500`

#### Widget 3: Success Rate (200s)
- Type: Timeseries
- Metric: `trace.web.request.hits`
- Filter: `http.status_code:200`

#### Widget 4: Health Check Status
- Type: Status
- Query: `avg:http.can_connect{url:http://YOUR_NODE_IP:30001/observability/health}`

#### Widget 5: Pod Metrics
- Type: Timeseries
- Metric: `kubernetes.pod.cpu.usage`
- Filter: `pod_name:backend*`

#### Widget 6: Recent Logs
- Type: Log Stream
- Query: `service:ecommerce-api`

---

## Part 7: Setup Alerts & Notifications

### Email Notifications

1. In Monitor, scroll to **Notify your team**
2. Add email: `your-email@example.com`
3. Add message:
   ```
   Alert: {{alert.title}}
   Status: {{alert.status}}
   Service: {{service.name}}
   ```

### Slack Integration

1. Go to **Integrations** → **Slack**
2. Click **Install Integration**
3. Authorize Datadog in Slack
4. In Monitor, add: `@slack-#alerts`

### PagerDuty Integration

1. Go to **Integrations** → **PagerDuty**
2. Add API key
3. In Monitor, add: `@pagerduty`

---

## Part 8: View Logs in Datadog

### Access Logs

1. Go to **Logs** in Datadog
2. Filter by service:
   ```
   service:ecommerce-api
   ```
3. View logs with:
   - Timestamp
   - Log level
   - Message
   - Metadata (method, path, status code, etc.)

### Search Logs

```
# Find all 500 errors
service:ecommerce-api status:error

# Find specific endpoint
service:ecommerce-api path:/api/products

# Find slow requests (> 1000ms)
service:ecommerce-api duration:>1000

# Find specific user
service:ecommerce-api user_id:12345
```

### Create Log-Based Alert

1. Click **Create Alert** in log view
2. Set condition: `count > 10 in last 5 minutes`
3. Save alert

---

## Part 9: Monitor Kubernetes Metrics

### Pod Metrics

Datadog automatically collects:
- CPU usage
- Memory usage
- Network I/O
- Disk I/O
- Container restarts

View in **Infrastructure** → **Containers**

### Node Metrics

View in **Infrastructure** → **Hosts**

### Custom Metrics

From your application's `/observability/metrics` endpoint:
- Request count
- Request duration
- Error count
- Custom business metrics

---

## Troubleshooting

### Logs Not Appearing

```bash
# 1. Check Datadog Agent is running
kubectl get pods -n datadog

# 2. Check agent logs
kubectl logs -f daemonset/datadog-agent -n datadog

# 3. Check if logs are being generated
kubectl logs -f deployment/backend -n mern

# 4. Verify API key is correct
kubectl get secret datadog-secret -n datadog -o yaml

# 5. Check agent status
kubectl exec -it <agent-pod> -n datadog -- agent status
```

### Metrics Not Showing

```bash
# 1. Test metrics endpoint
curl http://localhost:30001/observability/metrics

# 2. Check Prometheus scrape config
kubectl get configmap -n datadog

# 3. Verify annotations in pod
kubectl describe pod <backend-pod> -n mern
```

### Health Check Failing

```bash
# 1. Test health endpoint
curl http://localhost:30001/observability/health

# 2. Check backend logs
kubectl logs -f deployment/backend -n mern

# 3. Check database connection
# Verify MONGODB_URI in secret
kubectl get secret backend-secret -n mern -o yaml
```

---

## Summary: Steps to Implement

### Immediate Steps:
1. ✅ Create Datadog account (free tier)
2. ✅ Get API key from settings
3. ✅ Install Datadog Agent with Helm
4. ✅ Update backend deployment with Datadog env vars
5. ✅ Update logger to output JSON

### Next Steps:
6. Deploy updated backend
7. Verify logs appear in Datadog UI
8. Create monitors for 500 errors
9. Create monitors for 200 status codes
10. Create health check monitor
11. Create custom dashboard
12. Setup email/Slack notifications

### Verification:
- Logs visible in Datadog UI
- Metrics being collected
- Monitors triggering alerts
- Dashboard showing real-time data

---

## Quick Reference

| Task | Command |
|------|---------|
| Install Datadog | `helm install datadog datadog/datadog -f datadog-values.yaml` |
| Check Agent | `kubectl get pods -n datadog` |
| View Logs | `kubectl logs -f daemonset/datadog-agent -n datadog` |
| Test Health | `curl http://localhost:30001/observability/health` |
| Test Metrics | `curl http://localhost:30001/observability/metrics` |
| View in Datadog | https://app.datadoghq.com/logs |

---

## Resources

- Datadog Docs: https://docs.datadoghq.com/
- Kubernetes Integration: https://docs.datadoghq.com/integrations/kubernetes/
- Log Collection: https://docs.datadoghq.com/logs/
- Monitors: https://docs.datadoghq.com/monitors/
