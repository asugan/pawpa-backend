# Mobile App MongoDB ID Migration Plan

## Problem Statement
The backend has migrated to MongoDB and now returns documents with `_id` fields. The mobile app currently expects `id` fields in all API responses, causing `undefined` values when accessing `.id` properties. This results in API calls with `undefined` IDs (e.g., `/api/pets/undefined/expenses`).

## Solution Overview
Update the mobile app to use `_id` instead of `id` throughout the codebase to match the MongoDB backend response format.

## Scope
- Update all Zod schemas to use `_id` instead of `id`
- Update all TypeScript types derived from schemas
- Update all components, hooks, and services accessing `.id` to use `._id`
- Update API request payloads that send `id` to send `_id`

## Implementation Steps

### Phase 1: Update Zod Schemas
Update all schema files in `/lib/schemas/` to use `_id` instead of `id`:

**Files to modify:**
- `/home/asugan/Projects/petopia-mobile/lib/schemas/petSchema.ts` - Line 89: Change `id: objectIdSchema` to `_id: objectIdSchema`
- `/home/asugan/Projects/petopia-mobile/lib/schemas/expenseSchema.ts` - Find and update all `id` fields
- `/home/asugan/Projects/petopia-mobile/lib/schemas/eventSchema.ts` - Find and update all `id` fields
- `/home/asugan/Projects/petopia-mobile/lib/schemas/healthRecordSchema.ts` - Find and update all `id` fields
- `/home/asugan/Projects/petopia-mobile/lib/schemas/feedingScheduleSchema.ts` - Find and update all `id` fields
- `/home/asugan/Projects/petopia-mobile/lib/schemas/userBudgetSchema.ts` - Find and update all `id` fields
- `/home/asugan/Projects/petopia-mobile/lib/schemas/subscriptionSchema.ts` - Find and update all `id` fields

**Important:** Also update any references to these schemas in the same files (e.g., in `BasePetSchema.extend()` calls).

### Phase 2: Update TypeScript Type References
After updating schemas, the TypeScript types will automatically update via `z.infer<>`. However, we need to update:

**Files to check and update:**
- `/home/asugan/Projects/petopia-mobile/lib/types.ts` - Any manual type definitions or extensions
- Any files that manually reference `Pet['id']`, `Expense['id']`, etc.

### Phase 3: Update Components and Screens
Update all components and screens that access `.id` properties:

**Critical files identified from grep:**
1. `/home/asugan/Projects/petopia-mobile/components/PetCard.tsx` - Line 33: `pet.id` → `pet._id`
2. `/home/asugan/Projects/petopia-mobile/app/(tabs)/index.tsx` - Lines 152, 155, 156: `pet.id` → `pet._id`
3. `/home/asugan/Projects/petopia-mobile/app/(tabs)/pets.tsx` - Find and update all `.id` references
4. `/home/asugan/Projects/petopia-mobile/components/PetModal.tsx` - Find and update all `.id` references
5. `/home/asugan/Projects/petopia-mobile/components/PetDetailModal.tsx` - Find and update all `.id` references

**Additional files to check:**
- All files in `/components/` directory
- All files in `/app/` directory
- All files in `/lib/hooks/` directory
- All files in `/lib/services/` directory

### Phase 4: Update API Request Payloads
Update any API calls that send `id` in the request body to send `_id` instead:

**Files to check:**
- `/home/asugan/Projects/petopia-mobile/lib/services/petService.ts`
- `/home/asugan/Projects/petopia-mobile/lib/services/expenseService.ts`
- `/home/asugan/Projects/petopia-mobile/lib/services/eventService.ts`
- `/home/asugan/Projects/petopia-mobile/lib/services/healthRecordService.ts`
- All other service files

### Phase 5: Update Utility Functions and Hooks
Update any utility functions or hooks that handle IDs:

