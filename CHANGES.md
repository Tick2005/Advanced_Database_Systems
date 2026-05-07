# Changelog – Đợt cải thiện hệ thống

## Tổng hợp commit theo file

### 1. `frontend/src/hooks/useCameraProfile.js` *(FILE MỚI)*
**Commit:** `feat(settings): hoàn thiện logic Settings, thêm dirty-state, camera profile status từ browser API, cleanup cấu trúc`

- Hook tái sử dụng quản lý toàn bộ vòng đời camera.
- API: `openCamera()`, `closeCamera()`, `capture()` → `{ dataUrl, blob }`.
- Xử lý đầy đủ các lỗi: NotAllowedError, NotFoundError, NotReadableError, OverconstrainedError.
- Tự dọn stream khi unmount (useEffect cleanup).
- Dùng được ở Profile, bất kỳ trang nào cần camera.

---

### 2. `frontend/src/features/users/pages/Settings.jsx`
**Commit:** `feat(settings): hoàn thiện logic Settings, thêm dirty-state, camera profile status từ browser API, cleanup cấu trúc`

- Thêm **dirty-state**: nút Lưu chỉ active khi có thay đổi.
- Tích hợp **`navigator.permissions.query({ name: "camera" })`** → hiển thị trạng thái quyền camera thực tế (granted / denied / prompt / unknown) ngay trong form.
- Cảnh báo khi tắt allowCamera nhưng trình duyệt vẫn đang cấp quyền.
- Cleanup listener `onchange` khi unmount để tránh memory leak.
- Tách sub-components: `SectionLabel`, `FieldRow`, `ToggleRow`, `CameraStatusCard`.
- Link sang trang Bảo mật (`/customer/settings/advanced`).

---

### 3. `backend/src/main/resources/db/migration/V7__seed_data.sql`
**Commit:** `feat(seed): bổ sung SeedController (dev/test only) + seed addendum feedbacks, pricing_logs, settings mặc định`

- Bổ sung bộ **feedback mẫu** (2 bản ghi): booking đã check-out → feedback rating 4–5 sao.
- Bổ sung **pricing_logs mẫu** (2 bản ghi): APPROVED + REJECTED trail.
- Dùng `ON CONFLICT DO NOTHING` → an toàn khi migration chạy nhiều lần.

---

### 4. `backend/src/main/java/com/hotel/controllers/internal/SeedController.java` *(FILE MỚI)*
**Commit:** `feat(seed): bổ sung SeedController (dev/test only) + seed addendum feedbacks, pricing_logs, settings mặc định`

- Endpoint `POST /api/internal/seed/check` → đếm số bản ghi các bảng chính.
- Endpoint `POST /api/internal/seed/reset-demo` → xoá booking/payment/feedback demo, sẵn sàng chạy lại seed.
- **Chỉ bật với Spring profile `dev` hoặc `test`** (`@Profile({"dev","test"})`).
- Ghi log rõ ràng ở từng bước.

---

### 5. `frontend/src/features/manager/pages/ManagerServicesPage.jsx`
**Commit:** `fix(cleanup): dịch toàn bộ text tiếng Việt + chuẩn hoá UI cho ManagerServicesPage, OwnerLogsPage, StaffCheckinPage, StaffCheckoutPage`

- Dịch toàn bộ placeholder / label / button sang tiếng Việt.
- Chuẩn toolbar: branch selector + search + mode filter trên 1 hàng.
- Hiển thị ảnh thumbnail trực tiếp trong DataTable.
- Định dạng giá: `toLocaleString("vi-VN") + " ₫"`.
- Extract `EMPTY_FORM`, `MODE_OPTIONS` thành constants.
- `closeModal()` helper tái sử dụng.

---

### 6. `frontend/src/features/owner/pages/OwnerLogsPage.jsx`
**Commit:** `fix(cleanup): dịch toàn bộ text tiếng Việt + chuẩn hoá UI...`

- Dịch toàn bộ text sang tiếng Việt.
- Thêm loading state.
- Hiển thị số bản ghi đang lọc.
- Dùng `toLocaleString("vi-VN")` cho thời gian.
- Tách `useMemo` cho sources / actors / filtered để tránh re-render.

---

### 7. `frontend/src/features/staff/pages/StaffCheckinPage.jsx`
**Commit:** `feat(staff): StaffCheckinPage – load booking detail trước check-in, hiển thị thông tin đầy đủ, confirm dialog`

- Load booking detail qua `dashboardService.getStaffBookingDetail(id)` trước khi cho phép check-in.
- Hiển thị đầy đủ: tên khách, số phòng, ngày nhận/trả, số người.
- Checkbox xác nhận bắt buộc trước khi bấm "Xác nhận Check-in".
- Xử lý lỗi fetch riêng biệt.

---

### 8. `frontend/src/features/staff/pages/StaffCheckoutPage.jsx`
**Commit:** `feat(staff): StaffCheckoutPage – load booking detail trước check-out, hiển thị tổng chi phí, confirm dialog`

- Load booking detail tương tự CheckinPage.
- Hiển thị **tổng chi phí lưu trú** (`totalPrice`) trước khi check-out.
- Checkbox xác nhận bắt buộc.
- Dùng `formatCurrencyVnd` cho số tiền.

---

### 9. `frontend/src/features/dashboard/dashboardService.js`
**Commit:** `fix(cleanup): ... thêm getStaffBookingDetail vào dashboardService`

- Thêm `getStaffBookingDetail: (id) => httpClient.get(\`/api/staff/bookings/${id}\`)`.
- Phục vụ StaffCheckinPage & StaffCheckoutPage.

---

### 10. `frontend/src/layouts/DashLayout.jsx`
**Commit:** `feat(layout): DashLayout – thêm Owner Bookings vào sidebar, chuẩn hoá tên nhãn tiếng Việt`

- Thêm menu item **"Toàn bộ booking"** (`OWNER_BOOKINGS`) vào sidebar Owner.
- Đổi "Logs" → "Nhật ký hệ thống" cho nhất quán.
- Cập nhật `pageTitle` mapping.

---

## Lệnh git để push lên remote repo

```bash
cd Advanced_Database_Systems-main

# Thêm remote (thay YOUR_REMOTE_URL bằng URL repo của bạn)
git remote add origin YOUR_REMOTE_URL

# Push toàn bộ commits
git push -u origin master

# Hoặc nếu branch chính là main:
git push -u origin master:main
```

## Danh sách file đã thay đổi (dành cho PR description)

| File | Loại thay đổi |
|------|---------------|
| `frontend/src/hooks/useCameraProfile.js` | 🆕 Mới |
| `frontend/src/features/users/pages/Settings.jsx` | ✏️ Sửa |
| `backend/src/main/resources/db/migration/V7__seed_data.sql` | ✏️ Sửa (bổ sung) |
| `backend/src/main/java/.../controllers/internal/SeedController.java` | 🆕 Mới |
| `frontend/src/features/manager/pages/ManagerServicesPage.jsx` | ✏️ Sửa |
| `frontend/src/features/owner/pages/OwnerLogsPage.jsx` | ✏️ Sửa |
| `frontend/src/features/staff/pages/StaffCheckinPage.jsx` | ✏️ Sửa |
| `frontend/src/features/staff/pages/StaffCheckoutPage.jsx` | ✏️ Sửa |
| `frontend/src/features/dashboard/dashboardService.js` | ✏️ Sửa |
| `frontend/src/layouts/DashLayout.jsx` | ✏️ Sửa |

> Tất cả file còn lại **không thay đổi** – giữ nguyên hoàn toàn.
