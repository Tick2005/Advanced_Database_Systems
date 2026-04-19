# 📋 FRONTEND SPEC — LuxStay Hotel Booking System
> Tài liệu đặc tả toàn bộ giao diện frontend. Đọc từ trên xuống, mỗi section là 1 trang/module hoàn chỉnh.

---

## 🎨 DESIGN SYSTEM

### Fonts
- **Display (tiêu đề lớn):** `Playfair Display` — sang trọng, serif
- **Body (nội dung):** `DM Sans` — sạch, dễ đọc
- **Mono (mã booking, giá):** `JetBrains Mono`

### Color Palette
```css
--color-primary:       #1a3c5e;   /* Navy xanh đậm — brand chính */
--color-primary-light: #e8f0f8;   /* Nền nhạt navy */
--color-gold:          #c9a84c;   /* Gold accent — luxury */
--color-gold-light:    #fdf6e3;   /* Nền nhạt gold */
--color-ink:           #0f172a;   /* Chữ chính */
--color-muted:         #64748b;   /* Chữ phụ */
--color-border:        #e2e8f0;   /* Đường viền */
--color-paper:         #f8fafc;   /* Nền trang */
--color-surface:       #ffffff;   /* Card, panel */
--color-success:       #16a34a;
--color-danger:        #dc2626;
--color-warning:       #d97706;
--radius-sm:   8px;
--radius-md:   14px;
--radius-lg:   22px;
--shadow-soft: 0 4px 24px rgba(26,60,94,0.08);
--shadow-md:   0 8px 40px rgba(26,60,94,0.14);
```

### Layout Constants
- Max content width: `1200px`
- Navbar height: `68px` (sticky)
- Sidebar width (admin roles): `248px`
- Gutter: `24px` (mobile `16px`)

---

## 🗺️ SITEMAP & ROUTING

```
/                          PUBLIC — Trang chủ (chưa đăng nhập)
/rooms                     PUBLIC — Danh sách phòng + filter
/rooms/:id                 PUBLIC — Chi tiết phòng (xem, không đặt)
/branches                  PUBLIC — Danh sách chi nhánh
/about                     PUBLIC — Giới thiệu
/contact                   PUBLIC — Liên hệ
/login                     AUTH — Đăng nhập
/register                  AUTH — Đăng ký
/forgot-password           AUTH — Quên mật khẩu
/reset-password            AUTH — Đặt lại mật khẩu

/customer/home             CUSTOMER — Trang chủ sau đăng nhập
/customer/rooms            CUSTOMER — Tìm phòng (giống public + nút đặt)
/customer/rooms/:id        CUSTOMER — Chi tiết phòng (có nút đặt)
/customer/booking/create   CUSTOMER — Tạo booking (chọn ngày, số người)
/customer/booking/review   CUSTOMER — Xem lại trước khi xác nhận
/customer/booking/payment  CUSTOMER — Thanh toán VNPay
/customer/booking/result   CUSTOMER — Kết quả thanh toán (success/fail)
/customer/bookings         CUSTOMER — Lịch sử đặt phòng
/customer/bookings/:id     CUSTOMER — Chi tiết booking
/customer/feedbacks        CUSTOMER — Đánh giá của tôi
/customer/feedbacks/create CUSTOMER — Gửi đánh giá
/customer/profile          CUSTOMER — Hồ sơ cá nhân
/customer/profile/edit     CUSTOMER — Chỉnh sửa hồ sơ
/customer/settings         CUSTOMER — Cài đặt (đổi mật khẩu)

/staff                     STAFF — Dashboard
/staff/bookings/today      STAFF — Booking hôm nay
/staff/checkin/:id         STAFF — Check-in booking
/staff/checkout/:id        STAFF — Check-out booking
/staff/rooms/status        STAFF — Trạng thái phòng
/staff/service-usage       STAFF — Thêm dịch vụ vào booking

/manager                   MANAGER — Dashboard
/manager/rooms             MANAGER — Quản lý phòng
/manager/rooms/create      MANAGER — Tạo phòng
/manager/rooms/:id/edit    MANAGER — Sửa phòng
/manager/bookings          MANAGER — Tất cả booking chi nhánh
/manager/bookings/:id      MANAGER — Chi tiết booking
/manager/feedbacks         MANAGER — Feedback khách
/manager/services          MANAGER — Dịch vụ
/manager/pricing-requests  MANAGER — Yêu cầu điều chỉnh giá
/manager/reports/revenue   MANAGER — Báo cáo doanh thu
/manager/reports/booking   MANAGER — Báo cáo đặt phòng

/owner                     OWNER — Dashboard tổng
/owner/branches            OWNER — Quản lý chi nhánh
/owner/pricing             OWNER — Quản lý giá
/owner/pricing-requests    OWNER — Duyệt yêu cầu giá
/owner/users               OWNER — Quản lý người dùng
/owner/reports/revenue     OWNER — Doanh thu toàn hệ thống
/owner/reports/branches    OWNER — So sánh chi nhánh
/owner/logs                OWNER — System logs
```

---

## 📐 LAYOUTS

### 1. PublicLayout
Dùng cho tất cả trang public + customer home.

```
┌──────────────────────────────────────────────────────┐
│ NAVBAR (sticky, glass effect)                        │
│ [🏨 LuxStay]  [Phòng] [Chi nhánh] [Giới thiệu]      │
│                            [Đăng nhập] [Đăng ký▸]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│                  <PAGE CONTENT>                      │
│                                                      │
├──────────────────────────────────────────────────────┤
│ FOOTER                                               │
│ [Logo + slogan] [Links] [Liên hệ] [Mạng xã hội]     │
└──────────────────────────────────────────────────────┘
```

**Navbar — chưa đăng nhập:**
- Logo bên trái (🏨 LuxStay — font Playfair Display, navy)
- Nav links giữa: Phòng, Chi nhánh, Giới thiệu, Liên hệ
- Bên phải: nút `Đăng nhập` (outline) + `Đăng ký` (solid gold)
- Sticky, khi scroll xuống: background trắng + shadow xuất hiện (dùng `scrollY > 10`)
- Mobile: hamburger → drawer từ phải

**Navbar — đã đăng nhập (customer):**
- Giữ nguyên nav links
- Bên phải: `[+ Đặt phòng]` (gold) + avatar dropdown
- Dropdown: Hồ sơ, Lịch sử đặt phòng, Đánh giá, Cài đặt, --- Đăng xuất

**Footer:**
- Background navy đậm (`#0f2338`)
- Cột 1: Logo + tagline "Trải nghiệm lưu trú đẳng cấp"
- Cột 2: Khám phá (Phòng, Chi nhánh, Giới thiệu)
- Cột 3: Hỗ trợ (Liên hệ, Chính sách, FAQ)
- Cột 4: Liên hệ (địa chỉ, phone, email, social icons)
- Bottom bar: "© 2025 LuxStay. All rights reserved."

---

### 2. DashboardLayout
Dùng cho Staff, Manager, Owner.

