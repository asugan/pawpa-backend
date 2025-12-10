# Budget Simplification Roadmap - Backend

## 🎯 Hedef

Mevcut karmaşık budget sistemini basitleştirmek:

- Her kullanıcı için tek aylık overall budget (tüm petleri kapsayan)
- Category-specific budget'ları kaldır
- Pet-specific budget'ları kaldır
- Çoklu currency desteği koru
- Basit alert threshold sistemi

## 📊 Mevcut Durum Analizi

### Current Database Schema

```sql
-- budget_limits table (mevcut)
CREATE TABLE budget_limits (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  petId TEXT NOT NULL,
  category TEXT, -- NULL = overall budget, category-specific budget
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  period TEXT NOT NULL, -- 'monthly' | 'yearly'
  alertThreshold REAL NOT NULL DEFAULT 0.8,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
```

### Mevcut Karmaşıklıklar

1. **Category Field**: NULL (overall) + 13 farklı kategori seçeneği
2. **Period Field**: Monthly + Yearly seçenekleri
3. **Pet-specific Budgets**: Her pet için ayrı budget yönetimi
4. **Complex Queries**: Category, period ve pet bazlı filtreleme
5. **Multiple Budgets**: Aynı kullanıcı için birden fazla budget record'u

## 🔄 Yeni Basitleştirilmiş Sistem

### Yeni Database Schema

```sql
-- Yeni basitleştirilmiş user_budgets table
CREATE TABLE user_budgets (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE, -- Her kullanıcı için sadece bir budget
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  alertThreshold REAL NOT NULL DEFAULT 0.8,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,

  -- Foreign keys
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Index for performance
CREATE UNIQUE INDEX idx_user_budgets_userId ON user_budgets(userId);
```

### Schema Değişiklikleri

- ✅ **Table Adı**: `budget_limits` → `user_budgets`
- ✅ **UNIQUE Constraint**: `userId` üzerinde unique constraint
- ❌ **KALDIRILACAK**: `category` field
- ❌ **KALDIRILACAK**: `period` field (sadece monthly olacak)
- ❌ **KALDIRILACAK**: `petId` field (tüm petleri kapsayan tek budget)
- ✅ **KORUNACAK**: `currency` field (multi-currency desteği)
- ✅ **KORUNACAK**: `alertThreshold` field (basit hali)

## 🚀 Implementasyon Adımları

### Phase 1: Migration Hazırlığı

1. **Yeni Table Oluştur**

   ```sql
   -- Yeni user_budgets table'ını oluştur
   -- Mevcut overall budget'ları migrate et
   ```

2. **Data Migration Script**
   ```sql
   -- Mevcut overall budget'ları kullanıcı bazında toplulaştır
   -- Category-specific budget'ları ignore et
   -- Yearly budget'ları monthly olarak dönüştür
   -- Aynı kullanıcının birden fazla pet budget'ını birleştir
   ```

### Phase 2: Backend API Güncellemeleri

#### Models/Schemas Güncellemeleri

```typescript
// src/models/schema.ts
export const userBudgets = sqliteTable('user_budgets', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('TRY'),
  alertThreshold: real('alert_threshold').notNull().default(0.8),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

#### Service Layer Güncellemeleri

```typescript
// src/services/userBudgetService.ts
export class UserBudgetService {
  // Get budget by userId (sadece bir record dönecek)
  async getBudgetByUserId(userId: string): Promise<UserBudget | null>;

  // Create/update budget (upsert pattern)
  async setUserBudget(userId: string, data: SetUserBudgetInput): Promise<UserBudget>;

  // Simple budget status calculation (tüm petlerin harcamalarını içerir)
  async getBudgetStatus(userId: string): Promise<BudgetStatus | null>;

  // Simple alert check (tüm petler için)
  async checkBudgetAlert(userId: string): Promise<BudgetAlert | null>;
}
```

#### Controller Güncellemeleri

```typescript
// src/controllers/userBudgetController.ts
export class UserBudgetController {
  // GET /api/budget - Get user budget
  getUserBudget = async (req, res, next) => {
    /* simplified logic */
  };

  // PUT /api/budget - Set/update user budget
  setUserBudget = async (req, res, next) => {
    /* upsert logic */
  };

