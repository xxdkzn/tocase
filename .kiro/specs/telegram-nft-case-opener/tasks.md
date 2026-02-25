# Implementation Plan: Telegram NFT Case Opener

## Overview

This implementation plan breaks down the Telegram NFT Case Opener into discrete coding tasks. The system will be built using TypeScript/Node.js for the backend, React/TypeScript for the frontend, with SQLite for development and Supabase for production. Each task builds incrementally, with testing integrated throughout to catch errors early.

## Tasks

- [x] 1. Initialize project structure and dependencies
  - Create monorepo structure with backend and frontend directories
  - Initialize Node.js project with TypeScript configuration
  - Install core dependencies: Express, Telegraf, SQLite3, Cheerio, Axios
  - Initialize React project with Vite and TypeScript
  - Install frontend dependencies: Framer Motion, Tailwind CSS, Zustand, Axios
  - Set up ESLint and Prettier configurations
  - Create .env.example files for both backend and frontend
  - _Requirements: 20.1, 20.2, 20.3_

- [x] 2. Set up database schema and migrations
  - [x] 2.1 Create database connection module with SQLite and Supabase support
    - Implement database abstraction layer for multiple backends
    - Create connection pooling configuration
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 29.3_

  - [x] 2.2 Create migration system for schema management
    - Implement migration runner with up/down support
    - Create initial migration with all tables (users, nfts, cases, case_nfts, inventory, opening_history, abuse_flags)
    - Add indexes for performance optimization
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7_

  - [ ]* 2.3 Write unit tests for database connection module
    - Test connection establishment and error handling
    - Test query execution and transaction support
    - _Requirements: 21.1_


- [x] 3. Implement authentication system
  - [x] 3.1 Create Telegram WebApp signature verification
    - Implement HMAC-SHA256 signature validation using bot token
    - Validate initData freshness (max 24 hours)
    - Parse and extract user data from initData
    - _Requirements: 1.3, 30.3_

  - [x] 3.2 Implement user creation and session management
    - Create or update user records from Telegram data
    - Generate JWT session tokens
    - Implement token verification middleware
    - _Requirements: 1.4, 7.1_

  - [x] 3.3 Implement admin access control
    - Check username against admin configuration
    - Create admin authorization middleware
    - Log all admin access attempts
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 3.4 Write unit tests for authentication service
    - Test signature verification with valid and invalid data
    - Test admin access control logic
    - Test token generation and validation
    - _Requirements: 1.3, 12.2, 30.3_

- [x] 4. Build NFT scraper service
  - [x] 4.1 Implement HTTP client with retry logic
    - Create Axios instance with custom headers (User-Agent, Accept)
    - Implement exponential backoff retry mechanism (1s, 2s, 4s, 8s, 16s)
    - Add request timeout handling
    - _Requirements: 2.4, 2.5, 26.1_

  - [x] 4.2 Implement HTML parser for getgems.io
    - Use Cheerio to parse HTML responses
    - Extract NFT names from DOM elements
    - Extract NFT image URLs from DOM elements
    - Extract NFT prices from DOM elements
    - Validate extracted data (non-empty name, valid URL, positive price)
    - _Requirements: 2.1, 2.2, 26.2, 26.3, 26.4, 26.5, 26.7_

  - [x] 4.3 Implement database update logic
    - Upsert NFT records with extracted data
    - Store timestamp metadata for each update
    - Handle parsing errors and log failures
    - _Requirements: 2.6, 2.7, 26.6_

  - [x] 4.4 Create scheduled scraper job
    - Implement cron job to run daily at 3 AM UTC
    - Add manual trigger endpoint for admin
    - Implement progress tracking for admin panel
    - _Requirements: 2.3, 14.2, 14.3_

  - [ ]* 4.5 Write unit tests for scraper service
    - Test HTML parsing with mock responses
    - Test retry logic with simulated failures
    - Test data validation edge cases
    - _Requirements: 2.5, 26.6, 26.7_


- [x] 5. Implement NFT service and rarity classification
  - [x] 5.1 Create NFT data access layer
    - Implement CRUD operations for NFT records
    - Add filtering by rarity tier
    - Implement in-memory caching with 1-hour TTL
    - _Requirements: 3.6, 21.2_

  - [x] 5.2 Implement rarity tier calculation algorithm
    - Sort NFTs by price
    - Calculate percentiles (25th, 50th, 90th)
    - Assign rarity tiers based on price percentiles
    - Update database with calculated rarities
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 5.3 Implement cache invalidation on data updates
    - Clear cache when NFT data is updated
    - Trigger rarity recalculation after scraper runs
    - _Requirements: 3.5_

  - [ ]* 5.4 Write property test for rarity classification
    - **Property 1: Rarity distribution consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - Test that all NFTs are classified into exactly one rarity tier
    - Test that percentile boundaries are respected

