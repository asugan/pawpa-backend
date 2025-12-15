# MongoDB Migration Plan: Drizzle ORM → Mongoose

## Overview
Migrate the Petopia backend from Drizzle ORM with SQLite to Mongoose with MongoDB for improved scalability and performance.

**Migration Strategy**: Big Bang (complete migration in one go)
**Data Migration**: Clean slate (no existing data to migrate)
**Authentication**: Better-Auth has built-in MongoDB adapter (no custom adapter needed!)

## Key Discovery: Built-in MongoDB Adapter
Better-Auth already provides a production-ready MongoDB adapter! This significantly simplifies our migration.

**Usage**:
```typescript
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('petopia');

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client: client,        // Enables transaction support
    usePlural: false,      // Use singular collection names
    transaction: true      // Enable MongoDB transactions
  }),
  // ... rest of config stays the same
});
```

The adapter automatically handles:
- ObjectId ↔ string conversions
- Query translation between Better-Auth and MongoDB
- Collection management
- Transaction support (when client is provided)

## Phase 1: Prerequisites & Setup

### 1.1. MongoDB Infrastructure Setup
- Set up MongoDB Atlas cluster or local MongoDB instance
- Configure connection string in environment variables
- Create database and user with appropriate permissions
- Add MongoDB connection to `.env`:
  ```
  MONGODB_URI=mongodb://localhost:27017/pawpa
  ```

### 1.2. Install Dependencies
Remove SQLite/Drizzle packages:
```bash
npm uninstall drizzle-orm drizzle-kit better-sqlite3 @types/better-sqlite3
```

Install MongoDB packages:
```bash
npm install mongodb mongoose
npm install -D @types/mongoose
```

## Phase 2: Database Schema Migration

### 2.1. Create Mongoose Schema Files
Create new directory: `src/models/mongoose/`

**Files to Create**:
- `src/models/mongoose/user.ts` - User schema (for Better-Auth)
- `src/models/mongoose/session.ts` - Session schema
- `src/models/mongoose/account.ts` - OAuth account schema
- `src/models/mongoose/verification.ts` - Verification tokens
- `src/models/mongoose/pet.ts` - Pet schema
- `src/models/mongoose/healthRecord.ts` - Health record schema
- `src/models/mongoose/event.ts` - Event schema
- `src/models/mongoose/feedingSchedule.ts` - Feeding schedule schema
- `src/models/mongoose/expense.ts` - Expense schema
- `src/models/mongoose/userBudget.ts` - User budget schema
- `src/models/mongoose/subscription.ts` - Subscription schema
- `src/models/mongoose/deviceTrialRegistry.ts` - Device tracking schema
- `src/models/mongoose/index.ts` - Centralized exports

**Schema Design Patterns**:

**Application Collections** (Pets, Expenses, etc.):
```typescript
import { Schema, model } from 'mongoose';

const petSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  breed: String,
  birthDate: Date,
  weight: Number,
  gender: String,
  profilePhoto: String,
}, {
  timestamps: true  // Adds createdAt and updatedAt automatically
});

// Compound indexes for performance
petSchema.index({ userId: 1, name: 1 });

export const PetModel = model('Pet', petSchema);
```

**Key Schema Conversion Notes**:
- **ID Fields**: MongoDB uses ObjectId (converted to string by Better-Auth adapter)
- **Foreign Keys**: Use `ref: 'ModelName'` for relationships
- **Timestamps**: Enable Mongoose's `timestamps: true` option
- **Indexes**: Define compound indexes for queries that filter by userId + other fields
- **Cascade Deletes**: For application data, implement with Mongoose middleware:
  ```typescript
  // In petSchema file:
  petSchema.pre('findOneAndDelete', async function() {
    const petId = this.getQuery()._id;
    // Delete related documents
    await ExpenseModel.deleteMany({ petId });
    await HealthRecordModel.deleteMany({ petId });
    // ... etc
  });
  ```

### 2.2. Better-Auth Collections
Better-Auth will automatically create these collections when using the MongoDB adapter:
- `user` - User profiles
- `session` - User sessions
- `account` - OAuth provider accounts
- `verification` - Email verification & password reset tokens
- `api-key` - API keys (if plugin enabled)

**No need to define Mongoose schemas for these** - the adapter handles everything!

## Phase 3: Database Configuration

### 3.1. Replace Database Configuration
**File**: `src/config/database.ts` (REMOVE THIS FILE)