  // DELETE /api/budget - Remove user budget
  deleteUserBudget = async (req, res, next) => {
    /* simple delete */
  };

  // GET /api/budget/status - Get budget status
  getBudgetStatus = async (req, res, next) => {
    /* simplified status */
  };
}
```

#### Route Güncellemeleri

```typescript
// src/routes/userBudgetRoutes.ts
// Basitleştirilmiş route'lar
router.get('/', userBudgetController.getUserBudget);
router.put('/', userBudgetController.setUserBudget);
router.delete('/', userBudgetController.deleteUserBudget);
router.get('/status', userBudgetController.getBudgetStatus);
```

### Phase 3: Validation Types Güncellemeleri

```typescript
// src/types/api.ts
export interface SetUserBudgetInput {
  amount: number;
  currency: string;
  alertThreshold?: number; // optional, default 0.8
  isActive?: boolean; // optional, default true
}

export interface UserBudget {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  alertThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetStatus {
  budget: UserBudget;
  currentSpending: number;
  percentage: number;
  remainingAmount: number;
  isAlert: boolean;
  petBreakdown?: {
    petId: string;
    petName: string;
    spending: number;
  }[];
}
```

### Phase 4: Business Logic Basitleştirmesi

#### Budget Status Calculation

```typescript
// Simple monthly calculation (no more period logic)
const calculateBudgetStatus = (budget: UserBudget, expenses: Expense[]) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Filter expenses for current month and matching currency (tüm petler için)
  const monthlyExpenses = expenses.filter(
    expense =>
      expense.userId === budget.userId &&
      expense.currency === budget.currency &&
      expense.date >= startDate &&
      expense.date <= endDate
  );

  const currentSpending = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const percentage = (currentSpending / budget.amount) * 100;
  const remainingAmount = budget.amount - currentSpending;
  const isAlert = percentage >= budget.alertThreshold * 100;

  // Pet bazında harcama breakdown (opsiyonel)
  const petBreakdown = monthlyExpenses.reduce((acc, expense) => {
    const existing = acc.find(item => item.petId === expense.petId);
    if (existing) {
      existing.spending += expense.amount;
    } else {
      acc.push({
        petId: expense.petId,
        petName: expense.petName || 'Unknown Pet', // pet join ile alınacak
        spending: expense.amount,
      });
    }
    return acc;
  }, []);

  return {
    budget,
    currentSpending,
    percentage,
    remainingAmount,
    isAlert,
    petBreakdown,
  };
};
```

## 🗂️ File Structure Changes

### Yeni Dosyalar

```
src/
├── services/
│   └── userBudgetService.ts (yeni)
├── controllers/
│   └── userBudgetController.ts (yeni)
├── routes/
│   └── userBudgetRoutes.ts (yeni)
└── migrations/
    └── 001_simplify_budgets.sql (yeni)
