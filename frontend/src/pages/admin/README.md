# Admin Panel - Quick Reference

## Access
- **URL**: `/admin`
- **Requirement**: User must have `isAdmin=true`
- **Guard**: Protected by `AdminRoute` component

## Pages

### 📊 Dashboard (`/admin`)
View system statistics and popular cases.

**Features**:
- Total users, cases opened (24h), currency circulation, avg balance
- Top 5 most popular cases
- Auto-refresh every 60 seconds

### 📦 Cases (`/admin/cases`)
Manage all cases in the system.

**Actions**:
- ➕ Create new case
- ✏️ Edit existing case
- ✅/🚫 Enable/Disable case
- 📥 Export configuration
- 📤 Import configuration

**Case Editor**:
- Set name, description, price, image URL
- Add NFTs with drop probabilities
- Probabilities must sum to 100%

### 👥 Users (`/admin/users`)
Search and manage users.

**Actions**:
- 🔍 Search by username or Telegram ID
- 🚫 Block user
- ✅ Unblock user

**User Info**:
- Telegram ID, balance, cases opened, join date, blocked status

### 🎨 NFT Data (`/admin/nft-data`)
Manage NFT data updates from blockchain.

**Features**:
- View current NFT count
- See last update timestamp
- View next scheduled update
- Trigger manual update
- View update results (created, updated, errors)

## Components

### CaseEditorModal
Modal for creating/editing cases.

**Validation**:
- ✅ Name required
- ✅ Price must be positive
- ✅ At least one NFT required
- ✅ Probabilities must sum to 100%
- ✅ No duplicate NFTs

### ConfigurationManager
Import/export case configurations.

**Export**: Downloads JSON file with case and NFT configuration
**Import**: Uploads JSON file to create new case

## API Endpoints

All endpoints require admin authentication:

```typescript
// Statistics
GET /api/admin/statistics

// Users
GET /api/admin/users?query=...
POST /api/admin/users/:id/block
POST /api/admin/users/:id/unblock

// Cases
POST /api/admin/cases
PUT /api/admin/cases/:id
GET /api/admin/cases/:id/export
POST /api/admin/cases/import

// NFT Data
GET /api/admin/nft/status
POST /api/admin/nft/update
```

## Types

```typescript
import {
  SystemStatistics,
  AdminUser,
  AdminCase,
  NFTData,
  CaseNFT,
  CaseConfiguration,
  NFTUpdateStatus
} from '@/types/admin';
```

## Styling

- **Theme**: Dark with purple accents
- **Primary Color**: `#8B5CF6` (purple-600)
- **Layout**: Sidebar navigation (collapsible on mobile)
- **Responsive**: 320px - 768px

## Tips

1. **Dashboard**: Auto-refreshes every 60s, or click refresh button
2. **Cases**: Use export/import to duplicate case configurations
3. **Users**: Press Enter in search box to search
4. **NFT Data**: Wait for current update to finish before triggering another
5. **Probabilities**: Use decimals for precise probability control (e.g., 33.33%)

## Keyboard Shortcuts

- **Escape**: Close modals
- **Enter**: Submit search (Users page)

## Error Handling

All components handle:
- ✅ Loading states
- ✅ Error messages
- ✅ Success confirmations
- ✅ Validation feedback
- ✅ Network errors

## Mobile Support

- ✅ Responsive sidebar (hamburger menu)
- ✅ Touch-friendly buttons
- ✅ Optimized layouts for small screens
- ✅ Scrollable content areas
