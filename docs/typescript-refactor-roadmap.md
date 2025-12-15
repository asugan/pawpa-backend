# TypeScript Best Practices Refactor - Roadmap

## Overview

Replace excessive use of `any` types in the services folder with proper TypeScript types to improve type safety, IDE support, and code maintainability.

## Problem Statement

After the MongoDB migration from Drizzle ORM, the services folder has accumulated significant technical debt through excessive use of the `any` type:

### Current `any` Usage Statistics
- **expenseService.ts**: 15 occurrences
- **feedingScheduleService.ts**: 13 occurrences
- **eventService.ts**: 13 occurrences
- **healthRecordService.ts**: 9 occurrences
- **userBudgetService.ts**: 7 occurrences
- **subscriptionService.ts**: 5 occurrences
- **petService.ts**: 1 occurrence

### Common Patterns of `any` Usage
1. Query builders: `const whereClause: any = { userId };`
2. Return types: `Promise<any | null>`, `Promise<any[]>`, `Promise<any>`
3. Function parameters: `expenseData: any`, `updates: Partial<any>`
4. Array callbacks: `(expense: any)` in reduce/map operations

## Solution Overview

Implement proper TypeScript typing using Mongoose's TypeScript support:

1. **Document Interfaces**: Create interfaces for each Mongoose model extending `Document`
2. **HydratedDocument**: Use for return types from queries
3. **FilterQuery**: Use for query builder objects
4. **Model Types**: Use TypeScript generics when defining models
5. **Request Types**: Leverage existing request types from `src/types/api.ts`

## Implementation Phases

### Phase 1: Create Document Interfaces

**New File**: `src/models/mongoose/types.ts`

Create TypeScript interfaces for all Mongoose models:
- `IPetDocument` - Pet model interface
- `IHealthRecordDocument` - Health record model interface
- `IEventDocument` - Event model interface
- `IFeedingScheduleDocument` - Feeding schedule model interface
- `IExpenseDocument` - Expense model interface
- `IUserBudgetDocument` - User budget model interface
- `ISubscriptionDocument` - Subscription model interface
- `IDeviceTrialRegistryDocument` - Device trial registry model interface

Each interface should:
- Extend Mongoose's `Document` type
- Include all fields from the Mongoose schema with proper types
- Add `_id`, `createdAt`, `updatedAt` fields
- Use `Types.ObjectId` for MongoDB references
- Be compatible with existing request/response types from `src/types/api.ts`

### Phase 2: Update Model Definitions

Update each Mongoose schema file to use TypeScript generics with the new document interfaces.

**Files to modify**:
- `src/models/mongoose/pet.ts`
- `src/models/mongoose/healthRecord.ts`
- `src/models/mongoose/event.ts`
- `src/models/mongoose/feedingSchedule.ts`
- `src/models/mongoose/expense.ts`
- `src/models/mongoose/userBudget.ts`
- `src/models/mongoose/subscription.ts`
- `src/models/mongoose/deviceTrialRegistry.ts`

**Example transformation**:
```typescript
// Before
import { Schema, model } from 'mongoose';
const petSchema = new Schema({ /* schema */ });
export const PetModel = model('Pet', petSchema);

// After
import { Schema, model, Document, Types } from 'mongoose';

export interface IPetDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  type: string;
  breed?: string;
  birthDate?: Date;
  weight?: number;
  gender?: 'male' | 'female' | 'other';
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

const petSchema = new Schema<IPetDocument>({ /* schema */ });
export const PetModel = model<IPetDocument>('Pet', petSchema);
```

### Phase 3: Update Index Exports

**File**: `src/models/mongoose/index.ts`

Export both models and types from a centralized index:

```typescript
// Export models
export { PetModel } from './pet';
export { HealthRecordModel } from './healthRecord';
export { EventModel } from './event';
export { FeedingScheduleModel } from './feedingSchedule';
export { ExpenseModel } from './expense';
export { UserBudgetModel } from './userBudget';
export { SubscriptionModel } from './subscription';
export { DeviceTrialRegistryModel } from './deviceTrialRegistry';

// Export document interfaces
export type {
  IPetDocument,
  IHealthRecordDocument,
  IEventDocument,
  IFeedingScheduleDocument,
  IExpenseDocument,
  IUserBudgetDocument,
  ISubscriptionDocument,
  IDeviceTrialRegistryDocument
} from './types';
```

### Phase 4: Refactor petService.ts (Reference Service)

**File**: `src/services/petService.ts`

Even though this has only 1 `any`, update it to use best practices:

**Changes**:
- Import `FilterQuery` from mongoose
- Change `const whereClause: any = { userId };` → `const whereClause: FilterQuery<IPetDocument> = { userId };`
- Update return types to use `HydratedDocument<IPetDocument>` where applicable
- Update imports to include both model and document type:
  ```typescript
  import { PetModel, IPetDocument } from '../models/mongoose';
  import { FilterQuery } from 'mongoose';
  ```

### Phase 5: Refactor expenseService.ts

**File**: `src/services/expenseService.ts`

Address all 15 `any` occurrences:

**Line-by-line changes**:
1. **Line 1-4**: Add imports:
   ```typescript
   import { FilterQuery, HydratedDocument } from 'mongoose';
   import { ExpenseModel, IExpenseDocument } from '../models/mongoose';
   import { CreateExpenseRequest, UpdateExpenseRequest } from '../types/api';
   ```

2. **Line 10**: Change return type:
   ```typescript
   // Before
   Promise<{ expenses: any[]; total: number }>
   // After
   Promise<{ expenses: HydratedDocument<IExpenseDocument>[]; total: number }>
   ```