```
┌──────────┬───────────────────────────────────────────┐
│ SIDEBAR  │  TOPBAR (sticky)                          │
│ (fixed)  │  [☰] [Tên trang]         [🔔] [👤 Name▼] │
│          ├───────────────────────────────────────────┤
│ Logo     │                                           │
│ ──────── │           <PAGE CONTENT>                  │
│ Nav items│                                           │
│          │                                           │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

**Sidebar:**
- Fixed, width 248px
- Logo top: "🏨 LuxStay" + role badge ("STAFF", "MANAGER", "OWNER")
- Nav items: icon + label, active state (gold left border + light background)
- Collapse button ở bottom → thu thành icon-only (width 64px)
- Mobile: overlay drawer

---

## 🏠 PUBLIC PAGES

---

### PAGE 1: Trang chủ — `/`

**Mục tiêu:** Gây ấn tượng, giới thiệu khách sạn, dẫn dắt đặt phòng.

#### Section 1 — HERO
```
┌──────────────────────────────────────────────────────┐
│  [ảnh hero full-width, overlay tối nhẹ]              │
│                                                      │
│  Trải nghiệm lưu trú                                 │  ← Playfair Display 56px
│  đẳng cấp 5 sao                                      │
│                                                      │
│  Hàng trăm phòng premium tại các vị trí đắc địa     │  ← DM Sans 18px, opacity 0.85
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ 🔍  Tìm phòng...    [Chi nhánh ▼]  [Ngày ▼]   │  │  ← Search bar nổi
│  │                                    [Tìm kiếm] │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [500+ Phòng]  [50+ Chi nhánh]  [10k+ Khách hàng]   │  ← Stats bar
└──────────────────────────────────────────────────────┘
```

- Ảnh hero: full viewport height (100vh), object-fit cover
- Search bar nổi trên ảnh, background trắng, border-radius 16px, shadow lớn
- Stats bar: 3 con số lớn + label nhỏ, separated by divider lines
- Animation: tiêu đề fade-in từ dưới, search bar slide-up (animation-delay)

#### Section 2 — GIỚI THIỆU KHÁCH SẠN
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [ảnh 55%]    Về chúng tôi                           │
│               ────────────────                       │
│               LuxStay là chuỗi khách sạn hàng đầu   │
│               Việt Nam với hơn 10 năm kinh nghiệm.  │
│               Chúng tôi mang đến không gian lưu trú │
│               sang trọng, dịch vụ tận tâm...        │
│                                                      │
│               ✓ Phòng được thiết kế bởi chuyên gia  │
│               ✓ Dịch vụ 24/7                         │
│               ✓ Vị trí trung tâm, tiện di chuyển    │
│               ✓ Miễn phí bãi đỗ xe                  │
│                                                      │
│               [Tìm hiểu thêm →]                     │
└──────────────────────────────────────────────────────┘
```

- Layout 2 cột: ảnh bên trái (có viền gold), text bên phải
- Ảnh có một ảnh nhỏ overlap góc dưới-phải (decorative)
- Check list dùng icon ✓ màu gold
- Animate on scroll: ảnh slide-in từ trái, text từ phải

#### Section 3 — ƯU ĐIỂM (FEATURES)
```
┌──────────────────────────────────────────────────────┐
│              Tại sao chọn LuxStay?                   │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │   🛁    │  │   🍽️   │  │   🚗    │  │   📶    │ │
│  │ Phòng   │  │ Nhà hàng│  │ Đưa đón │  │ WiFi    │ │
│  │ cao cấp │  │ 5 sao   │  │ sân bay  │  │ miễn phí│ │
│  │         │  │         │  │          │  │         │ │
│  │ Nội thất│  │ Buffet  │  │ Xe sang  │  │ 1Gbps   │ │
│  │ Châu Âu │  │ sáng    │  │ đưa đón  │  │ toàn khu│ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │
└──────────────────────────────────────────────────────┘
```

- 4 cards (hoặc 6), icon lớn trên cùng, tiêu đề đậm, mô tả nhỏ
- Hover: card lift + gold border-top xuất hiện
- Background section: `--color-paper` (xám rất nhạt)

#### Section 4 — TOP PHÒNG SINH LỢI / NỔI BẬT
```
┌──────────────────────────────────────────────────────┐
│              Phòng nổi bật                           │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│  │ [ảnh]      │  │ [ảnh]      │  │ [ảnh]      │      │
│  │ ⭐ 4.9     │  │ ⭐ 4.8     │  │ 🔥 HOT     │      │
│  │            │  │            │  │            │      │
│  │ Penthouse  │  │ Deluxe     │  │ Suite      │      │
│  │ Suite      │  │ Ocean View │  │ Garden     │      │
│  │            │  │            │  │            │      │
│  │ Tầng 20    │  │ Tầng 15    │  │ Tầng 5     │      │
│  │ 2 người    │  │ 2 người    │  │ 4 người    │      │
│  │            │  │            │  │            │      │
│  │ 2.500.000₫ │  │ 1.800.000₫ │  │ 3.200.000₫ │      │
│  │ /đêm       │  │ /đêm       │  │ /đêm       │      │
│  │            │  │            │  │            │      │
│  │ [Xem chi   │  │ [Xem chi   │  │ [Xem chi   │      │
│  │  tiết]     │  │  tiết]     │  │  tiết]     │      │
│  └────────────┘  └────────────┘  └────────────┘      │
│                                                      │
│                 [Xem tất cả phòng →]                 │
└──────────────────────────────────────────────────────┘
```

- Grid 3 cột (desktop), 1 cột (mobile)
- Mỗi card: ảnh 200px + badge (⭐ rating hoặc 🔥 HOT), info, giá, nút
- Hover card: ảnh zoom nhẹ, shadow tăng
- Lấy data: `GET /api/rooms/top-profit` hoặc sort theo profit/booking count
- Nút "Xem chi tiết" → `/rooms/:id` (public, không đặt được)
- "Xem tất cả phòng" → `/rooms`

#### Section 5 — CHI NHÁNH NỔI BẬT
```
┌──────────────────────────────────────────────────────┐
│              Hệ thống chi nhánh                      │
│                                                      │
│  ┌──────────────────────────┐  ┌────────────────────┐│
│  │ [Ảnh chi nhánh lớn]      │  │ Chi nhánh Quận 1   ││
│  │                          │  │ 📍 123 Lê Lợi, Q1  ││
│  │ Chi nhánh Quận 1         │  │ ☎️ 028 1234 5678   ││
│  │ Flagship                 │  │ 🕐 24/7             ││
│  │                          │  │                    ││
│  └──────────────────────────┘  │ Chi nhánh Quận 7   ││
│                                │ 📍 456 Nguyễn Văn  ││
│  [← prev]           [next →]  │ ☎️ 028 8765 4321   ││
│                                └────────────────────┘│
└──────────────────────────────────────────────────────┘
```

- Hoặc dạng grid 3 cột với card nhỏ cho mỗi chi nhánh
- Mỗi card: ảnh, tên, địa chỉ, số phòng, nút "Xem chi nhánh"

#### Section 6 — ĐÁNH GIÁ KHÁCH HÀNG (TESTIMONIALS)
```
┌──────────────────────────────────────────────────────┐
│           Khách hàng nói gì về chúng tôi?            │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │  ⭐⭐⭐⭐⭐                                         ││
│  │  "Phòng rất sạch, nhân viên thân thiện, view     ││
│  │   biển tuyệt đẹp. Tôi sẽ quay lại lần sau!"     ││
│  │                                                  ││
│  │  [Avatar] Nguyễn Văn A — TP.HCM                  ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ○ ● ○ ○ ○  (dots pagination)                       │
└──────────────────────────────────────────────────────┘
```

- Carousel/slider tự động, 3 giây/slide
- Background: gold nhạt (`--color-gold-light`)
- Avatar tròn, tên + thành phố

#### Section 7 — THÔNG TIN LIÊN HỆ (CTA CUỐI)
```
┌──────────────────────────────────────────────────────┐
│  Background: navy gradient                           │
│                                                      │
│  Sẵn sàng trải nghiệm?                               │
│  Đặt phòng ngay hôm nay và nhận ưu đãi đặc biệt     │
│                                                      │
│  📍 123 Lê Lợi, Quận 1, TP.HCM                      │
│  ☎️  028 1234 5678                                   │
│  📧  hello@luxstay.vn                                │
│                                                      │
│  [Đặt phòng ngay]  [Liên hệ với chúng tôi]          │
└──────────────────────────────────────────────────────┘
```

---

