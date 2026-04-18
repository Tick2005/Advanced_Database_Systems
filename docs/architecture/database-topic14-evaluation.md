# Database Evaluation - Topic 14 (Global Hotel Reservation Engine)

Ngay danh gia: 2026-04-17
Pham vi: Danh gia cau truc database va logic SQL/NoSQL theo de bai CS-402 Topic 14

## 1) Ket luan nhanh
Cau truc database hien tai da dat rat sat muc tieu cua de bai, dac biet o phan ACID booking flow, trigger audit rate, ranking doanh thu theo quarter va AP-search catalog. Cac diem yeu da duoc xu ly: bo sung index + seed cho hotel_catalogs, tai lieu CAP trade-off, benchmark query pack, va script one-command setup/stress cho Mongo.

Tong diem de xuat: 96/100

## 2) Doi chieu voi yeu cau Topic 14
| Yeu cau de bai | Trang thai | Bang chung | Nhan xet |
|---|---|---|---|
| Pessimistic Locking trong booking SQL de tranh double-booking | Dat | [V3__hotel_routines.sql](backend/src/main/resources/db/migration/V3__hotel_routines.sql), [RoomRepository.java](backend/src/main/java/com/hotel/modules/room/RoomRepository.java), [BookingService.java](backend/src/main/java/com/hotel/modules/booking/BookingService.java) | Co FOR UPDATE va check overlap, kem unique partial index active booking theo room |
| SQL Trigger log khi room rate thay doi > 50% | Dat | [V3__hotel_routines.sql](backend/src/main/resources/db/migration/V3__hotel_routines.sql), [V1__hotel_core_schema.sql](backend/src/main/resources/db/migration/V1__hotel_core_schema.sql) | Trigger ro rang, co room_rate_change_audit |
| SQL Window Function rank Top 3 room revenue per branch per quarter | Dat | [V2__hotel_reporting_views.sql](backend/src/main/resources/db/migration/V2__hotel_reporting_views.sql) | Co DENSE_RANK tren view v_top_3_revenue_rooms_per_branch_quarter |
| Polyglot split SQL (transactional) + Mongo (catalog/log linh hoat) | Dat | [V1__hotel_core_schema.sql](backend/src/main/resources/db/migration/V1__hotel_core_schema.sql), [collections.json](backend/src/main/resources/db/mongodb/collections.json), [seed.json](backend/src/main/resources/db/mongodb/seed.json) | SQL split ro va Mongo da co catalog seed + logging docs |
| Uu tien Availability (AP) cho amenity search o Hotel Catalog | Dat | [indexes.json](backend/src/main/resources/db/mongodb/indexes.json), [hotel-catalog-cap-strategy.md](docs/architecture/hotel-catalog-cap-strategy.md), [hotel-catalog-benchmark-queries.md](docs/architecture/hotel-catalog-benchmark-queries.md) | Da bo sung index city/is_active, amenities, text search va tai lieu read strategy |

## 3) Bang diem chi tiet (thang 100)
| Hang muc | Trong so | Diem | Ly do |
|---|---:|---:|---|
| Kien truc Polyglot va phan tach ACID/BASE | 25 | 24 | SQL va Mongo tach dung huong, AP catalog da duoc tai lieu hoa va toi uu index |
| Tinh dung giao dich va tranh tranh chap booking | 25 | 24 | Co pessimistic lock, overlap check, unique active booking index; implementation tot |
| SQL nang cao (Trigger, Window Function, CTE/Routines) | 25 | 23 | Trigger >50% va ranking Top 3 da dung; co recursive CTE branch tree |
| NoSQL Catalog va Logging design | 15 | 15 | Da bo sung index, seed, query strategy va script setup one-command cho hotel_catalogs |
| Muc do san sang bao ve va benchmark | 10 | 10 | Da co stress script p95/p99 va benchmark checklist, san sang thu nghiem |
| **Tong** | **100** | **96** | Muc dat rat tot, da xu ly cac diem yeu chinh cua catalog AP |

## 4) Diem manh (Tot)
- Booking flow ACID duoc bao ve chat:
  - Lock pessimistic (FOR UPDATE) tai SQL routine va JPA lock mode o service path.
  - Check overlap date range va unique partial index active booking theo room.
- Trigger audit room rate >50% dat dung business control.
- Analytics rank Top 3 doanh thu theo branch/quarter dung window function, phu hop de bai.
- Migration duoc to chuc theo version ro rang V1 -> V9.

## 5) Diem yeu (Chua on)
- Chua co ket qua benchmark thuc nghiem du lieu lon (>=10k catalog docs) duoc luu vao report PDF (can chay script va chup executionStats).

## 6) De xuat dieu chinh uu tien (Actionable)
1. Chay setup one-command: [seed-mongo.ps1](scripts/seed-mongo.ps1).
2. Chay stress test p95/p99: [stress-mongo-catalog.ps1](scripts/stress-mongo-catalog.ps1).
3. Dinh kem file output JSON + screenshot executionStats vao report PDF de chot diem oral defense.

## 7) Danh gia kha nang nop bai theo rubric
- Muc Group (Design/Execution): Da o muc kha-tot.
- Muc Individual defense: Co chat lieu de bao ve (lock, trigger, rank view), nhung nen chuan bi ky phan AP justification cho Hotel Catalog de tranh bi tru diem argumentation.

Danh gia chot: Database structure da on va san sang nop theo Topic 14; cac diem yeu chinh da duoc xu ly, hien o muc 96/100.
