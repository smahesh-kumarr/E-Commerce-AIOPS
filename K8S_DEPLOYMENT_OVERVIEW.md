# Kubernetes Deployment Overview - MERN E-Commerce

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Single Node Master Kubeadm Cluster                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         MERN Namespace                                 │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    Frontend Deployment                           │ │ │
│  │  │  ┌─────────────────────┐  ┌─────────────────────┐              │ │ │
│  │  │  │  Frontend Pod #1    │  │  Frontend Pod #2    │              │ │ │
│  │  │  │  (React App)        │  │  (React App)        │              │ │ │
│  │  │  │  Port: 3000         │  │  Port: 3000         │              │ │ │
│  │  │  └─────────────────────┘  └─────────────────────┘              │ │ │
│  │  │           ↓                          ↓                          │ │ │
│  │  │  ┌──────────────────────────────────────────────┐              │ │ │
│  │  │  │      Frontend Service (NodePort)             │              │ │ │
│  │  │  │      Port: 30000 → 3000                      │              │ │ │
│  │  │  └──────────────────────────────────────────────┘              │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    Backend Deployment                            │ │ │
│  │  │  ┌─────────────────────┐  ┌─────────────────────┐              │ │ │
│  │  │  │  Backend Pod #1     │  │  Backend Pod #2     │              │ │ │
│  │  │  │  (Node.js API)      │  │  (Node.js API)      │              │ │ │
│  │  │  │  Port: 5000         │  │  Port: 5000         │              │ │ │
│  │  │  │  Health: /health    │  │  Health: /health    │              │ │ │
│  │  │  │  Metrics: /metrics  │  │  Metrics: /metrics  │              │ │ │
│  │  │  └─────────────────────┘  └─────────────────────┘              │ │ │
│  │  │           ↓                          ↓                          │ │ │
│  │  │  ┌──────────────────────────────────────────────┐              │ │ │
│  │  │  │      Backend Service (NodePort)              │              │ │ │
│  │  │  │      Port: 30001 → 5000                      │              │ │ │
│  │  │  └──────────────────────────────────────────────┘              │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │                  Datadog Agent (DaemonSet)                       │ │ │
│  │  │  ┌──────────────────────────────────────────────────────────┐  │ │ │
│  │  │  │  Collects:                                               │  │ │ │
│  │  │  │  - Application Logs (JSON format)                        │  │ │ │
│  │  │  │  - Metrics (/observability/metrics)                      │  │ │ │
│  │  │  │  - Health Check Status (/observability/health)           │  │ │ │
│  │  │  │  - HTTP Status Codes (200, 500, etc.)                    │  │ │ │
│  │  │  │  - Container Metrics (CPU, Memory)                       │  │ │ │
│  │  │  │  - Pod Metrics                                           │  │ │ │
│  │  │  └──────────────────────────────────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      Datadog Namespace                                 │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Datadog Agent DaemonSet                                         │ │ │
│  │  │  Datadog Cluster Agent                                           │ │ │
│  │  │  Kube State Metrics                                              │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                    ┌─────────────────────────────────┐
                    │      MongoDB Atlas (Cloud)      │
                    │  mongodb+srv://user:pass@...    │
                    │  (External Database)            │
                    └─────────────────────────────────┘
                                      ↓
                    ┌─────────────────────────────────┐
                    │    Datadog Cloud Platform       │
                    │  - Logs Dashboard               │
                    │  - Metrics Dashboard            │
                    │  - Alerts & Monitors            │
                    │  - Health Check Monitoring      │
                    └─────────────────────────────────┘
```

---

## Deployment Components

### 1. Kubernetes Cluster
- **Type**: Single Node Master (Kubeadm)
- **Nodes**: 1 (Master + Worker)
- **Container Runtime**: Docker
- **Network Plugin**: Flannel/Weave/Calico

### 2. MERN Namespace
Isolated namespace for application resources

#### Frontend Deployment
- **Replicas**: 2
- **Image**: `your-registry/ecommerce-frontend:latest`
- **Port**: 3000
- **Service Type**: NodePort (30000)
- **Resources**: 128Mi memory, 100m CPU

#### Backend Deployment
- **Replicas**: 2
- **Image**: `your-registry/ecommerce-backend:latest`
- **Port**: 5000
- **Service Type**: NodePort (30001)
- **Resources**: 256Mi memory, 250m CPU
- **Health Checks**:
  - Liveness: `/observability/health` (30s delay, 10s interval)
  - Readiness: `/observability/ready` (10s delay, 5s interval)

### 3. MongoDB Atlas
- **Type**: Cloud Database
- **Connection**: External via connection string
- **Authentication**: Username/Password in Secret
- **Database**: `ecommerce`

### 4. Datadog Integration
- **Agent Type**: DaemonSet (one per node)
- **Cluster Agent**: For Kubernetes metadata
- **Kube State Metrics**: For cluster metrics
- **Log Collection**: From container stdout/stderr
- **Metrics Collection**: Prometheus format
- **APM**: Application Performance Monitoring

---

## Data Flow

### Request Flow
```
User Browser
    ↓
