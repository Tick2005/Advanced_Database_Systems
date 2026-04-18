# Mongo Setup + Stress Guide (Topic 14)

Ngay cap nhat: 2026-04-17

## 1) One-command setup Mongo
PowerShell command (tu root repo):

```powershell
./scripts/seed-mongo.ps1 -MongoUri "mongodb://localhost:27017" -Database "hotel"
```

Script se:
- Tao collections theo [collections.json](backend/src/main/resources/db/mongodb/collections.json)
- Tao index theo [indexes.json](backend/src/main/resources/db/mongodb/indexes.json)
- Upsert seed documents theo [seed.json](backend/src/main/resources/db/mongodb/seed.json)

## 2) Stress test read-path (amenity search)
PowerShell command (tu root repo):

```powershell
./scripts/stress-mongo-catalog.ps1 -MongoUri "mongodb://localhost:27017" -Database "hotel" -Iterations 10000 -OutputPath "docs/architecture/hotel-catalog-stress-result.json"
```

Script se:
- Chay query read-path ngau nhien theo city + amenity
- Tinh cac chi so latency: min, avg, p50, p95, p99, max
- Ghi ket qua ra file JSON

## 3) Artifact nen dinh kem vao report
- File JSON output: docs/architecture/hotel-catalog-stress-result.json
- Screenshot explain("executionStats") cho query city + is_active + amenities
- So sanh ngan truoc/sau index neu can bao ve diem cao

## 4) Luu y
- Can cai mongosh va MongoDB daemon dang chay
- Neu script bao "mongosh is not installed", cai mongosh truoc khi chay