The current Drizzle database.ts file is no longer needed. We'll connect to MongoDB directly where needed.

### 3.2. Update Application Entry Point
**File**: `src/index.ts`

Add MongoDB connection initialization:
```typescript
import mongoose from 'mongoose';

// MongoDB connection setup
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

// Connect to MongoDB
await mongoose.connect(mongoUri);

console.log('Connected to MongoDB');

// Handle connection events
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});
```

### 3.3. Update Better-Auth Configuration
**File**: `src/lib/auth.ts`

Replace SQLite with MongoDB:

**Before** (SQLite):
```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: schema,
    usePlural: false,
  }),
  // ...
});
```

**After** (MongoDB):
```typescript
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

// Create MongoDB client (reuse existing connection if available)
const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db(); // Uses database name from connection string

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client: client,        // Enables transactions
    usePlural: false,      // Use singular collection names
    transaction: true      // Enable MongoDB transactions
  }),

  // Rest of your config stays EXACTLY the same:
  secret: process.env.AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    'http://localhost:8081',
    'http://localhost:3000',
    'capacitor://localhost',
    'pawpa://',
    'exp://'
  ],
  emailAndPassword: {
    enabled: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      // Your existing email sending logic
    },
  },
  socialProviders: {}, // Add providers when ready
  plugins: [
    // Your existing plugins (apiKey, admin, etc.)
  ],
  rateLimit: {
    storage: "database", // Uses MongoDB for rate limiting storage
  },
});

// Make sure to export the client for reuse
export { client };
```

## Phase 4: Service Layer Refactoring

### 4.1. Update All Service Files
Refactor 7 service files to use Mongoose instead of Drizzle ORM:

1. **src/services/petService.ts** (173 lines)
2. **src/services/healthRecordService.ts** (134 lines)
3. **src/services/eventService.ts** (288 lines)
4. **src/services/feedingScheduleService.ts** (218 lines)
5. **src/services/expenseService.ts** (293 lines)
6. **src/services/userBudgetService.ts** (220 lines)
7. **src/services/subscriptionService.ts** (177 lines)

### 4.2. Import Changes
**Before**:
```typescript
import { and, count, desc, eq, like } from 'drizzle-orm';
import { db, pets } from '../config/database';
```

**After**:
```typescript
import { PetModel } from '../models/mongoose/pet';
```

### 4.3. Query Pattern Changes

**Finding records**:
```typescript
// Before (Drizzle)
const result = await db
  .select()
  .from(pets)
  .where(and(eq(pets.userId, userId), eq(pets.id, id)));

// After (Mongoose)
const result = await PetModel.findOne({
  userId: userId,
  _id: id
}).exec();
```

**Finding with pagination**:
```typescript
// Before
const result = await db
  .select()
  .from(pets)
  .where(eq(pets.userId, userId))
  .orderBy(desc(pets.createdAt))
  .limit(limit)
  .offset(offset);

// After
const result = await PetModel.find({ userId: userId })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(offset)
  .exec();
```

**Creating records**:
```typescript
// Before
const [newPet] = await db
  .insert(pets)
  .values({ ...data, userId })
  .returning();

// After
const newPet = await PetModel.create({ ...data, userId });
```

**Updating records**:
```typescript
// Before
const [updated] = await db
  .update(pets)
  .set(updates)
  .where(and(eq(pets.userId, userId), eq(pets.id, id)))
  .returning();

// After
const updated = await PetModel.findOneAndUpdate(
  { userId: userId, _id: id },
  updates,
  { new: true }  // Return the updated document
).exec();
```

**Deleting records**:
```typescript
// Before
await db.delete(pets).where(and(eq(pets.userId, userId), eq(pets.id, id)));

// After
await PetModel.findOneAndDelete({ userId: userId, _id: id }).exec();
```

### 4.4. Aggregations and Complex Queries

**Before (Drizzle)**:
```typescript
const budgetSpending = await db
  .select({
    period: sql<string>`date(expenses.date, 'start of month')`,
    total: sum(expenses.amount),
    count: count(),
  })
  .from(expenses)
  .where(and(...conditions))
  .groupBy(sql`date(expenses.date, 'start of month')`)
  .orderBy(desc(sql`date(expenses.date, 'start of month')`));
```

**After (Mongoose - Aggregation Pipeline)**:
```typescript
const budgetSpending = await ExpenseModel.aggregate([
  { $match: { $and: conditions } },
  {
    $group: {
      _id: {
        year: { $year: '$date' },
        month: { $month: '$date' },
      },
      total: { $sum: '$amount' },
      count: { $sum: 1 },
    },
  },
  { $sort: { '_id.year': -1, '_id.month': -1 } },
]);
```

