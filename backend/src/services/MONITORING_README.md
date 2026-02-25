# Resource Usage Monitoring

## Overview

The monitoring service tracks resource usage to ensure the application stays within free-tier limits for hosting platforms like Render, Railway, or Fly.io.

## Features

### 1. Database Size Monitoring
- Tracks SQLite database file size
- **Warning threshold**: 400MB (80% of 500MB limit)
- **Critical threshold**: 500MB (free-tier limit)
- Logs warnings when approaching limits

### 2. API Response Time Monitoring
- Tracks all API request response times
- Logs slow requests (>1000ms)
- Calculates rolling average from last 1000 requests
- Warns if average response time exceeds 1000ms

### 3. Memory Usage Monitoring
- Tracks Node.js heap memory usage
- **Warning threshold**: 400MB (80% of 512MB limit)
- **Critical threshold**: 512MB (typical free-tier limit)
- Logs warnings when approaching limits

### 4. Periodic Monitoring
- Runs checks every 5 minutes
- Logs all warnings to console
- Automatic startup with server

## Usage

The monitoring service is automatically started when the server starts:

```typescript
import { startMonitoring, responseTimeMiddleware } from './services/monitoring';

// Add response time tracking middleware
app.use(responseTimeMiddleware);

// Start monitoring (called in server startup)
startMonitoring();
```

## Console Output Examples

```
🔍 Starting resource monitoring (5 minute intervals)
⚠️  Database size warning: 420.50MB (84.1% of 500MB limit)
⚠️  Memory usage warning: 450.25MB (88.1% of 512MB limit)
⚠️  Slow request detected: 1250ms
⚠️  Average response time high: 1100ms
🚨 DATABASE SIZE LIMIT REACHED: 505.00MB / 500MB
🚨 MEMORY LIMIT REACHED: 515.00MB / 512MB
```

## Manual Metrics Access

You can programmatically access current metrics:

```typescript
import { getResourceMetrics } from './services/monitoring';

const metrics = await getResourceMetrics();
console.log(metrics);
// {
//   databaseSize: 419430400,
//   memoryUsage: 471859200,
//   activeConnections: 0,
//   averageResponseTime: 245.5
// }
```

## Thresholds

| Resource | Warning | Critical | Notes |
|----------|---------|----------|-------|
| Database | 400MB | 500MB | SQLite file size |
| Memory | 400MB | 512MB | Node.js heap usage |
| Response Time | 1000ms | N/A | Per-request and average |

## Free-Tier Limits Reference

Common free-tier limits across platforms:
- **Render**: 512MB RAM, no storage limit but performance degrades
- **Railway**: 512MB RAM, 1GB storage
- **Fly.io**: 256MB RAM (shared), 1GB storage
- **Heroku**: 512MB RAM, 10k rows (Postgres)

This monitoring helps you stay within these limits and get early warnings before hitting hard limits.
