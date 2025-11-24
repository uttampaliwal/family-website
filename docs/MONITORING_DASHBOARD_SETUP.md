# 🔥 Family Portal - Monitoring Dashboard Setup Guide

## 🎯 **Production-Ready Monitoring Architecture**

The Family Portal now has **enterprise-grade structured logging** that's ready for monitoring tools like Datadog, Splunk, New Relic, and custom dashboards.

---

## 📊 **Structured Logging Overview**

### **Backend Logging (Pino JSON Format)**

```json
{
  "level": "error",
  "time": "2024-01-15T10:30:00.000Z",
  "context": "user_authentication",
  "userId": "user_12345",
  "operation": "login_attempt",
  "message": "Authentication failed",
  "err": {
    "message": "Invalid credentials",
    "stack": "..."
  },
  "metadata": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### **Frontend Logging (Structured Error Context)**

```json
{
  "level": "error",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "operation": "document_creation",
  "message": "Failed to create document",
  "metadata": {
    "userId": "user_12345",
    "documentTitle": "Family Budget"
  },
  "userAgent": "Mozilla/5.0...",
  "url": "https://family-portal.com/documents/new"
}
```

---

## 🚀 **Monitoring Tool Integration**

### **1. Datadog Integration**

#### **Backend Setup (Node.js)**

```javascript
// Add to apps/api/src/config/monitoring.ts
import { createLogger } from "datadog-winston";

const datadogLogger = createLogger({
  apiKey: process.env.DATADOG_API_KEY,
  hostname: process.env.HOST,
  service: "family-portal-api",
  ddsource: "nodejs",
  ddtags: "env:production,version:1.0.0",
});

// Pipe our Pino logs to Datadog
logger.addDestination(datadogLogger);
```

#### **Frontend Setup (React)**

```javascript
// Add to apps/web/src/utils/monitoring.ts
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: process.env.REACT_APP_DATADOG_APP_ID,
  clientToken: process.env.REACT_APP_DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'family-portal-web',
  env: 'production',
  version: '1.0.0',
  trackInteractions: true,
  trackResources: true,
  trackLongTasks: true,
});

// Enhanced error logger integration
export const sendToDatadog = (error: Error, context: any) => {
  datadogRum.addError(error, context);
};
```

### **2. Splunk Integration**

#### **HTTP Event Collector Setup**

```javascript
// apps/api/src/config/splunk.ts
const splunkLogger = require("splunk-logging").Logger({
  token: process.env.SPLUNK_HEC_TOKEN,
  url: process.env.SPLUNK_URL,
  index: "family-portal",
  sourcetype: "nodejs",
});

// Pipe structured logs to Splunk
logger.addDestination({
  write: (chunk) => {
    splunkLogger.send(JSON.parse(chunk));
  },
});
```

### **3. Grafana + Loki Setup**

#### **Docker Compose Configuration**

```yaml
# monitoring/docker-compose.yml
version: "3.8"
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log:ro
```

---

## 📈 **Key Metrics & Dashboards**

### **1. Application Health Dashboard**

- **Error Rate**: Count of errors per minute/hour
- **Response Times**: P95/P99 response times by endpoint
- **User Authentication**: Success/failure rates
- **Database Performance**: Query execution times

### **2. User Experience Dashboard**

- **Document Operations**: Creation, editing, deletion success rates
- **Frontend Errors**: JavaScript errors by page
- **Performance Metrics**: Page load times, resource loading
- **User Journey**: Authentication → Document usage flow

### **3. Security Monitoring Dashboard**

- **Failed Login Attempts**: Grouped by IP/user
- **Rate Limiting Events**: API abuse detection
- **Authentication Anomalies**: Suspicious login patterns
- **Error Injection Attempts**: Security-related errors

---

## 🔍 **Log Query Examples**

### **Datadog Queries**

```sql
-- Find authentication failures
source:family-portal-api status:error operation:user_login