```

### Güncellenecek Dosyalar

```
src/
├── models/schema.ts (userBudgets table ekle)
├── types/api.ts (yeni tipler)
├── routes/index.ts (yeni route'ları ekle)
└── config/database.ts (yeni table'ı export et)
```

### Kaldırılacak Dosyalar

```
src/
├── services/budgetService.ts
├── controllers/budgetController.ts
└── routes/budgetRoutes.ts
```

## 🔄 Migration Strategy

### Step 1: Create New Table

```sql
-- Yeni table oluştur
CREATE TABLE user_budgets (
  -- ... schema yukarıda
);
```

### Step 2: Migrate Data

```sql
-- Mevcut overall budget'ları kullanıcı bazında toplulaştır
INSERT INTO user_budgets (id, userId, amount, currency, alertThreshold, isActive, createdAt, updatedAt)
SELECT
  generateId() as id,
  userId,
  SUM(amount) as amount,
  currency,
  AVG(alertThreshold) as alertThreshold,
  MAX(isActive) as isActive,
  MIN(createdAt) as createdAt,
  MAX(updatedAt) as updatedAt
FROM budget_limits
WHERE category IS NULL AND period = 'monthly'
GROUP BY userId, currency;
```

### Step 3: Update References

```sql
-- Foreign key'leri güncelle
-- Index'leri oluştur
```

### Step 4: Cleanup (Optional)

```sql
-- Eski table'ı drop et (frontend migration'dan sonra)
-- DROP TABLE budget_limits;
```

## ⚠️ Riskler ve Çözümleri

### Risk 1: Data Loss

- **Çözüm**: Backup almadan migration yapma
- **Çözüm**: Category-specific budget'ları kullanıcıya bilgilendir
- **Çözüm**: Aynı kullanıcının birden fazla pet budget'ını doğru birleştir

### Risk 2: Frontend Compatibility

- **Çözüm**: Backend'de backward compatibility sağla
- **Çözüm**: Eski endpoint'leri geçici olarak tut
- **Çözüm**: Pet-specific route'ları user-level route'lara yönlendir

### Risk 3: Active Budget'ların Kaybolması

- **Çözüm**: Migration'da sadece active budget'ları taşı
- **Çözüm**: Yearly budget'ları monthly olarak convert et
- **Çözüm**: Kullanıcıların mevcut budget limitlerini koru

### Risk 4: Multi-pet Harcama Karmaşası

- **Çözüm**: Budget status'da pet breakdown sağla
- **Çözüm**: Hangi pet'in ne kadar harcama yaptığını göster

## 📋 Test Planı

### Unit Tests

- [ ] UserBudgetService methods
- [ ] Budget status calculation (tüm petler için)
- [ ] Alert threshold logic
- [ ] Pet breakdown calculation

### Integration Tests

- [ ] API endpoint'leri
- [ ] Database operations
- [ ] Migration script
- [ ] Multi-pet expense aggregation

### Manual Tests

- [ ] Budget creation/update
- [ ] Expense tracking against budget (birden fazla pet ile)
- [ ] Alert generation
- [ ] Multi-currency support
- [ ] Pet breakdown reporting

## 🚀 Deployment Plan

### Phase 1: Backend Deployment

1. Migration script'ini çalıştır
2. Yeni API endpoint'lerini deploy et
3. Eski endpoint'leri maintenance mode'a al
4. Pet-specific route'ları user-level route'lara yönlendir

### Phase 2: Frontend Integration

1. Frontend'i yeni API'leri kullanacak şekilde güncelle
2. Pet-specific budget UI'ını user-level budget'a çevir
3. Test ve validation
4. Full deployment

### Phase 3: Cleanup

1. Eski table'ları drop et
2. Eski kodları temizle
3. Documentation güncelle

## 📊 Success Metrics

- **Performance**: Budget query'lerinin %70 daha hızlı çalışması (daha az join)
- **Code Complexity**: Budget-related kodun %70 daha az satır olması
- **UI Simplicity**: Budget setup sürecinin 3 adımdan 1 adıma inmesi
- **User Experience**: Budget creation completion rate'in %90+ olması
- **Data Aggregation**: Tüm pet harcamalarının doğru bir şekilde toplulaştırılması

---

## 🔄 API Changes Summary

### Eski API'ler (Kaldırılacak)

```
GET /api/pets/:petId/budget-limits
GET /api/budget-limits/:id
POST /api/budget-limits
PUT /api/budget-limits/:id
DELETE /api/budget-limits/:id
GET /api/budget-limits/active
GET /api/budget-limits/alerts
GET /api/budget-limits/:id/status
GET /api/budget-limits/statuses
```

### Yeni API'ler (Eklenecek)

```
GET /api/budget - Get user budget
PUT /api/budget - Set/update user budget
DELETE /api/budget - Remove user budget
GET /api/budget/status - Get budget status with pet breakdown
GET /api/budget/alerts - Check budget alerts
```

### Backward Compatibility

- Eski pet-specific endpoint'ler geçici olarak yeni user-level endpoint'lere yönlendirilecek
- Response format'ında pet breakdown bilgisi eklenecek
- Migration sırasında her iki API de çalışacak

---

**Not**: Bu roadmap backend-focused'tır. Frontend değişiklikleri için ayrı bir doküman
hazırlanacaktır. User-level budget yaklaşımı, kullanıcıların tüm petleri için tek bir budget
yönetimi sağlayarak önemli ölçüde basitleştirme sunacaktır.