- [x] 6. Implement RNG service with provably fair mechanism
  - [x] 6.1 Create seed generation functions
    - Generate cryptographically secure server seed (64 hex chars)
    - Generate client seed from user ID + timestamp + random component
    - Implement seed hashing with SHA-256
    - _Requirements: 8.1, 19.1_

  - [x] 6.2 Implement NFT selection algorithm
    - Combine seeds and nonce to create hash
    - Convert hash to normalized value (0-1 range)
    - Map to NFT using cumulative probability distribution
    - _Requirements: 8.2, 19.1_

  - [x] 6.3 Implement verification function
    - Accept server seed, client seed, nonce, and probabilities
    - Recalculate result and compare with expected NFT
    - _Requirements: 19.4_

  - [x] 6.4 Create seed storage and retrieval
    - Store server seed hash before opening
    - Store revealed server seed after opening
    - Maintain seeds for 30 days
    - _Requirements: 19.2, 19.3, 19.5_

  - [ ]* 6.5 Write property test for RNG fairness
    - **Property 2: Probability distribution convergence**
    - **Validates: Requirements 8.2, 5.1, 5.2, 5.3, 5.4**
    - Test that over many iterations, drop rates converge to configured probabilities
    - Test that same seeds produce same results (determinism)

  - [ ]* 6.6 Write unit tests for RNG service
    - Test seed generation randomness
    - Test verification with valid and invalid inputs
    - Test edge cases (empty probabilities, single NFT)
    - _Requirements: 8.1, 19.1, 19.4_


- [x] 7. Implement case service and drop probability system
  - [x] 7.1 Create case data access layer
    - Implement CRUD operations for cases
    - Implement case-NFT relationship management
    - Add filtering for enabled cases only
    - _Requirements: 4.1, 4.6, 4.7, 21.3, 21.4_

  - [x] 7.2 Implement drop probability calculation
    - Group NFTs by rarity tier
    - Assign probability weights (Common 50%, Rare 30%, Epic 15%, Legendary 5%)
    - Distribute probability evenly within each tier
    - Handle missing tiers by redistributing proportionally
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 7.3 Implement probability validation
    - Validate that total probability equals 100%
    - Validate individual probabilities are between 0 and 100
    - _Requirements: 4.5_

  - [x] 7.4 Implement case opening transaction logic
    - Check user balance against case price
    - Deduct case price from user balance
    - Call RNG service to select NFT
    - Add NFT to user inventory
    - Record opening in history table
    - Implement atomic transaction with rollback on failure
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 7.5 Write property test for probability calculation
    - **Property 3: Probability sum invariant**
    - **Validates: Requirements 4.5, 5.1, 5.2, 5.3, 5.4**
    - Test that calculated probabilities always sum to 100%
    - Test that missing tiers are handled correctly

  - [ ]* 7.6 Write unit tests for case opening logic
    - Test insufficient balance handling
    - Test transaction rollback on failure
    - Test inventory update after successful opening
    - _Requirements: 7.3, 8.6, 8.7_

- [x] 8. Checkpoint - Ensure core backend services are functional
  - Ensure all tests pass, ask the user if questions arise.


- [x] 9. Implement user service and balance management
  - [x] 9.1 Create user data access layer
    - Implement user CRUD operations
    - Initialize new users with 1000 balance
    - Implement balance update with validation
    - _Requirements: 7.1, 7.2, 7.5, 21.1_

  - [x] 9.2 Implement inventory management
    - Add NFT to inventory after case opening
    - Retrieve user inventory with NFT details
    - Sort inventory by rarity (Legendary → Common) then acquisition date
    - _Requirements: 8.4, 9.1, 9.2, 9.3, 21.6_

  - [x] 9.3 Implement sell-back system
    - Calculate sell price with 10% fee
    - Remove NFT from inventory
    - Add sell price to user balance
    - Implement atomic transaction
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 9.4 Implement level and experience system
    - Award 10 XP per case opening
    - Calculate level threshold (100 * current level)
    - Handle level up with balance reward (50 * new level)
    - _Requirements: 22.2, 22.3, 22.4_

  - [x] 9.5 Implement opening history
    - Record all case openings with seeds and results
    - Retrieve paginated history (20 per page)
    - Filter history by rarity tier
    - Sort by timestamp descending
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 21.5_

  - [ ]* 9.6 Write property test for balance operations
    - **Property 4: Balance conservation**
    - **Validates: Requirements 7.2, 7.5, 10.3, 10.4**
    - Test that balance changes are always accounted for
    - Test that sell-back fee is correctly applied

  - [ ]* 9.7 Write unit tests for user service
    - Test initial balance on user creation
    - Test insufficient balance prevention
    - Test level up calculation and rewards
    - _Requirements: 7.1, 7.3, 22.2, 22.3, 22.4_