-- Monitor slow API responses
source:family-portal-api @duration:>1000 service:api

-- Track document operations
source:family-portal-api operation:*document* status:info
```

### **Splunk Queries**

```spl
index="family-portal" level=error operation="user_*"
| stats count by operation
| sort -count

index="family-portal" level=warn duration>1000
| timechart span=1h avg(duration) by operation

index="family-portal" context="document_*"
| stats count by context, level
```

### **Grafana/Loki Queries**

```logql
{service="family-portal-api"} |= "error" | json | operation =~ "user_.*"

rate({service="family-portal-api"} |= "slow request" [5m])

{service="family-portal-web"} |= "operation" | json | operation =~ "document_.*"
```

---

## 🚨 **Alerting Rules**

### **Critical Alerts**

```yaml
# Error rate spike
- alert: HighErrorRate
  expr: rate(log_entries{level="error"}[5m]) > 10
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"

# Authentication failures
- alert: AuthenticationFailures
  expr: increase(log_entries{operation="user_login", level="error"}[10m]) > 50
  labels:
    severity: warning
  annotations:
    summary: "Multiple authentication failures"

# Database performance
- alert: SlowDatabaseQueries
  expr: avg(database_query_duration) > 2000
  labels:
    severity: warning
  annotations:
    summary: "Database queries running slowly"
```

---

## 🎛️ **Environment Setup**

### **Production Environment Variables**

```bash
# Monitoring Configuration
DATADOG_API_KEY=your_datadog_api_key
SPLUNK_HEC_TOKEN=your_splunk_token
GRAFANA_URL=https://your-grafana.com

# Logging Configuration
LOG_LEVEL=info
STRUCTURED_LOGGING=true
MONITORING_ENABLED=true

# Performance Monitoring
SLOW_REQUEST_THRESHOLD=1000
ERROR_SAMPLING_RATE=1.0
```

### **Development Environment**

```bash
# apps/api/.env.development
LOG_LEVEL=debug
STRUCTURED_LOGGING=true
MONITORING_ENABLED=false

# apps/web/.env.development
REACT_APP_LOG_LEVEL=debug
REACT_APP_MONITORING_ENABLED=false
```

---

## 🔧 **Implementation Checklist**

### **✅ Already Implemented**

- [x] **Structured Pino logging** throughout backend
- [x] **Contextual error metadata** (user IDs, operation types)
- [x] **Frontend error boundaries** with structured logging
- [x] **Performance monitoring** middleware
- [x] **Security-focused logging** with sanitization
- [x] **Development vs Production** logging configuration

### **🎯 Ready to Implement**

- [ ] **Choose monitoring platform** (Datadog/Splunk/Grafana)
- [ ] **Set up log shipping** pipeline
- [ ] **Create monitoring dashboards**
- [ ] **Configure alerting rules**
- [ ] **Set up log retention** policies
- [ ] **Implement log rotation** and cleanup

---

## 🚀 **Quick Start Commands**

```bash
# Start monitoring stack (Grafana example)
cd monitoring
docker-compose up -d

# View logs in structured format
cd apps/api && npm start | pino-pretty

# Test error logging
curl -X POST localhost:3001/api/auth/login \
  -d '{"email":"invalid","password":"wrong"}' \
  -H "Content-Type: application/json"

# Monitor log output
tail -f logs/family-portal.log | jq '.level="error"'
```

---

## 📚 **Documentation & Resources**

- **Pino Documentation**: https://getpino.io/
- **Datadog Node.js**: https://docs.datadoghq.com/logs/log_collection/nodejs/
- **Grafana Loki**: https://grafana.com/docs/loki/
- **Monitoring Best Practices**: https://sre.google/sre-book/monitoring-distributed-systems/

---

**🎉 Result**: Your Family Portal now has **enterprise-grade monitoring** capabilities with structured logging, contextual metadata, and seamless integration with major monitoring platforms!