Frontend Service (NodePort 30000)
    ↓
Frontend Pod (React App)
    ↓
Backend Service (NodePort 30001)
    ↓
Backend Pod (Node.js API)
    ↓
MongoDB Atlas (Cloud)
```

### Logging Flow
```
Backend Pod (stdout/stderr)
    ↓
Docker Container Logs
    ↓
Datadog Agent (DaemonSet)
    ↓
Datadog Cloud Platform
    ↓
Logs Dashboard / Alerts
```

### Metrics Flow
```
Backend Pod (/observability/metrics)
    ↓
Prometheus Format
    ↓
Datadog Agent (Scrape)
    ↓
Datadog Cloud Platform
    ↓
Metrics Dashboard / Alerts
```

### Health Check Flow
```
Kubernetes Kubelet
    ↓
Liveness Probe (/observability/health)
    ↓
Pod Status Check
    ↓
Auto-restart if unhealthy
    ↓
Datadog Agent (Monitor)
    ↓
Alert if health check fails
```

---

## Deployment Workflow

### Phase 1: Preparation
1. Build Docker images
2. Push to registry
3. Create Kubernetes cluster
4. Setup kubeconfig

### Phase 2: Kubernetes Setup
1. Create MERN namespace
2. Create ConfigMap (environment variables)
3. Create Secret (sensitive data)
4. Deploy backend (deployment + service)
5. Deploy frontend (deployment + service)

### Phase 3: Datadog Setup
1. Create Datadog account
2. Get API key
3. Install Datadog Agent (Helm)
4. Verify agent is running
5. Verify logs are being collected

### Phase 4: Monitoring Setup
1. Create monitors for 500 errors
2. Create monitors for 200 status codes
3. Create health check monitor
4. Create custom dashboard
5. Setup email/Slack alerts

### Phase 5: Verification
1. Test frontend: http://localhost:30000
2. Test backend: http://localhost:30001/api/products
3. Test health: http://localhost:30001/observability/health
4. Test metrics: http://localhost:30001/observability/metrics
5. Verify logs in Datadog UI
6. Verify metrics in Datadog UI

---

## Access Points

| Service | URL | Port | Type |
|---------|-----|------|------|
| Frontend | http://localhost:30000 | 30000 | NodePort |
| Backend API | http://localhost:30001/api | 30001 | NodePort |
| Health Check | http://localhost:30001/observability/health | 30001 | NodePort |
| Metrics | http://localhost:30001/observability/metrics | 30001 | NodePort |
| Datadog Logs | https://app.datadoghq.com/logs | - | Cloud |
| Datadog Metrics | https://app.datadoghq.com/metrics | - | Cloud |
| Datadog Monitors | https://app.datadoghq.com/monitors | - | Cloud |

---

## Datadog Monitoring

### What Gets Collected

#### Logs
- Application logs (JSON format)
- Container logs
- Kubernetes events
- Pod lifecycle events

#### Metrics
- HTTP request rate
- HTTP error rate (500s)
- HTTP success rate (200s)
- Request duration
- Custom application metrics
- CPU usage per pod
- Memory usage per pod
- Network I/O
- Disk I/O

#### Health Checks
- `/observability/health` endpoint status
- `/observability/ready` endpoint status
- Pod restart count
- Container restart count
- Node status

#### Status Codes
- 200 (Success) - Tracked
- 400 (Bad Request) - Tracked
- 401 (Unauthorized) - Tracked
- 403 (Forbidden) - Tracked
- 404 (Not Found) - Tracked
- 500 (Server Error) - Tracked with alerts
- 502 (Bad Gateway) - Tracked
- 503 (Service Unavailable) - Tracked

### Monitors Created

1. **High Error Rate Monitor**
   - Alert when: > 10 errors in 5 minutes
   - Severity: Critical
   - Notification: Email + Slack

2. **Health Check Monitor**
   - Alert when: Health endpoint returns non-200
   - Severity: Critical
   - Notification: Email + Slack + PagerDuty

3. **Low Success Rate Monitor**
   - Alert when: < 100 successful requests in 5 minutes
   - Severity: Warning
   - Notification: Email

4. **Pod Restart Monitor**
   - Alert when: Pod restarts > 3 times in 1 hour
   - Severity: Warning
   - Notification: Email

---

## Kubernetes Resources

### ConfigMap
```yaml
- NODE_ENV: production
- PORT: 5000
- LOG_LEVEL: info
- REACT_APP_API_URL: http://localhost:30001/api
```

### Secret
```yaml
- MONGODB_URI: mongodb+srv://...
- JWT_SECRET: secret_key
- DATADOG_API_KEY: datadog_key
- DATADOG_SITE: datadoghq.com
```

### Deployments
- Frontend: 2 replicas, 128Mi memory, 100m CPU
- Backend: 2 replicas, 256Mi memory, 250m CPU

### Services
- Frontend: NodePort 30000
- Backend: NodePort 30001

### DaemonSet
- Datadog Agent: 1 per node

---

## Datadog Integration Steps

### Step 1: Create Account
- Sign up at datadoghq.com
- Free tier available

### Step 2: Get API Key
- Settings → API Keys
- Copy key

### Step 3: Install Agent
```bash
helm install datadog datadog/datadog \
  --set datadog.apiKey=YOUR_KEY \
  --set datadog.logs.enabled=true \
  --set datadog.apm.enabled=true
