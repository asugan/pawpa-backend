# Project Context

## Purpose
Petopia Backend (PawPa) - A comprehensive backend API for a pet care mobile application. The system manages pet profiles, health records, events, feeding schedules, expenses, budgets, and user subscriptions. Provides RESTful API services with authentication, security, and data validation.

## Tech Stack
- **Runtime**: Node.js (ESNext modules)
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.x (strict mode enabled)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Better-Auth
- **Validation**: Zod
- **Security**: Helmet, CORS, Express Rate Limit
- **Logging**: Morgan
- **Code Quality**: ESLint, Prettier, TypeScript ESLint
- **Development**: Nodemon (hot reload), tsx (ES module runner)
- **Database Tools**: Drizzle Kit (migrations), Drizzle Studio

## Project Conventions

### Code Style
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: TypeScript ESLint with recommended rules
  - `@typescript-eslint/no-unused-vars`: Error (ignore args with `_` prefix)
  - `@typescript-eslint/no-explicit-any`: Warn
  - `@typescript-eslint/prefer-nullish-coalescing`: Error
  - `@typescript-eslint/prefer-optional-chain`: Error
  - `prefer-const`: Error
  - `no-var`: Error
- **Prettier**: Code formatting with ESLint integration
- **Import Sorting**: Handled by eslint-plugin-import
- **Line Endings**: LF (Unix)
- **Quotes**: Single quotes preferred
- **Semicolons**: Yes (enforced by Prettier)
- **Console Logs**: Warn in production code, off in entry points
- **File Naming**:
  - PascalCase for classes and types: `PetController.ts`
  - camelCase for functions, variables: `getPetById()`
  - kebab-case for file paths and route handlers
  - camelCase for database/ORM tables: `feeding_schedules`

### Architecture Patterns
**MVC Architecture**:
- **Controllers** (`src/controllers/`): Handle HTTP requests/responses, validation, and orchestration
- **Services** (`src/services/`): Business logic, data processing, and external API calls
- **Routes** (`src/routes/`): Route definitions and middleware composition
- **Models** (`src/models/`): Database schema definitions with Drizzle ORM
- **Middleware** (`src/middleware/`): Cross-cutting concerns (auth, logging, validation, error handling)

**Database Design**:
- All application tables include `userId` foreign key for multi-tenant isolation
- Better-Auth tables for authentication (user, session, account, verification)
- Cascade delete relationships for data integrity
- UUID primary keys (text) for all tables
- Timestamp fields with automatic `createdAt` and `updatedAt`
- Relations defined using Drizzle's relations API

**API Design**:
- RESTful endpoints with consistent naming
- All non-webhook routes require authentication
- Consistent API response format: `{ success: boolean, data?: T, error?: { code, message, details } }`
- Webhook endpoints have separate verification mechanisms
- Nested routes for pet-related resources (e.g., `/api/pets/:petId/health-records`)

**Middleware Stack** (in order):
1. Helmet (security headers)
2. CORS configuration
3. Rate limiting
4. Better-Auth handler (`/api/auth/*`)
5. Body parsing (JSON, URL-encoded)
6. Request logging
7. UTC date serialization
8. Custom middleware (validation, auth)
9. Error handler (last)

### Testing Strategy
- **Framework**: Jest (configured in `jest/` directory)
- **Test Files**: `*.test.ts`, `*.spec.ts`, or `__tests__/` directories
- **Test Configuration**:
  - TypeScript project service enabled
  - Different ESLint rules for tests (console logs allowed, any type allowed)
  - Separate TypeScript config for test files
- **Coverage**: Not enforced in current setup
- **Database**: Tests should use separate test database or mocking

### Git Workflow
- **Main Branch**: `main` (production-ready code)
- **Branching Strategy**: Feature branches recommended (not enforced)
- **Commit Conventions**: Conventional Commits recommended
  - `feat:` for new features
  - `fix:` for bug fixes
  - `refactor:` for refactoring
  - `chore:` for maintenance tasks
  - `docs:` for documentation
- **Code Review**: PRs recommended but not enforced
- **Git Ignore**: Node modules, dist, database files, environment files

## Domain Context

**Pet Care Application Core Features**:
- **Pet Management**: Profile information (name, type, breed, birth date, weight, gender, photo)
- **Health Records**: Medical records, vaccinations, veterinarian visits, costs, attachments, next due dates
- **Events**: Scheduled activities (appointments, walks, grooming), with reminders
- **Feeding Schedules**: Recurring feeding times with food type and amount
- **Expense Tracking**: Pet-related expenses by category (food, veterinary, medication, etc.) with receipt photos
- **Budget Management**: User-level and pet-level budget limits with alerts (80% threshold by default)
- **Subscriptions**: Pro tier subscriptions via RevenueCat integration + internal trials
- **Authentication**: Email/password with optional OAuth providers

**Data Relationships**:
- Users have many Pets, HealthRecords, Events, FeedingSchedules, Expenses, BudgetLimits, UserBudgets, Subscriptions
- Each Pet belongs to a User
- HealthRecords, Events, FeedingSchedules, Expenses, BudgetLimits belong to both User and Pet

**Key Business Rules**:
- All data is user-isolated via `userId` foreign keys
- Budget alerts trigger at 80% threshold by default
- Trial fraud prevention via device trial registry
- Webhook endpoints handle subscription events from RevenueCat
- Budget system recently refactored from pet-specific to user-level budgets

## Important Constraints

**Technical Constraints**:
- ES modules only (type: "module" in package.json)
- TypeScript strict mode (noImplicitAny, strictNullChecks, strictFunctionTypes, etc.)
- Single database file (SQLite) - not designed for multi-instance scaling
- All timestamps stored as UTC, serialized as ISO strings
- File uploads limited to 10MB (express.json limit)

**Security Constraints**:
- All API routes require authentication (except webhooks and health checks)
- Rate limiting enabled (configurable via environment variables)
- Helmet middleware for security headers
- CORS configured via environment variable
- Environment variables for sensitive configuration

**Performance Constraints**:
- SQLite may not scale well beyond moderate concurrent users
- No caching layer currently implemented
- No pagination currently implemented in core queries
- Single-threaded Node.js event loop limits concurrent operations

## External Dependencies

**Database & ORM**:
- `better-sqlite3`: SQLite driver (native module)
- `drizzle-orm`: Type-safe ORM with SQLite
- `drizzle-kit`: Migration tool for Drizzle

**Authentication**:
- `better-auth`: Authentication library with session management, OAuth support

**API & Web Framework**:
- `express`: Web framework
- `@types/express`: TypeScript types

**Validation & Parsing**:
- `zod`: Schema validation for runtime type checking
- `express-rate-limit`: Rate limiting middleware
- `cors`: CORS middleware

**Security & Monitoring**:
- `helmet`: Security headers middleware
- `morgan`: HTTP request logger

**Development Tools**:
- `typescript`: TypeScript compiler
- `tsx`: TypeScript runner for development
- `nodemon`: Hot reload development server
- `eslint`, `@typescript-eslint/eslint-plugin`, `typescript-eslint`: Linting
- `eslint-config-prettier`, `eslint-plugin-prettier`: Prettier integration
- `prettier`: Code formatter

**Optional Integrations**:
- `pdfkit`: PDF generation (for reports/receipts)
- `dotenv`: Environment variable loading

**Environment Variables Required**:
- `NODE_ENV`: development/production
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: SQLite database path (default: ./data/pawpa.db)
- `CORS_ORIGIN`: Allowed origin for CORS
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window
- `AUTH_SECRET`: Better-Auth secret key
- RevenueCat webhook verification keys (if using subscriptions)