### PAGE 2: Danh sách phòng — `/rooms`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  NAVBAR                                              │
├──────────────────────────────────────────────────────┤
│  Page header: "Tất cả phòng" + tổng số phòng        │
├──────────────┬───────────────────────────────────────┤
│              │                                       │
│   FILTER     │   ROOM GRID / LIST                    │
│   PANEL      │                                       │
│   (280px)    │   [Sort ▼]  [Grid/List toggle]  12/45│
│              │                                       │
│   [Tìm kiếm] │   ┌────────┐ ┌────────┐ ┌────────┐  │
│              │   │ Card   │ │ Card   │ │ Card   │  │
│   Khoảng giá │   └────────┘ └────────┘ └────────┘  │
│   [──●──]    │   ┌────────┐ ┌────────┐ ┌────────┐  │
│   [──●──]    │   │ Card   │ │ Card   │ │ Card   │  │
│              │   └────────┘ └────────┘ └────────┘  │
│   Loại phòng │                                       │
│   □ Standard │   [Trang trước]  1 2 3  [Trang sau]  │
│   □ Deluxe   │                                       │
│   □ Suite    │                                       │
│   □ Penthouse│                                       │
│              │                                       │
│   Chi nhánh  │                                       │
│   □ Quận 1   │                                       │
│   □ Quận 7   │                                       │
│   □ Thủ Đức  │                                       │
│              │                                       │
│   Số người   │                                       │
│   [1] [2] [4]│                                       │
│              │                                       │
│   Tầng       │                                       │
│   [min] [max]│                                       │
│              │                                       │
│   Trạng thái │                                       │
│   ● Còn trống│                                       │
│   ○ Tất cả   │                                       │
│              │                                       │
│   Tiện nghi  │                                       │
│   □ Bể bơi   │                                       │
│   □ Gym      │                                       │
│   □ Spa      │                                       │
│   □ Bữa sáng │                                       │
│              │                                       │
│   [Áp dụng]  │                                       │
│   [Xóa lọc]  │                                       │
└──────────────┴───────────────────────────────────────┘
```

**Filter Panel chi tiết:**
- Keyword search: input tìm theo tên phòng, loại phòng
- Price range: dual range slider (min/max), hiển thị giá realtime
- Loại phòng: checkbox list (Standard, Deluxe, Suite, Penthouse, Executive)
- Chi nhánh: checkbox list (lấy từ API)
- Số người: button group [1] [2] [3] [4+]
- Tầng: 2 input số (min tầng – max tầng)
- Trạng thái: radio (Còn trống / Tất cả)
- Tiện nghi: checkbox (Bể bơi, Gym, Spa, Bữa sáng, Minibar, Bancony)
- Nút `[Áp dụng]` (navy) + `[Xóa bộ lọc]` (text link)
- Mobile: filter ẩn, nút `[Bộ lọc ▼]` mở modal/drawer

**Sort options:**
- Giá tăng dần / Giá giảm dần
- Đánh giá cao nhất
- Mới nhất
- Phổ biến nhất (số lượt đặt)

**Room Card (Grid view):**
```
┌─────────────────────────┐
│  [Ảnh 220px]            │
│  [Badge: AVAILABLE]     │
├─────────────────────────┤
│  Penthouse Suite        │  ← font-weight 700
│  ⭐ 4.9  (128 đánh giá) │
│  Quận 1 · Tầng 20       │
│  👥 1–4 người           │
│                         │
│  Tiện nghi: 🏊 🏋️ 🛁   │
│                         │
│  2.500.000₫ /đêm        │  ← gold color, mono font
│                         │
│  [Xem chi tiết]         │
└─────────────────────────┘
```

**Room Card (List view):**
```
┌─────────────────────────────────────────────────────┐
│ [Ảnh 180x120] │ Penthouse Suite         2.500.000₫  │
│               │ ⭐ 4.9 · Quận 1 · T20  /đêm         │
│               │ 👥 1–4 người · 🏊 🏋️ 🛁            │
│               │ Không gian sang trọng...  [Xem →]   │
└─────────────────────────────────────────────────────┘
```

**Pagination:** Previous / 1 2 3 ... 10 / Next — hiển thị "Showing 1-12 of 45 phòng"

---

### PAGE 3: Chi tiết phòng — `/rooms/:id`

```
┌──────────────────────────────────────────────────────┐
│  NAVBAR                                              │
├──────────────────────────────────────────────────────┤
│  ← Quay lại danh sách phòng                          │
│                                                      │
│  [Ảnh lớn chính]                                     │
│  [Thumb 1] [Thumb 2] [Thumb 3] [Thumb 4] [+3 ảnh]   │
│  (click → lightbox gallery)                          │
│                                                      │
│  ┌──────────────────────────┬───────────────────────┐│
│  │  LEFT COLUMN (60%)       │  RIGHT COLUMN (40%)   ││
│  │                          │  (sticky)             ││
│  │  Penthouse Suite         │  ┌───────────────────┐││
│  │  ⭐ 4.9 (128 đánh giá)   │  │ 2.500.000₫ /đêm   │││
│  │  📍 Chi nhánh Quận 1     │  │                   │││
│  │  Tầng 20 · 2–4 người    │  │ [Đăng nhập để đặt]│││
│  │                          │  │ (nếu chưa login)  │││
│  │  ─── Mô tả ───           │  │                   │││
│  │  Phòng penthouse sang    │  │ Hoặc:             │││
│  │  trọng với view toàn     │  │                   │││
│  │  thành phố...            │  │ [Check-in date]   │││
│  │                          │  │ [Check-out date]  │││
│  │  ─── Tiện nghi ───       │  │ [Số người    ]    │││
│  │  🏊 Bể bơi               │  │                   │││
│  │  🏋️ Phòng gym            │  │ Tổng: 7.500.000₫  │││
│  │  🛁 Bồn tắm              │  │ (3 đêm)           │││
│  │  📶 WiFi miễn phí        │  │                   │││
│  │  🅿️ Bãi đỗ xe            │  │ [Đặt phòng ngay]  │││
│  │  🍳 Bữa sáng             │  │ (chỉ khi login)   │││
│  │                          │  │                   │││
│  │  ─── Thông tin phòng ─── │  │ Chính sách hủy:   │││
│  │  Diện tích: 85m²         │  │ Hủy miễn phí      │││
│  │  Loại giường: King size  │  │ trước 24h         │││
│  │  Tầng: 20                │  └───────────────────┘││
│  │  Hướng: Hướng biển       │                       ││
│  │                          │                       ││
│  │  ─── Đánh giá ───        │                       ││
│  │  ⭐ 4.9 / 5.0            │                       ││
│  │  Tổng 128 đánh giá       │                       ││
│  │                          │                       ││
│  │  [Avatar] Nguyễn Văn A   │                       ││
│  │  ⭐⭐⭐⭐⭐                 │                       ││
│  │  "Phòng rất đẹp..."      │                       ││
│  │  21/03/2025              │                       ││
│  │                          │                       ││
│  │  [Avatar] Trần Thị B     │                       ││
│  │  ⭐⭐⭐⭐                  │                       ││
│  │  "Dịch vụ tốt..."        │                       ││
│  │                          │                       ││
│  │  [Xem thêm đánh giá]     │                       ││
│  └──────────────────────────┴───────────────────────┘│
└──────────────────────────────────────────────────────┘
```

**Chi tiết:**
- Gallery: ảnh lớn 1 cái + thumbnails dưới, click mở lightbox (có prev/next)
- Booking widget bên phải: sticky khi scroll, form chọn ngày + số người
- Nếu chưa đăng nhập: widget hiển thị giá + nút "Đăng nhập để đặt phòng" → redirect `/login?redirect=/customer/rooms/:id`
- Nếu đã đăng nhập (customer): widget có form đầy đủ + nút "Đặt phòng ngay" → `/customer/booking/create?roomId=:id`
- Rating breakdown: bar chart nhỏ cho từng sao (5⭐ 80%, 4⭐ 15%, ...)
- Đánh giá: paginate (5 cái / trang), không cần load all

---

### PAGE 4: Đăng nhập — `/login`

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [Ảnh background: khách sạn sang trọng, overlay]    │
│                                                      │
│  ┌────────────────────────────────────┐              │
│  │  🏨 LuxStay                        │              │
│  │  Đăng nhập vào tài khoản           │              │
│  │                                    │              │
│  │  Email                             │              │
│  │  [___________________________]     │              │
│  │                                    │              │
│  │  Mật khẩu                          │              │
│  │  [___________________________] 👁️  │              │
│  │                                    │              │
│  │  [Quên mật khẩu?]                  │              │
│  │                                    │              │
│  │  [     Đăng nhập      ]            │              │
│  │                                    │              │
│  │  ─────────── hoặc ──────────       │              │
│  │                                    │              │
│  │  Chưa có tài khoản?                │              │
│  │  [Đăng ký ngay →]                  │              │
│  └────────────────────────────────────┘              │
└──────────────────────────────────────────────────────┘
```

