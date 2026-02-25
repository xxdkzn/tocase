# Zustand Store Usage Guide

This directory contains all Zustand stores for state management in the Telegram NFT Case Opener frontend.

## Stores Overview

### 1. User Store (`userStore.ts`)
Manages user profile data and authentication.

```typescript
import { useUserStore } from '@/store/userStore';

// In your component
const { user, token, setUser, updateBalance, addXP, clearUser } = useUserStore();

// Update user data
setUser({
  id: 1,
  telegramId: '123456',
  username: 'john_doe',
  balance: 1000,
  level: 1,
  xp: 0,
  isAdmin: false,
  createdAt: new Date().toISOString()
});

// Update balance after case opening
updateBalance(900);

// Add XP (automatically handles level ups)
addXP(10);

// Clear on logout
clearUser();
```

**Persistence:** Token is persisted to localStorage with key `auth_token`.

### 2. Cases Store (`casesStore.ts`)
Manages available cases with caching.

```typescript
import { useCasesStore } from '@/store/casesStore';

// In your component
const { cases, loading, error, fetchCases, getCaseById, clearCache } = useCasesStore();

// Fetch cases (uses cache if valid)
await fetchCases();

// Get specific case
const myCase = getCaseById(1);

// Force refresh
clearCache();
await fetchCases();
```

**Caching:** Cases are cached for 5 minutes (300,000ms).

### 3. Inventory Store (`inventoryStore.ts`)
Manages user's NFT inventory with automatic sorting.

```typescript
import { useInventoryStore } from '@/store/inventoryStore';

// In your component
const { items, loading, fetchInventory, addItem, removeItem, clearInventory } = useInventoryStore();

// Fetch inventory
await fetchInventory();

// Add item after case opening
addItem({
  id: 123,
  nftId: 456,
  nft: {
    id: 456,
    name: 'Cool NFT',
    imageUrl: 'https://...',
    price: 100,
    rarity: 'Epic'
  },
  acquiredAt: new Date().toISOString()
});

// Remove item after selling
removeItem(123);

// Clear inventory
clearInventory();
```

**Sorting:** Items are automatically sorted by rarity (Legendary → Epic → Rare → Common) then by acquisition date (newest first).

### 4. Settings Store (`settingsStore.ts`)
Manages user preferences with persistence.

```typescript
import { useSettingsStore } from '@/store/settingsStore';

// In your component
const { soundEnabled, hapticsEnabled, toggleSound, toggleHaptics } = useSettingsStore();

// Toggle settings
toggleSound();
toggleHaptics();

// Use in conditional logic
if (soundEnabled) {
  playSound();
}
```

**Persistence:** Settings are persisted to localStorage with key `app_settings`.

## Best Practices

1. **Use selectors for performance:**
```typescript
// Only re-render when balance changes
const balance = useUserStore(state => state.user?.balance);
```

2. **Handle loading states:**
```typescript
const { cases, loading, error } = useCasesStore();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
```

3. **Clear stores on logout:**
```typescript
const clearUser = useUserStore(state => state.clearUser);
const clearInventory = useInventoryStore(state => state.clearInventory);

const handleLogout = () => {
  clearUser();
  clearInventory();
  // Navigate to login
};
```

## TypeScript Types

All stores export their types for use in your components:

```typescript
import type { User } from '@/store/userStore';
import type { Case, NFT } from '@/store/casesStore';
import type { InventoryItem, InventoryNFT } from '@/store/inventoryStore';
```
