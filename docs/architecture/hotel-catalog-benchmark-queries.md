# Hotel Catalog Benchmark Queries (Defense Pack)

Ngay cap nhat: 2026-04-17
Muc dich: bo query mau de benchmark amenity search va bao ve oral defense

## 1) Query amenity + city (index-friendly)
```javascript
// Tim khach san active tai Da Nang co amenity pool
// Su dung index: idx_hotel_catalog_city_active + idx_hotel_catalog_amenities
 db.hotel_catalogs.find(
   {
     city: "Da Nang",
     is_active: true,
     amenities: "pool"
   },
   {
     hotel_name: 1,
     city: 1,
     amenities: 1,
     updated_at: 1
   }
 ).limit(20)
```

## 2) Text search description + amenities
```javascript
// Su dung text index: idx_hotel_catalog_text_desc_amenities
 db.hotel_catalogs.find(
   { $text: { $search: "business pool" }, is_active: true },
   { score: { $meta: "textScore" }, hotel_name: 1, city: 1 }
 ).sort({ score: { $meta: "textScore" } }).limit(10)
```

## 3) Explain de chung minh index usage
```javascript
 db.hotel_catalogs.find(
   { city: "Da Nang", is_active: true, amenities: "pool" }
 ).explain("executionStats")
```

Ky vong oral defense:
- totalDocsExamined gan voi so ket qua (khong scan full collection).
- winningPlan the hien IXSCAN thay vi COLLSCAN.

## 4) Mini benchmark checklist
- Dataset: >= 10k hotel_catalogs documents (co the script them nhanh).
- Chay moi query 3 lan, bo lan dau warm-up.
- Ghi lai:
  - executionTimeMillis
  - totalKeysExamined
  - totalDocsExamined
- So sanh truoc/sau khi co index.

## 5) Statement cho report
"Hotel catalog search duoc toi uu AP read path bang index theo city/is_active, multikey amenities va text index. Benchmark executionStats cho thay query amenities+city khong con COLLSCAN, giam ro rang totalDocsExamined tren tap du lieu lon."