- Card trắng giữa màn hình, background ảnh mờ
- Validation inline: email format, required
- Show/hide password (icon 👁️)
- Loading state: nút spinner khi đang submit
- Error: banner đỏ "Email hoặc mật khẩu không đúng"
- Sau đăng nhập → redirect theo role:
  - CUSTOMER → `/customer/home`
  - STAFF → `/staff`
  - MANAGER → `/manager`
  - OWNER → `/owner`
- Nếu có `?redirect=` → redirect đến đó thay vì default

---

### PAGE 5: Đăng ký — `/register`

Tương tự Login layout nhưng form dài hơn:
- Họ và tên *
- Email *
- Mật khẩu * (có strength indicator)
- Xác nhận mật khẩu *
- Số điện thoại
- Checkbox "Tôi đồng ý với điều khoản sử dụng"
- Nút "Đăng ký"
- Sau đăng ký: hiển thị thông báo "Vui lòng kiểm tra email để xác minh tài khoản"

---

### PAGE 6: Quên mật khẩu — `/forgot-password`

Step 1 — Nhập email:
- Input email
- Nút "Gửi email đặt lại"
- Sau submit: "Đã gửi email, kiểm tra hộp thư"

Step 2 — Hiển thị sau khi submit (hoặc route `/reset-password?token=xxx`):
- Input "Mã xác nhận"
- Input "Mật khẩu mới"
- Input "Xác nhận mật khẩu mới"
- Nút "Đặt lại mật khẩu"
- Success → redirect `/login`

---

## 👤 CUSTOMER PAGES

---

### PAGE 7: Home Customer — `/customer/home`

**Giống public Home NHƯNG:**
- Navbar thêm: user dropdown + nút "Đặt phòng"
- Search bar trên hero → khi click "Tìm kiếm" → `/customer/rooms` (không phải `/rooms`)
- Nút "Xem chi tiết" trên room cards → `/customer/rooms/:id` (có nút đặt)
- Thêm section "Welcome back" phía trên hero (nhỏ, không nổi bật):
  ```
  Xin chào, Nguyễn Văn A! 👋
  Bạn có 2 đặt phòng sắp tới.  [Xem lịch sử]
  ```
- Section đặt phòng gần đây (3 items cuối) ở cuối trang (trước footer)

**Nội dung sections giữ nguyên như public:** Hero, Giới thiệu, Features, Top phòng, Chi nhánh, Testimonials, CTA.

---

### PAGE 8: Danh sách phòng Customer — `/customer/rooms`

Giống `/rooms` (public) NHƯNG:
- Room card có nút **"Đặt phòng"** (gold, solid) thay vì chỉ "Xem chi tiết"
- "Xem chi tiết" vẫn còn (secondary button)
- Hoặc: "Đặt phòng" là CTA chính, "Xem chi tiết" là link nhỏ phía dưới

---

### PAGE 9: Chi tiết phòng Customer — `/customer/rooms/:id`

Giống `/rooms/:id` (public) NHƯNG booking widget bên phải:
- Hiển thị form đặt phòng đầy đủ (không bị lock)
- Nút "Đặt phòng ngay" active → navigate tới `/customer/booking/create` với state `{ roomId, checkInDate, checkOutDate, adults, children }`
- Form submit ngay từ trang này để pre-fill trang create

---

### PAGE 10: Tạo Booking — `/customer/booking/create`

```
┌──────────────────────────────────────────────────────┐
│  ← Quay lại                                          │
│                                                      │
│  Đặt phòng                                           │
│  Bước 1 / 3: Thông tin đặt phòng                     │
│  ●────○────○                                         │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │  Thông tin phòng (nếu chưa chọn)                 ││
│  │  Chọn phòng: [Dropdown / Search phòng]           ││
│  │                                                  ││
│  │  Hoặc — nếu đến từ room detail, hiển thị:        ││
│  │  ┌────────────────────────────────────────────┐  ││
│  │  │ [Ảnh nhỏ]  Penthouse Suite                 │  ││
│  │  │            ⭐ 4.9 · Quận 1 · Tầng 20       │  ││
│  │  │            2.500.000₫/đêm    [Thay đổi]    │  ││
│  │  └────────────────────────────────────────────┘  ││
│  │                                                  ││
│  │  Ngày check-in *      Ngày check-out *           ││
│  │  [📅 DD/MM/YYYY ]     [📅 DD/MM/YYYY ]           ││
│  │                                                  ││
│  │  Số người lớn *       Số trẻ em                  ││
│  │  [─ 2 +]              [─ 0 +]                    ││
│  │                                                  ││
│  │  Ghi chú đặc biệt (tuỳ chọn)                    ││
│  │  [Ví dụ: dị ứng thực phẩm, yêu cầu tầng cao...] ││
│  │                                                  ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │  Chi nhánh *                                     ││
│  │  [Dropdown chọn chi nhánh]                       ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Preview tổng:                                       │
│  3 đêm × 2.500.000₫ = 7.500.000₫                    │
│                                                      │
│                           [Tiếp theo →]              │
└──────────────────────────────────────────────────────┘
```

**Stepper header:** Bước 1 (active) → Bước 2 → Bước 3
- Bước 1: Thông tin
- Bước 2: Xem lại
- Bước 3: Thanh toán

**Date picker:** inline hoặc popup, disable ngày quá khứ, disable ngày đã fully booked

**Số người:** stepper (– / số / +), không nhập tay

**Tổng tiền preview:** tự động tính khi chọn đủ ngày + phòng

---

### PAGE 11: Xem lại Booking — `/customer/booking/review`

```
┌──────────────────────────────────────────────────────┐
│  Đặt phòng — Bước 2 / 3: Xác nhận thông tin         │
│  ○────●────○                                         │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │  🏠 Thông tin phòng                              ││
│  │  ─────────────────────────────────────────────   ││
│  │  Phòng:          Penthouse Suite                 ││
│  │  Chi nhánh:      LuxStay Quận 1                  ││
│  │  Tầng:           20                              ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │  📅 Thời gian lưu trú                            ││
│  │  ─────────────────────────────────────────────   ││
│  │  Check-in:       Thứ Hai, 01/04/2025             ││
│  │  Check-out:      Thứ Tư, 03/04/2025              ││
│  │  Số đêm:         2 đêm                           ││
│  │  Số khách:       2 người lớn, 0 trẻ em           ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │  💰 Chi tiết giá                                 ││
│  │  ─────────────────────────────────────────────   ││
│  │  2.500.000₫ × 2 đêm:            5.000.000₫       ││
│  │  Phí dịch vụ (10%):               500.000₫       ││
│  │  Giảm giá:                              0₫       ││
│  │  ─────────────────────────────────────────────   ││
│  │  Tổng cộng:                     5.500.000₫       ││  ← bold, gold
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Chính sách hủy:                                     │
│  ⚠️ Hủy miễn phí trước 24h check-in.                │
│  Sau thời gian này, phí hủy là 50% tổng tiền.       │
│                                                      │
│  ☑️ Tôi đồng ý với điều khoản và chính sách hủy phòng│
│                                                      │
│  [← Quay lại]               [Tiến hành thanh toán →]│
└──────────────────────────────────────────────────────┘
```

