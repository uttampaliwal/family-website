# 📊 Family Portal - Monitoring Platform Integration Setup

## 🎯 **Quick Start Integration**

Your Family Portal now has **enterprise-grade structured logging** ready for immediate integration with major monitoring platforms. All logs are in JSON format with rich contextual metadata.

---

## 🔥 **Datadog Integration (Recommended)**

### **1. Backend Integration**

#### **Install Datadog Agent**

```bash
# Add Datadog repository
curl -o /tmp/datadog-agent-7-1-key.asc https://keys.datadoghq.com/DATADOG_APT_KEY_CURRENT.asc
sudo apt-key add /tmp/datadog-agent-7-1-key.asc
echo "deb https://apt.datadoghq.com/ stable 7" | sudo tee /etc/apt/sources.list.d/datadog.list

# Install agent
sudo apt update
sudo apt install datadog-agent

# Configure API key
sudo sh -c "sed 's/api_key:.*/api_key: YOUR_API_KEY/' /etc/datadog-agent/datadog.yaml.example > /etc/datadog-agent/datadog.yaml"
```

#### **Log Collection Setup**

```yaml
# /etc/datadog-agent/conf.d/family-portal.yaml
logs:
  - type: file
    path: "/var/log/family-portal/*.log"
    service: "family-portal-api"
    source: "nodejs"
    tags:
      - env:production
      - team:family-portal

  - type: docker
    image: "family-portal-api"
    service: "family-portal-api"
    source: "nodejs"
```

#### **Application Metrics**

```javascript
// Add to apps/api/src/config/datadog.ts
import { dogstatsd } from 'node-dogstatsd-client';

const client = new dogstatsd.StatsD('localhost', 8125);

export const metrics = {
  increment: (metric: string, tags?: string[]) => {
    client.increment(metric, 1, tags);
  },
  histogram: (metric: string, value: number, tags?: string[]) => {
    client.histogram(metric, value, tags);
  },
  gauge: (metric: string, value: number, tags?: string[]) => {
    client.gauge(metric, value, tags);
  }
};

// Usage in your controllers
metrics.increment('family_portal.user.login', ['status:success']);
metrics.histogram('family_portal.database.query_time', queryDuration);
```

### **2. Frontend Integration (RUM)**

```javascript
// Add to apps/web/src/config/datadog.ts
import { datadogRum } from '@datadog/browser-rum';

if (import.meta.env.PROD) {
  datadogRum.init({
    applicationId: 'YOUR_APP_ID',
    clientToken: 'YOUR_CLIENT_TOKEN',
    site: 'datadoghq.com',
    service: 'family-portal-web',
    env: 'production',
    version: '1.0.0',
    sessionSampleRate: 100,
    trackInteractions: true,
    trackResources: true,
    trackLongTasks: true,
  });
}

// Enhanced error logger integration
export const sendToDatadog = (error: Error, context: any) => {
  if (import.meta.env.PROD) {
    datadogRum.addError(error, context);
  }
};
```

---

## 📈 **Splunk Integration**

### **1. HTTP Event Collector Setup**

```javascript
// Add to apps/api/src/config/splunk.ts
import { Logger as SplunkLogger } from 'splunk-logging';

const splunkLogger = new SplunkLogger({
  token: process.env.SPLUNK_HEC_TOKEN,
  url: process.env.SPLUNK_URL,
  index: 'family_portal',
  sourcetype: 'family_portal:api'
});

// Integration with existing logger
import { logger } from './logger';

const originalInfo = logger.info;
const originalError = logger.error;

logger.info = function(obj: any, msg?: string) {
  // Send to Pino (console/file)
  originalInfo.call(this, obj, msg);

  // Send to Splunk
  splunkLogger.send({
    message: {
      level: 'info',
      data: obj,
      message: msg,
      timestamp: new Date().toISOString()
    }
  });
};

logger.error = function(obj: any, msg?: string) {
  originalError.call(this, obj, msg);

  splunkLogger.send({
    message: {
      level: 'error',
      data: obj,
      message: msg,
      timestamp: new Date().toISOString()
    }
  });
};
```

### **2. Dashboard Queries**

```spl
# Error Rate Monitoring
index="family_portal" level=error
| timechart span=5m count by operation

# User Authentication Tracking
index="family_portal" operation=user_login
| stats count by level
| eval success_rate=round((info/(info+error))*100, 2)

# Performance Monitoring
index="family_portal" operation=*document*
| eval duration_ms=tonumber(duration)
| stats avg(duration_ms) as avg_duration by operation

# Database Query Performance
index="family_portal" "database query"
| rex field=_raw "executionTime\":(?<exec_time>\d+)"
| stats avg(exec_time) as avg_time by query
```

---

## 🎨 **Grafana + Loki Setup**

### **1. Docker Compose Integration**

```yaml
# monitoring/docker-compose.yml
version: "3.8"
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
      - loki_data:/loki

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro

volumes:
  loki_data:
  grafana_data:
```

### **2. Promtail Configuration**

```yaml
# promtail-config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: family-portal-api
    static_configs:
      - targets:
          - localhost
        labels:
          job: family-portal-api
          __path__: /var/log/family-portal/*.log

  - job_name: docker-containers
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ["__meta_docker_container_name"]
        regex: "/family-portal.*"
        target_label: __tmp_docker_container_name
```

### **3. Ready-to-Import Dashboard**

```json
{
  "dashboard": {
    "title": "Family Portal Monitoring",
    "panels": [
      {
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate({service=\"family-portal-api\"} |= \"error\" [5m])",
            "legendFormat": "Errors/sec"
          }
        ]
      },
      {
        "title": "Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "{service=\"family-portal-api\"} |= \"Request performance\" | json | duration != \"\" | unwrap duration",
            "legendFormat": "Response Time"
          }
        ]
      },
      {
        "title": "User Operations",
        "type": "table",
        "targets": [
          {
            "expr": "sum by (operation) (count_over_time({service=\"family-portal-api\"} |= \"operation\" [1h]))",
            "legendFormat": "{{operation}}"
          }
        ]
      }
    ]
  }
}
```

---

This is the first part of the monitoring setup. Let me continue with more platforms and fix the lint issues next.

Would you like me to continue with:

1. More monitoring platforms (New Relic, ELK Stack)
2. Fix remaining lint/build issues
3. Create alerting configurations?
