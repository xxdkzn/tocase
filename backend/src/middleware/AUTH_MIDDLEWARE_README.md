# JWT Authentication Middleware

This module provides Express middleware for JWT-based authentication in the Telegram NFT Case Opener backend.

## Overview

The authentication system uses JSON Web Tokens (JWT) for stateless session management. After a user authenticates via Telegram WebApp, they receive a JWT token that must be included in subsequent API requests.

## Components

### 1. JWT Token Generation (`AuthService.generateSessionToken`)

Generates a JWT token containing user identification data.

**Token Payload:**
```typescript
{
  userId: number;        // Database user ID
  telegramId: number;    // Telegram user ID
  username: string | null; // Telegram username (optional)
  iat: number;           // Issued at timestamp
  exp: number;           // Expiration timestamp
}
```

**Token Expiration:** 7 days

**Usage:**
```typescript
const authService = new AuthService(botToken, db, jwtSecret);
const token = authService.generateSessionToken(user);
```

### 2. JWT Token Verification (`AuthService.verifyToken`)

Verifies and decodes a JWT token.

**Throws:**
- `Error('Token has expired')` - Token is past expiration date
- `Error('Invalid token')` - Token signature is invalid or malformed

**Usage:**
```typescript
try {
  const payload = authService.verifyToken(token);
  console.log(payload.userId, payload.telegramId);
} catch (error) {
  console.error('Token verification failed:', error.message);
}
```

### 3. Required Authentication Middleware (`createAuthMiddleware`)

Middleware that requires a valid JWT token for route access.

**Behavior:**
- Extracts token from `Authorization: Bearer <token>` header
- Verifies token signature and expiration
- Attaches decoded payload to `req.user`
- Returns 401 error if token is missing, invalid, or expired

**Usage:**
```typescript
import { createAuthMiddleware } from './middleware/auth';

const authMiddleware = createAuthMiddleware(authService);

// Protect a route
app.get('/api/user/profile', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  // ... fetch and return user profile
});

// Protect multiple routes
app.use('/api/user', authMiddleware);
app.get('/api/user/profile', (req, res) => { /* ... */ });
app.get('/api/user/inventory', (req, res) => { /* ... */ });
```

**Error Responses:**

Missing header:
```json
{
  "error": "Missing authorization header",
  "message": "Authorization header is required"
}
```

Invalid format:
```json
{
  "error": "Invalid authorization format",
  "message": "Authorization header must use Bearer token format"
}
```

Invalid/expired token:
```json
{
  "error": "Authentication failed",
  "message": "Invalid token" // or "Token has expired"
}
```

### 4. Optional Authentication Middleware (`createOptionalAuthMiddleware`)

Middleware that attaches user data if a valid token is present, but doesn't require it.

**Behavior:**
- Extracts token from `Authorization: Bearer <token>` header if present
- Verifies token and attaches payload to `req.user` if valid
- Proceeds without error if token is missing or invalid
- Does NOT return 401 errors

**Usage:**
```typescript
import { createOptionalAuthMiddleware } from './middleware/auth';

const optionalAuth = createOptionalAuthMiddleware(authService);

// Route accessible to both authenticated and anonymous users
app.get('/api/cases', optionalAuth, (req, res) => {
  if (req.user) {
    // User is authenticated - can show personalized data
    console.log('Authenticated user:', req.user.userId);
  } else {
    // Anonymous user - show public data only
    console.log('Anonymous user');
  }
  // ... return cases
});
```

### 5. Admin Authorization Middleware (`createAdminMiddleware`)

Middleware that requires authentication and verifies the user is an admin.

**Behavior:**
- Checks that `req.user` is set (requires prior authentication middleware)
- Verifies username matches admin username from configuration
- Username comparison is case-insensitive
- Logs all admin access attempts with timestamp and username
- Returns 401 if not authenticated
- Returns 403 if authenticated but not admin

**Usage:**
```typescript
import { createAuthMiddleware, createAdminMiddleware } from './middleware/auth';

const authMiddleware = createAuthMiddleware(authService);
const adminMiddleware = createAdminMiddleware(authService, process.env.ADMIN_USERNAME!);

// Protect admin routes - MUST use both middlewares
app.use('/api/admin', authMiddleware, adminMiddleware);

// All routes under /api/admin now require admin access
app.get('/api/admin/statistics', (req, res) => {
  // Only admin users can access this
  // req.user is guaranteed to be set and be an admin
});

app.post('/api/admin/users/:id/block', (req, res) => {
  // Only admin users can block other users
});
```

**Error Responses:**

Not authenticated:
```json
{
  "error": "Authentication required",
  "message": "You must be authenticated to access admin resources"
}
```

Not admin (forbidden):
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access admin resources"
}
```

**Logging:**

All admin access attempts are logged to console with the following format:

Successful access:
```
[Admin Access] GRANTED - User: admin_user (ID: 123) at 2024-01-15T10:30:45.123Z
```

Denied access:
```
[Admin Access] DENIED - User: regular_user (ID: 456) at 2024-01-15T10:30:45.123Z
```

Unauthenticated attempt:
```
[Admin Access] Unauthorized attempt - No authentication at 2024-01-15T10:30:45.123Z
```

## TypeScript Types

### AuthenticatedRequest

Extended Express Request type with user data:

```typescript
import { AuthenticatedRequest } from './middleware/auth';

