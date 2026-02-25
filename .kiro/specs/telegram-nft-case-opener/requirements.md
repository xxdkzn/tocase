# Requirements Document

## Introduction

This document specifies requirements for a Telegram Mini App that enables users to open virtual cases containing NFT Telegram Gifts. The system provides a gamified case-opening experience with rarity-based drop mechanics, user inventory management, and administrative controls. The application must operate entirely on free-tier infrastructure with zero recurring costs.

## Glossary

- **Mini_App**: The web application launched within Telegram's WebApp interface
- **Bot**: The Telegram bot that serves as the entry point and hosts the Mini_App
- **Case**: A virtual container with a defined list of NFTs, price, and drop probabilities
- **NFT_Gift**: A Telegram NFT gift item that can be won from cases
- **Drop_Probability**: The calculated chance of receiving a specific NFT from a case
- **Rarity_Tier**: Classification of NFTs (Common, Rare, Epic, Legendary) based on price
- **User_Balance**: Virtual currency amount available to a user for purchasing cases
- **Inventory**: Collection of NFTs owned by a user
- **Case_Opening_Animation**: Visual reel/roulette effect displayed during case opening
- **NFT_Data_Source**: External service (getgems.io) providing NFT information
- **Admin_Panel**: Administrative interface for system configuration and management
- **Scraper**: Component that extracts NFT data from the NFT_Data_Source
- **RNG_System**: Random number generation system for determining case drops
- **Sell_Back_System**: Mechanism allowing users to convert NFTs back to User_Balance
- **Anti_Abuse_System**: Protection mechanisms against cheating and exploitation

## Requirements

### Requirement 1: Telegram Bot Integration

**User Story:** As a user, I want to launch the Mini App from a Telegram bot, so that I can access the case opening game within Telegram.

#### Acceptance Criteria

1. WHEN a user starts the Bot, THE Bot SHALL display a welcome message with a launch button
2. WHEN a user clicks the launch button, THE Bot SHALL open the Mini_App in Telegram's WebApp interface
3. THE Bot SHALL authenticate the user using Telegram's WebApp authentication mechanism
4. WHEN authentication succeeds, THE Mini_App SHALL load the user's profile and User_Balance
5. THE Bot SHALL operate on free-tier hosting infrastructure

### Requirement 2: NFT Data Acquisition

**User Story:** As a system administrator, I want to automatically fetch NFT data from getgems.io, so that the cases contain current NFT gifts without manual updates.

#### Acceptance Criteria

1. THE Scraper SHALL extract NFT images from the NFT_Data_Source
2. THE Scraper SHALL extract NFT prices from the NFT_Data_Source
3. WHEN the NFT_Data_Source updates, THE Scraper SHALL refresh NFT data within 24 hours
4. THE Scraper SHALL operate without using paid APIs
5. IF the NFT_Data_Source is unavailable, THEN THE Scraper SHALL retry with exponential backoff up to 5 attempts
6. THE Scraper SHALL store extracted data in the database with timestamp metadata
7. WHEN scraping fails after all retries, THE Scraper SHALL log the error and alert the administrator

### Requirement 3: Rarity Classification

**User Story:** As a system, I want to automatically classify NFTs into rarity tiers based on price, so that drop probabilities reflect NFT value.

#### Acceptance Criteria

1. WHEN an NFT price is in the lowest 25th percentile, THE System SHALL classify it as Common
2. WHEN an NFT price is between 25th and 50th percentile, THE System SHALL classify it as Rare
3. WHEN an NFT price is between 50th and 90th percentile, THE System SHALL classify it as Epic
4. WHEN an NFT price is in the top 10th percentile, THE System SHALL classify it as Legendary
5. WHEN NFT prices are updated, THE System SHALL recalculate all Rarity_Tier classifications
6. THE System SHALL store Rarity_Tier with each NFT record

### Requirement 4: Case Configuration

**User Story:** As an administrator, I want to create and configure cases with specific NFTs and probabilities, so that I can control the game economy.

#### Acceptance Criteria

