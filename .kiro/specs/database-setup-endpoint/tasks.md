# Implementation Plan: Database Setup Endpoint

## Overview

Implement a public HTTP endpoint `/api/setup` that initializes the PostgreSQL database on Render.com by executing existing migrations. The endpoint includes safety checks to ensure it only operates on empty databases, preventing accidental data corruption.

## Tasks

- [x] 1. Create setup route handler with database state checker
  - Create `backend/src/routes/setup.ts` file
  - Implement `isDatabaseEmpty()` function to check for users table existence and row count
  - Handle both SQLite and PostgreSQL table existence queries
  - _Requirements: 2.1, 2.2, 2.3, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 1.1 Write property test for database state checker
  - **Property 3: JSON Content-Type Header**
  - **Validates: Requirements 5.4**

- [x] 2. Implement setup endpoint handler
  - [x] 2.1 Create POST handler function that orchestrates setup workflow
    - Get database connection from DatabaseManager
    - Call isDatabaseEmpty() to verify database state
    - Execute MigrationRunner.up() if database is empty
    - Return appropriate HTTP responses with JSON structure
    - _Requirements: 1.1, 1.3, 1.4, 2.5, 4.1, 4.2, 4.3_
  
  - [x] 2.2 Implement error handling and response formatting
    - Handle database connection errors
    - Handle migration execution errors
    - Return 403 for already initialized databases
    - Return 500 for internal errors
    - Set Content-Type header to application/json
    - _Requirements: 1.5, 2.4, 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4_
  
  - [x] 2.3 Add error message sanitization
    - Implement sanitizeErrorMessage() function
    - Remove database credentials from error messages
    - Remove connection strings and passwords
    - _Requirements: 7.5_

- [ ]* 2.4 Write property test for idempotent operation
  - **Property 1: Idempotent Operation on Initialized Database**
  - **Validates: Requirements 2.5, 3.2, 3.3**

- [ ]* 2.5 Write property test for consistent error responses
  - **Property 2: Consistent Error Response for Initialized Database**
  - **Validates: Requirements 3.4**

- [ ]* 2.6 Write property test for credential sanitization
  - **Property 4: No Credential Exposure in Error Messages**
  - **Validates: Requirements 7.5**

- [ ]* 2.7 Write unit tests for setup endpoint
  - Test successful setup on empty database (no users table)
  - Test successful setup on database with empty users table
  - Test 403 response when users table has data
  - Test error handling for connection failures
  - Test error handling for migration failures
  - Test response format and Content-Type headers
  - _Requirements: 1.4, 1.5, 2.4, 3.1, 3.2, 5.1, 5.2, 5.3, 5.4_

- [x] 3. Register setup endpoint in Express application
  - Import setup routes in `backend/src/index.ts`
  - Register `/api/setup` route after database initialization
  - Register before app.listen() call
  - Ensure no authentication middleware is applied
  - Ensure no rate limiting is applied
  - _Requirements: 1.2, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4. Add logging for observability
  - Log setup endpoint invocations
  - Log database state check results
  - Log migration execution status
  - Log all errors with full stack traces
  - _Requirements: 4.5, 7.4_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The endpoint reuses existing MigrationRunner and IDatabase abstractions
- TypeScript is used throughout for type safety
- Property tests use fast-check library with minimum 100 iterations
