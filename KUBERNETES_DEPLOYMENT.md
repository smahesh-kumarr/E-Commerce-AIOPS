# Kubernetes Deployment Guide - MERN E-Commerce

## Deployment Overview

```
┌─────────────────────────────────────────────────────────────┐
│         Single Node Master Kubeadm Cluster                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           MERN Namespace                             │  │
│  │                                                      │  │
│  │  ┌──────────────────┐  ┌──────────────────┐        │  │
│  │  │  Frontend Pod    │  │  Backend Pod     │        │  │
│  │  │  (React)         │  │  (Node.js)       │        │  │
│  │  │  Port: 3000      │  │  Port: 5000      │        │  │
│  │  └──────────────────┘  └──────────────────┘        │  │
│  │         ↓                      ↓                     │  │
│  │  ┌──────────────────┐  ┌──────────────────┐        │  │
│  │  │ Frontend Service │  │ Backend Service  │        │  │
│  │  │ (NodePort)       │  │ (NodePort)       │        │  │
│  │  │ Port: 30000      │  │ Port: 30001      │        │  │
│  │  └──────────────────┘  └──────────────────┘        │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│                  ┌─────────────────┐                        │
│                  │  MongoDB Atlas  │                        │
│                  │  (Cloud)        │                        │
│                  └─────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- Kubernetes 1.20+ cluster (single node with master)
- kubectl configured
- Docker images pushed to registry (Docker Hub or private)
- MongoDB Atlas account and connection string
- Datadog account (free tier available)

---

## Step 1: Create MERN Namespace

```bash
kubectl create namespace mern
kubectl config set-context --current --namespace=mern
```

Verify:
```bash
kubectl get namespace mern
```

---

## Step 2: Create ConfigMap for Environment Variables

Create `configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: mern
data:
  NODE_ENV: "production"
  PORT: "5000"
  LOG_LEVEL: "info"
  REACT_APP_API_URL: "http://localhost:30001/api"
```

Apply:
```bash
kubectl apply -f configmap.yaml
```

---

## Step 3: Create Secret for Sensitive Data

Create `secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: backend-secret
  namespace: mern
type: Opaque
stringData:
  MONGODB_URI: "mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority"
  JWT_SECRET: "your_jwt_secret_key_here"
  DATADOG_API_KEY: "your_datadog_api_key"
  DATADOG_SITE: "datadoghq.com"
```

Apply:
```bash
kubectl apply -f secret.yaml
```

**Important**: Use `kubectl create secret` for production:
```bash
kubectl create secret generic backend-secret \
  --from-literal=MONGODB_URI='mongodb+srv://...' \
  --from-literal=JWT_SECRET='your_secret' \
  --from-literal=DATADOG_API_KEY='your_key' \
  -n mern
```

---

## Step 4: Backend Deployment

Create `backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: mern
  labels:
    app: backend
    version: v1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "5000"
        prometheus.io/path: "/observability/metrics"
    spec:
      containers:
      - name: backend
        image: your-docker-registry/ecommerce-backend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 5000
          name: http
          protocol: TCP
        
        # Environment variables from ConfigMap and Secret
        envFrom:
        - configMapRef:
            name: backend-config
        - secretRef:
            name: backend-secret
        
        # Health checks
        livenessProbe:
          httpGet:
            path: /observability/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /observability/ready
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        
        # Resource limits
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        # Logging
        volumeMounts:
        - name: logs
          mountPath: /app/logs
      
      volumes:
      - name: logs
        emptyDir: {}
      
      # Pod restart policy
      restartPolicy: Always
```

Apply:
```bash
kubectl apply -f backend-deployment.yaml
```

Verify:
```bash
kubectl get pods -n mern
kubectl logs -f deployment/backend -n mern
```

---

## Step 5: Backend Service (NodePort)

Create `backend-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: mern
  labels:
    app: backend
spec:
  type: NodePort
  selector:
    app: backend
  ports:
  - port: 5000
    targetPort: 5000
    nodePort: 30001
    protocol: TCP
    name: http
```

Apply:
```bash
kubectl apply -f backend-service.yaml
```

Access backend:
```
http://localhost:30001/api/products
```

---

## Step 6: Frontend Deployment

Create `frontend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: mern
  labels:
    app: frontend
    version: v1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
        version: v1
    spec:
      containers:
      - name: frontend
        image: your-docker-registry/ecommerce-frontend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        
        # Environment variables
        env:
        - name: REACT_APP_API_URL
          value: "http://localhost:30001/api"
        
        # Health check
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        
        # Resource limits
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
      
      restartPolicy: Always
```

Apply:
```bash
kubectl apply -f frontend-deployment.yaml
```

---

## Step 7: Frontend Service (NodePort)

Create `frontend-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: mern
  labels:
    app: frontend
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
  - port: 3000
    targetPort: 3000
    nodePort: 30000
    protocol: TCP
    name: http