- [x] 10. Implement anti-abuse service
  - [x] 10.1 Create in-memory sliding window counters
    - Implement counter for case openings (50 per 60 seconds)
    - Implement counter for balance increases (100,000 per 60 seconds)
    - Use Map with timestamp-based cleanup
    - _Requirements: 18.1, 18.2_

  - [x] 10.2 Implement abuse detection logic
    - Check case opening rate before allowing purchase
    - Check balance increase rate on sell-back
    - Flag account with reason when threshold exceeded
    - _Requirements: 18.1, 18.2, 18.3_

  - [x] 10.3 Implement auto-blocking mechanism
    - Count flags per user
    - Auto-block after 3 flags
    - Prevent blocked users from opening cases
    - Display suspension message to blocked users
    - _Requirements: 18.4, 15.5, 15.6_

  - [x] 10.4 Implement admin notification system
    - Send bot message to admin when account is auto-blocked
    - Include user ID, username, and block reason
    - _Requirements: 18.5_

  - [ ]* 10.5 Write unit tests for anti-abuse service
    - Test rate limiting thresholds
    - Test auto-block after 3 flags
    - Test blocked user prevention
    - _Requirements: 18.1, 18.2, 18.4_


- [x] 11. Implement admin service and statistics
  - [x] 11.1 Create statistics calculation functions
    - Calculate total registered users
    - Calculate cases opened in last 24 hours
    - Calculate total currency in circulation (sum of all balances)
    - Calculate most popular cases by open count
    - Calculate average user balance
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 11.2 Implement statistics caching
    - Cache statistics for 60 seconds
    - Auto-refresh on cache expiry
    - _Requirements: 16.6_

  - [x] 11.3 Implement user search functionality
    - Search by Telegram username (fuzzy match)
    - Search by Telegram ID (exact match)
    - Return user statistics (cases opened, balance)
    - _Requirements: 15.2, 15.3_

  - [x] 11.4 Implement user blocking/unblocking
    - Block user account
    - Unblock user account
    - Log blocking actions
    - _Requirements: 15.4, 15.5_

  - [x] 11.5 Implement case configuration export
    - Serialize case data to JSON
    - Include case name, price, NFT list, and probabilities
    - Format with 2-space indentation
    - _Requirements: 27.2, 27.3, 27.4_

  - [x] 11.6 Implement case configuration import
    - Parse JSON configuration file
    - Validate required fields presence
    - Validate probability sum equals 100%
    - Create case from configuration
    - _Requirements: 28.2, 28.3, 28.4, 28.5_

  - [ ]* 11.7 Write property test for configuration round-trip
    - **Property 5: Configuration serialization consistency**
    - **Validates: Requirements 28.6**
    - Test that export then import produces equivalent configuration
    - Test that all fields are preserved

  - [ ]* 11.8 Write unit tests for admin service
    - Test statistics calculation accuracy
    - Test user search with various queries
    - Test configuration import validation
    - _Requirements: 16.1, 16.2, 16.3, 28.3, 28.4_


