# Deployment Guide

## Local Development Setup

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone <repo-url>
cd E-Commerce

# Start all services
docker-compose up -d

# Services will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

### Manual Setup

#### Backend

```bash
cd backend
npm install
cp .env.example .env

# Edit .env with your configuration
# Start MongoDB
docker run -d -p 27017:27017 mongo:latest

# Start backend
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

## Production Deployment

### Environment Variables

Create `.env` file with production values:

```env
# Backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ecommerce
JWT_SECRET=<generate-strong-random-string>
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
LOG_LEVEL=warn

# Datadog
DATADOG_API_KEY=<your-datadog-api-key>
DATADOG_SITE=datadoghq.com
```

### Docker Deployment

#### Build Images

```bash
# Backend
cd backend
docker build -t ecommerce-api:1.0.0 .

# Frontend
cd frontend
docker build -t ecommerce-web:1.0.0 .
```

#### Push to Registry

```bash
# Docker Hub
docker tag ecommerce-api:1.0.0 username/ecommerce-api:1.0.0
docker push username/ecommerce-api:1.0.0

docker tag ecommerce-web:1.0.0 username/ecommerce-web:1.0.0
docker push username/ecommerce-web:1.0.0
```

### Kubernetes Deployment

#### Prerequisites

- kubectl configured
- Kubernetes cluster running
- Docker images pushed to registry

#### Create Namespace

```bash
kubectl create namespace ecommerce
```

#### Create Secrets

```bash
kubectl create secret generic ecommerce-secrets \
  --from-literal=mongodb-uri='mongodb+srv://...' \
  --from-literal=jwt-secret='your-secret' \
  --from-literal=datadog-api-key='your-key' \
  -n ecommerce
```

#### Deploy MongoDB

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
  namespace: ecommerce
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
        volumeMounts:
        - name: mongodb-data
          mountPath: /data/db
      volumes:
      - name: mongodb-data
        persistentVolumeClaim:
          claimName: mongodb-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb
  namespace: ecommerce
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
  clusterIP: None
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
  namespace: ecommerce
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

#### Deploy Backend

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-api
  namespace: ecommerce
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ecommerce-api
  template:
    metadata:
      labels:
        app: ecommerce-api
    spec:
      containers:
      - name: api
        image: username/ecommerce-api:1.0.0
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: ecommerce-secrets
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: ecommerce-secrets
              key: jwt-secret
        - name: DATADOG_API_KEY
          valueFrom:
            secretKeyRef:
              name: ecommerce-secrets
              key: datadog-api-key
        livenessProbe:
          httpGet:
            path: /observability/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /observability/ready
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: ecommerce-api
  namespace: ecommerce
spec:
  selector:
    app: ecommerce-api
  ports:
  - port: 5000
    targetPort: 5000
  type: LoadBalancer
```

#### Deploy Frontend

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-web
  namespace: ecommerce
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ecommerce-web
  template:
    metadata:
      labels:
        app: ecommerce-web
    spec:
      containers:
      - name: web
        image: username/ecommerce-web:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: REACT_APP_API_URL
          value: "https://api.example.com"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: ecommerce-web
  namespace: ecommerce
spec:
  selector:
    app: ecommerce-web
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### AWS ECS Deployment

#### Task Definition

```json
{
  "family": "ecommerce-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "username/ecommerce-api:1.0.0",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:mongodb-uri"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ecommerce-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create app
heroku create ecommerce-api

# Add MongoDB Atlas
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

## Monitoring Setup

### Prometheus

```bash
# Start Prometheus
docker run -d \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### Grafana

```bash
# Start Grafana
docker run -d \
  -p 3001:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin \
  grafana/grafana
```

Access at `http://localhost:3001` (admin/admin)

### Datadog Agent

```bash
# Install agent
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=<your-api-key> \
DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_agent.sh)"

# Configure log collection
# Edit /etc/datadog-agent/datadog.yaml
logs_enabled: true

# Add log configuration
# Create /etc/datadog-agent/conf.d/ecommerce.d/conf.yaml
logs:
  - type: file
    path: /path/to/backend/logs/combined.log
    service: ecommerce-api
    source: nodejs
```

## Health Checks

### Liveness Probe

```bash
curl http://localhost:5000/observability/health
```

### Readiness Probe

```bash
curl http://localhost:5000/observability/ready
```

## Scaling

### Horizontal Scaling

```bash
# Kubernetes
kubectl scale deployment ecommerce-api --replicas=5 -n ecommerce

# Docker Swarm
docker service scale ecommerce-api=5
```

### Load Balancing

Use nginx or cloud provider load balancer:

```nginx
upstream backend {
  server api1:5000;
  server api2:5000;
  server api3:5000;
}

server {
  listen 80;
  server_name api.example.com;

  location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location /observability/metrics {
    proxy_pass http://backend;
  }
}
```

## Backup & Recovery

### MongoDB Backup

```bash
# Backup
mongodump --uri "mongodb+srv://user:password@cluster.mongodb.net/ecommerce" \
  --out ./backup

# Restore
mongorestore --uri "mongodb+srv://user:password@cluster.mongodb.net/ecommerce" \
  ./backup/ecommerce
```

### Database Snapshots

```bash
# AWS RDS
aws rds create-db-snapshot \
  --db-instance-identifier ecommerce-db \
  --db-snapshot-identifier ecommerce-backup-$(date +%Y%m%d)
```

## Troubleshooting

### Check Service Status

```bash
# Docker
docker ps
docker logs container-name

# Kubernetes
kubectl get pods -n ecommerce
kubectl logs pod-name -n ecommerce
kubectl describe pod pod-name -n ecommerce

# Systemd
systemctl status ecommerce-api
journalctl -u ecommerce-api -f
```

### Common Issues

**Database Connection Failed**
- Check MONGODB_URI environment variable
- Verify network connectivity
- Check MongoDB service status

**High Memory Usage**
- Check log file sizes
- Review metrics cardinality
- Increase container memory limits

**Slow API Response**
- Check database query performance
- Review Prometheus metrics
- Check network latency

## Performance Optimization

### Caching

```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient();

app.get('/api/products', async (req, res) => {
  const cacheKey = `products:${JSON.stringify(req.query)}`;
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Fetch and cache
  const data = await Product.find(req.query);
  await client.setex(cacheKey, 3600, JSON.stringify(data));
  res.json(data);
});
```

### Database Indexing

```javascript
// Ensure indexes are created
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
```

### CDN for Static Assets

```javascript
// Serve frontend from CDN
app.use(express.static('public', {
  maxAge: '1d',
  etag: false
}));
```

## Security Checklist

- [ ] Change default passwords
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable database authentication
- [ ] Set up firewall rules
- [ ] Enable logging and monitoring
- [ ] Regular security updates
- [ ] API rate limiting
- [ ] Input validation