### 4.5. Population (Joins)

For relationships, use Mongoose's populate:

```typescript
// Get expenses with pet details
const expenses = await ExpenseModel.find({ userId: userId })
  .populate('petId', 'name type')  // Populate pet details
  .sort({ date: -1 })
  .exec();

// The petId field will be replaced with the actual pet document
```

## Phase 5: Route and Controller Updates

### 5.1. Update ID Validation
**Files**: All route files in `src/routes/`

Add MongoDB ObjectId validation:
```typescript
import { z } from 'zod';

// Validate MongoDB ObjectId format (24 hex characters)
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// In route validation:
const petIdSchema = z.object({
  id: objectIdSchema,
});
```

### 5.2. Error Handling Updates
**File**: `src/middleware/errorHandler.ts`

Add MongoDB error handling:
```typescript
import mongoose from 'mongoose';

app.use((err, req, res, next) => {
  logger.error('Error:', err);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: Object.values(err.errors).map(e => e.message)
      }
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        message: 'Duplicate key error',
        details: err.keyValue
      }
    });
  }

  // Invalid ObjectId
  if (err.kind === 'ObjectId' || err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid ID format',
        details: err.value
      }
    });
  }

  // MongoDB connection error
  if (err.name === 'MongooseServerSelectionError') {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Database connection error',
        details: 'Unable to connect to the database'
      }
    });
  }

  // ... rest of error handling
});
```

## Phase 6: Configuration & Tooling

### 6.1. Remove Drizzle Configuration
Delete these files:
- `drizzle.config.ts`
- `src/config/database.ts` (if no longer needed)

Remove Drizzle scripts from `package.json`:
```json
// Remove these scripts:
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio",
"db:reset": "rm -f ./data/pawpa.db && npm run db:migrate"
```

### 6.2. Add MongoDB Scripts
```json
{
  "scripts": {
    "db:seed": "node scripts/seed-mongodb.js",
    "db:clean": "node scripts/clean-mongodb.js",
    "db:status": "node scripts/check-mongodb.js",
    "db:generate-indexes": "node scripts/generate-indexes.js"
  }
}
```

### 6.3. Environment Variables
Update `.env`:
```bash
# Remove:
DATABASE_URL=./data/pawpa.db

# Add:
MONGODB_URI=mongodb://localhost:27017/pawpa
MONGODB_TEST_URI=mongodb://localhost:27017/pawpa_test
```

## Phase 7: Testing Strategy

### 7.1. Create Test Utilities
**File**: `src/lib/test-utils.ts`

```typescript
import mongoose from 'mongoose';

export async function setupTestDB() {
  const testUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/pawpa_test';
  await mongoose.connect(testUri);
}

export async function teardownTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
```

### 7.2. Write Integration Tests
Test each service with real MongoDB operations.

## Phase 8: Deployment & Migration

### 8.1. Pre-deployment Checklist
- [ ] MongoDB Atlas or local MongoDB instance provisioned
- [ ] Connection strings configured
- [ ] Indexes created in production database
- [ ] Authentication tested with MongoDB adapter
- [ ] All services refactored and unit tested
- [ ] Performance benchmarks run
- [ ] Rollback plan prepared

### 8.2. Deployment Steps
1. Deploy code changes
2. MongoDB adapter automatically creates Better-Auth collections
3. Restart application
4. Verify database connection
5. Create initial application data
6. Test critical user flows
7. Monitor error rates and performance

### 8.3. Monitoring
- MongoDB connection pool metrics
- Query performance monitoring
- Error tracking for MongoDB errors
- Application performance metrics

## Phase 9: Post-Deployment Cleanup

### 9.1. Remove SQLite Artifacts
- Delete `data/` directory
- Remove SQLite database files
- Clean up unused imports
- Update `.gitignore` if needed

### 9.2. Documentation Updates
- Update `CLAUDE.md` with MongoDB information
- Document database setup procedures
- Update API documentation if needed
- Update deployment documentation

## Updated Implementation Order (5 Weeks)

**Week 1**: Setup & Core Configuration
- Install MongoDB and Mongoose
- Create Mongoose schema files for application data
- Update Better-Auth config with MongoDB adapter
- Set up database connection

