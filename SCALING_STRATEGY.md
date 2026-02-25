# Scaling Strategy

This document outlines resource usage, free-tier limitations, and scaling strategies for the Telegram NFT Case Opener as your user base grows.

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [Resource Usage Estimates](#resource-usage-estimates)
3. [Free Tier Limitations](#free-tier-limitations)
4. [Scaling Milestones](#scaling-milestones)
5. [Migration Paths](#migration-paths)
6. [Cost Estimates](#cost-estimates)
7. [Performance Optimization](#performance-optimization)
8. [Database Scaling](#database-scaling)
9. [Caching Strategies](#caching-strategies)
10. [Monitoring and Alerts](#monitoring-and-alerts)

---

## Current Architecture

### Technology Stack

**Backend**:
- Platform: Render (Free tier)
- Runtime: Node.js 18
- Framework: Express.js
- Database: Supabase PostgreSQL (Free tier)

**Frontend**:
- Platform: Vercel (Free tier)
- Framework: React + Vite
- CDN: Vercel Edge Network

**External Services**:
- Telegram Bot API (Free)
- GetGems NFT data (Free scraping)

### Current Deployment

```
┌─────────────────┐
│  Telegram Bot   │
│   (Webhooks)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Vercel CDN     │      │   Render     │
│  (Frontend)     │─────▶│  (Backend)   │
└─────────────────┘      └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  Supabase    │
                         │ (PostgreSQL) │
                         └──────────────┘
```

---

## Resource Usage Estimates

### Per User Metrics

**Storage per user**:
- User record: ~500 bytes
- Average inventory: 10 NFTs × 200 bytes = 2 KB
- Opening history: 50 records × 300 bytes = 15 KB
- **Total per user**: ~17.5 KB

**API requests per user per day**:
- Authentication: 1-2 requests
- Case browsing: 3-5 requests
- Case opening: 2-3 requests
- Inventory/profile: 2-4 requests
- **Total**: 8-14 requests/day

**Database queries per user per day**:
- Reads: 15-25 queries
- Writes: 3-5 queries
- **Total**: 18-30 queries/day

### NFT Data

**Storage per NFT**:
- Metadata: ~1 KB
- Image URL: ~200 bytes
- **Total per NFT**: ~1.2 KB

**Typical collection**: 100-500 NFTs = 120-600 KB

### Case Data

**Storage per case**:
- Case metadata: ~500 bytes
- Case items (10 NFTs): 10 × 100 bytes = 1 KB
- **Total per case**: ~1.5 KB

**Typical setup**: 5-10 cases = 7.5-15 KB

---

## Free Tier Limitations

### Render (Backend)

**Free Tier Limits**:
- ✅ 750 hours/month (enough for 1 service)
- ✅ 512 MB RAM
- ✅ 0.1 CPU
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold start: ~30 seconds
- ✅ Automatic HTTPS
- ✅ Custom domains

**Practical Limits**:
- **Concurrent users**: 10-20 active users
- **Requests/minute**: ~100 (with rate limiting)
- **Database connections**: 5-10 concurrent

**When to upgrade**:
- Consistent 50+ active users
- Cold starts affecting UX
- Need 24/7 availability
- Require more RAM/CPU

### Vercel (Frontend)

**Free Tier Limits**:
- ✅ 100 GB bandwidth/month
- ✅ Unlimited requests
- ✅ Serverless functions (10s timeout)
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Custom domains

**Practical Limits**:
- **Monthly users**: 10,000+ (with typical usage)
- **Bandwidth**: ~10 KB per page load = 10M page loads
- **Build time**: 45 minutes/month free

**When to upgrade**:
- Exceed 100 GB bandwidth
- Need longer function timeouts
- Require team collaboration features

### Supabase (Database)

**Free Tier Limits**:
- ✅ 500 MB database storage
- ✅ 2 GB bandwidth/month
- ✅ 50,000 monthly active users
- ⚠️ Pauses after 7 days of inactivity
- ✅ Automatic backups (7 days)
- ✅ 2 GB file storage

**Practical Limits**:
- **Users**: ~28,000 users (at 17.5 KB each)
- **NFTs**: ~400,000 NFTs (at 1.2 KB each)
- **Queries**: ~2M queries/month
- **Bandwidth**: Depends on query size

**When to upgrade**:
- Approaching 500 MB storage
- Exceed 2 GB bandwidth
- Need longer backup retention
- Require better performance

---

## Scaling Milestones

### Stage 1: 0-100 Users (Free Tier)

**Characteristics**:
- Low traffic, occasional usage
- Cold starts acceptable
- Manual monitoring sufficient

**Infrastructure**:
- ✅ Render Free
- ✅ Vercel Free
- ✅ Supabase Free

**Estimated Costs**: $0/month

**Resource Usage**:
- Database: ~1.75 MB (100 users × 17.5 KB)
- Bandwidth: <1 GB/month
- API requests: ~1,000/day

**Action Items**:
- Monitor usage dashboards
- Optimize queries
- Set up basic error tracking

---

### Stage 2: 100-1,000 Users (Hybrid)

**Characteristics**:
- Regular traffic throughout day
- Cold starts becoming problematic
- Need better monitoring

**Infrastructure**:
- 🔄 Render Starter ($7/month) - **Recommended upgrade**
- ✅ Vercel Free (still sufficient)
- ✅ Supabase Free (still sufficient)

**Estimated Costs**: $7/month

**Resource Usage**:
- Database: ~17.5 MB (1,000 users × 17.5 KB)
- Bandwidth: 5-10 GB/month
- API requests: ~10,000/day

**Action Items**:
- Upgrade Render to eliminate cold starts
- Implement Redis caching (optional)
- Set up automated monitoring
- Optimize database indexes

**Why Upgrade Render**:
- No cold starts (always on)
- Better performance (1 GB RAM)
- Improved reliability
- Better user experience

---

### Stage 3: 1,000-10,000 Users (Paid Tiers)

**Characteristics**:
- Consistent high traffic
- Need for optimization
- Professional monitoring required

**Infrastructure**:
- 🔄 Render Standard ($25/month) - **Recommended**
- 🔄 Vercel Pro ($20/month) - **If bandwidth exceeded**
- 🔄 Supabase Pro ($25/month) - **Recommended**

**Estimated Costs**: $50-70/month

**Resource Usage**:
- Database: ~175 MB (10,000 users × 17.5 KB)
- Bandwidth: 50-100 GB/month
- API requests: ~100,000/day

**Action Items**:
- Implement Redis caching
- Set up CDN for images
- Database connection pooling
- Advanced monitoring (Sentry, DataDog)
- Load testing
- Automated backups

**Optimization Priorities**:
1. Database query optimization
2. API response caching
3. Image optimization and CDN
4. Rate limiting refinement

---

### Stage 4: 10,000+ Users (Enterprise)

**Characteristics**:
- High-scale operations
- Need for redundancy
- Advanced features required

**Infrastructure**:
- 🔄 Render Pro ($85/month) or AWS/GCP
- 🔄 Vercel Pro ($20/month) or Enterprise
- 🔄 Supabase Pro ($25/month) or dedicated PostgreSQL

**Estimated Costs**: $130-500/month

**Resource Usage**:
- Database: 1.75+ GB
- Bandwidth: 500+ GB/month
- API requests: 1M+/day

**Action Items**:
- Multi-region deployment
- Database read replicas
- Advanced caching (Redis Cluster)
- Load balancing
- Microservices architecture
- Professional DevOps

---

## Migration Paths

### Backend Migration

#### From Render Free to Render Starter

**Steps**:
1. Go to Render dashboard
2. Select your service
3. Click "Upgrade" → "Starter"
4. Confirm upgrade
5. Service restarts automatically

**Downtime**: None (rolling upgrade)

**Benefits**:
- No cold starts
- 1 GB RAM (vs 512 MB)
- Always-on availability

#### From Render to AWS/GCP

**When to consider**:
- Need custom infrastructure
- Require specific compliance
- Want more control
- Cost optimization at scale

**Migration steps**:
1. Set up EC2/Compute Engine instance
2. Install Node.js and dependencies
3. Configure environment variables
4. Set up reverse proxy (nginx)
5. Configure SSL certificates
6. Update DNS records
7. Test thoroughly
8. Switch traffic

**Estimated effort**: 1-2 weeks

### Database Migration

#### Supabase Free to Pro

**Steps**:
1. Go to Supabase dashboard
2. Project Settings → Billing
3. Select Pro plan
4. Confirm upgrade

**Downtime**: None

**Benefits**:
- 8 GB storage (vs 500 MB)
- 50 GB bandwidth (vs 2 GB)
- Better performance
- Longer backups (14 days)

#### Supabase to Self-Hosted PostgreSQL

**When to consider**:
- Need more than 8 GB storage
- Require specific PostgreSQL extensions
- Want full control
- Cost optimization at very large scale

**Migration steps**:
1. Set up PostgreSQL server (AWS RDS, GCP Cloud SQL, or self-hosted)
2. Export Supabase database (pg_dump)
3. Import to new database
4. Update connection string in backend
5. Test thoroughly
6. Switch traffic
7. Monitor for issues

**Estimated effort**: 1 week

### Frontend Migration

#### Vercel Free to Pro

**Steps**:
1. Go to Vercel dashboard
2. Account Settings → Billing
3. Select Pro plan
4. Confirm upgrade

**Downtime**: None

**Benefits**:
- 1 TB bandwidth (vs 100 GB)
- Team collaboration
- Advanced analytics
- Priority support

---

## Cost Estimates

### Monthly Cost by User Scale

| Users | Backend | Frontend | Database | Monitoring | Total |
|-------|---------|----------|----------|------------|-------|
| 0-100 | $0 (Render Free) | $0 (Vercel Free) | $0 (Supabase Free) | $0 | **$0** |
| 100-1K | $7 (Render Starter) | $0 (Vercel Free) | $0 (Supabase Free) | $0 | **$7** |
| 1K-5K | $25 (Render Standard) | $0 (Vercel Free) | $25 (Supabase Pro) | $0-10 | **$50-60** |
| 5K-10K | $25 (Render Standard) | $20 (Vercel Pro) | $25 (Supabase Pro) | $10-20 | **$80-90** |
| 10K-50K | $85 (Render Pro) | $20 (Vercel Pro) | $25-100 (Supabase Pro+) | $20-50 | **$150-255** |
| 50K+ | $200+ (Custom) | $20-150 | $100-500 | $50-200 | **$370-1050** |

### Additional Services (Optional)

| Service | Purpose | Cost |
|---------|---------|------|
| Redis (Upstash) | Caching | $0-10/month |
| Sentry | Error tracking | $0-26/month |
| UptimeRobot | Uptime monitoring | $0-7/month |
| CloudFlare | CDN + DDoS protection | $0-20/month |
| SendGrid | Email notifications | $0-15/month |

---

## Performance Optimization

### Backend Optimizations

#### 1. Database Query Optimization

**Current issues**:
- N+1 queries in inventory fetching
- Missing indexes on foreign keys
- Inefficient joins

**Solutions**:
```sql
-- Add indexes
CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX idx_opening_history_user_id ON opening_history(user_id);
CREATE INDEX idx_case_items_case_id ON case_items(case_id);

-- Optimize queries with JOINs
SELECT ui.*, n.name, n.image_url, n.rarity, n.value
FROM user_inventory ui
JOIN nfts n ON ui.nft_id = n.id
WHERE ui.user_id = $1
ORDER BY ui.acquired_at DESC;
```

**Impact**: 50-70% faster queries

#### 2. Response Caching

**Implement caching for**:
- Case list (cache for 5 minutes)
- NFT data (cache for 1 hour)
- User profile (cache for 1 minute)

**Example with Redis**:
```typescript
// Cache case list
const cacheKey = 'cases:all';
let cases = await redis.get(cacheKey);

if (!cases) {
  cases = await db.query('SELECT * FROM cases WHERE is_active = true');
  await redis.setex(cacheKey, 300, JSON.stringify(cases)); // 5 min
}
```

**Impact**: 80-90% reduction in database load

#### 3. Connection Pooling

**Configure pg pool**:
```typescript
const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Impact**: Better concurrency handling

#### 4. Compression

**Enable gzip compression**:
```typescript
import compression from 'compression';
app.use(compression());
```

**Impact**: 60-80% smaller response sizes

### Frontend Optimizations

#### 1. Code Splitting

**Implement route-based splitting**:
```typescript
const AdminPanel = lazy(() => import('./pages/admin/AdminLayout'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
```

**Impact**: 40-50% smaller initial bundle

#### 2. Image Optimization

**Use optimized formats**:
- WebP for modern browsers
- Lazy loading for images
- Responsive images with srcset

**Impact**: 50-70% faster page loads

#### 3. API Request Batching

**Batch related requests**:
```typescript
// Instead of 3 separate requests
const [profile, inventory, history] = await Promise.all([
  api.getProfile(),
  api.getInventory(),
  api.getHistory()
]);
```

**Impact**: Faster page loads, reduced server load

#### 4. Service Worker Caching

**Cache static assets**:
- App shell
- Images
- API responses (with TTL)

**Impact**: Instant subsequent loads

---

## Database Scaling

### Vertical Scaling

**Upgrade database resources**:
- More CPU for complex queries
- More RAM for caching
- Faster storage (SSD)

**Supabase tiers**:
- Free: Shared CPU, 500 MB
- Pro: 2 CPU, 8 GB storage
- Team: 4 CPU, 32 GB storage
- Enterprise: Custom

### Horizontal Scaling

#### Read Replicas

**When to implement**: 10,000+ users

**Setup**:
1. Create read replica in Supabase
2. Route read queries to replica
3. Write queries to primary

**Example**:
```typescript
// Write to primary
await primaryDb.query('INSERT INTO users ...');

// Read from replica
const users = await replicaDb.query('SELECT * FROM users ...');
```

**Impact**: 2-3x read capacity

#### Sharding

**When to implement**: 100,000+ users

**Strategy**: Shard by user ID
- Shard 1: Users 0-99,999
- Shard 2: Users 100,000-199,999
- etc.

**Complexity**: High (requires significant refactoring)

### Data Archiving

**Archive old data**:
- Opening history older than 6 months
- Deleted user data
- Inactive user records

**Implementation**:
```sql
-- Move old history to archive table
INSERT INTO opening_history_archive
SELECT * FROM opening_history
WHERE opened_at < NOW() - INTERVAL '6 months';

DELETE FROM opening_history
WHERE opened_at < NOW() - INTERVAL '6 months';
```

**Impact**: Smaller active database, faster queries

---

## Caching Strategies

### Application-Level Caching

**Use Redis for**:
- Session data
- Case configurations
- NFT metadata
- User profiles (short TTL)

**Redis setup** (Upstash):
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache with TTL
await redis.setex('user:123', 60, JSON.stringify(userData));

// Get cached data
const cached = await redis.get('user:123');
```

### CDN Caching

**Use CloudFlare or Vercel Edge**:
- Static assets (images, CSS, JS)
- API responses (with cache headers)

**Cache headers**:
```typescript
res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
```

### Browser Caching

**Service Worker caching**:
- Cache API responses
- Offline support
- Background sync

---

## Monitoring and Alerts

### Essential Metrics

**Backend**:
- Response time (p50, p95, p99)
- Error rate
- Request rate
- Database query time
- Memory usage
- CPU usage

**Frontend**:
- Page load time
- Time to interactive
- Error rate
- API call success rate

**Database**:
- Query performance
- Connection pool usage
- Storage usage
- Replication lag (if using replicas)

### Monitoring Tools

**Free/Cheap Options**:
- Render built-in metrics
- Vercel Analytics
- Supabase dashboard
- UptimeRobot (uptime monitoring)

**Professional Options**:
- Sentry (error tracking): $26/month
- DataDog (full observability): $15/host/month
- New Relic (APM): $25/month

### Alert Configuration

**Set alerts for**:
- Error rate > 5%
- Response time > 2 seconds
- Database storage > 80%
- Uptime < 99%
- Unusual traffic spikes

**Example alert** (Sentry):
```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Alert on critical errors
    if (event.level === 'error') {
      // Send notification
    }
    return event;
  }
});
```

---

## Recommendations Summary

### Immediate Actions (0-100 users)

1. ✅ Use free tiers for all services
2. ✅ Implement basic error logging
3. ✅ Set up database indexes
4. ✅ Monitor usage dashboards weekly

### Short-term (100-1,000 users)

1. 🔄 Upgrade Render to Starter ($7/month)
2. 🔄 Implement response caching
3. 🔄 Set up UptimeRobot monitoring
4. 🔄 Optimize database queries

### Medium-term (1,000-10,000 users)

1. 🔄 Upgrade to paid tiers (Render Standard, Supabase Pro)
2. 🔄 Implement Redis caching
3. 🔄 Set up professional monitoring (Sentry)
4. 🔄 Implement CDN for images
5. 🔄 Database connection pooling

### Long-term (10,000+ users)

1. 🔄 Consider read replicas
2. 🔄 Implement microservices architecture
3. 🔄 Multi-region deployment
4. 🔄 Advanced caching strategies
5. 🔄 Professional DevOps team

---

## Conclusion

The current free-tier architecture can support 100-1,000 users with acceptable performance. As you grow:

- **First upgrade**: Render Starter at 100 users ($7/month)
- **Second upgrade**: Supabase Pro at 1,000 users ($25/month)
- **Third upgrade**: Render Standard at 5,000 users ($25/month)

Total cost at 10,000 users: ~$80-90/month

This scaling strategy provides a clear path from free tier to enterprise scale while maintaining performance and reliability.

---

**For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**
