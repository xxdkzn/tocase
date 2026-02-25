# Requirements Document

## Introduction

Эта функция добавляет публичный HTTP endpoint для инициализации базы данных PostgreSQL на Render.com без необходимости доступа к shell. Endpoint запускает существующую систему миграций для создания начальной схемы базы данных, но работает только когда база данных пуста, обеспечивая безопасность.

## Glossary

- **Setup_Endpoint**: HTTP endpoint POST /api/setup для инициализации базы данных
- **Migration_System**: Существующая система миграций в backend/src/services/migrations.ts
- **Database_Service**: Сервис базы данных в backend/src/services/database.ts
- **Empty_Database**: База данных, в которой отсутствует таблица users или таблица users существует но не содержит записей
- **Express_App**: Express.js приложение с TypeScript
- **Schema**: Структура таблиц базы данных, создаваемая миграциями

## Requirements

### Requirement 1: Public Setup Endpoint

**User Story:** Как администратор, развертывающий приложение на Render.com, я хочу инициализировать базу данных через HTTP запрос, чтобы не требовался платный план с доступом к shell.

#### Acceptance Criteria

1. THE Setup_Endpoint SHALL accept POST requests at /api/setup
2. THE Setup_Endpoint SHALL not require authentication
3. WHEN a POST request is received, THE Setup_Endpoint SHALL execute the Migration_System
4. WHEN migrations complete successfully, THE Setup_Endpoint SHALL return HTTP 200 with success message
5. WHEN migrations fail, THE Setup_Endpoint SHALL return HTTP 500 with error details

### Requirement 2: Empty Database Safety Check

**User Story:** Как администратор, я хочу чтобы setup endpoint работал только на пустой базе данных, чтобы предотвратить случайное повреждение существующих данных.

#### Acceptance Criteria

1. WHEN a request is received, THE Setup_Endpoint SHALL check if the database is empty
2. THE Setup_Endpoint SHALL consider the database empty IF the users table does not exist
3. THE Setup_Endpoint SHALL consider the database empty IF the users table exists AND contains zero rows
4. IF the database is not empty, THEN THE Setup_Endpoint SHALL return HTTP 403 with error message "Database is already initialized"
5. THE Setup_Endpoint SHALL execute migrations only WHEN the database is empty

### Requirement 3: Idempotent Operation

**User Story:** Как администратор, я хочу безопасно вызывать setup endpoint несколько раз, чтобы повторные запросы не вызывали ошибок.

#### Acceptance Criteria

1. WHEN the Setup_Endpoint is called on an empty database, THE Setup_Endpoint SHALL execute migrations
2. WHEN the Setup_Endpoint is called on an initialized database, THE Setup_Endpoint SHALL return HTTP 403 without executing migrations
3. THE Setup_Endpoint SHALL not modify the database WHEN it is already initialized
4. FOR ALL valid requests to initialized database, THE Setup_Endpoint SHALL return consistent error response

### Requirement 4: Migration System Integration

**User Story:** Как разработчик, я хочу использовать существующую систему миграций, чтобы не дублировать логику инициализации базы данных.

#### Acceptance Criteria

1. THE Setup_Endpoint SHALL use the Migration_System from backend/src/services/migrations.ts
2. THE Setup_Endpoint SHALL use the Database_Service from backend/src/services/database.ts
3. WHEN executing migrations, THE Setup_Endpoint SHALL call MigrationRunner.up() method
4. THE Setup_Endpoint SHALL handle all errors from the Migration_System
5. THE Setup_Endpoint SHALL log migration execution status

### Requirement 5: Response Format

**User Story:** Как клиент API, я хочу получать структурированные ответы, чтобы программно обрабатывать результаты setup операции.

#### Acceptance Criteria

1. WHEN migrations succeed, THE Setup_Endpoint SHALL return JSON with structure: { "success": true, "message": string }
2. WHEN database is not empty, THE Setup_Endpoint SHALL return JSON with structure: { "success": false, "error": string }
3. WHEN migrations fail, THE Setup_Endpoint SHALL return JSON with structure: { "success": false, "error": string }
4. THE Setup_Endpoint SHALL set Content-Type header to "application/json"
5. THE Setup_Endpoint SHALL include appropriate HTTP status codes for all responses

### Requirement 6: Endpoint Registration

**User Story:** Как разработчик, я хочу чтобы endpoint был зарегистрирован до запуска сервера, чтобы он был доступен сразу после деплоя.

#### Acceptance Criteria

1. THE Setup_Endpoint SHALL be registered in backend/src/index.ts
2. THE Setup_Endpoint SHALL be registered before app.listen() call
3. THE Setup_Endpoint SHALL be registered after database initialization
4. THE Setup_Endpoint SHALL not be subject to rate limiting
5. THE Setup_Endpoint SHALL not be subject to authentication middleware

### Requirement 7: Error Handling

**User Story:** Как администратор, я хочу получать понятные сообщения об ошибках, чтобы диагностировать проблемы с инициализацией базы данных.

#### Acceptance Criteria

1. WHEN the database connection fails, THE Setup_Endpoint SHALL return HTTP 500 with connection error details
2. WHEN a migration fails, THE Setup_Endpoint SHALL return HTTP 500 with migration error details
3. WHEN checking database state fails, THE Setup_Endpoint SHALL return HTTP 500 with check error details
4. THE Setup_Endpoint SHALL log all errors to console
5. THE Setup_Endpoint SHALL not expose sensitive database credentials in error messages

### Requirement 8: Database State Verification

**User Story:** Как система, я хочу надежно определять состояние базы данных, чтобы корректно принимать решение о выполнении миграций.

#### Acceptance Criteria

1. THE Setup_Endpoint SHALL query the database for users table existence
2. IF the users table does not exist, THE Setup_Endpoint SHALL proceed with migrations
3. IF the users table exists, THE Setup_Endpoint SHALL count rows in the users table
4. IF the row count is zero, THE Setup_Endpoint SHALL proceed with migrations
5. IF the row count is greater than zero, THE Setup_Endpoint SHALL reject the request with HTTP 403