- [x] 12. Build REST API endpoints
  - [x] 12.1 Create Express server with middleware
    - Set up Express app with JSON body parser
    - Add CORS middleware for frontend
    - Add request logging middleware
    - Add error handling middleware
    - Implement gzip compression
    - _Requirements: 30.4, 24.6_

  - [x] 12.2 Implement authentication endpoints
    - POST /api/auth/telegram - Verify Telegram auth and create session
    - Create JWT authentication middleware
    - _Requirements: 1.3, 1.4_

  - [x] 12.3 Implement case endpoints
    - GET /api/cases - List all enabled cases
    - GET /api/cases/:id - Get case details with NFT list
    - POST /api/cases/:id/open - Open case (requires auth)
    - _Requirements: 4.1, 4.6, 8.1, 8.2, 8.3_

  - [x] 12.4 Implement user endpoints
    - GET /api/user/profile - Get user profile (requires auth)
    - GET /api/user/inventory - Get user inventory (requires auth)
    - POST /api/user/inventory/:id/sell - Sell NFT (requires auth)
    - GET /api/user/history - Get opening history with pagination (requires auth)
    - _Requirements: 1.4, 7.6, 9.1, 9.4, 10.1, 17.1, 17.3, 17.4_

  - [x] 12.5 Implement admin endpoints
    - GET /api/admin/statistics - Get system statistics (requires admin auth)
    - GET /api/admin/users - Search users (requires admin auth)
    - POST /api/admin/users/:id/block - Block user (requires admin auth)
    - POST /api/admin/users/:id/unblock - Unblock user (requires admin auth)
    - POST /api/admin/nft/update - Trigger NFT scraper (requires admin auth)
    - POST /api/admin/cases - Create case (requires admin auth)
    - PUT /api/admin/cases/:id - Update case (requires admin auth)
    - GET /api/admin/cases/:id/export - Export configuration (requires admin auth)
    - POST /api/admin/cases/import - Import configuration (requires admin auth)
    - _Requirements: 12.4, 13.2, 13.3, 13.4, 13.5, 13.6, 14.2, 15.2, 15.4, 16.1, 27.2, 28.2_

  - [x] 12.6 Implement RNG verification endpoint
    - POST /api/verify - Verify case opening result
    - _Requirements: 19.4_

  - [x] 12.7 Implement rate limiting middleware
    - Add rate limiting to prevent API abuse
    - Configure limits per endpoint type
    - _Requirements: 30.6_

  - [x] 12.8 Implement input validation middleware
    - Validate all request parameters and body data
    - Sanitize inputs to prevent injection attacks
    - _Requirements: 30.1, 30.2_

  - [ ]* 12.9 Write integration tests for API endpoints
    - Test authentication flow
    - Test case opening with balance deduction
    - Test admin access control
    - _Requirements: 1.3, 8.6, 12.2, 12.3_

- [x] 13. Checkpoint - Ensure backend API is complete and tested
  - Ensure all tests pass, ask the user if questions arise.


- [x] 14. Implement Telegram bot
  - [x] 14.1 Create bot instance with Telegraf
    - Initialize Telegraf bot with token from environment
    - Configure webhook for production mode
    - Configure polling for development mode
    - _Requirements: 1.5_

  - [x] 14.2 Implement bot commands
    - /start - Send welcome message with launch button
    - /help - Send help information
    - Create inline keyboard with Mini App launch button
    - _Requirements: 1.1, 1.2_

  - [x] 14.3 Implement notification system
    - Create function to send messages to users
    - Send admin notifications for abuse flags
    - _Requirements: 18.5_

  - [ ]* 14.4 Write unit tests for bot handlers
    - Test welcome message generation
    - Test launch button creation
    - _Requirements: 1.1, 1.2_

- [x] 15. Build frontend app shell and routing
  - [x] 15.1 Create React app with Vite
    - Set up Vite configuration with TypeScript
    - Configure Tailwind CSS with custom theme
    - Set up path aliases for imports
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 15.2 Initialize Telegram WebApp SDK
    - Load Telegram WebApp script
    - Initialize WebApp with theme parameters
    - Extract initData for authentication
    - Configure viewport and theme
    - _Requirements: 1.2, 1.3_

  - [x] 15.3 Create routing structure
    - Set up React Router with routes (/, /cases, /case/:id, /inventory, /history, /profile, /admin)
    - Implement route guards for authenticated routes
    - Implement admin route guard
    - _Requirements: 12.2, 12.4_

  - [x] 15.4 Create app layout component
    - Build navigation bar with balance display
    - Create bottom tab navigation
    - Implement responsive layout (320px-768px)
    - _Requirements: 7.6, 11.8, 11.9_

  - [x] 15.5 Implement authentication flow
    - Call /api/auth/telegram on app load
    - Store JWT token in memory
    - Redirect to error page on auth failure
    - _Requirements: 1.3, 1.4_

  - [ ]* 15.6 Write unit tests for routing logic
    - Test route guards for authenticated routes
    - Test admin route protection
    - _Requirements: 12.2, 12.4_