---

### PAGE 12: Thanh toán — `/customer/booking/payment`

```
┌──────────────────────────────────────────────────────┐
│  Đặt phòng — Bước 3 / 3: Thanh toán                 │
│  ○────○────●                                         │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │  Tóm tắt đặt phòng                              ││
│  │  Penthouse Suite · 2 đêm · Quận 1               ││
│  │  01/04 – 03/04/2025                              ││
│  │  Tổng: 5.500.000₫                               ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Chọn phương thức thanh toán:                        │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ ● [Logo VNPay]  Thanh toán qua VNPay             ││
│  │   ATM, Internet Banking, QR Code, Visa/Master    ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ ○ 💵 Thanh toán tại quầy                         ││
│  │   Thanh toán khi đến nhận phòng                  ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  🔒 Thanh toán được bảo mật bởi VNPay               │
│     Thông tin thẻ không được lưu trữ                │
│                                                      │
│  [← Quay lại]          [Xác nhận & Thanh toán →]    │
└──────────────────────────────────────────────────────┘
```

- Radio selection: VNPay (default) / Thanh toán tại quầy
- VNPay → gọi API → nhận `paymentUrl` → `window.location.href = paymentUrl`
- Thanh toán tại quầy → tạo booking với status PENDING, redirect success

---

### PAGE 13: Kết quả thanh toán — `/customer/booking/result`

#### Case A — Thành công
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              ✅  (icon vòng tròn xanh lá)            │
│                                                      │
│         Đặt phòng thành công!                        │
│                                                      │
│  Mã đặt phòng: #LUX-2025-00128                       │
│  Penthouse Suite · 01/04 – 03/04/2025                │
│  Tổng đã thanh toán: 5.500.000₫                      │
│                                                      │
│  📧 Thông tin đặt phòng đã được gửi đến              │
│     nguyenvanat@gmail.com                            │
│                                                      │
│  [Xem chi tiết đặt phòng]  [Về trang chủ]           │
└──────────────────────────────────────────────────────┘
```

#### Case B — Thất bại
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              ❌  (icon vòng tròn đỏ)                 │
│                                                      │
│         Thanh toán không thành công                  │
│                                                      │
│  Giao dịch bị hủy hoặc xảy ra lỗi.                  │
│  Đặt phòng của bạn chưa được xác nhận.              │
│                                                      │
│  Mã lỗi: VNP_07 — Giao dịch bị từ chối             │
│                                                      │
│  [Thử lại]  [Chọn phương thức khác]  [Liên hệ HT]   │
└──────────────────────────────────────────────────────┘
```

- VNPay redirect về với query params: `?vnp_ResponseCode=00` (success) hoặc khác (fail)
- Parse query params để xác định success/fail
- Gọi API verify payment sau khi VNPay redirect về

---

### PAGE 14: Lịch sử đặt phòng — `/customer/bookings`

```
┌──────────────────────────────────────────────────────┐
│  Lịch sử đặt phòng                                   │
│                                                      │
│  [Tất cả] [Sắp tới] [Đang ở] [Đã hoàn thành] [Đã hủy]│  ← Tab filter
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ [Ảnh]  Penthouse Suite              #LUX-00128   ││
│  │        LuxStay Quận 1                            ││
│  │        📅 01/04 – 03/04/2025 (2 đêm)            ││
│  │        👥 2 người lớn                            ││
│  │        5.500.000₫                  [CONFIRMED ●] ││
│  │                                    [Xem chi tiết]││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ [Ảnh]  Deluxe Ocean View            #LUX-00115   ││
│  │        LuxStay Quận 7                            ││
│  │        📅 15/03 – 17/03/2025 (2 đêm)            ││
│  │        👥 2 người lớn, 1 trẻ em                  ││
│  │        3.200.000₫                 [COMPLETED ●]  ││
│  │                                    [Xem chi tiết]││
│  │                                    [Đánh giá]    ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

- Status badge màu:
  - PENDING: vàng
  - CONFIRMED: xanh navy
  - CHECKED_IN: xanh lá
  - COMPLETED: xám
  - CANCELLED: đỏ
- Booking đã COMPLETED + chưa đánh giá → hiện nút "Đánh giá phòng" (gold)
- Booking PENDING/CONFIRMED → nút "Hủy đặt phòng"

---

### PAGE 15: Chi tiết Booking — `/customer/bookings/:id`

```
┌──────────────────────────────────────────────────────┐
│  ← Quay lại lịch sử                                  │
│                                                      │
│  Chi tiết đặt phòng #LUX-2025-00128      [CONFIRMED] │
│                                                      │
│  ┌────────────────────────┬─────────────────────────┐│
│  │ 🏠 Thông tin phòng     │ 📅 Thời gian            ││
│  │ Penthouse Suite        │ Check-in: 01/04/2025    ││
│  │ LuxStay Quận 1         │ Check-out: 03/04/2025   ││
│  │ Tầng 20                │ Số đêm: 2               ││
│  │ Sức chứa: 4 người      │ Check-in: 14:00         ││
│  └────────────────────────┴─────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 💰 Chi tiết thanh toán                           ││
│  │ Tiền phòng:         5.000.000₫                   ││
│  │ Phí dịch vụ:          500.000₫                   ││
│  │ Giảm giá:                   0₫                   ││
│  │ ─────────────────────────────                    ││
│  │ Tổng cộng:          5.500.000₫                   ││
│  │ Trạng thái TT:      Đã thanh toán ✅              ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 🍽️ Dịch vụ đã sử dụng                           ││
│  │ Spa (2 lần) ............... 1.200.000₫           ││
│  │ Minibar .................... 350.000₫            ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  [Hủy đặt phòng]  (nếu PENDING/CONFIRMED)            │
│  [Đánh giá phòng]  (nếu COMPLETED, chưa review)      │
│  [Thanh toán ngay]  (nếu PENDING + chưa thanh toán)  │
└──────────────────────────────────────────────────────┘
```

---

### PAGE 16: Đánh giá phòng — `/customer/feedbacks/create`

Chỉ vào được sau khi booking đã COMPLETED.

```
┌──────────────────────────────────────────────────────┐
│  Đánh giá phòng                                      │
│                                                      │
│  [Ảnh phòng nhỏ] Penthouse Suite                     │
│  Bạn đã lưu trú: 01/04 – 03/04/2025                  │
│                                                      │
│  Đánh giá tổng thể                                   │
│  ★ ★ ★ ★ ★  (click để chọn, hover highlight)        │
│  "Xuất sắc"  (label theo sao: Tệ / Tạm / Tốt / Rất tốt / Xuất sắc)│
│                                                      │
│  Đánh giá theo tiêu chí (optional)                  │
│  🧹 Vệ sinh:    ★ ★ ★ ★ ★                           │
│  🛎️ Dịch vụ:   ★ ★ ★ ★ ☆                           │
│  📍 Vị trí:    ★ ★ ★ ★ ★                            │
│  💰 Giá cả:    ★ ★ ★ ★ ☆                            │
│                                                      │
│  Nội dung đánh giá *                                 │
│  [Chia sẻ trải nghiệm của bạn về phòng, dịch vụ...] │
│  (min 20 ký tự)                                      │
│                                                      │
│  Thêm ảnh (tuỳ chọn, tối đa 5 ảnh)                  │
│  [📷 Chọn ảnh] [📷] [📷]                             │
│                                                      │
│  [Hủy]                    [Gửi đánh giá]             │
└──────────────────────────────────────────────────────┘
```

---

### PAGE 17: Đánh giá của tôi — `/customer/feedbacks`

```
┌──────────────────────────────────────────────────────┐
│  Đánh giá của tôi                        3 đánh giá  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ [Ảnh] Penthouse Suite                            ││
│  │       01/04 – 03/04/2025                         ││
│  │       ⭐⭐⭐⭐⭐  Xuất sắc                         ││
│  │       "Phòng rất đẹp, view tuyệt vời..."         ││
│  │       Đăng ngày: 05/04/2025                      ││
│  │                                                  ││
│  │  [Phản hồi từ khách sạn:]                        ││
│  │  "Cảm ơn bạn đã tin tưởng LuxStay..."           ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