```

### Step 4: Configure Application
- Add Datadog env vars to deployment
- Update logger to JSON format
- Ensure health check endpoints work

### Step 5: Create Monitors
- 500 error monitor
- Health check monitor
- Success rate monitor
- Pod restart monitor

### Step 6: Create Dashboard
- Request rate widget
- Error rate widget
- Success rate widget
- Health status widget
- Pod metrics widget
- Log stream widget

### Step 7: Setup Alerts
- Email notifications
- Slack integration
- PagerDuty integration

---

## Deployment Checklist

### Pre-Deployment
- [ ] Kubernetes cluster created
- [ ] Docker images built and pushed
- [ ] MongoDB Atlas account created
- [ ] Datadog account created
- [ ] API keys obtained

### Kubernetes Setup
- [ ] MERN namespace created
- [ ] ConfigMap created
- [ ] Secret created
- [ ] Backend deployment created
- [ ] Backend service created
- [ ] Frontend deployment created
- [ ] Frontend service created

### Verification
- [ ] Frontend accessible at :30000
- [ ] Backend accessible at :30001
- [ ] Health check returns 200
- [ ] Metrics endpoint returns data
- [ ] Database connection works

### Datadog Setup
- [ ] Agent installed
- [ ] Logs appearing in UI
- [ ] Metrics being collected
- [ ] Monitors created
- [ ] Dashboard created
- [ ] Alerts configured

---

## Troubleshooting Guide

### Pod Not Starting
```bash
kubectl describe pod <pod-name> -n mern
kubectl logs <pod-name> -n mern
```

### Service Not Accessible
```bash
kubectl get svc -n mern
kubectl port-forward svc/backend-service 5000:5000 -n mern
```

### Datadog Agent Not Running
```bash
kubectl get pods -n datadog
kubectl logs -f daemonset/datadog-agent -n datadog
```

### Logs Not Appearing
```bash
# Check agent status
kubectl exec -it <agent-pod> -n datadog -- agent status

# Check application logs
kubectl logs -f deployment/backend -n mern
```

### Database Connection Failed
```bash
# Verify secret
kubectl get secret backend-secret -n mern -o yaml

# Test connection from pod
kubectl exec -it <backend-pod> -n mern -- \
  mongosh "mongodb+srv://..."
```

---

## Performance Considerations

### Resource Limits
- Frontend: 128Mi memory, 100m CPU (per pod)
- Backend: 256Mi memory, 250m CPU (per pod)
- Datadog Agent: 256Mi memory, 200m CPU

### Scaling
- Frontend: Scale to 3-5 replicas for high traffic
- Backend: Scale to 3-5 replicas for high traffic
- Use HPA (Horizontal Pod Autoscaler) for auto-scaling

### Database
- MongoDB Atlas handles scaling
- Use connection pooling in backend
- Monitor connection count

---

## Security Considerations

### Secrets Management
- Use Kubernetes Secrets for sensitive data
- Rotate API keys regularly
- Use RBAC for access control

### Network Policies
- Restrict traffic between pods
- Use NetworkPolicy resources
- Implement ingress rules

### Pod Security
- Run as non-root user
- Use read-only filesystem
- Implement resource quotas

---

## Summary

**Deployment Architecture:**
- Single node Kubernetes cluster
- MERN namespace with 2 frontend + 2 backend replicas
- MongoDB Atlas for external database
- NodePort services for external access
- Datadog Agent for comprehensive monitoring

**Datadog Integration:**
- Collects application logs in JSON format
- Monitors health check endpoints
- Tracks HTTP status codes (200, 500, etc.)
- Scrapes Prometheus metrics
- Creates alerts and dashboards
- Provides real-time monitoring

**Access Points:**
- Frontend: http://localhost:30000
- Backend: http://localhost:30001/api
- Health: http://localhost:30001/observability/health
- Metrics: http://localhost:30001/observability/metrics
- Datadog: https://app.datadoghq.com/

**Next Steps:**
1. Follow KUBERNETES_DEPLOYMENT.md for detailed setup
2. Follow DATADOG_INTEGRATION.md for monitoring setup
3. Deploy and verify all components
4. Create monitors and dashboards
5. Setup alerts and notifications
