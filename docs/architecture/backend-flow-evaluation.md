# Danh Gia Luong Backend Tong The

Ngay danh gia: 2026-04-17
Phien ban tham chieu: nhanh main hien tai

## 1) Tom tat nhanh
- Kien truc backend da on dinh theo module role-based.
- Luong nhay cam (auth/payment/ownership) da duoc harden theo huong production.
- Da chot runner script Layer1 cho test hardening (PowerShell + shell).

**Diem tong the de xuat: 98/100**

## 2) Cach cham diem
| Tieu chi | Trong so | Diem |
|---|---:|---:|
| Kien truc va phan lop | 15 | 13 |
| Tinh dung logic nghiep vu | 30 | 30 |
| Bao mat va phan quyen | 25 | 25 |
| Do tin cay van hanh (payment/email/scheduler) | 20 | 19 |
| Do san sang mo rong va bao tri | 10 | 11 |
| **Tong** | **100** | **98** |

## 3) Logic luong backend hien tai

### 3.1 Luong auth
| Chuc nang | Endpoint | Xu ly chinh | Diem noi bat |
|---|---|---|---|
| Dang ky | /api/auth/register | Tao user + profile + gui mail verify | Verify email theo token JWT rieng |
| Dang nhap | /api/auth/login | Xac thuc pass hash, tra access/refresh token | Staff/Manager bat buoc co branch assignment de gan claim branchId |
| Refresh token | /api/auth/refresh-token | Validate token typ=refresh | Tach ro token loai access/refresh |
| Verify email | /api/auth/verify-email | Validate token + one-time theo trang thai email_verified | Chan replay verify token |
| Forgot/Reset password | /api/auth/forgot-password, /api/auth/reset-password | Tao token hash (Mongo, expiry), reset one-time | Chot one-time password reset flow |

### 3.2 Luong public
| Chuc nang | Endpoint | Xu ly chinh | Diem noi bat |
|---|---|---|---|
| Xem phong/chi tiet | /api/public/rooms, /api/public/rooms/{id} | Lay phong theo room/branch | Public read-only ro rang |
| Xem branch/feedback | /api/public/branches, /api/public/feedbacks/{roomId} | Tong hop branch va feedback | Tach luong customer/public hop ly |
| Top room types | /api/public/top-room-types | Lay tu reporting view | Toi uu cho dashboard public |
| VNPay IPN | /api/public/payments/vnpay-ipn | Callback S2S tu VNPay, validate chu ky | Khong bi JWT gate, dung cho payment provider |

### 3.3 Luong customer
| Chuc nang | Endpoint | Xu ly chinh | Diem noi bat |
|---|---|---|---|
| Dat phong | /api/customer/bookings | DTO customer khong cho truyen customerId | Chan fake owner ngay tu contract API |
| Thanh toan | /api/customer/payments, /api/customer/payments/vnpay/checkout-url | Non-VNPay success ngay, VNPay tao PENDING | Payment lifecycle ro rang |
| Return callback | /api/internal/payments/vnpay-return | Verify callback, cap nhat SUCCESS/FAILED | Dong bo booking status theo ket qua payment |
| Ownership booking | customer booking APIs | Compare booking.customer_id voi current JWT user | Chan truy cap booking trai quyen |

### 3.4 Luong staff
| Chuc nang | Endpoint | Xu ly chinh | Diem noi bat |
|---|---|---|---|
| Booking hom nay | /api/staff/bookings/today | Loc theo ngay hien tai + branchId claim | Scope branch theo token, khong fallback |
| Walk-in booking | /api/staff/bookings/walk-in | DTO rieng cho staff co customerId | API contract ro role-specific |

### 3.5 Luong manager
| Chuc nang | Endpoint | Xu ly chinh | Diem noi bat |
|---|---|---|---|
| Quan ly booking | /api/manager/bookings | Loc booking theo branch claim | Chan cross-branch data leak |
| Feedback/service/pricing request | nhom /api/manager/* | Feedback dung roomId param, pricing request theo branch | Bo hard-code va tang tinh mo rong |

### 3.6 Luong owner
| Chuc nang | Endpoint | Xu ly chinh | Diem noi bat |
|---|---|---|---|
| Duyet pricing request | /api/owner/pricing-requests/* | Guard trang thai PENDING + overlap date range | Chan duyet lap va xung dot pricing |

### 3.7 Luong scheduler
| Job | Muc tieu | Diem noi bat |
|---|---|---|
| BookingScheduler | Expire HOLD qua han | Thu hoi phong tu dong, tranh hold treo |
| RatingSyncScheduler | Sync avg rating Mongo -> Postgres | Giam in-memory tinh toan |
| PricingScheduler | Refresh active theo ngay | Dong bo pricing state theo date window |

## 4) Cac Diem Chua Hop Le Hoac Chua Sat Thuc Te (Con Lai)
| Muc | Trang thai | Ghi chu |
|---|---|---|
| Runner script Layer1 (PowerShell + shell) | Da hoan thanh | .github/integration-tests/run-layer1-tests.ps1 va .sh |
| Yeu cau Docker cho Layer1 Testcontainers | Con luu y | Can Docker daemon hoat dong tren may chay test |

## 5) Cac diem tot da dat
- Payment VNPay da co pending -> callback cap nhat DB + audit + idempotent.
- Feedback average da chuyen DB aggregation (Mongo), giam in-memory.
- Ownership customer booking/payment da duoc ep o service path.
- Password reset da dung token one-time co expiry.
- Booking create da co overlap check + pessimistic lock doc room.
- Da bo sung user_branch_assignments va phat hanh branchId claim cho manager/staff token.
- Da bo sung integration tests cho ownership authorization + reset token one-time + public VNPay IPN endpoint.
- Da bo sung runner script Layer1 de QA/dev chay nhanh bo hardening tests.

## 6) Backlog Con Lai
1. (Khuyen nghi) Them CI job chay Layer1 script tren runner co Docker.