**Week 2**: Application Models & Services (Part 1)
- Migrate petService, healthRecordService
- Migrate eventService, feedingScheduleService
- Write tests for migrated services

**Week 3**: Application Services (Part 2)
- Migrate expenseService, userBudgetService
- Migrate subscriptionService
- Complete all service tests
- Implement cascade delete middleware

**Week 4**: Integration & Testing
- End-to-end testing
- Performance testing
- Security review
- Error handling refinement

**Week 5**: Deployment & Cleanup
- Production deployment
- Monitoring setup
- Documentation updates
- Remove SQLite artifacts

## Files to be Modified (25 files vs 36)

### Removed (no longer needed):
- ❌ `src/lib/auth-adapter.ts` - No custom adapter needed!
- ❌ `src/config/database.ts` - Direct connection in index.ts
- ❌ MongoDB auth collection schemas (handled by adapter)

### Core Configuration (3 files)
- `src/index.ts` - Add MongoDB connection
- `src/lib/auth.ts` - Update to use built-in MongoDB adapter
- `package.json` - Update dependencies and scripts

### Application Schemas (10 files - new)
- `src/models/mongoose/pet.ts`
- `src/models/mongoose/healthRecord.ts`
- `src/models/mongoose/event.ts`
- `src/models/mongoose/feedingSchedule.ts`
- `src/models/mongoose/expense.ts`
- `src/models/mongoose/budgetLimit.ts`
- `src/models/mongoose/userBudget.ts`
- `src/models/mongoose/subscription.ts`
- `src/models/mongoose/deviceTrialRegistry.ts`
- `src/models/mongoose/index.ts`

### Services (7 files)
- `src/services/petService.ts`
- `src/services/healthRecordService.ts`
- `src/services/eventService.ts`
- `src/services/feedingScheduleService.ts`
- `src/services/expenseService.ts`
- `src/services/userBudgetService.ts`
- `src/services/subscriptionService.ts`

### Routes (7 files - validation updates)
- `src/routes/petRoutes.ts` - Add ObjectId validation
- `src/routes/healthRecordRoutes.ts` - Add ObjectId validation
- `src/routes/eventRoutes.ts` - Add ObjectId validation
- `src/routes/feedingScheduleRoutes.ts` - Add ObjectId validation
- `src/routes/expenseRoutes.ts` - Add ObjectId validation
- `src/routes/userBudgetRoutes.ts` - Add ObjectId validation
- `src/routes/subscriptionRoutes.ts` - Add ObjectId validation

### Middleware (1 file)
- `src/middleware/errorHandler.ts` - Add MongoDB error handling

### Configuration & Scripts (3 files)
- Create `.env.example` - Update environment variables
- Delete `drizzle.config.ts` - Remove Drizzle config
- Create test utilities

**Total**: ~25 files (vs 36 in original plan)

## Risk Mitigation

1. **Built-in Adapter Risk**: VERY LOW - Official Better-Auth MongoDB adapter is production-ready
2. **Data Loss Risk**: LOW (clean slate migration)
3. **Performance Risk**: LOW - MongoDB typically performs better for this use case
4. **Rollback Plan**: Keep Git branch with SQLite implementation until migration is verified

## Success Criteria

- [ ] Better-Auth authentication works with MongoDB adapter
- [ ] All API endpoints return same response format as before
- [ ] All existing functionality preserved
- [ ] Performance benchmarks meet or exceed SQLite implementation
- [ ] No data integrity issues
- [ ] Successful production deployment
- [ ] Application successfully connects to MongoDB
- [ ] All cascade deletes work correctly
- [ ] Team can maintain and extend MongoDB implementation

## Key Benefits of Using Built-in Adapter

1. **Less Code**: No need to write and maintain custom adapter (estimated 300-400 lines)
2. **Battle-Tested**: Official adapter is used by many production applications
3. **Future-Proof**: Automatically stays updated with Better-Auth features
4. **Less Testing**: Adapter already thoroughly tested
5. **Faster Implementation**: Save ~1 week of development time
6. **Better Support**: Official documentation and community support
7. **Automatic Updates**: Bug fixes and improvements come with Better-Auth updates

## Notes

- Better-Auth MongoDB adapter requires MongoDB 4.0+ (for transactions)
- For Atlas M0 free tier, set `transaction: false` (doesn't support transactions)
- The adapter handles all ID conversions automatically (string ↔ ObjectId)
- Collections are automatically created on first use
- Consider MongoDB indexing strategy for production performance