```

Apply:
```bash
kubectl apply -f frontend-service.yaml
```

Access frontend:
```
http://localhost:30000
```

---

## Step 8: Verify Deployment

```bash
# Check all resources
kubectl get all -n mern

# Check pods
kubectl get pods -n mern

# Check services
kubectl get svc -n mern

# Check deployments
kubectl get deployments -n mern

# View logs
kubectl logs -f deployment/backend -n mern
kubectl logs -f deployment/frontend -n mern

# Describe pod for debugging
kubectl describe pod <pod-name> -n mern
```

---

# Datadog Integration Guide

## Overview

Datadog will collect:
- Application logs
- Health check status
- HTTP status codes (200, 500, etc.)
- Metrics from `/observability/metrics`
- Container metrics
- Pod metrics

---

## Step 1: Get Datadog API Key

1. Go to https://app.datadoghq.com/
2. Navigate to **Organization Settings** → **API Keys**
3. Create new API key
4. Copy the key

---

## Step 2: Install Datadog Agent in Kubernetes

### Option A: Using Helm (Recommended)

```bash
# Add Datadog Helm repo
helm repo add datadog https://helm.datadoghq.com
helm repo update

# Create values file (datadog-values.yaml)
cat > datadog-values.yaml << 'EOF'
datadog:
  apiKey: "YOUR_DATADOG_API_KEY"
  site: "datadoghq.com"
  logs:
    enabled: true
    containerCollectAll: true
  apm:
    enabled: true
  processAgent:
    enabled: true
  systemProbe:
    enabled: false

agents:
  rbac:
    create: true
  serviceAccount:
    create: true

clusterAgent:
  enabled: true
  rbac:
    create: true
  serviceAccount:
    create: true
EOF

# Install Datadog Agent
helm install datadog datadog/datadog -f datadog-values.yaml
```

### Option B: Manual Installation

Create `datadog-agent.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: datadog-agent
  namespace: default

---
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

---
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
  namespace: default

---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: datadog-agent
  namespace: default
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
      containers:
      - name: datadog-agent
        image: gcr.io/datadoghq/agent:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8125
          protocol: UDP
          name: dogstatsd
        - containerPort: 8126
          protocol: TCP
          name: traceport
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
        volumeMounts:
        - name: dockersocket
          mountPath: /var/run/docker.sock
        - name: procdir
          mountPath: /host/proc
          readOnly: true
        - name: cgroups
          mountPath: /host/sys/fs/cgroup
          readOnly: true
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
      hostNetwork: true
      dnsPolicy: ClusterFirstWithHostNet
```

Create secret:
```bash
kubectl create secret generic datadog-secret \
  --from-literal=api-key='YOUR_DATADOG_API_KEY' \
  -n default
```

Apply:
```bash
kubectl apply -f datadog-agent.yaml
```

---

## Step 3: Configure Application Logging to Datadog

### Update Backend Deployment to Send Logs

Modify `backend-deployment.yaml` to add Datadog logging:

```yaml
# Add to backend container spec
env:
- name: DD_AGENT_HOST
  valueFrom:
    fieldRef:
      fieldPath: status.hostIP
- name: DD_TRACE_AGENT_PORT
  value: "8126"
- name: DD_LOGS_INJECTION
  value: "true"
```

### Update Backend Code for Datadog

Update `backend/src/observability/logger.js`:

```javascript
const winston = require('winston');
const os = require('os');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'ecommerce-api',
    environment: process.env.NODE_ENV || 'development',
    hostname: os.hostname(),
    version: '1.0.0'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}] ${message} ${JSON.stringify(meta)}`;
        })
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json()
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json()
    })
  ]
});

module.exports = logger;
```

---

## Step 4: Configure Datadog to Scrape Metrics

Create `datadog-monitors.yaml`:

```yaml
# This is a template - configure in Datadog UI
# Monitor for 500 errors
name: "High Error Rate"
type: "metric alert"
query: "avg(last_5m):avg:trace.web.request.errors{service:ecommerce-api} > 10"
thresholds:
  critical: 10
  warning: 5

---
# Monitor for health check failures
name: "Health Check Failed"
type: "service check"
query: "avg(last_5m):avg:http.can_connect{url:http://localhost:30001/observability/health} < 1"
thresholds:
  critical: 1

---
# Monitor for 200 status codes (success rate)
name: "Low Success Rate"
type: "metric alert"
query: "avg(last_5m):avg:trace.web.request.hits{service:ecommerce-api,http.status_code:200} < 100"
thresholds:
  critical: 100
```

---

## Step 5: View Logs in Datadog

### Access Logs