1. WHERE Admin_Panel access is granted, THE Admin_Panel SHALL allow creating new cases
2. WHEN creating a case, THE Admin_Panel SHALL require a case name, price, and NFT list
3. THE Admin_Panel SHALL calculate Drop_Probability for each NFT based on its Rarity_Tier
4. THE Admin_Panel SHALL allow manual adjustment of Drop_Probability values
5. WHEN Drop_Probability values are set, THE System SHALL validate that total probability equals 100 percent
6. THE Admin_Panel SHALL allow updating case prices after creation
7. THE Admin_Panel SHALL allow enabling or disabling cases

### Requirement 5: Drop Probability Calculation

**User Story:** As a system, I want to calculate drop probabilities dynamically based on rarity, so that expensive NFTs drop less frequently.

#### Acceptance Criteria

1. WHEN calculating Drop_Probability for Common NFTs, THE System SHALL assign 50 percent of total probability weight
2. WHEN calculating Drop_Probability for Rare NFTs, THE System SHALL assign 30 percent of total probability weight
3. WHEN calculating Drop_Probability for Epic NFTs, THE System SHALL assign 15 percent of total probability weight
4. WHEN calculating Drop_Probability for Legendary NFTs, THE System SHALL assign 5 percent of total probability weight
5. THE System SHALL distribute probability evenly among NFTs within the same Rarity_Tier
6. WHEN a case contains no NFTs of a specific Rarity_Tier, THE System SHALL redistribute that tier's probability proportionally to other tiers

### Requirement 6: Case Opening Animation

**User Story:** As a user, I want to see a smooth reel animation when opening a case, so that the experience feels engaging and premium.

#### Acceptance Criteria

1. WHEN a user opens a case, THE Mini_App SHALL display a horizontal scrolling reel animation
2. THE Mini_App SHALL apply motion blur effect during reel scrolling
3. THE Mini_App SHALL apply ease-out timing function to the reel deceleration
4. WHEN the reel stops, THE Mini_App SHALL highlight the won NFT with a glow effect matching its Rarity_Tier
5. WHEN a Legendary NFT is won, THE Mini_App SHALL display confetti animation
6. WHERE Telegram WebApp haptic feedback is available, THE Mini_App SHALL trigger haptic feedback when the reel stops
7. THE Mini_App SHALL complete the animation within 5 seconds
8. THE Mini_App SHALL maintain 60 frames per second during animation

### Requirement 7: User Balance Management

**User Story:** As a user, I want to have a balance that I can use to purchase cases, so that I can participate in the game.

#### Acceptance Criteria

1. WHEN a new user registers, THE System SHALL initialize User_Balance to 1000 virtual currency units
2. WHEN a user purchases a case, THE System SHALL deduct the case price from User_Balance
3. IF User_Balance is less than case price, THEN THE System SHALL prevent case purchase and display insufficient balance message
4. WHEN a user sells an NFT, THE System SHALL add the NFT price to User_Balance
5. THE System SHALL persist User_Balance changes to the database immediately
6. THE Mini_App SHALL display current User_Balance on all screens

### Requirement 8: Case Opening Logic

**User Story:** As a user, I want to open cases and receive NFTs based on fair probabilities, so that I trust the game mechanics.

#### Acceptance Criteria

1. WHEN a user initiates case opening, THE RNG_System SHALL generate a random seed using cryptographically secure randomness
2. THE RNG_System SHALL select an NFT from the case based on Drop_Probability values
3. THE System SHALL record the seed, timestamp, and result in the database
4. WHEN an NFT is selected, THE System SHALL add it to the user's Inventory
5. THE System SHALL deduct the case price from User_Balance before revealing the result
6. IF the transaction fails, THEN THE System SHALL rollback all changes and return an error
7. THE System SHALL complete the case opening transaction within 2 seconds

### Requirement 9: Inventory Management

**User Story:** As a user, I want to view my collected NFTs in an inventory, so that I can see what I have won.

#### Acceptance Criteria

1. THE Mini_App SHALL display all NFTs in the user's Inventory
2. THE Mini_App SHALL show NFT image, name, Rarity_Tier, and current price for each item
3. THE Mini_App SHALL sort Inventory by Rarity_Tier with Legendary first
4. WHEN a user selects an NFT, THE Mini_App SHALL display detailed information and sell option
5. THE Mini_App SHALL update Inventory display in real-time after case openings

### Requirement 10: NFT Sell Back System

**User Story:** As a user, I want to sell NFTs back to the system for virtual currency, so that I can open more cases.

#### Acceptance Criteria