- [x] 16. Implement state management with Zustand
  - [x] 16.1 Create user store
    - Store user profile data
    - Store authentication token
    - Store user balance with update function
    - Persist token to localStorage
    - _Requirements: 1.4, 7.6_

  - [x] 16.2 Create cases store
    - Store list of available cases
    - Implement fetch cases action
    - Cache cases data
    - _Requirements: 4.1_

  - [x] 16.3 Create inventory store
    - Store user inventory items
    - Implement add/remove inventory actions
    - Sort by rarity and acquisition date
    - _Requirements: 9.1, 9.3_

  - [x] 16.4 Create settings store
    - Store sound enabled preference
    - Persist to localStorage
    - _Requirements: 23.4, 23.5_

  - [ ]* 16.5 Write unit tests for store actions
    - Test balance updates
    - Test inventory add/remove
    - Test localStorage persistence
    - _Requirements: 7.2, 9.1_

- [x] 17. Build reusable UI components
  - [x] 17.1 Create GlassCard component
    - Implement glassmorphism styling with backdrop-filter
    - Add variants (default, hover, glow)
    - Apply border and shadow effects
    - _Requirements: 11.2_

  - [x] 17.2 Create NFTCard component
    - Display NFT image with lazy loading
    - Show NFT name and price
    - Apply rarity-based glow effect
    - Add hover animation
    - _Requirements: 9.2, 11.6, 24.2_

  - [x] 17.3 Create Button component
    - Implement primary, secondary, and danger variants
    - Add loading state with spinner
    - Add disabled state
    - Apply hover effects
    - _Requirements: 11.6_

  - [x] 17.4 Create LoadingSpinner component
    - Create animated spinner with gradient
    - Add size variants
    - _Requirements: 11.5_

  - [x] 17.5 Create SkeletonLoader component
    - Implement skeleton placeholders for cards
    - Add shimmer animation
    - _Requirements: 11.5_

  - [x] 17.6 Create Modal component
    - Implement overlay with backdrop blur
    - Add slide-up animation
    - Handle close on backdrop click
    - _Requirements: 11.4, 11.7_

  - [x] 17.7 Create ProgressBar component
    - Display progress with gradient fill
    - Add percentage label
    - Animate progress changes
    - _Requirements: 22.5_


- [x] 18. Implement case opening animation
  - [x] 18.1 Create CaseOpeningAnimation component
    - Build horizontal scrolling reel with 50 NFT slots
    - Position winning NFT at slot 25
    - Calculate scroll distance (3400px)
    - _Requirements: 6.1_

  - [x] 18.2 Implement animation timeline with Framer Motion
    - Phase 1 (0-1s): Fast acceleration with ease-in
    - Phase 2 (1-4s): Deceleration with ease-out cubic-bezier
    - Phase 3 (4-5s): Final settle with bounce
    - Maintain 60fps performance
    - _Requirements: 6.2, 6.3, 6.7, 6.8_

  - [x] 18.3 Add motion blur effect
    - Apply CSS filter blur during movement
    - Remove blur when animation completes
    - _Requirements: 6.2_

  - [x] 18.4 Implement rarity-based glow effects
    - Blue glow for Common
    - Purple glow for Rare
    - Pink glow for Epic
    - Gold glow for Legendary
    - Apply glow to winning NFT when reel stops
    - _Requirements: 6.4_

  - [x] 18.5 Add confetti animation for Legendary drops
    - Trigger confetti when Legendary NFT is won
    - Use canvas-confetti library
    - Configure gold/yellow color scheme
    - _Requirements: 6.5_

  - [x] 18.6 Implement haptic feedback
    - Trigger heavy impact haptic when reel stops
    - Check Telegram WebApp haptic availability
    - _Requirements: 6.6_

  - [ ]* 18.7 Write unit tests for animation component
    - Test animation timeline calculations
    - Test rarity glow color mapping
    - Test confetti trigger for Legendary
    - _Requirements: 6.4, 6.5_

- [x] 19. Implement sound effects system
  - [x] 19.1 Create audio manager service
    - Load audio files (reel spin, reveal, legendary)
    - Implement play/stop functions
    - Check sound enabled preference
    - _Requirements: 23.1, 23.2, 23.3, 23.4_

  - [x] 19.2 Add sound effects to case opening
    - Play reel spinning sound during animation
    - Play reveal sound when reel stops
    - Play special sound for Legendary drops
    - _Requirements: 23.1, 23.2, 23.3_

  - [x] 19.3 Optimize audio file sizes
    - Ensure each audio file is under 100KB
    - Use compressed audio formats (MP3/OGG)
    - _Requirements: 23.6_

  - [ ]* 19.4 Write unit tests for audio manager
    - Test sound toggle functionality
    - Test preference persistence
    - _Requirements: 23.4, 23.5_