---

### PAGE 18: Hồ sơ — `/customer/profile`

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │  [Avatar 80px]  Nguyễn Văn A                     ││
│  │                 nguyenvana@gmail.com              ││
│  │                 Thành viên từ: 01/2024            ││
│  │                 [Thay đổi ảnh đại diện]          ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Thông tin cá nhân            [✏️ Chỉnh sửa]         │
│  ─────────────────────────────────────────────       │
│  Họ tên:       Nguyễn Văn A                          │
│  Email:        nguyenvana@gmail.com (đã xác minh ✅) │
│  Điện thoại:   0901 234 567                          │
│  Ngày sinh:    01/01/1990                            │
│  Địa chỉ:      123 Lê Lợi, Quận 1, TP.HCM          │
│                                                      │
│  Thống kê                                            │
│  ─────────────────────────────────────────────       │
│  Tổng đặt phòng:    12 lần                          │
│  Tổng chi tiêu:     45.000.000₫                     │
│  Đánh giá đã gửi:   8                               │
│                                                      │
│  [Đổi mật khẩu]    [Xóa tài khoản]                  │
└──────────────────────────────────────────────────────┘
```

---

### PAGE 19: Chỉnh sửa hồ sơ — `/customer/profile/edit`

Form 2 cột:
- Họ tên *
- Email * (disabled nếu không cho đổi)
- Điện thoại
- Ngày sinh (date picker)
- Địa chỉ
- Upload ảnh đại diện (preview ngay)
- [Lưu thay đổi] [Hủy]

---

### PAGE 20: Cài đặt / Đổi mật khẩu — `/customer/settings`

Tab sidebar nhỏ: Bảo mật / Thông báo / ...

**Tab Bảo mật:**
- Mật khẩu hiện tại
- Mật khẩu mới (strength meter)
- Xác nhận mật khẩu mới
- [Đổi mật khẩu]

---

## 👷 STAFF PAGES

Layout: DashboardLayout với sidebar.

**Sidebar items:**
- 📊 Dashboard
- 📅 Booking hôm nay
- ✅ Check-in
- 🚪 Check-out
- 🏠 Trạng thái phòng
- 🍽️ Dịch vụ

---

### PAGE S1: Staff Dashboard — `/staff`

```
┌──────────────────────────────────────────────────────┐
│  Dashboard — LuxStay Quận 1              Hôm nay     │
│                                          25/03/2025  │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │📅 Booking│ │✅ Phòng  │ │🔴 Phòng  │ │🏠 Tổng   ││
│  │  hôm nay │ │  trống   │ │  đang ở  │ │  phòng   ││
│  │    12    │ │    8     │ │   15     │ │   28     ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                      │
│  Cần xử lý hôm nay:                                  │
│  ┌──────────────────────────────────────────────────┐│
│  │ Check-in (5)         Check-out (3)               ││
│  │ ─────────────────    ────────────────            ││
│  │ 14:00 · #LUX-00128  12:00 · #LUX-00115          ││
│  │ Penthouse Suite     Deluxe Ocean                 ││
│  │ [Check-in →]        [Check-out →]                ││
│  │                                                  ││
│  │ 15:00 · #LUX-00131  13:00 · #LUX-00118          ││
│  │ Standard Room       Suite Garden                 ││
│  │ [Check-in →]        [Check-out →]                ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Lối tắt:                                            │
│  [Walk-in Booking] [Cập nhật phòng] [Thêm dịch vụ]  │
└──────────────────────────────────────────────────────┘
```

---

### PAGE S2: Booking hôm nay — `/staff/bookings/today`

Table: Mã booking | Phòng | Khách | Check-in | Check-out | Trạng thái | Hành động

Tabs: Tất cả / Chờ check-in / Đang ở / Chờ check-out

---

### PAGE S3: Check-in — `/staff/checkin/:id`

```
┌──────────────────────────────────────────────────────┐
│  Check-in Booking #LUX-2025-00128                    │
│                                                      │
│  Thông tin khách:                                    │
│  Họ tên: Nguyễn Văn A                               │
│  Email: nguyenvana@gmail.com                         │
│  SĐT: 0901 234 567                                   │
│                                                      │
│  Thông tin phòng:                                    │
│  Penthouse Suite · Tầng 20 · Quận 1                  │
│  Check-in: 01/04/2025 (hôm nay)                      │
│  Check-out: 03/04/2025                               │
│  Số khách: 2 người lớn                              │
│                                                      │
│  Xác nhận giấy tờ:                                   │
│  ☐ Đã kiểm tra CCCD/Hộ chiếu                        │
│  ☐ Đã thu tiền đặt cọc (nếu có)                     │
│                                                      │
│  Ghi chú nhân viên:                                  │
│  [_____________________________________________]     │
│                                                      │
│  [Hủy]              [✅ Xác nhận Check-in]           │
└──────────────────────────────────────────────────────┘
```

---

### PAGE S4: Check-out — `/staff/checkout/:id`

Tương tự Check-in + thêm:
- Danh sách dịch vụ đã dùng + tổng phí
- Trạng thái thanh toán
- [Xác nhận Check-out + In hóa đơn]

---

### PAGE S5: Trạng thái phòng — `/staff/rooms/status`

Grid phòng theo tầng:
```
Tầng 20: [🟢 201] [🔴 202] [🟡 203] [⚪ 204]
Tầng 19: [🟢 191] [🟢 192] [🔴 193] [🔵 194]
```
- 🟢 Trống (AVAILABLE)
- 🔴 Đang có khách (OCCUPIED)
- 🟡 Đang dọn (CLEANING)
- 🔵 Bảo trì (MAINTENANCE)
- ⚪ Ngừng hoạt động

Click vào phòng → popup: thông tin phòng + nút đổi trạng thái.

---

### PAGE S6: Dịch vụ theo booking — `/staff/service-usage`

- Tìm booking (input mã hoặc chọn từ list đang ở)
- Hiển thị booking detail
- Thêm dịch vụ: chọn loại, số lượng → [Thêm]
- List dịch vụ đã thêm với tổng tiền

---

## 🗂️ MANAGER PAGES

**Sidebar items:**
- 📊 Dashboard
- 🏠 Quản lý phòng
- 📋 Danh sách booking
- 💬 Feedback khách
- 🍽️ Dịch vụ
- 💰 Yêu cầu điều chỉnh giá
- 📈 Báo cáo

---

### PAGE M1: Manager Dashboard — `/manager`

```
┌──────────────────────────────────────────────────────┐
│  Dashboard — LuxStay Quận 1                          │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │📋 Booking│ │🏠 Phòng  │ │💬 Feedback│ │💰 Doanh  ││
│  │  tháng   │ │  trống   │ │  mới     │ │  thu T3  ││
│  │   248    │ │   12     │ │    5     │ │ 450tr₫   ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                      │
│  ┌────────────────────────┬─────────────────────────┐│
│  │ Booking gần đây        │ Phòng theo trạng thái   ││
│  │ (table 5 rows)         │ (donut chart)           ││
│  │                        │ ■ Trống  12             ││
│  │                        │ ■ Đang ở 15            ││
│  │                        │ ■ Dọn    1             ││
│  └────────────────────────┴─────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ Doanh thu 7 ngày qua  (line chart)               ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