1. WHEN a user initiates NFT sale, THE Sell_Back_System SHALL display the current NFT price
2. WHEN a user confirms sale, THE Sell_Back_System SHALL remove the NFT from Inventory
3. THE Sell_Back_System SHALL add the NFT price to User_Balance
4. THE Sell_Back_System SHALL apply a 10 percent transaction fee
5. THE Sell_Back_System SHALL complete the transaction atomically
6. IF the transaction fails, THEN THE Sell_Back_System SHALL rollback all changes

### Requirement 11: Mini App User Interface

**User Story:** As a user, I want a modern and smooth interface, so that the app feels premium and professional.

#### Acceptance Criteria

1. THE Mini_App SHALL use a dark color theme
2. THE Mini_App SHALL apply glassmorphism effects to card components
3. THE Mini_App SHALL use gradient backgrounds
4. THE Mini_App SHALL animate all transitions with duration between 200ms and 400ms
5. WHILE content is loading, THE Mini_App SHALL display skeleton loading placeholders
6. THE Mini_App SHALL apply hover effects to interactive elements
7. THE Mini_App SHALL animate page transitions smoothly
8. THE Mini_App SHALL adapt layout for mobile Telegram viewport dimensions
9. THE Mini_App SHALL maintain responsive design for screen widths from 320px to 768px

### Requirement 12: Admin Panel Access Control

**User Story:** As a system, I want to restrict admin panel access to authorized administrators only, so that unauthorized users cannot modify system configuration.

#### Acceptance Criteria

1. THE System SHALL define a single administrator username in configuration
2. WHEN a user attempts to access Admin_Panel, THE System SHALL verify the user's Telegram username matches the administrator username
3. IF the username does not match, THEN THE System SHALL deny access and return a 403 error
4. WHEN access is granted, THE Admin_Panel SHALL display all administrative functions
5. THE System SHALL log all Admin_Panel access attempts with timestamp and username

### Requirement 13: Admin Panel Case Management

**User Story:** As an administrator, I want to manage cases through the admin panel, so that I can control available cases and their configuration.

#### Acceptance Criteria

1. WHERE Admin_Panel access is granted, THE Admin_Panel SHALL display a list of all cases
2. THE Admin_Panel SHALL allow creating new cases with name, price, and NFT selection
3. THE Admin_Panel SHALL allow editing existing case prices
4. THE Admin_Panel SHALL allow modifying Drop_Probability values for NFTs in a case
5. THE Admin_Panel SHALL allow enabling or disabling cases
6. WHEN a case is disabled, THE Mini_App SHALL hide it from users
7. THE Admin_Panel SHALL validate all changes before saving

### Requirement 14: Admin Panel NFT Data Management

**User Story:** As an administrator, I want to manually trigger NFT data updates, so that I can refresh data on demand.

#### Acceptance Criteria

1. WHERE Admin_Panel access is granted, THE Admin_Panel SHALL display an update NFT data button
2. WHEN the administrator clicks the update button, THE Scraper SHALL fetch latest data from NFT_Data_Source
3. THE Admin_Panel SHALL display update progress with percentage completion
4. WHEN the update completes, THE Admin_Panel SHALL show success message with count of updated NFTs
5. IF the update fails, THEN THE Admin_Panel SHALL display error message with failure reason

### Requirement 15: Admin Panel User Management

**User Story:** As an administrator, I want to block abusive users, so that I can maintain fair gameplay.

#### Acceptance Criteria

1. WHERE Admin_Panel access is granted, THE Admin_Panel SHALL display a user search interface
2. THE Admin_Panel SHALL allow searching users by Telegram username or user ID
3. THE Admin_Panel SHALL display user statistics including total cases opened and User_Balance
4. THE Admin_Panel SHALL allow blocking a user account
5. WHEN a user is blocked, THE System SHALL prevent that user from opening cases
6. WHEN a blocked user attempts to open a case, THE Mini_App SHALL display an account suspended message

### Requirement 16: Admin Panel Statistics

**User Story:** As an administrator, I want to view system statistics, so that I can monitor game economy and user activity.

#### Acceptance Criteria