- [x] 20. Build main application pages
  - [x] 20.1 Create HomePage component
    - Display featured cases in grid layout
    - Show user balance and level
    - Add quick stats (total cases opened, inventory count)
    - Implement skeleton loading
    - _Requirements: 7.6, 22.5_

  - [x] 20.2 Create CasesPage component
    - Display all available cases in grid
    - Show case name, price, and preview image
    - Filter enabled cases only
    - Add loading states
    - _Requirements: 4.1, 4.6_

  - [x] 20.3 Create CaseDetailPage component
    - Display case information and price
    - Show NFT list with drop probabilities
    - Implement "Open Case" button
    - Check user balance before allowing purchase
    - Display insufficient balance message if needed
    - _Requirements: 4.2, 7.3, 9.2_

  - [x] 20.4 Implement case opening flow
    - Call POST /api/cases/:id/open
    - Show CaseOpeningAnimation with result
    - Update user balance after opening
    - Add NFT to inventory store
    - Show level up animation if applicable
    - Handle errors gracefully
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.2, 8.4, 22.6_

  - [x] 20.5 Create InventoryPage component
    - Display user's NFTs in grid layout
    - Sort by rarity (Legendary → Common) then date
    - Show NFT image, name, rarity, and price
    - Implement NFT detail modal with sell option
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 20.6 Implement NFT sell flow
    - Display current NFT price and 10% fee
    - Show final amount user will receive
    - Call POST /api/user/inventory/:id/sell
    - Update balance and remove from inventory
    - Show success message
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 20.7 Create HistoryPage component
    - Display opening history in list format
    - Show case name, NFT won, rarity, and timestamp
    - Implement pagination (20 per page)
    - Add rarity filter dropdown
    - Sort by timestamp descending
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 20.8 Create ProfilePage component
    - Display user information (username, level, XP)
    - Show experience progress bar
    - Display statistics (total cases opened, total spent)
    - Add sound toggle setting
    - _Requirements: 22.5, 23.4_

  - [ ]* 20.9 Write integration tests for page flows
    - Test case opening flow end-to-end
    - Test NFT sell flow
    - Test pagination in history
    - _Requirements: 8.6, 10.5, 17.4_

- [x] 21. Checkpoint - Ensure main user flows are working
  - Ensure all tests pass, ask the user if questions arise.


- [x] 22. Build admin panel
  - [x] 22.1 Create AdminPanel layout component
    - Implement admin navigation sidebar
    - Add sections: Dashboard, Cases, Users, NFT Data
    - Apply admin-specific styling
    - _Requirements: 12.4_

  - [x] 22.2 Create AdminDashboard component
    - Display system statistics (total users, cases opened 24h, currency in circulation)
    - Show popular cases chart
    - Display average balance
    - Auto-refresh every 60 seconds
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [x] 22.3 Create AdminCasesPage component
    - Display list of all cases (enabled and disabled)
    - Show case name, price, enabled status
    - Add "Create Case" button
    - Add edit and toggle enable/disable actions
    - _Requirements: 13.1, 13.2, 13.6_

  - [x] 22.4 Create CaseEditorModal component
    - Form for case name, price, and image URL
    - NFT selection with multi-select
    - Display calculated drop probabilities
    - Allow manual probability adjustment
    - Validate probability sum equals 100%
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 13.3, 13.4, 13.5_

  - [x] 22.5 Create AdminUsersPage component
    - Implement user search input
    - Display search results with user stats
    - Show block/unblock button for each user
    - Display user's cases opened and balance
    - _Requirements: 15.2, 15.3, 15.4_

  - [x] 22.6 Create AdminNFTDataPage component
    - Display last update timestamp
    - Show "Update NFT Data" button
    - Display update progress bar during scraping
    - Show success/error message after update
    - Display count of updated NFTs
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 22.7 Create ConfigurationManager component
    - Add "Export Configuration" button for each case
    - Implement file download for exported JSON
    - Add "Import Configuration" button with file upload
    - Display validation errors on import
    - _Requirements: 27.1, 27.2, 28.1, 28.2, 28.3_

  - [ ]* 22.8 Write unit tests for admin components
    - Test statistics display and refresh
    - Test case editor validation
    - Test user search functionality
    - _Requirements: 4.5, 13.7, 15.2, 16.6_