**Files to check:**
- `/home/asugan/Projects/petopia-mobile/lib/hooks/useHomeData.ts`
- `/home/asugan/Projects/petopia-mobile/lib/hooks/useExpenses.ts`
- `/home/asugan/Projects/petopia-mobile/lib/hooks/useHealthRecords.ts`
- `/home/asugan/Projects/petopia-mobile/lib/hooks/useRecentExpenses.ts`
- Any ID comparison logic (e.g., `existing.id === p.id`)

### Phase 6: Testing and Verification
1. Run TypeScript type checking: `npm run type-check` or equivalent
2. Test the app in development mode
3. Verify that:
   - Pets list loads correctly
   - Pet details view works
   - Expenses load correctly for each pet
   - Health records load correctly for each pet
   - All CRUD operations work (create, update, delete)
   - Navigation between screens works correctly

## Files That Need Modification

### Schemas (Phase 1)
- [ ] `/home/asugan/Projects/petopia-mobile/lib/schemas/petSchema.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/schemas/expenseSchema.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/schemas/eventSchema.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/schemas/healthRecordSchema.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/schemas/feedingScheduleSchema.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/schemas/userBudgetSchema.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/schemas/subscriptionSchema.ts`

### Components (Phase 3)
- [ ] `/home/asugan/Projects/petopia-mobile/components/PetCard.tsx`
- [ ] `/home/asugan/Projects/petopia-mobile/components/PetModal.tsx`
- [ ] `/home/asugan/Projects/petopia-mobile/components/PetDetailModal.tsx`
- [ ] `/home/asugan/Projects/petopia-mobile/components/EventModal.tsx`
- [ ] `/home/asugan/Projects/petopia-mobile/components/FeedingScheduleModal.tsx`
- [ ] `/home/asugan/Projects/petopia-mobile/components/UpcomingEvents.tsx`
- [ ] `/home/asugan/Projects/petopia-mobile/components/forms/HealthRecordForm.tsx`
- [ ] `/home/asugan/Projects/petopia-mobile/components/forms/PetSelector.tsx`
- [ ] `/home/asugan/Projects/petopia-mobile/components/forms/EventForm.tsx`
- [ ] `/home/asugan/Projects/petopia-mobile/components/home/FinancialOverview.tsx`

### Screens (Phase 3)
- [ ] `/home/asugan/Projects/petopia-mobile/app/(tabs)/index.tsx`
- [ ] `/home/asugan/Projects/petopia-mobile/app/(tabs)/pets.tsx`
- [ ] `/home/asugan/Projects/petopia-mobile/app/(tabs)/finance.tsx`
- [ ] `/home/asugan/Projects/petopia-mobile/app/(tabs)/care.tsx`

### Hooks (Phase 5)
- [ ] `/home/asugan/Projects/petopia-mobile/lib/hooks/useHealthRecords.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/hooks/useHomeData.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/hooks/useExpenses.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/hooks/useRecentExpenses.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/hooks/usePetNextActivity.ts`

### Services (Phase 4)
- [ ] `/home/asugan/Projects/petopia-mobile/lib/services/petService.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/services/expenseService.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/services/eventService.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/services/healthRecordService.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/services/feedingScheduleService.ts`
- [ ] `/home/asugan/Projects/petopia-mobile/lib/services/userBudgetService.ts`

### Providers and Utilities
- [ ] `/home/asugan/Projects/petopia-mobile/providers/SubscriptionProvider.tsx`

## Risk Mitigation

1. **Breaking Changes**: This is a breaking change that will require the mobile app to be updated. Users will need to update their app.

2. **Test Thoroughly**: Ensure comprehensive testing of all features that use IDs:
   - Pet management (add, edit, delete, view)
   - Expense tracking
   - Health records
   - Events and feeding schedules
   - Navigation

3. **Rollback Plan**: If issues arise, the backend could potentially add a transformation layer to temporarily support both `id` and `_id` fields during a transition period.

4. **Communication**: Users should be informed about the update requirement.

## Success Criteria
- All TypeScript compilation errors resolved
- No runtime errors related to undefined IDs
- All API calls use valid MongoDB ObjectId strings
- App functionality fully restored
- All CRUD operations work correctly
