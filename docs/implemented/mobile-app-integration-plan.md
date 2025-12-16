# Mobil Uygulama Güncelleme Planı

## Genel Durum
Backend'de MongoDB migration (SQLite → MongoDB) ve TypeScript refactor tamamlandı. Backend artık MongoDB ObjectId formatında ID'ler kullanıyor (24 karakter hexadecimal string).

## Backend'deki Temel Değişiklikler

### 1. ID Format Değişimi
- **Eski**: UUID format (örn: `123e4567-e89b-12d3-a456-426614174000`)
- **Yeni**: MongoDB ObjectId format (örn: `507f1f77bcf86cd799439011`)
- **Validation**: Backend ObjectId formatını kontrol ediyor: `/^[0-9a-fA-F]{24}$/`

### 2. Database Değişimi
- **Eski**: SQLite with Drizzle ORM
- **Yeni**: MongoDB with Mongoose
- **Auth**: Better-Auth artık MongoDB adapter kullanıyor

### 3. API Değişiklikleri
- API endpoint'ler aynı kaldı (`/api/pets`, `/api/health-records`, vb.)
- Response formatı aynı: `{ success: boolean, data?: T, error?: {...}, meta?: {...} }`
- Hata kodları güncellendi: `INVALID_ID_FORMAT`, `VALIDATION_ERROR`, vb.

### 4. TypeScript Refactor
- Tüm `any` tipleri kaldırıldı
- Mongoose document interface'leri eklendi (`IPetDocument`, `IHealthRecordDocument`, vb.)
- Tip güvenliği iyileştirildi

## Mobil Uygulama Değişiklikleri

Kullanıcı "Start fresh (clean slate)" tercihini seçti. Bu durumda mobil uygulamadaki tüm local data silinecek ve kullanıcılar sıfırdan başlayacak.

### Phase 1: Schema Validasyon Güncellemeleri (KRİTİK)

**Dosyalar:**
- `/home/asugan/Projects/petopia-mobile/lib/schemas/petSchema.ts`
- `/home/asugan/Projects/petopia-mobile/lib/schemas/healthRecordSchema.ts`
- `/home/asugan/Projects/petopia-mobile/lib/schemas/eventSchema.ts`
- `/home/asugan/Projects/petopia-mobile/lib/schemas/feedingScheduleSchema.ts`
- `/home/asugan/Projects/petopia-mobile/lib/schemas/expenseSchema.ts`
- `/home/asugan/Projects/petopia-mobile/lib/schemas/userBudgetSchema.ts`

**Değişiklikler:**
```typescript
// Eski (UUID)
id: z.string().uuid(),
petId: z.string().uuid(),

// Yeni (ObjectId)
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
id: objectIdSchema,
petId: objectIdSchema,
```

### Phase 2: Tip Güncellemeleri

**Dosyalar:**
- `/home/asugan/Projects/petopia-mobile/lib/types.ts`

**Değişiklikler:**
- ID alanları için yeni tip tanımlamaları ekle
- Backend'deki ObjectId formatına uygun hale getir
- `Pet`, `HealthRecord`, `Event`, vb. type'larındaki `id` alanlarını string olarak güncelle

### Phase 3: Local Storage Temizliği

**Dosyalar:**
- Auth storage temizliği (Better Auth session'ları)
- Tanstack Query cache temizliği
- Mevcut kullanıcı data'sını temizleme

**İşlemler:**
```typescript
// Uygulama açıldığında local storage'ı temizle
// AsyncStorage.clear() veya benzeri
// QueryClient cache'ini temizle
```

### Phase 4: API Client Güncellemeleri

**Dosyalar:**
- `/home/asugan/Projects/petopia-mobile/lib/api/client.ts`

**Değişiklikler:**
- Yeni hata kodu `INVALID_ID_FORMAT` için error handling ekle
- Backend'deki yeni MongoDB error handling'e uyum sağla

### Phase 5: Environment Variables

**Dosyalar:**
- `.env` ve `.env.example`

**Değişiklikler:**
- Backend MongoDB URL'sini güncelle (gerekirse)
- Test ortamı için yeni MongoDB URI ekle
- Better Auth URL'lerini kontrol et

### Phase 6: Dokümantasyon Güncellemeleri

**Dosyalar:**
- `README.md`
- API dokümantasyonları

**Değişiklikler:**
- Backend'in artık MongoDB kullandığını belirt
- ID formatının değiştiğini belirt
- Yeni veri modelini açıkla
- Test kullanıcıları için yeni akış belirt

## Test Stratejileri

### Yeni Kullanıcı Flow'u
1. Uygulamayı sıfırdan kur
2. Yeni kullanıcı oluştur
3. Pet oluştur
4. Health record, event, expense ekle
5. Tüm CRUD operasyonlarını test et

### Login Flow'u
1. Yeni kullanıcı kaydı
2. Logout/login test
3. Session yönetimi

### Data Isolation
1. Birden fazla kullanıcı ile test et
2. Kullanıcılar arası data izolasyonunu doğrula
3. User-based query'leri test et

## Riskler ve Mitigasyon

### Risk 1: Eski UUID'ler
**Problem**: Mobil app'te hala eski UUID formatında ID'ler varsa
**Çözüm**: Local storage'ı temizle, sıfırdan başla

### Risk 2: Backend'de eski data
**Problem**: Backend'de SQLite'dan kalma test data'sı
**Çözüm**: MongoDB'yi sıfırla, `npm run db:clean` ve `npm run db:seed` ile yeni data yükle

### Risk 3: Authentication sorunları
**Problem**: Better-Auth session'ları eski database'den kalma
**Çözüm**: Tüm session'ları temizle, yeniden login ol

### Risk 4: Eşzamanlılık
**Problem**: Kullanıcı app'i güncellerken backend'de değişiklik var
**Çözüm**: Backend deployment'ı tamamlandıktan sonra mobil güncellemeyi dağıt

## Deployment Adımları

1. **Backend**: MongoDB migration tamamlandı ✓
2. **Backend**: Deploy et, test et
3. **Mobile**: Phase 1-6 değişikliklerini yap
4. **Mobile**: Test et (dev ortam)
5. **Mobile**: Beta kullanıcıları ile test
6. **Mobile**: Production deploy
7. **Kullanıcılar**: App'i güncellesin

## Gerekli Eylemler

### Backend (Yapıldı ✓)
- MongoDB migration tamamlandı
- ObjectId validation eklendi
- TypeScript refactor tamamlandı
- Better Auth MongoDB adapter konfigüre edildi

### Mobil (Yapılacak)
- [ ] Schema validasyonlarını ObjectId formatına güncelle
- [ ] Tip tanımlamalarını güncelle
- [ ] Local storage temizliği ekle
- [ ] API client'ı yeni hata kodları için güncelle
- [ ] Environment variables'ı kontrol et
- [ ] Tüm CRUD operasyonlarını test et
- [ ] Authentication flow'u test et
- [ ] Beta test dağıtımı yap
- [ ] Production dağıtımı yap

## Özet

Backend'de büyük değişiklikler yapıldı ama API interface'i aynı kaldı. Mobil uygulamada sadece:

1. **UUID -> ObjectId format geçişi** (en kritik)
2. Schema validasyonları
3. Local storage temizliği
4. Dokümantasyon güncellemeleri

API endpoint'ler, request/response format'ları ve authentication mekanizması aynı. Kullanıcı clean slate tercih ettiği için data migration gerekmiyor.
