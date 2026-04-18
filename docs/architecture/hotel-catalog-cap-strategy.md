# Hotel Catalog CAP Strategy (Topic 14)

Ngay cap nhat: 2026-04-17
Pham vi: Giai trinh kien truc AP cho module Hotel Catalog tren MongoDB

## 1) Muc tieu kien truc
- Search amenities/city phai tra loi nhanh va co kha nang chiu tai cao.
- Booking/payment van thuoc SQL ACID, khong dua vao Mongo cho transaction core.
- Chap nhan eventual consistency cho truong mo ta catalog (description, images, amenity labels).

## 2) CAP trade-off da chon
- Uu tien: Availability + Partition tolerance (AP) cho hotel catalog read path.
- Danh doi: consistency tuc thoi o document catalog sau cap nhat.
- Giai thich nghiep vu: stale metadata ngắn hạn khong gay mat booking vi inventory va booking lock nam o SQL.

## 3) Co che dong bo va consistency
- SQL la source of truth cho inventory/booking/payment.
- Mongo la read model cho search va noi dung linh hoat.
- Dong bo theo huong asynchronous:
  - Update catalog -> ghi updated_at, last_synced_at
  - Retry-safe tren id duy nhat hotel_id
- Read preference de xuat:
  - production search: secondaryPreferred (tang availability)
  - admin consistency-sensitive view: primary

## 4) Cache invalidation va stale-data guard
- TTL khong ap dung cho catalog chinh; dung updated_at de client biet version.
- Khi co su thay doi lon (amenities/images), emit activity log va trigger re-index nhe.
- UI co the hien "updated X minutes ago" cho minh bach eventual consistency.

## 5) Lien he voi oral defense
Cau hoi mau va cach tra loi:
- "Vi sao catalog AP ma booking van an toan?"
  - Vi booking lock + overlap + payment state duoc enforce tai SQL ACID, Mongo chi phuc vu search.
- "Neu partition xay ra o Mongo thi sao?"
  - He thong uu tien tra ket qua search co the stale nhung booking write path khong anh huong.

## 6) Pattern transaction lien quan (Saga/2PC)
- Khong dung 2PC giua SQL va Mongo cho booking vi chi phi va do phuc tap cao.
- Dung compensation + idempotency:
  - VNPay callback idempotent theo transaction ref/request id
  - Booking state machine SQL xu ly rollback theo status/business rule
- Ly do phu hop de bai: booking correctness can ACID o SQL; catalog eventual consistency la chap nhan duoc.