3. **Line 25, 132, 162, 267, 287**: Replace query builder type:
   ```typescript
   // Before
   const whereClause: any = { userId };
   // After
   const whereClause: FilterQuery<IExpenseDocument> = { userId };
   ```

4. **Line 78**: Change return type:
   ```typescript
   // Before
   Promise<any | null>
   // After
   Promise<HydratedDocument<IExpenseDocument> | null>
   ```

5. **Line 85**: Change parameter type:
   ```typescript
   // Before
   expenseData: any
   // After
   expenseData: CreateExpenseRequest
   ```

6. **Line 106**: Change parameter type:
   ```typescript
   // Before
   updates: Partial<any>
   // After
   updates: UpdateExpenseRequest
   ```

7. **Line 131, 237, 266**: Change return types:
   ```typescript
   // Before
   Promise<any[]>
   // After
   Promise<HydratedDocument<IExpenseDocument>[]>
   ```

8. **Array callbacks**: Update to use proper types:
   ```typescript
   // Before
   expenseList.map((expense: any) => ...)
   // After
   expenseList.map((expense: HydratedDocument<IExpenseDocument>) => ...)
   ```

### Phase 6: Refactor eventService.ts

**File**: `src/services/eventService.ts`

Address all 13 `any` occurrences following the same pattern as expenseService.ts:

**Import changes**:
```typescript
import { FilterQuery, HydratedDocument } from 'mongoose';
import { EventModel, IEventDocument } from '../models/mongoose';
import { CreateEventRequest, UpdateEventRequest } from '../types/api';
```

**Key changes**:
- Line 18: `Promise<{ events: any[]; total: number }>` → `Promise<{ events: HydratedDocument<IEventDocument>[]; total: number }>`
- Line 23: `const whereClause: any = { userId };` → `const whereClause: FilterQuery<IEventDocument> = { userId };`
- Line 107: `Promise<any | null>` → `Promise<HydratedDocument<IEventDocument> | null>`
- Line 117: `eventData: any` → `eventData: CreateEventRequest`
- Line 141: `updates: Partial<any>` → `updates: UpdateEventRequest`
- Line 175: `Promise<any[]>` → `Promise<HydratedDocument<IEventDocument>[]>`
- Line 207: `Promise<any[]>` → `Promise<HydratedDocument<IEventDocument>[]>`

### Phase 7: Refactor feedingScheduleService.ts

**File**: `src/services/feedingScheduleService.ts`

Address all 13 `any` occurrences following the same pattern:

**Import changes**:
```typescript
import { FilterQuery, HydratedDocument } from 'mongoose';
import { FeedingScheduleModel, IFeedingScheduleDocument } from '../models/mongoose';
import { CreateFeedingScheduleRequest, UpdateFeedingScheduleRequest } from '../types/api';
```

### Phase 8: Refactor healthRecordService.ts

**File**: `src/services/healthRecordService.ts`

Address all 9 `any` occurrences following the same pattern:

**Import changes**:
```typescript
import { FilterQuery, HydratedDocument } from 'mongoose';
import { HealthRecordModel, IHealthRecordDocument } from '../models/mongoose';
import { CreateHealthRecordRequest, UpdateHealthRecordRequest } from '../types/api';
```

### Phase 9: Refactor userBudgetService.ts

**File**: `src/services/userBudgetService.ts`

Address all 7 `any` occurrences following the same pattern:

**Import changes**:
```typescript
import { FilterQuery, HydratedDocument } from 'mongoose';
import { UserBudgetModel, IUserBudgetDocument } from '../models/mongoose';
import { SetUserBudgetInput } from '../types/api';
```

### Phase 10: Refactor subscriptionService.ts

**File**: `src/services/subscriptionService.ts`

Address all 5 `any` occurrences following the same pattern:

**Import changes**:
```typescript
import { FilterQuery, HydratedDocument } from 'mongoose';
import { SubscriptionModel, ISubscriptionDocument } from '../models/mongoose';
```

## Testing Strategy

After completing all phases, verify the changes:

1. **Type Checking**: Run `npm run type-check` to ensure no TypeScript compilation errors
2. **Linting**: Run `npm run lint` to ensure code style compliance
3. **Functionality**: Test critical paths in the application to ensure behavior unchanged
4. **IDE Support**: Verify that autocomplete and type hints work properly in the services

## Benefits of This Refactor

1. **Type Safety**: Eliminate 63+ instances of `any`, catching errors at compile time
2. **Better IDE Support**: Autocomplete, type hints, and inline documentation
3. **Self-Documenting Code**: Types provide clear documentation of data structures
4. **Refactoring Confidence**: Types make it safer to refactor and modify code
5. **Reduced Bugs**: TypeScript compiler will catch many potential runtime errors
6. **Developer Experience**: Easier for new developers to understand the codebase
7. **Maintainability**: Types make the code easier to maintain and extend

## Files Modified Summary

### New Files (1):
- `src/models/mongoose/types.ts`

### Modified Files (17):
- Model files (7): Add TypeScript generics
  - `src/models/mongoose/pet.ts`
  - `src/models/mongoose/healthRecord.ts`
  - `src/models/mongoose/event.ts`
  - `src/models/mongoose/feedingSchedule.ts`
  - `src/models/mongoose/expense.ts`
  - `src/models/mongoose/userBudget.ts`
  - `src/models/mongoose/subscription.ts`

- Index file (1):
  - `src/models/mongoose/index.ts`

- Service files (7): Replace `any` with proper types
  - `src/services/petService.ts`
  - `src/services/expenseService.ts`
  - `src/services/eventService.ts`
  - `src/services/feedingScheduleService.ts`
  - `src/services/healthRecordService.ts`
  - `src/services/userBudgetService.ts`
  - `src/services/subscriptionService.ts`

**Total**: 18 files