---

### PAGE M2: Quản lý phòng — `/manager/rooms`

Table: Số phòng | Loại | Tầng | Sức chứa | Giá/đêm | Trạng thái | Hành động

Filter: Loại phòng / Trạng thái

Hành động: [Sửa] [Vô hiệu hóa] [Xem booking]

Nút trên: [+ Thêm phòng]

---

### PAGE M3: Tạo/Sửa phòng — `/manager/rooms/create` & `/manager/rooms/:id/edit`

Form 2 cột:
- Số phòng * | Tầng *
- Loại phòng * (dropdown) | Sức chứa *
- Diện tích (m²) | Loại giường
- Hướng (dropdown: Hướng biển, Hướng thành phố, ...) | -
- Giá/đêm * | Trạng thái *
- Mô tả (textarea full width)
- Tiện nghi (checkbox list)
- Upload ảnh (multiple, preview, drag-drop)

---

### PAGE M4: Danh sách booking — `/manager/bookings`

Table: Mã | Khách | Phòng | Check-in | Check-out | Tổng tiền | Thanh toán | Trạng thái | Actions

Filter: Ngày / Trạng thái / Thanh toán

---

### PAGE M5: Feedback khách — `/manager/feedbacks`

List feedback với rating, nội dung, tên phòng, tên khách.

Nút "Phản hồi" → input reply → submit.

Filter: Chưa trả lời / Đã trả lời / Sao (1-5)

---

### PAGE M6: Yêu cầu điều chỉnh giá — `/manager/pricing-requests`

Table: Phòng/Loại | Giá hiện tại | Giá đề xuất | Lý do | Trạng thái | Ngày gửi

Nút [+ Tạo yêu cầu] → form: chọn phòng/loại, nhập giá mới, lý do.

Status: PENDING (vàng) / APPROVED (xanh) / REJECTED (đỏ)

---

### PAGE M7: Báo cáo — `/manager/reports/revenue` & `/manager/reports/booking`

**Doanh thu:**
- Filter: Tháng / Quý / Năm / Tùy chỉnh
- Line chart: doanh thu theo ngày
- Bar chart: theo loại phòng
- Table: top phòng doanh thu cao nhất

**Booking:**
- Bar chart: số booking theo ngày
- Pie chart: theo trạng thái
- Bảng tổng hợp

---

## 👑 OWNER PAGES

**Sidebar items:**
- 📊 Dashboard tổng
- 🏢 Quản lý chi nhánh
- 💰 Quản lý giá
- ✅ Duyệt yêu cầu giá
- 👥 Quản lý người dùng
- 📈 Báo cáo doanh thu
- 📊 So sánh chi nhánh
- 📋 System Logs

---

### PAGE O1: Owner Dashboard — `/owner`