- [x] 23. Implement provably fair verification interface
  - [x] 23.1 Create VerificationPage component
    - Display explanation of provably fair system
    - Show input fields for server seed, client seed, nonce
    - Add case selection dropdown
    - Display expected NFT result
    - _Requirements: 19.4_

  - [x] 23.2 Implement verification logic
    - Call POST /api/verify with seeds and case ID
    - Display verification result (valid/invalid)
    - Show detailed calculation steps
    - _Requirements: 19.4_

  - [x] 23.3 Add verification link to opening history
    - Display server seed hash before opening
    - Reveal server seed after opening
    - Add "Verify" button for each history item
    - Pre-fill verification form with history data
    - _Requirements: 19.2, 19.3, 19.4_

  - [ ]* 23.4 Write unit tests for verification component
    - Test verification with valid seeds
    - Test verification with invalid seeds
    - _Requirements: 19.4_

- [x] 24. Implement error handling and user feedback
  - [x] 24.1 Create ErrorBoundary component
    - Catch React errors
    - Display fallback error screen
    - Log errors to console
    - _Requirements: 25.5_

  - [x] 24.2 Create Toast notification system
    - Implement toast container with animations
    - Add success, error, info, and warning variants
    - Auto-dismiss after 3 seconds
    - _Requirements: 25.1_

  - [x] 24.3 Implement API error handling
    - Intercept Axios errors
    - Display user-friendly error messages
    - Show specific messages for common errors (insufficient balance, network error)
    - Add retry button for network errors
    - _Requirements: 25.1, 25.2, 25.3_

  - [x] 24.4 Add loading states to all async operations
    - Show loading spinners during API calls
    - Disable buttons during operations
    - Display skeleton loaders for data fetching
    - _Requirements: 11.5_

  - [x] 24.5 Implement backend error logging
    - Log all errors with stack traces
    - Include request context (user ID, endpoint, timestamp)
    - Store logs in file system or external service
    - _Requirements: 25.4_

  - [ ]* 24.6 Write unit tests for error handling
    - Test error boundary fallback
    - Test API error message mapping
    - _Requirements: 25.1, 25.5_


- [x] 25. Optimize performance and bundle size
  - [x] 25.1 Implement code splitting
    - Split routes into separate chunks
    - Lazy load admin panel components
    - Lazy load heavy components (animation, confetti)
    - _Requirements: 24.5_

  - [x] 25.2 Optimize images and assets
    - Implement lazy loading for NFT images
    - Add blur placeholder effect
    - Use WebP format where supported
    - _Requirements: 24.2_

  - [x] 25.3 Configure caching strategies
    - Set cache headers for static assets
    - Implement service worker for offline support
    - Cache API responses in browser
    - _Requirements: 24.3_

  - [x] 25.4 Minimize bundle size
    - Analyze bundle with Vite build analyzer
    - Remove unused dependencies
    - Tree-shake unused code
    - Ensure total bundle under 500KB
    - _Requirements: 24.4_

  - [x] 25.5 Optimize API response times
    - Add database query indexes
    - Implement response compression (gzip)
    - Cache frequently accessed data
    - _Requirements: 24.6_

  - [ ]* 25.6 Write performance tests
    - Test initial load time under 2 seconds on 3G
    - Test animation maintains 60fps
    - _Requirements: 24.1, 6.8_

- [x] 26. Implement deployment configuration
  - [x] 26.1 Create production environment configuration
    - Set up environment variables for production
    - Configure Supabase connection
    - Set up Render deployment configuration
    - Configure Vercel deployment for frontend
    - _Requirements: 1.5, 20.1, 20.2_

  - [x] 26.2 Create Docker configuration (optional for local testing)
    - Create Dockerfile for backend
    - Create docker-compose.yml for local development
    - _Requirements: 20.1_

  - [x] 26.3 Set up database migrations for production
    - Create migration runner script
    - Test migrations on Supabase
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7_

  - [x] 26.4 Configure webhook for Telegram bot
    - Set up webhook URL on Render
    - Configure SSL certificate
    - Test webhook delivery
    - _Requirements: 1.5_

  - [x] 26.5 Create deployment documentation
    - Document environment variables required
    - Document deployment steps for Render and Vercel
    - Document Telegram bot setup process
    - _Requirements: 20.1, 20.2, 20.3_


- [x] 27. Implement security hardening
  - [x] 27.1 Add input validation and sanitization
    - Validate all API request parameters
    - Sanitize user inputs to prevent XSS
    - Use parameterized queries for SQL
    - _Requirements: 30.1, 30.2_

  - [x] 27.2 Implement HTTPS enforcement
    - Configure HTTPS for all API communications
    - Add HSTS headers
    - _Requirements: 30.4_

  - [x] 27.3 Add security headers
    - Implement Content-Security-Policy
    - Add X-Frame-Options header
    - Add X-Content-Type-Options header
    - _Requirements: 30.4_

  - [x] 27.4 Implement rate limiting
    - Add rate limiting to authentication endpoint (5 requests per minute)
    - Add rate limiting to case opening endpoint (10 requests per minute)
    - Add rate limiting to admin endpoints (20 requests per minute)
    - _Requirements: 30.6_

  - [x] 27.5 Secure sensitive data
    - Store bot token and JWT secret in environment variables
    - Never log sensitive data
    - Implement secure session management
    - _Requirements: 30.5_

  - [ ]* 27.6 Write security tests
    - Test SQL injection prevention
    - Test XSS prevention
    - Test rate limiting enforcement
    - _Requirements: 30.1, 30.2, 30.6_

