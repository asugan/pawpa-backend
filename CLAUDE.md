<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security
  work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Quick Start Commands

### Development

- `npm run dev` - Start development server with hot reload (uses nodemon)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run type-check` - TypeScript type checking without emitting files

### Code Quality

- `npm run lint` - Run ESLint on all files
- `npm run lint:fix` - Fix ESLint auto-fixable issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check Prettier formatting

### Database Operations

- `npm run db:generate` - Generate new migration files from schema changes
- `npm run db:migrate` - Apply pending migrations to database
- `npm run db:push` - Push schema changes directly (development only)
- `npm run db:studio` - Open Drizzle Studio (GUI database editor)
- `npm run db:reset` - Delete database and re-run migrations

### Testing

- `npm test` - Run tests (currently shows "no test specified" error)

## Architecture Overview

This is a RESTful API backend for a pet care mobile application using Node.js, Express.js,
TypeScript, and SQLite with Drizzle ORM.

### High-Level Architecture

**MVC Pattern**: Clear separation between Controllers (HTTP layer), Services (business logic), and
Models (data layer).

**Request Flow**:

1. Request hits Express route (`src/routes/*.ts`)
2. Route handlers delegate to Controller classes (`src/controllers/*.ts`)
3. Controllers orchestrate calls to Service classes (`src/services/*.ts`)
4. Services perform database operations via Drizzle ORM
5. Response flows back through Controller → Route → Client

**Key Architectural Patterns**:

1. **Controller-Service Pattern**
   - Controllers handle HTTP concerns: request parsing, validation, response formatting
   - Services contain business logic and data access
   - Controllers instantiate and call services for each operation
   - Example: `PetController` delegates to `PetService`

2. **Authentication Pattern**
   - Better-Auth handles user sessions and authentication
   - `authMiddleware` in `src/middleware/auth.ts` protects all routes
   - AuthenticatedRequest interface extends Express Request with user data
   - Always pass `userId` to services to ensure data isolation

3. **Database Isolation Pattern**
   - All database queries filter by `userId` to ensure multi-tenant isolation
   - Services verify ownership before any read/update/delete operations
   - Drizzle relations defined in `src/models/schema.ts` with cascade deletes

4. **Validation Pattern**
   - Zod schemas defined in route files
   - `validateRequest` middleware validates request body/query params
   - Controllers assume validated data

5. **Response Pattern**
   - All successful responses use `successResponse()` utility
   - All responses follow standard format: `{ success: boolean, data?: T, error?: {...} }`
   - Pagination meta included in responses where applicable

6. **Error Handling Pattern**
   - Custom errors created via `createError()` helper
   - Global error handler in `src/middleware/errorHandler.ts` catches all errors
   - Consistent error response format across API

### Core Modules

**Authentication & Security** (`src/lib/auth.ts`, `src/middleware/auth.ts`):

- Better-Auth configured with SQLite adapter
- Supports email/password authentication
- Mobile-friendly trusted origins (pawpa://, exp://)
- Session expires in 7 days

**Database Layer** (`src/models/schema.ts`, `src/config/database.ts`):

- Drizzle ORM with SQLite
- Separate tables for auth (user, session, account, verification) and application data
- UUID primary keys for all tables
- Relations define foreign key constraints

**API Routes** (`src/routes/`):

- `/api/pets` - Pet management
- `/api/health-records` - Medical records
- `/api/events` - Scheduled events
- `/api/feeding-schedules` - Recurring feeding times
- `/api/expenses` - Expense tracking
- `/api/budget` - Budget management
- `/api/subscription` - User subscriptions

### Important Configuration Files

- `src/index.ts` - Server entry point, graceful shutdown handling
- `src/app.ts` - Express application setup, middleware configuration
- `drizzle.config.ts` - Drizzle ORM configuration
- `eslint.config.js` - ESLint rules and configuration
- `tsconfig.json` - TypeScript compiler settings (ESNext modules, strict mode)
- `.env` - Environment variables (not committed)

## Database Schema

Key tables (all have `userId` for multi-tenant isolation):

- **pets** - Pet profiles (name, type, breed, birth date, weight, gender, photo)
- **health_records** - Medical records (type, title, date, vet, cost, vaccine info)
- **events** - Scheduled activities (title, type, start/end times, location, reminder)
- **feeding_schedules** - Recurring feeding (time, food type, amount, days, active)
- **expenses** - Expense tracking (category, amount, currency, payment method, date, receipt)
- **budget_limits** - Pet-specific budget limits (category, amount, period, alert threshold)
- **user_budgets** - User-level budget limits (recently added to simplify budget system)
- **subscriptions** - User subscription status (provider, tier, status, expiresAt)

All tables use UUID text primary keys and include `createdAt`/`updatedAt` timestamps.

## Development Conventions

**File Organization**:

- Controllers: Class-based, named after resources (e.g., `PetController`, `EventController`)
- Services: Class-based, handle database operations and business logic
- Routes: Define Express routes and attach validation
- Middleware: Cross-cutting concerns (auth, logging, validation, error handling)
- Utils: Helper functions (response formatting, ID generation, date utilities)

**Type Safety**:

- TypeScript strict mode enabled
- All API types defined in `src/types/api.ts`
- Drizzle generated types exported from `src/models/schema.ts`
- Request/Response types imported from `../types/api`

**Code Quality**:

- ESLint configured with TypeScript and Prettier integration
- Import sorting via eslint-plugin-import
- No console.log in production code (warn/error in ESLint)
- Explicit return types for functions

**Common Patterns**:

Creating a new endpoint:

1. Add TypeScript types to `src/types/api.ts`
2. Create Service class with database operations in `src/services/`
3. Create Controller class in `src/controllers/` that uses the service
4. Define route in `src/routes/` with Zod validation schemas
5. Add tests in `jest/` directory

Database changes:

1. Modify schema in `src/models/schema.ts`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:migrate` to apply changes
4. Update TypeScript types if needed

## Environment Variables

Required in `.env`:

- `NODE_ENV` - development/production
- `PORT` - server port (default: 3000)
- `DATABASE_URL` - SQLite file path (default: ./data/pawpa.db)
- `CORS_ORIGIN` - allowed origin for CORS
- `RATE_LIMIT_WINDOW_MS` - rate limit window
- `RATE_LIMIT_MAX_REQUESTS` - max requests per window
- `AUTH_SECRET` - Better-Auth secret key

## Recent Major Changes

- **Budget System Refactor** (commit 320fcd6): Migrated from pet-specific budgets to user-level
  budgets for simpler expense tracking
- **Timezone Fix** (commit 4e3e72b): Resolved timezone inconsistency in upcoming events
- **ES Modules Migration** (commit b94881e): Migrated to ES modules with tsx for better consistency