1. WHERE Admin_Panel access is granted, THE Admin_Panel SHALL display total number of registered users
2. THE Admin_Panel SHALL display total number of cases opened in the last 24 hours
3. THE Admin_Panel SHALL display total virtual currency in circulation
4. THE Admin_Panel SHALL display most popular cases by open count
5. THE Admin_Panel SHALL display average User_Balance across all users
6. THE Admin_Panel SHALL refresh statistics every 60 seconds

### Requirement 17: Opening History

**User Story:** As a user, I want to see my case opening history, so that I can review what I have won.

#### Acceptance Criteria

1. THE Mini_App SHALL display a history screen showing all past case openings
2. THE Mini_App SHALL show case name, NFT won, Rarity_Tier, and timestamp for each opening
3. THE Mini_App SHALL sort history by timestamp with most recent first
4. THE Mini_App SHALL paginate history with 20 entries per page
5. THE Mini_App SHALL allow filtering history by Rarity_Tier

### Requirement 18: Anti-Abuse Protection

**User Story:** As a system, I want to detect and prevent abusive behavior, so that the game remains fair for all users.

#### Acceptance Criteria

1. WHEN a user opens more than 50 cases within 60 seconds, THE Anti_Abuse_System SHALL flag the account for review
2. WHEN a user's User_Balance increases by more than 100000 units within 60 seconds, THE Anti_Abuse_System SHALL flag the account for review
3. THE Anti_Abuse_System SHALL log all flagged events with user ID, timestamp, and reason
4. WHEN an account is flagged 3 times, THE Anti_Abuse_System SHALL automatically block the account
5. THE Anti_Abuse_System SHALL notify the administrator of blocked accounts

### Requirement 19: Provably Fair Mechanism

**User Story:** As a user, I want to verify that case openings are fair, so that I can trust the system.

#### Acceptance Criteria

1. WHEN a case is opened, THE RNG_System SHALL generate a seed using the combination of server seed, client seed, and nonce
2. THE System SHALL display the server seed hash to the user before case opening
3. WHEN the case opening completes, THE System SHALL reveal the server seed to the user
4. THE Mini_App SHALL provide a verification interface where users can input seeds and verify results
5. THE System SHALL store all seeds and nonces for 30 days for verification purposes

### Requirement 20: Free-Tier Infrastructure

**User Story:** As a project owner, I want the entire system to run on free infrastructure, so that there are no recurring costs.

#### Acceptance Criteria

1. THE System SHALL use only free-tier hosting services
2. THE System SHALL use only free-tier database services
3. THE System SHALL operate within free-tier resource limits
4. THE System SHALL not require paid API subscriptions
5. IF free-tier limits are approached, THEN THE System SHALL log a warning

### Requirement 21: Database Schema

**User Story:** As a system, I want a well-structured database schema, so that data is organized efficiently.

#### Acceptance Criteria

1. THE System SHALL store user data including Telegram user ID, username, User_Balance, and registration timestamp
2. THE System SHALL store NFT data including name, image URL, price, Rarity_Tier, and last update timestamp
3. THE System SHALL store case data including name, price, enabled status, and creation timestamp
4. THE System SHALL store case-NFT relationships with Drop_Probability values
5. THE System SHALL store opening history with user ID, case ID, NFT ID, seed, and timestamp
6. THE System SHALL store inventory with user ID, NFT ID, and acquisition timestamp
7. THE System SHALL create indexes on frequently queried columns

### Requirement 22: Level System

**User Story:** As a user, I want to gain levels as I open cases, so that I feel progression in the game.

#### Acceptance Criteria

1. WHEN a new user registers, THE System SHALL set user level to 1
2. WHEN a user opens a case, THE System SHALL award 10 experience points
3. WHEN experience points reach level threshold, THE System SHALL increase user level by 1
4. THE System SHALL calculate level threshold as 100 multiplied by current level
5. THE Mini_App SHALL display user level and experience progress bar
6. WHEN a user levels up, THE Mini_App SHALL display a level up animation

### Requirement 23: Sound Effects

**User Story:** As a user, I want to hear sound effects during case opening, so that the experience is more immersive.

#### Acceptance Criteria

1. WHERE sound is enabled, THE Mini_App SHALL play a reel spinning sound during Case_Opening_Animation
2. WHERE sound is enabled, THE Mini_App SHALL play a reveal sound when the reel stops
3. WHERE sound is enabled, THE Mini_App SHALL play a special sound for Legendary NFT drops
4. THE Mini_App SHALL provide a sound toggle in settings
5. THE Mini_App SHALL remember sound preference in local storage
6. THE Mini_App SHALL use audio files smaller than 100KB each

