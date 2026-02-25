# Authentication Service

This module implements Telegram WebApp authentication using HMAC-SHA256 signature verification according to Telegram's official protocol.

## Features

- ✅ HMAC-SHA256 signature verification using bot token
- ✅ Data freshness validation (max 24 hours)
- ✅ User data parsing and extraction from initData
- ✅ User creation and update in database
- ✅ Admin access control

## Usage

### Initialize the Service

```typescript
import { AuthService } from './services/auth';
import { getDatabase } from './services/database';

const botToken = process.env.TELEGRAM_BOT_TOKEN!;
const db = await getDatabase();
const authService = new AuthService(botToken, db);
```

### Verify Telegram WebApp Authentication

```typescript
// In your Express route handler
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { initData } = req.body;
    
    // Verify the signature and extract user data
    const telegramUser = await authService.verifyTelegramAuth(initData);
    
    // Create or update user in database
    const user = await authService.createOrUpdateUser(telegramUser);
    
    // Generate session token (implement separately)
    const token = generateJWT(user.id);
    
    res.json({ user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
```

### Check Admin Access

```typescript
// In your middleware
function requireAdmin(req, res, next) {
  const user = req.user; // From JWT middleware
  const adminUsername = process.env.ADMIN_USERNAME;
  
  if (!authService.isAdmin(user.username, adminUsername)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}
```

## Security

### Signature Verification Process

The service implements Telegram's official WebApp authentication protocol:

1. **Extract hash** from initData parameters
2. **Create data-check-string** by sorting all parameters (except hash) alphabetically
3. **Generate secret key**: `HMAC_SHA256(bot_token, "WebAppData")`
4. **Calculate expected hash**: `HMAC_SHA256(data_check_string, secret_key)`
5. **Compare** expected hash with provided hash

### Data Freshness

The service validates that the `auth_date` is not older than 24 hours to prevent replay attacks.

### Error Handling

The service throws descriptive errors for:
- Missing or invalid hash
- Invalid signature (tampered data)
- Missing user data
- Invalid user data format
- Missing auth_date
- Data older than 24 hours

## API Reference

### `verifyTelegramAuth(initData: string): Promise<TelegramUser>`

Verifies Telegram WebApp initData signature and extracts user information.

**Parameters:**
- `initData` - The initData string from Telegram WebApp

**Returns:**
- `Promise<TelegramUser>` - Verified user data

**Throws:**
- `Error` if signature is invalid or data is too old

### `createOrUpdateUser(telegramUser: TelegramUser): Promise<User>`

Creates a new user or updates existing user in the database.

**Parameters:**
- `telegramUser` - Verified Telegram user data

**Returns:**
- `Promise<User>` - User record from database

**New users receive:**
- Initial balance: 1000
- Level: 1
- Experience: 0

### `isAdmin(username: string | null | undefined, adminUsername: string): boolean`

Checks if a username matches the admin username (case-insensitive).

**Parameters:**
- `username` - User's Telegram username
- `adminUsername` - Admin username from environment

**Returns:**
- `boolean` - True if user is admin

## Types

### TelegramUser

```typescript
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
}
```

### User

```typescript
interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  balance: number;
  level: number;
  experience: number;
  is_blocked: boolean;
  created_at: Date;
  updated_at: Date;
}
```

## Testing

Run the test suite:

```bash
npm test -- auth.test.ts
```

The test suite includes:
- Valid signature verification
- Invalid signature detection
- Missing field handling
- Data freshness validation
- User creation and update
- Admin access control

## References

- [Telegram WebApp Authentication](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)
- Requirements: 1.3, 30.3
- Design: Authentication Service section
