# NFT Scraper Service

Complete NFT scraper implementation for fetching, parsing, and storing NFT data from getgems.io.

## Components

### 1. HTTP Client (`httpClient.ts`)
- Axios-based HTTP client with retry logic
- Exponential backoff: 1s, 2s, 4s, 8s, 16s (5 retries max)
- Custom headers for web scraping (User-Agent, Accept, etc.)
- Automatic retry on network errors and 5xx responses
- 30-second timeout per request

**Requirements**: 2.4, 2.5, 26.1

### 2. HTML Parser (`nftParser.ts`)
- Cheerio-based HTML parser for getgems.io
- Extracts NFT names, images, and prices
- Multiple selector strategies for robustness
- Data validation (non-empty names, valid URLs, positive prices)
- Handles protocol-relative URLs (//example.com → https://example.com)
- Generates unique external IDs for each NFT

**Requirements**: 2.1, 2.2, 26.2, 26.3, 26.4, 26.5, 26.7

### 3. Database Update Logic (`nftScraper.ts`)
- Upserts NFT records (creates new or updates existing)
- Automatic rarity tier calculation based on price percentiles:
  - Common: 0-25th percentile
  - Rare: 25-50th percentile
  - Epic: 50-90th percentile
  - Legendary: 90-100th percentile
- Stores timestamp metadata for each update
- Error logging and handling

**Requirements**: 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 26.6

### 4. Scheduled Job (`scraperScheduler.ts`)
- Cron-based scheduler (default: daily at 3 AM UTC)
- Manual trigger support for admin
- Progress tracking (isRunning, lastUpdate, lastResult)
- Prevents concurrent updates
- Configurable via environment variables

**Requirements**: 2.3, 14.2, 14.3

### 5. Admin API (`routes/admin.ts`)
- `POST /api/admin/nft/update` - Manually trigger NFT update
- `GET /api/admin/nft/status` - Get scraper status and progress
- Requires admin authentication
- Returns detailed update results

**Requirements**: 14.2, 14.3

## Usage

### Initialize Scheduler

```typescript
import { initializeScheduler } from './services/scraperScheduler';
import { initializeDatabase } from './services/database';

// Initialize database first
await initializeDatabase();

// Start scheduler (runs daily at 3 AM UTC by default)
const scheduler = initializeScheduler();
```

### Manual Trigger

```typescript
import { getScheduler } from './services/scraperScheduler';

const scheduler = getScheduler();
const result = await scheduler.triggerUpdate();

console.log(`Updated: ${result.nftsUpdated}, Created: ${result.nftsCreated}`);
```

### Admin API Endpoints

#### Trigger Update
```bash
POST /api/admin/nft/update
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "message": "NFT data updated successfully",
  "data": {
    "nftsCreated": 15,
    "nftsUpdated": 5,
    "timestamp": "2024-01-15T03:00:00.000Z"
  }
}
```

#### Get Status
```bash
GET /api/admin/nft/status
Authorization: Bearer <admin-token>

Response:
{
  "isRunning": false,
  "lastUpdate": "2024-01-15T03:00:00.000Z",
  "nextScheduledRun": "2024-01-16T03:00:00.000Z",
  "nftCount": 50,
  "lastResult": {
    "success": true,
    "nftsCreated": 15,
    "nftsUpdated": 5,
    "timestamp": "2024-01-15T03:00:00.000Z",
    "errorCount": 0
  }
}
```

## Configuration

Environment variables:

```env
# Scraper configuration
SCRAPER_ENABLED=true                # Enable/disable scheduler (default: true)
SCRAPER_CRON=0 3 * * *              # Cron expression (default: daily at 3 AM UTC)

# Database configuration
DATABASE_TYPE=sqlite                # sqlite or supabase
DATABASE_PATH=./data/database.sqlite # SQLite path
```

## Error Handling

The scraper implements comprehensive error handling:

1. **Network Errors**: Automatic retry with exponential backoff
2. **Parsing Errors**: Logged but don't stop the update process
3. **Database Errors**: Transaction rollback on failure
4. **Validation Errors**: Invalid NFTs are skipped with error logging

All errors are:
- Logged to console with timestamps
- Included in the UpdateResult
- Tracked in the scheduler progress

## Testing

Run tests:
```bash
npm test -- httpClient.test.ts --run
npm test -- nftParser.test.ts --run
npm test -- nftScraper.test.ts --run
```

## Architecture

```
┌─────────────────┐
│  Cron Scheduler │ (Daily 3 AM UTC)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Scraper Service │
└────────┬────────┘
         │
         ├──► HTTP Client (with retry)
         │         │
         │         ▼
         │    getgems.io
         │         │
         │         ▼
         ├──► HTML Parser (Cheerio)
         │         │
         │         ▼
         │    Validate Data
         │         │
         │         ▼
         └──► Database (Upsert)
                   │
                   ▼
              Rarity Calculation
```

## Implementation Notes

1. **Zero Cost**: Uses free-tier compatible scraping (no paid APIs)
2. **Robust Parsing**: Multiple selector strategies for HTML changes
3. **Data Integrity**: Validation before database insertion
4. **Idempotent**: Safe to run multiple times (upsert logic)
5. **Observable**: Progress tracking for admin panel display
6. **Testable**: Comprehensive unit tests with mocks

## Future Enhancements

- [ ] Add webhook notifications on update completion
- [ ] Implement incremental updates (only changed NFTs)
- [ ] Add scraping metrics (success rate, duration)
- [ ] Support multiple NFT sources
- [ ] Add data quality checks (duplicate detection)