```
┌──────────────────────────────────────────────────────┐
│  Dashboard Tổng Hệ Thống                             │
│                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │Chi   │ │Tổng  │ │Booking│ │Doanh │ │Người │      │
│  │nhánh │ │phòng │ │tháng  │ │thu   │ │dùng  │      │
│  │  5   │ │ 140  │ │ 1248  │ │2.3 tỷ│ │ 3400 │      │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘      │
│                                                      │
│  ┌────────────────────────┬─────────────────────────┐│
│  │ Doanh thu theo chi     │ So sánh tháng này vs    ││
│  │ nhánh (bar chart)      │ tháng trước (line chart)││
│  └────────────────────────┴─────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ Top phòng sinh lợi cao nhất toàn hệ thống        ││
│  │ # | Phòng | Chi nhánh | Doanh thu | Booking count││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ Yêu cầu giá đang chờ duyệt: 3 yêu cầu [Xem →]  ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

---

### PAGE O2: Quản lý chi nhánh — `/owner/branches`

Table: Tên | Địa chỉ | Thành phố | Số phòng | Manager | Trạng thái | Actions

[+ Tạo chi nhánh] → form: tên, địa chỉ, thành phố, số ĐT, mô tả, ảnh, chọn manager.

---

### PAGE O3: Quản lý giá — `/owner/pricing`

Table: Loại áp dụng (phòng / loại phòng / chi nhánh) | Giá | Mùa | Thời hạn | Actions

[+ Tạo chính sách giá] → form chọn scope, mức giá, % giảm theo mùa, thời hạn hiệu lực.

---

### PAGE O4: Duyệt yêu cầu giá — `/owner/pricing-requests`

Table: Chi nhánh | Phòng | Giá cũ | Giá mới | Lý do | Manager | Ngày gửi | Actions

Actions: [✅ Duyệt] [❌ Từ chối + Nhập lý do]

Modal từ chối: textarea lý do.

---

### PAGE O5: Quản lý người dùng — `/owner/users`

Table: Họ tên | Email | SĐT | Role | Chi nhánh (nếu STAFF/MANAGER) | Ngày tạo | Actions

Filter: Role (CUSTOMER / STAFF / MANAGER / OWNER)

Actions: [Đổi role] [Khoá tài khoản] [Xem chi tiết]

Đổi role → modal: chọn role mới, chọn chi nhánh (nếu STAFF/MANAGER).

---

### PAGE O6: Báo cáo doanh thu — `/owner/reports/revenue`

- Line chart: doanh thu toàn hệ thống theo tháng (12 tháng)
- Grouped bar chart: từng chi nhánh theo tháng
- Dropdown chọn năm
- Export CSV/PDF button

---

### PAGE O7: So sánh chi nhánh — `/owner/reports/branches`

- Bảng so sánh: các cột là chi nhánh, các hàng là metrics (doanh thu, số phòng, tỷ lệ lấp đầy, avg rating)
- Radar chart so sánh hiệu suất
- Filter: chọn kỳ thời gian

---

### PAGE O8: System Logs — `/owner/logs`

Table: Thời gian | Người dùng | Hành động | Module | Chi tiết | IP

Filter: Date range / User / Module (Auth, Booking, Payment, Room, User...)

Phân trang 50 rows/page.

---

## 🔔 SHARED COMPONENTS

### Toast / Notification
- Vị trí: top-right
- Types: success (xanh), error (đỏ), warning (vàng), info (navy)
- Auto dismiss sau 4 giây
- Stack nếu nhiều toast

### Modal
- Overlay tối 50%
- Card trắng center, max-width 560px
- Header + body + footer (action buttons)
- Close: click overlay hoặc nút X

### DataTable
- Column sorting (click header)
- Row hover highlight
- Checkbox select (multi-action)
- Empty state khi không có data
- Skeleton loading state

### StatusBadge
```
AVAILABLE   → bg: #dcfce7, text: #16a34a
OCCUPIED    → bg: #fef3c7, text: #d97706
CLEANING    → bg: #e0f2fe, text: #0369a1
MAINTENANCE → bg: #fee2e2, text: #dc2626
PENDING     → bg: #fef3c7, text: #d97706
CONFIRMED   → bg: #e0f2fe, text: #0369a1
CHECKED_IN  → bg: #dcfce7, text: #16a34a
COMPLETED   → bg: #f1f5f9, text: #64748b
CANCELLED   → bg: #fee2e2, text: #dc2626
```

### Pagination
- Previous / [1] [2] [3] ... [10] / Next
- Hiển thị "Showing X–Y of Z results"
- Jump to page input (nếu nhiều trang)

### EmptyState
- Icon lớn (emoji hoặc SVG)
- Tiêu đề
- Mô tả
- CTA button (optional)

### SkeletonLoader
- Dùng khi đang fetch data
- Pulse animation
- Match layout của content thật

---

## 📱 RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Notes |
|------------|-------|-------|
| Mobile     | < 640px | 1 cột, hamburger nav |
| Tablet     | 640–1024px | 2 cột, sidebar collapse |
| Desktop    | > 1024px | Full layout |

**Mobile-specific:**
- Navbar → hamburger + drawer
- Filter panel → bottom sheet hoặc modal
- Room grid → 1 cột
- Tables → horizontal scroll
- Sidebar (admin) → overlay drawer
- Booking widget → bottom floating bar

---

## 🔐 AUTH GUARD LOGIC

```
Chưa đăng nhập → chỉ xem public pages
  Cố vào /customer/* → redirect /login?redirect=...
  Cố vào /staff, /manager, /owner → redirect /login

Đăng nhập CUSTOMER → được vào /customer/*
  Cố vào /staff, /manager, /owner → 403 page

Đăng nhập STAFF → được vào /staff/*
  KHÔNG có /customer/* (staff không đặt phòng qua app)

Đăng nhập MANAGER → được vào /manager/*

Đăng nhập OWNER → được vào /owner/*
```

---

## 🔄 API STATE PATTERNS

Mọi trang fetch data cần handle đủ 3 states:
1. **Loading:** Skeleton hoặc spinner
2. **Error:** Banner đỏ + nút retry
3. **Empty:** EmptyState component

Form submit cần handle:
1. **Loading:** Disable nút + show spinner
2. **Success:** Toast green + redirect hoặc reset form
3. **Error:** Toast red + hiển thị lỗi cụ thể từ API

---

## 📂 FILE STRUCTURE GỢI Ý

🌳 1. FULL PROJECT STRUCTURE (FINAL)
src/
├── app/
│   ├── App.jsx
│   └── main.jsx
│
├── features/
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── Signin.jsx
│   │   │   └── Signup.jsx
│   │   ├── authService.js
│   │   └── useAuth.js
│
│   ├── booking/
│   │   ├── pages/
│   │   │   ├── PreviewBooking.jsx
│   │   │   ├── VnPayPayment.jsx
│   │   │   ├── VnPayReturn.jsx
│   │   │   ├── PaymentSuccess.jsx
│   │   │   ├── PaymentFailed.jsx
│   │   │   ├── BookingsToday.jsx
│   │   │   └── ManageBookings.jsx
│   │   ├── BookingCard.jsx
│   │   ├── bookingService.js
│   │   ├── paymentService.js
│   │   └── useBooking.js
│
│   ├── rooms/
│   │   ├── pages/
│   │   │   ├── RoomList.jsx
│   │   │   ├── RoomDetail.jsx
│   │   │   ├── RoomStatus.jsx
│   │   │   └── ManageRoom.jsx
│   │   ├── RoomCard.jsx
│   │   ├── RoomForm.jsx
│   │   └── roomService.js
│
│   ├── services/
│   │   ├── pages/
│   │   │   ├── ServiceUsage.jsx
│   │   │   └── ManageServices.jsx
│   │   ├── ServiceCard.jsx
│   │   └── serviceService.js
│
│   ├── feedback/
│   │   ├── pages/
│   │   │   ├── Feedbacks.jsx
│   │   │   └── ManageFeedbacks.jsx
│   │   └── feedbackService.js
│
│   ├── users/
│   │   ├── pages/
│   │   │   ├── Profile.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── ManageUser.jsx
│   │   ├── UserCard.jsx
│   │   └── userService.js
│
│   ├── reports/
│   │   ├── pages/
│   │   │   └── Reports.jsx
│   │   └── reportService.js
│
│   ├── branches/
│   │   ├── pages/
│   │   │   └── ManageBranches.jsx
│   │   └── branchService.js
│
│   └── dashboard/
│       ├── StaffDashboard.jsx
│       ├── ManagerDashboard.jsx
│       ├── OwnerDashboard.jsx
│       └── DashboardWidgets.jsx
│
├── pages/
│   ├── Home.jsx
│   ├── Dashboard.jsx
│   ├── NotFound.jsx
│   └── errors/
│       ├── Unauthorized.jsx
│       ├── Forbidden.jsx
│       └── ServerError.jsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── common/
│
├── layouts/
│   ├── PublicLayout.jsx
│   ├── CustomerLayout.jsx
│   └── DashLayout.jsx
│
├── routes/
│   ├── index.jsx
│   ├── pathConstants.js
│   └── guards/
│
├── store/
│   ├── index.js
│   └── authStore.js
│
├── hooks/
├── services/
├── utils/
├── constants/
└── styles/
🧠 2. CHI TIẾT NỘI DUNG QUAN TRỌNG (THEO FILE)
🔥 pages/Home.jsx (PUBLIC - rất quan trọng)

👉 Trang landing cho customer

Nội dung nên có:
- Hero section (banner khách sạn)
- Giới thiệu (about)
- Danh sách phòng nổi bật (recommended rooms)
- Chi nhánh nổi bật
- Dịch vụ chính
- Feedback khách hàng
- Contact + map
Logic:
- gọi API: getFeaturedRooms()
- gọi API: getTopBranches()
- gọi API: getFeedbacks()
🏨 RoomList.jsx
- filter theo:
  + giá
  + loại phòng
  + chi nhánh
- search
- pagination
- list RoomCard
🏨 RoomDetail.jsx
- ảnh phòng (gallery)
- mô tả
- tiện ích
- giá
- chọn ngày checkin/checkout
- nút "Đặt phòng"
💳 PreviewBooking.jsx
- thông tin phòng
- ngày checkin/checkout
- số người
- dịch vụ thêm
- tổng tiền
- nút "Thanh toán VNPay"
💰 VnPayPayment.jsx
- call API tạo payment URL
- redirect sang VNPay
🔄 VnPayReturn.jsx
- lấy query params từ VNPay
- verify checksum (nếu có)
- gọi API xác nhận thanh toán
- redirect:
    success → /booking/success
    fail    → /booking/fail
✅ PaymentSuccess.jsx
- thông báo thành công
- mã booking
- nút về trang chủ / xem booking
❌ PaymentFailed.jsx
- thông báo thất bại
- nút thử lại
🧑‍🔧 RoomStatus.jsx (STAFF)
- danh sách phòng hôm nay
- trạng thái:
   + trống
   + đang sử dụng
   + cần dọn
- update trạng thái
🧑‍💼 ManageRoom.jsx (MANAGER)
- CRUD phòng
- upload ảnh
- set giá
- set chi nhánh
🧾 ManageBookings.jsx
- list booking
- filter theo ngày
- trạng thái:
   + pending
   + paid
   + cancelled
🧑 ManageUser.jsx (OWNER)
- list user
- phân quyền:
   + customer
   + staff
   + manager
- khóa tài khoản
🏢 ManageBranches.jsx (OWNER)
- CRUD chi nhánh
- địa chỉ
- số phòng
📊 Reports.jsx
- doanh thu theo:
   + ngày
   + tháng
- số lượng booking
- top phòng
📊 Dashboard.jsx
const role = useAuth()

if (role === 'staff') → StaffDashboard
if (role === 'manager') → ManagerDashboard
if (role === 'owner') → OwnerDashboard
🧠 DashboardWidgets.jsx
- card:
   + total booking
   + revenue
   + rooms available
⚙️ 3. SERVICE LAYER
bookingService.js
- createBooking()
- getBookings()
- cancelBooking()
paymentService.js
- createVnPayPayment()
- verifyVnPayReturn()
roomService.js
- getRooms()
- getRoomDetail()
- createRoom()
- updateRoom()
🧱 4. GUARD
AuthGuard.jsx
if (!user) redirect('/signin')
RoleGuard.jsx
if (!roles.includes(user.role)) redirect('/forbidden')

---

*Tài liệu này bao gồm đủ 20+ trang cho tất cả 4 role. Mỗi trang có layout ASCII, danh sách fields, logic state, và UX notes đủ để implement trực tiếp.*