app.get('/api/user/profile', authMiddleware, (req: AuthenticatedRequest, res) => {
  // TypeScript knows req.user exists and has correct type
  const userId = req.user.userId;
  const telegramId = req.user.telegramId;
  const username = req.user.username;
});
```

## Complete Example

```typescript
import express from 'express';
import { AuthService } from './services/auth';
import { 
  createAuthMiddleware, 
  createOptionalAuthMiddleware,
  createAdminMiddleware,
  AuthenticatedRequest 
} from './middleware/auth';

const app = express();
const authService = new AuthService(
  process.env.TELEGRAM_BOT_TOKEN!,
  db,
  process.env.JWT_SECRET!
);

const authMiddleware = createAuthMiddleware(authService);
const optionalAuth = createOptionalAuthMiddleware(authService);
const adminMiddleware = createAdminMiddleware(authService, process.env.ADMIN_USERNAME!);

// Public endpoint - no auth required
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Authentication endpoint - returns JWT token
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { initData } = req.body;
    
    // Verify Telegram auth
    const telegramUser = await authService.verifyTelegramAuth(initData);
    
    // Create or update user
    const user = await authService.createOrUpdateUser(telegramUser);
    
    // Generate JWT token
    const token = authService.generateSessionToken(user);
    
    res.json({ user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Optional auth - accessible to all, but can personalize for authenticated users
app.get('/api/cases', optionalAuth, (req: AuthenticatedRequest, res) => {
  const cases = getCases();
  
  if (req.user) {
    // Add user-specific data (e.g., which cases they've opened)
    const userCases = addUserData(cases, req.user.userId);
    res.json({ cases: userCases });
  } else {
    res.json({ cases });
  }
});

// Protected endpoint - requires valid JWT
app.get('/api/user/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const user = await getUserById(req.user.userId);
  res.json({ user });
});

// Protected endpoint - requires valid JWT
app.post('/api/cases/:id/open', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const caseId = parseInt(req.params.id);
  const result = await openCase(req.user.userId, caseId);
  res.json({ result });
});

// Admin endpoints - require authentication AND admin privileges
app.use('/api/admin', authMiddleware, adminMiddleware);

app.get('/api/admin/statistics', async (req: AuthenticatedRequest, res) => {
  // Only admin users can access this
  const stats = await getSystemStatistics();
  res.json({ stats });
});

app.post('/api/admin/users/:id/block', async (req: AuthenticatedRequest, res) => {
  // Only admin users can block other users
  const userId = parseInt(req.params.id);
  await blockUser(userId);
  res.json({ success: true });
});

app.post('/api/admin/cases', async (req: AuthenticatedRequest, res) => {
  // Only admin users can create cases
  const caseData = req.body;
  const newCase = await createCase(caseData);
  res.json({ case: newCase });
});
```

## Security Considerations

1. **JWT Secret**: Store in environment variable, never commit to version control
2. **Token Expiration**: Tokens expire after 7 days - users must re-authenticate
3. **HTTPS Only**: Always use HTTPS in production to prevent token interception
4. **Token Storage**: Frontend should store tokens securely (memory or httpOnly cookies)
5. **Token Revocation**: JWTs cannot be revoked before expiration - keep expiration time reasonable

## Environment Variables

```env
JWT_SECRET=your_jwt_secret_here_change_in_production
ADMIN_USERNAME=your_admin_telegram_username
```

**Important:** 
- Use a strong, random secret in production. Generate with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Set `ADMIN_USERNAME` to the Telegram username of the administrator (without @ symbol)
- Admin username comparison is case-insensitive

## Testing

See `auth.test.ts` and `auth.test.ts` in the middleware directory for comprehensive test coverage.

Run tests:
```bash
npm test
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 1.4**: Load user profile and balance (JWT contains user ID for profile lookup)
- **Requirement 7.1**: Initialize new users with 1000 balance (handled in `createOrUpdateUser`)
- **Requirement 12.1**: Define single administrator username in configuration (ADMIN_USERNAME env var)
- **Requirement 12.2**: Verify user's Telegram username matches administrator username
- **Requirement 12.3**: Deny access and return 403 error for non-admin users
- **Requirement 12.4**: Display all administrative functions when access is granted
- **Requirement 12.5**: Log all admin panel access attempts with timestamp and username
- **Task 3.2**: 
  - ✅ Generate JWT session tokens
  - ✅ Implement token verification middleware for Express
  - ✅ Store user ID and metadata in JWT payload
  - ✅ Set appropriate token expiration (7 days)
- **Task 3.3**:
  - ✅ Check username against admin configuration (ADMIN_USERNAME environment variable)
  - ✅ Create admin authorization middleware for Express
  - ✅ Log all admin access attempts with timestamp and username
  - ✅ Return 403 error for non-admin users trying to access admin routes