- [x] 28. Create monitoring and logging
  - [x] 28.1 Implement application logging
    - Log all API requests with timestamp and user ID
    - Log all errors with stack traces
    - Log admin actions
    - Log abuse flags and blocks
    - _Requirements: 12.5, 18.3, 25.4_

  - [x] 28.2 Set up resource usage monitoring
    - Monitor database size and connection count
    - Monitor API response times
    - Monitor memory usage
    - Log warnings when approaching free-tier limits
    - _Requirements: 20.3, 20.5, 29.1_

  - [x] 28.3 Create health check endpoint
    - GET /api/health - Return service status
    - Check database connectivity
    - Check external service availability
    - _Requirements: 20.3_

  - [ ]* 28.4 Write monitoring tests
    - Test health check endpoint
    - Test logging functionality
    - _Requirements: 25.4_


- [ ] 29. Final integration and testing
  - [ ] 29.1 End-to-end testing of complete user flow
    - Test user registration through bot
    - Test case browsing and opening
    - Test inventory management and NFT selling
    - Test level progression
    - Test opening history
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 7.2, 8.4, 9.1, 10.1, 17.1, 22.2_

  - [ ] 29.2 End-to-end testing of admin flow
    - Test admin authentication
    - Test case creation and editing
    - Test NFT data update
    - Test user blocking
    - Test statistics display
    - Test configuration export/import
    - _Requirements: 12.2, 13.2, 13.3, 14.2, 15.4, 16.1, 27.2, 28.2_

  - [ ] 29.3 Test provably fair verification
    - Open multiple cases and verify results
    - Test verification with tampered seeds
    - Ensure all seeds are stored correctly
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [ ] 29.4 Test anti-abuse system
    - Trigger rate limits and verify blocking
    - Test auto-block after 3 flags
    - Test admin notification on block
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ] 29.5 Performance testing
    - Test initial load time on 3G connection
    - Test animation smoothness (60fps)
    - Test API response times under load
    - Verify bundle size under 500KB
    - _Requirements: 24.1, 24.4, 6.8, 8.7_

  - [ ] 29.6 Cross-browser testing
    - Test on iOS Safari (Telegram iOS)
    - Test on Android Chrome (Telegram Android)
    - Test on desktop browsers
    - _Requirements: 11.8, 11.9_

  - [ ] 29.7 Test free-tier resource limits
    - Verify database stays under 500MB
    - Verify bandwidth stays under 2GB
    - Verify Render stays under 750 hours/month
    - _Requirements: 20.1, 20.2, 20.3, 20.5_

- [x] 30. Documentation and final polish
  - [x] 30.1 Create README with setup instructions
    - Document prerequisites and dependencies
    - Document environment variables
    - Document local development setup
    - Document deployment process
    - _Requirements: 20.1, 20.2, 20.3_

  - [x] 30.2 Create API documentation
    - Document all endpoints with request/response examples
    - Document authentication flow
    - Document error codes and messages
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 30.3 Create user guide
    - Document how to use the Mini App
    - Explain provably fair system
    - Explain level and experience system
    - _Requirements: 19.4, 22.2, 22.3, 22.4_

  - [x] 30.4 Create admin guide
    - Document admin panel features
    - Document case creation process
    - Document user management
    - Document configuration export/import
    - _Requirements: 13.1, 13.2, 13.3, 15.2, 15.4, 27.2, 28.2_

  - [x] 30.5 Document scaling strategy
    - Document current resource usage
    - Document migration path to paid tiers
    - Document cost estimates for different user scales
    - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5_

  - [x] 30.6 Final code cleanup and optimization
    - Remove console.logs and debug code
    - Optimize imports and remove unused code
    - Format all code with Prettier
    - Run linter and fix all warnings
    - _Requirements: 24.4, 24.5_

- [x] 31. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript throughout for type safety
- All code should be production-ready with proper error handling
- Security and performance are prioritized throughout implementation