### Requirement 24: Performance Optimization

**User Story:** As a user, I want the app to load quickly and run smoothly, so that I have a good experience.

#### Acceptance Criteria

1. THE Mini_App SHALL load initial view within 2 seconds on 3G connection
2. THE Mini_App SHALL lazy load images with placeholder blur effect
3. THE Mini_App SHALL cache static assets in browser cache
4. THE Mini_App SHALL minimize bundle size to under 500KB
5. THE Mini_App SHALL use code splitting for route-based chunks
6. THE System SHALL compress API responses with gzip

### Requirement 25: Error Handling

**User Story:** As a user, I want clear error messages when something goes wrong, so that I understand what happened.

#### Acceptance Criteria

1. WHEN an API request fails, THE Mini_App SHALL display a user-friendly error message
2. WHEN User_Balance is insufficient, THE Mini_App SHALL display the required amount and current balance
3. WHEN the network is unavailable, THE Mini_App SHALL display a connection error message with retry button
4. THE System SHALL log all errors with stack traces to error logging service
5. IF a critical error occurs, THEN THE Mini_App SHALL display a fallback error screen with support contact

### Requirement 26: Data Parser Implementation

**User Story:** As a system, I want to parse NFT data from HTML or JSON responses, so that I can extract required information without paid APIs.

#### Acceptance Criteria

1. THE Scraper SHALL send HTTP requests to NFT_Data_Source with appropriate headers
2. THE Scraper SHALL parse HTML responses using a DOM parser
3. THE Scraper SHALL extract NFT names from parsed HTML elements
4. THE Scraper SHALL extract NFT image URLs from parsed HTML elements
5. THE Scraper SHALL extract NFT prices from parsed HTML elements
6. IF the HTML structure changes, THEN THE Scraper SHALL log a parsing error
7. THE Scraper SHALL validate extracted data before storing in database

### Requirement 27: Pretty Printer for Configuration

**User Story:** As an administrator, I want to export case configurations in a readable format, so that I can backup and share configurations.

#### Acceptance Criteria

1. WHERE Admin_Panel access is granted, THE Admin_Panel SHALL provide an export configuration button
2. WHEN the administrator clicks export, THE System SHALL format case data as JSON
3. THE System SHALL include case name, price, NFT list, and Drop_Probability values in export
4. THE System SHALL format JSON with 2-space indentation for readability
5. THE Admin_Panel SHALL allow downloading the formatted configuration file

### Requirement 28: Configuration Round-Trip

**User Story:** As an administrator, I want to import previously exported configurations, so that I can restore or duplicate cases.

#### Acceptance Criteria

1. WHERE Admin_Panel access is granted, THE Admin_Panel SHALL provide an import configuration button
2. WHEN the administrator uploads a configuration file, THE System SHALL parse the JSON
3. THE System SHALL validate that all required fields are present
4. THE System SHALL validate that Drop_Probability values sum to 100 percent
5. WHEN validation succeeds, THE System SHALL create cases from the configuration
6. FOR ALL valid configuration exports, importing then exporting SHALL produce equivalent configuration data

## Non-Functional Requirements

### Requirement 29: Scalability Strategy

**User Story:** As a project owner, I want a plan for scaling beyond free tier, so that growth is possible.

#### Acceptance Criteria

1. THE System SHALL document resource usage metrics for free-tier limits
2. THE System SHALL document migration path to paid hosting tiers
3. THE System SHALL use database abstraction layer to support multiple database backends
4. THE System SHALL design API to support horizontal scaling
5. THE System SHALL document estimated costs for 1000, 10000, and 100000 active users

### Requirement 30: Security

**User Story:** As a user, I want my data to be secure, so that I can trust the platform.

#### Acceptance Criteria

1. THE System SHALL validate all user inputs to prevent injection attacks
2. THE System SHALL use parameterized queries for all database operations
3. THE System SHALL validate Telegram WebApp authentication data using Telegram's signature verification
4. THE System SHALL use HTTPS for all API communications
5. THE System SHALL not store sensitive user data beyond Telegram user ID and username
6. THE System SHALL implement rate limiting on API endpoints to prevent abuse