1. Go to **Datadog** → **Logs**
2. Filter by service: `service:ecommerce-api`
3. View logs from your application

### Create Log-Based Monitors

1. Go to **Monitors** → **New Monitor**
2. Select **Logs**
3. Query: `service:ecommerce-api status:error`
4. Set alert threshold
5. Save monitor

---

## Step 6: View Metrics in Datadog

### Access Metrics

1. Go to **Datadog** → **Metrics**
2. Search for metrics from your app
3. View in dashboards

### Create Custom Dashboard

1. Go to **Dashboards** → **New Dashboard**
2. Add widgets:
   - HTTP request rate
   - Error rate (500 status codes)
   - Success rate (200 status codes)
   - Health check status
   - Pod metrics

---

## Step 7: Configure Health Check Monitoring

### Create HTTP Monitor

```bash
# In Datadog UI:
# 1. Go to Monitors → New Monitor
# 2. Select "HTTP"
# 3. URL: http://your-node-ip:30001/observability/health
# 4. Check interval: 1 minute
# 5. Alert on: Status code != 200
```

---

## Step 8: Setup Alerts for Status Codes

### Alert on 500 Errors

In Datadog:
1. **Monitors** → **New Monitor**
2. **Type**: Logs
3. **Query**: `service:ecommerce-api status:error`
4. **Alert condition**: `> 5 errors in last 5 minutes`
5. **Notification**: Email/Slack

### Alert on Low Success Rate

In Datadog:
1. **Monitors** → **New Monitor**
2. **Type**: Metric
3. **Metric**: `trace.web.request.hits{http.status_code:200}`
4. **Alert condition**: `< 100 requests in last 5 minutes`

---

## Complete Deployment Checklist

```bash
# 1. Create namespace
kubectl create namespace mern

# 2. Create ConfigMap and Secret
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml

# 3. Deploy backend
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml

# 4. Deploy frontend
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# 5. Verify deployments
kubectl get all -n mern

# 6. Install Datadog Agent
helm install datadog datadog/datadog -f datadog-values.yaml

# 7. Verify Datadog Agent
kubectl get pods | grep datadog

# 8. Check logs
kubectl logs -f deployment/backend -n mern

# 9. Access application
# Frontend: http://localhost:30000
# Backend: http://localhost:30001/api/products
# Health: http://localhost:30001/observability/health
# Metrics: http://localhost:30001/observability/metrics
```

---

## Datadog Integration Steps Summary

### Step 1: Get API Key
- Sign up at datadoghq.com
- Copy API key from settings

### Step 2: Install Agent
```bash
helm install datadog datadog/datadog \
  --set datadog.apiKey=YOUR_KEY \
  --set datadog.logs.enabled=true \
  --set datadog.apm.enabled=true
```

### Step 3: Configure Application
- Update logger to output JSON
- Add Datadog environment variables
- Ensure health check endpoints work

### Step 4: Monitor in Datadog
- View logs: Logs → Filter by service
- View metrics: Metrics → Search
- Create monitors: Monitors → New Monitor
- Setup alerts: Email/Slack notifications

### Step 5: Create Dashboards
- Dashboard → New Dashboard
- Add widgets for:
  - Request rate
  - Error rate (500s)
  - Success rate (200s)
  - Health check status
  - Pod metrics

---

## Troubleshooting

### Logs Not Appearing in Datadog

```bash
# 1. Check Datadog Agent is running
kubectl get pods | grep datadog

# 2. Check agent logs
kubectl logs -f daemonset/datadog-agent

# 3. Verify API key
kubectl get secret datadog-secret -o yaml

# 4. Check application logs
kubectl logs -f deployment/backend -n mern
```

### Health Check Failing

```bash
# Test health endpoint
curl http://localhost:30001/observability/health

# Check backend logs
kubectl logs -f deployment/backend -n mern

# Describe pod
kubectl describe pod <backend-pod> -n mern
```

### Metrics Not Showing

```bash
# Test metrics endpoint
curl http://localhost:30001/observability/metrics

# Verify Prometheus scrape config
kubectl get configmap -n default
```

---

## Summary

**Deployment Architecture:**
- Single node Kubernetes cluster
- MERN namespace with 2 frontend + 2 backend replicas
- MongoDB Atlas for database
- NodePort services for external access
- Datadog Agent for monitoring

**Datadog Integration:**
- Collects application logs (JSON format)
- Monitors health check endpoints
- Tracks HTTP status codes (200, 500, etc.)
- Scrapes Prometheus metrics
- Creates alerts and dashboards

**Access Points:**
- Frontend: http://localhost:30000
- Backend API: http://localhost:30001/api
- Health: http://localhost:30001/observability/health
- Metrics: http://localhost:30001/observability/metrics
- Datadog: https://app.datadoghq.com/
