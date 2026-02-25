# API Documentation

Complete API reference for the Telegram NFT Case Opener backend.

**Base URL**: `http://localhost:3000/api` (development) or `https://your-app.onrender.com/api` (production)

## Table of Contents

1. [Authentication](#authentication)
2. [Case Endpoints](#case-endpoints)
3. [User Endpoints](#user-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Verification Endpoint](#verification-endpoint)
6. [Error Codes](#error-codes)
7. [Rate Limiting](#rate-limiting)

---

## Authentication

### POST /api/auth/telegram

Authenticate user via Telegram Web App initData.

**Request Body**:
```json
{
  "initData": "query_id=AAH...&user=%7B%22id%22%3A123456..."
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "telegramId": 123456789,
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "balance": 1000,
    "totalOpened": 5,
    "level": 2,
    "experience": 50,
    "isAdmin": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "Authentication failed",
  "message": "Invalid initData"
}
```

**Usage**:
- Called automatically by the frontend when the Mini App loads
- The `token` should be stored and included in subsequent requests
- Token expires after 7 days (configurable)

**Authentication Header**:
For protected endpoints, include the token:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Case Endpoints

### GET /api/cases

Get list of all active cases.

**Authentication**: Not required

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Bronze Case",
    "description": "Common NFTs with occasional rare finds",
    "price": 100,
    "imageUrl": "https://example.com/bronze-case.png",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Silver Case",
    "description": "Better odds for rare NFTs",
    "price": 250,
    "imageUrl": "https://example.com/silver-case.png",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET /api/cases/:id

Get detailed information about a specific case, including NFT list and drop rates.

**Authentication**: Not required

**Parameters**:
- `id` (path): Case ID

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Bronze Case",
  "description": "Common NFTs with occasional rare finds",
  "price": 100,
  "imageUrl": "https://example.com/bronze-case.png",
  "isActive": true,
  "nfts": [
    {
      "id": 1,
      "name": "Cool Cat #123",
      "description": "A cool cat NFT",
      "imageUrl": "https://example.com/cat123.png",
      "rarity": "common",
      "value": 50,
      "dropRate": 45.5
    },
    {
      "id": 2,
      "name": "Rare Dragon #456",
      "description": "A rare dragon NFT",
      "imageUrl": "https://example.com/dragon456.png",
      "rarity": "rare",
      "value": 500,
      "dropRate": 5.0
    }
  ]
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "Case not found"
}
```

---

### POST /api/cases/:id/open

Open a case and receive a random NFT.

**Authentication**: Required

**Parameters**:
- `id` (path): Case ID

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "nftId": 5,
  "seeds": {
    "serverSeed": "a1b2c3d4e5f6...",
    "clientSeed": "user_generated_seed",
    "hashedServerSeed": "hash_of_server_seed"
  },
  "nonce": 42,
  "levelUp": {
    "leveledUp": true,
    "newLevel": 3,
    "experienceGained": 10,
    "totalExperience": 110
  }
}
```

**Error Responses**:

400 Bad Request - Insufficient balance:
```json
{
  "error": "Insufficient balance"
}
```

403 Forbidden - User blocked:
```json
{
  "error": "User is blocked"
}
```

403 Forbidden - Rate limit exceeded:
```json
{
  "error": "Rate limit exceeded"
}
```

404 Not Found - Case not found:
```json
{
  "error": "Case not found"
}
```

**Notes**:
- Deducts case price from user balance
- Awards 10 XP per opening
- Returns seeds for provably fair verification
- Rate limited to prevent abuse (max 10 openings per minute)

---

## User Endpoints

### GET /api/user/profile

Get current user's profile information.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": 1,
  "telegramId": 123456789,
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "balance": 850,
  "totalOpened": 6,
  "level": 2,
  "experience": 60,
  "experienceToNextLevel": 40,
  "isAdmin": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T12:30:00.000Z"
}
```

---

### GET /api/user/inventory

Get user's NFT inventory.

**Authentication**: Required

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "nftId": 5,
    "name": "Cool Cat #123",
    "description": "A cool cat NFT",
    "imageUrl": "https://example.com/cat123.png",
    "rarity": "common",
    "value": 50,
    "acquiredAt": "2024-01-02T10:15:00.000Z"
  },
  {
    "id": 2,
    "nftId": 12,
    "name": "Epic Sword #789",
    "description": "A legendary weapon",
    "imageUrl": "https://example.com/sword789.png",
    "rarity": "epic",
    "value": 1000,
    "acquiredAt": "2024-01-02T11:20:00.000Z"
  }
]
```

---

### POST /api/user/inventory/:id/sell

Sell an NFT from inventory for 80% of its value.

**Authentication**: Required

**Parameters**:
- `id` (path): Inventory item ID (not NFT ID)

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "sellPrice": 40
}
```

**Error Responses**:

404 Not Found - Item not found:
```json
{
  "error": "Item not found"
}
```

403 Forbidden - Suspicious activity:
```json
{
  "error": "Suspicious activity detected"
}
```

**Notes**:
- Sell price is 80% of NFT value
- Item is removed from inventory
- Balance is increased by sell price
- Anti-abuse checks prevent rapid selling

---

### GET /api/user/history

Get user's case opening history with pagination.

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `rarityFilter` (optional): Filter by rarity (common, uncommon, rare, epic, legendary)

**Response** (200 OK):
```json
{
  "history": [
    {
      "id": 10,
      "caseName": "Bronze Case",
      "nftName": "Cool Cat #123",
      "nftImageUrl": "https://example.com/cat123.png",
      "rarity": "common",
      "value": 50,
      "openedAt": "2024-01-02T12:30:00.000Z"
    },
    {
      "id": 9,
      "caseName": "Silver Case",
      "nftName": "Rare Dragon #456",
      "nftImageUrl": "https://example.com/dragon456.png",
      "rarity": "rare",
      "value": 500,
      "openedAt": "2024-01-02T11:15:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

---

## Admin Endpoints

All admin endpoints require authentication and admin privileges.

### GET /api/admin/statistics

Get system-wide statistics.

**Authentication**: Required (Admin only)

**Response** (200 OK):
```json
{
  "users": {
    "total": 1250,
    "active": 450,
    "blocked": 5
  },
  "cases": {
    "total": 5,
    "active": 4
  },
  "nfts": {
    "total": 150,
    "byRarity": {
      "common": 75,
      "uncommon": 40,
      "rare": 20,
      "epic": 10,
      "legendary": 5
    }
  },
  "openings": {
    "total": 5420,
    "today": 234,
    "thisWeek": 1567
  },
  "revenue": {
    "total": 542000,
    "today": 23400,
    "thisWeek": 156700
  }
}
```

---

### GET /api/admin/users

Search users by username or Telegram ID.

**Authentication**: Required (Admin only)

**Query Parameters**:
- `query` (optional): Search query (username or Telegram ID)

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": 1,
      "telegramId": 123456789,
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "balance": 850,
      "totalOpened": 6,
      "isBlocked": false,
      "isAdmin": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /api/admin/users/:id/block

Block a user from opening cases.

**Authentication**: Required (Admin only)

**Parameters**:
- `id` (path): User ID

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "message": "User blocked successfully"
}
```

---

### POST /api/admin/users/:id/unblock

Unblock a previously blocked user.

**Authentication**: Required (Admin only)

**Parameters**:
- `id` (path): User ID

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "message": "User unblocked successfully"
}
```

---

### POST /api/admin/cases

Create a new case.

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "name": "Gold Case",
  "description": "Premium case with high-value NFTs",
  "price": 500,
  "imageUrl": "https://example.com/gold-case.png"
}
```

**Response** (201 Created):
```json
{
  "caseId": 6
}
```

---

### PUT /api/admin/cases/:id

Update an existing case.

**Authentication**: Required (Admin only)

**Parameters**:
- `id` (path): Case ID

**Request Body** (all fields optional):
```json
{
  "name": "Updated Gold Case",
  "description": "New description",
  "price": 550,
  "imageUrl": "https://example.com/new-gold-case.png",
  "isActive": true
}
```

**Response** (200 OK):
```json
{
  "message": "Case updated successfully"
}
```

---

### GET /api/admin/cases/:id/export

Export case configuration including NFTs and drop rates.

**Authentication**: Required (Admin only)

**Parameters**:
- `id` (path): Case ID

**Response** (200 OK):
```json
{
  "case": {
    "name": "Bronze Case",
    "description": "Common NFTs with occasional rare finds",
    "price": 100,
    "imageUrl": "https://example.com/bronze-case.png"
  },
  "items": [
    {
      "nftId": 1,
      "dropRate": 45.5
    },
    {
      "nftId": 2,
      "dropRate": 30.0
    }
  ]
}
```

---

### POST /api/admin/cases/import

Import case configuration from JSON.

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "configJson": {
    "case": {
      "name": "Imported Case",
      "description": "Case imported from configuration",
      "price": 200,
      "imageUrl": "https://example.com/imported-case.png"
    },
    "items": [
      {
        "nftId": 1,
        "dropRate": 50.0
      },
      {
        "nftId": 2,
        "dropRate": 30.0
      }
    ]
  }
}
```

**Response** (201 Created):
```json
{
  "caseId": 7
}
```

---

### GET /api/admin/nft/status

Get NFT scraper status and progress.

**Authentication**: Required (Admin only)

**Response** (200 OK):
```json
{
  "isRunning": false,
  "lastUpdate": "2024-01-02T06:00:00.000Z",
  "nextScheduledRun": "2024-01-03T06:00:00.000Z",
  "nftCount": 150,
  "lastResult": {
    "success": true,
    "nftsCreated": 5,
    "nftsUpdated": 145,
    "timestamp": "2024-01-02T06:00:00.000Z",
    "errorCount": 0
  }
}
```

---

### POST /api/admin/nft/update

Manually trigger NFT data update from GetGems.

**Authentication**: Required (Admin only)

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "success": true,
  "message": "NFT data updated successfully",
  "data": {
    "nftsCreated": 3,
    "nftsUpdated": 147,
    "timestamp": "2024-01-02T14:30:00.000Z"
  }
}
```

**Error Response** (409 Conflict - Update in progress):
```json
{
  "error": "Update in progress",
  "message": "An NFT data update is already running",
  "progress": {
    "isRunning": true,
    "lastUpdate": "2024-01-02T14:25:00.000Z"
  }
}
```

---

## Verification Endpoint

### POST /api/verify

Verify the fairness of a case opening result.

**Authentication**: Not required

**Request Body**:
```json
{
  "serverSeed": "a1b2c3d4e5f6...",
  "clientSeed": "user_generated_seed",
  "nonce": 42,
  "caseId": 1,
  "expectedNFTId": 5
}
```

**Response** (200 OK):
```json
{
  "isValid": true,
  "selectedNFT": {
    "id": 5,
    "name": "Cool Cat #123",
    "rarity": "common"
  }
}
```

**Notes**:
- Uses HMAC-SHA256 for cryptographic verification
- Anyone can verify results using the provided seeds
- Server seed is hashed before case opening to prevent manipulation

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions or blocked |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., update in progress) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Format

All errors follow this format:

```json
{
  "error": "Short error description",
  "message": "Detailed error message (optional)"
}
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing initData` | No initData in auth request | Include initData from Telegram |
| `Authentication failed` | Invalid token or initData | Re-authenticate with Telegram |
| `Insufficient balance` | Not enough balance to open case | Add balance or choose cheaper case |
| `User is blocked` | User has been blocked by admin | Contact admin |
| `Rate limit exceeded` | Too many requests | Wait before retrying |
| `Case not found` | Invalid case ID | Use valid case ID |
| `Item not found` | Invalid inventory item ID | Check inventory |

---

## Rate Limiting

Rate limits are applied per IP address and per user (when authenticated).

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/*` | 5 requests | 1 minute |
| `/api/cases/:id/open` | 10 requests | 1 minute |
| `/api/user/*` | 30 requests | 1 minute |
| `/api/admin/*` | 20 requests | 1 minute |
| All other endpoints | 100 requests | 1 minute |

### Rate Limit Headers

Responses include rate limit information:

```
RateLimit-Limit: 10
RateLimit-Remaining: 7
RateLimit-Reset: 1704196800
```

- `RateLimit-Limit`: Maximum requests allowed in window
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Unix timestamp when limit resets

### Rate Limit Exceeded Response

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

---

## API Client Example

### JavaScript/TypeScript

```typescript
const API_URL = 'http://localhost:3000/api';
let authToken: string | null = null;

// Authenticate
async function authenticate(initData: string) {
  const response = await fetch(`${API_URL}/auth/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData })
  });
  
  const data = await response.json();
  authToken = data.token;
  return data.user;
}

// Get cases
async function getCases() {
  const response = await fetch(`${API_URL}/cases`);
  return response.json();
}

// Open case
async function openCase(caseId: number) {
  const response = await fetch(`${API_URL}/cases/${caseId}/open`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return response.json();
}

// Get inventory
async function getInventory() {
  const response = await fetch(`${API_URL}/user/inventory`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  return response.json();
}
```

---

## Changelog

### Version 1.0.0 (2024-01-01)
- Initial API release
- Authentication via Telegram Web App
- Case opening with provably fair system
- User inventory and history
- Admin panel endpoints
- NFT scraper integration

---

For more information, see:
- [User Guide](./USER_GUIDE.md)
- [Admin Guide](./ADMIN_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)
