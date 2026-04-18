# PROJECT CHỐT TOÀN HỆ THỐNG

## 1. Mục tiêu hệ thống
Xây dựng hệ thống quản lý khách sạn đa chi nhánh theo mô hình role-based, hỗ trợ:
- Luồng public cho người chưa đăng nhập (xem phòng, xem feedback, liên hệ).
- Luồng customer (đặt phòng, thanh toán, quản lý booking, feedback, profile).
- Luồng staff (check-in/check-out, quản lý trạng thái phòng, xử lý dịch vụ tại chỗ).
- Luồng manager (quản lý vận hành chi nhánh, gửi đề xuất giá, xử lý feedback).
- Luồng owner (quản lý toàn cục nhiều chi nhánh, duyệt giá, dashboard so sánh).

## 2. Kiến trúc tổng thể
- Backend: Java Spring Boot.
- Frontend: React (Vite).
- RDBMS chính: PostgreSQL (ACID, giao dịch đặt phòng, thanh toán).
- NoSQL bổ trợ: MongoDB (feedback document, activity log, session/token, cache).
- Thanh toán: VNPay sandbox.
- Email: SMTP xác thực tài khoản.
- Triển khai: Docker Compose (postgres, mongo, backend, frontend/nginx).

## 3. Cây thư mục chuẩn (master)
```text
hotel-management-system/
├── backend/
│   ├── .mvn/
│   │   └── wrapper/
│   │       ├── maven-wrapper.jar
│   │       └── maven-wrapper.properties
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/
│       ├── main/
│       │   ├── java/com/hotel/
│       │   │   ├── Application.java
│       │   │   ├── config/
│       │   │   │   ├── SecurityConfig.java
│       │   │   │   ├── JwtConfig.java
│       │   │   │   ├── MongoConfig.java
│       │   │   │   ├── CorsConfig.java
│       │   │   │   ├── OpenApiConfig.java
│       │   │   │   └── JacksonConfig.java
│       │   │   ├── security/
│       │   │   │   ├── JwtFilter.java
│       │   │   │   ├── JwtProvider.java
│       │   │   │   ├── RoleGuard.java
│       │   │   │   ├── PermissionEvaluator.java
│       │   │   │   ├── CurrentUser.java
│       │   │   │   └── SecurityUtils.java
│       │   │   ├── common/
│       │   │   │   ├── base/
│       │   │   │   │   ├── BaseEntity.java
│       │   │   │   │   └── AuditableEntity.java
│       │   │   │   ├── constants/
│       │   │   │   │   ├── ErrorCode.java
│       │   │   │   │   ├── ApiPath.java
│       │   │   │   │   └── AppConstants.java
│       │   │   │   ├── enums/
│       │   │   │   │   ├── Role.java
│       │   │   │   │   ├── BookingStatus.java
│       │   │   │   │   ├── PaymentStatus.java
│       │   │   │   │   ├── RoomStatus.java
│       │   │   │   │   └── ServiceMode.java
│       │   │   │   ├── response/
│       │   │   │   │   ├── ApiResponse.java
│       │   │   │   │   ├── ErrorResponse.java
│       │   │   │   │   └── MetaResponse.java
│       │   │   │   ├── pagination/
│       │   │   │   │   ├── PageRequest.java
│       │   │   │   │   └── PageResponse.java
│       │   │   │   ├── mapper/
│       │   │   │   │   └── CommonMapper.java
│       │   │   │   └── util/
│       │   │   │       ├── DateTimeUtils.java
│       │   │   │       ├── CurrencyUtils.java
│       │   │   │       └── ValidationUtils.java
│       │   │   ├── modules/
│       │   │   │   ├── auth/
│       │   │   │   │   ├── AuthController.java
│       │   │   │   │   ├── AuthService.java
│       │   │   │   │   ├── AuthRepository.java
│       │   │   │   │   ├── AuthMapper.java
│       │   │   │   │   └── dto/
│       │   │   │   │       ├── LoginRequest.java
│       │   │   │   │       ├── RegisterRequest.java
│       │   │   │   │       ├── RefreshTokenRequest.java
│       │   │   │   │       ├── VerifyEmailRequest.java
│       │   │   │   │       └── AuthResponse.java
│       │   │   │   ├── user/
│       │   │   │   │   ├── UserEntity.java
│       │   │   │   │   ├── ProfileEntity.java
│       │   │   │   │   ├── UserRepository.java
│       │   │   │   │   ├── ProfileRepository.java
│       │   │   │   │   ├── UserService.java
│       │   │   │   │   ├── UserMapper.java
│       │   │   │   │   └── dto/
│       │   │   │   │       ├── UserResponse.java
│       │   │   │   │       ├── ProfileResponse.java
│       │   │   │   │       └── UpdateProfileRequest.java
│       │   │   │   ├── branch/
│       │   │   │   │   ├── BranchEntity.java
│       │   │   │   │   ├── BranchImageEntity.java
│       │   │   │   │   ├── BranchRepository.java
│       │   │   │   │   ├── BranchService.java
│       │   │   │   │   ├── BranchMapper.java
│       │   │   │   │   └── dto/
│       │   │   │   │       ├── BranchCreateRequest.java
│       │   │   │   │       ├── BranchUpdateRequest.java
│       │   │   │   │       └── BranchResponse.java
│       │   │   │   ├── room/
│       │   │   │   │   ├── RoomTypeEntity.java
│       │   │   │   │   ├── RoomEntity.java
│       │   │   │   │   ├── RoomImageEntity.java
│       │   │   │   │   ├── RoomRepository.java
│       │   │   │   │   ├── RoomService.java
│       │   │   │   │   ├── RoomMapper.java
│       │   │   │   │   └── dto/
│       │   │   │   │       ├── RoomCreateRequest.java
│       │   │   │   │       ├── RoomUpdateRequest.java
│       │   │   │   │       ├── RoomSearchFilter.java
│       │   │   │   │       └── RoomResponse.java
│       │   │   │   ├── service/
│       │   │   │   │   ├── ServiceEntity.java
│       │   │   │   │   ├── ServiceImageEntity.java
│       │   │   │   │   ├── ServiceRepository.java
│       │   │   │   │   ├── ServiceService.java
│       │   │   │   │   ├── ServiceMapper.java
│       │   │   │   │   └── dto/
│       │   │   │   │       ├── ServiceCreateRequest.java
│       │   │   │   │       ├── ServiceUpdateRequest.java
│       │   │   │   │       └── ServiceResponse.java
│       │   │   │   ├── booking/
│       │   │   │   │   ├── BookingEntity.java
│       │   │   │   │   ├── BookingServiceEntity.java
│       │   │   │   │   ├── BookingRepository.java
│       │   │   │   │   ├── BookingValidator.java
│       │   │   │   │   ├── BookingService.java
│       │   │   │   │   ├── BookingMapper.java
│       │   │   │   │   └── dto/
│       │   │   │   │       ├── BookingCreateRequest.java
│       │   │   │   │       ├── BookingCancelRequest.java
│       │   │   │   │       ├── BookingPaymentRequest.java
│       │   │   │   │       ├── BookingFilterRequest.java
│       │   │   │   │       └── BookingResponse.java
│       │   │   │   ├── payment/
│       │   │   │   │   ├── PaymentEntity.java
│       │   │   │   │   ├── PaymentRepository.java
│       │   │   │   │   ├── PaymentService.java
│       │   │   │   │   └── dto/
│       │   │   │   │       ├── PaymentCreateRequest.java
│       │   │   │   │       └── PaymentResponse.java
│       │   │   │   ├── feedback/
│       │   │   │   │   ├── FeedbackDocument.java
│       │   │   │   │   ├── FeedbackRepository.java
│       │   │   │   │   ├── FeedbackService.java
│       │   │   │   │   └── dto/
│       │   │   │   │       ├── FeedbackCreateRequest.java
│       │   │   │   │       ├── FeedbackReplyRequest.java
│       │   │   │   │       └── FeedbackResponse.java
│       │   │   │   ├── pricing/
│       │   │   │   │   ├── pricing/
│       │   │   │   │   │   ├── PricingEntity.java
│       │   │   │   │   │   ├── PricingRepository.java
│       │   │   │   │   │   ├── PricingService.java
│       │   │   │   │   │   └── dto/
│       │   │   │   │   │       ├── PricingCreateRequest.java
│       │   │   │   │   │       ├── PricingUpdateRequest.java
│       │   │   │   │   │       └── PricingResponse.java
│       │   │   │   │   ├── request/
│       │   │   │   │   │   ├── PricingRequestEntity.java
│       │   │   │   │   │   ├── PricingRequestRepository.java
│       │   │   │   │   │   ├── PricingRequestService.java
│       │   │   │   │   │   └── dto/
│       │   │   │   │   │       ├── PricingRequestCreateRequest.java
│       │   │   │   │   │       ├── PricingRequestApproveRequest.java
│       │   │   │   │   │       ├── PricingRequestRejectRequest.java
│       │   │   │   │   │       └── PricingRequestResponse.java
│       │   │   │   │   └── log/
│       │   │   │   │       ├── PricingLogEntity.java
│       │   │   │   │       ├── PricingLogRepository.java
│       │   │   │   │       └── PricingLogService.java
│       │   │   │   ├── dashboard/
│       │   │   │   │   ├── DashboardService.java
│       │   │   │   │   └── dto/
│       │   │   │   │       ├── DashboardSummaryResponse.java
│       │   │   │   │       └── BranchComparisonResponse.java
│       │   │   │   ├── report/
│       │   │   │   │   ├── ReportService.java
│       │   │   │   │   └── dto/
│       │   │   │   │       ├── RevenueReportResponse.java
│       │   │   │   │       └── BookingReportResponse.java
│       │   │   │   └── notification/
│       │   │   │       ├── NotificationService.java
│       │   │   │       └── dto/
│       │   │   │           ├── EmailNotificationRequest.java
│       │   │   │           └── NotificationResponse.java
│       │   │   ├── controllers/
│       │   │   │   ├── public/
│       │   │   │   │   └── PublicController.java
│       │   │   │   ├── customer/
│       │   │   │   │   └── CustomerController.java
│       │   │   │   ├── staff/
│       │   │   │   │   └── StaffController.java
│       │   │   │   ├── manager/
│       │   │   │   │   └── ManagerController.java
│       │   │   │   ├── owner/
│       │   │   │   │   └── OwnerController.java
│       │   │   │   └── internal/
│       │   │   │       └── InternalController.java
│       │   │   ├── integrations/
│       │   │   │   ├── vnpay/
│       │   │   │   │   ├── VNPayService.java
│       │   │   │   │   ├── VNPayClient.java
│       │   │   │   │   └── VNPaySignatureUtil.java
│       │   │   │   ├── email/
│       │   │   │   │   ├── EmailService.java
│       │   │   │   │   └── EmailTemplateFactory.java
│       │   │   │   └── logging/
│       │   │   │       ├── ActivityLogService.java
│       │   │   │       └── ActivityLogPublisher.java
│       │   │   ├── scheduler/
│       │   │   │   ├── BookingScheduler.java
│       │   │   │   ├── PricingScheduler.java
│       │   │   │   └── RatingSyncScheduler.java
│       │   │   └── exception/
│       │   │       ├── GlobalExceptionHandler.java
│       │   │       ├── BusinessException.java
│       │   │       ├── NotFoundException.java
│       │   │       └── UnauthorizedException.java
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-dev.yml
│       │       ├── application-prod.yml
│       │       ├── logback-spring.xml
│       │       ├── templates/
│       │       │   ├── mail-verify-account.html
│       │       │   ├── mail-booking-confirmed.html
│       │       │   └── mail-reset-password.html
│       │       └── db/
│       │           ├── README.md
│       │           ├── migration/
│       │           │   ├── V1__hotel_core_schema.sql
│       │           │   ├── V2__hotel_reporting_views.sql
│       │           │   ├── V3__hotel_routines.sql
│       │           │   ├── V4__hotel_seed_sample_data.sql
│       │           │   ├── V5__hotel_indexes_optimization.sql
│       │           │   └── V6__hotel_permissions.sql
│       │           └── mongodb/
│       │               ├── collections.json
│       │               ├── indexes.json
│       │               └── seed.json
│       └── test/
│           ├── java/com/hotel/
│           │   ├── auth/
│           │   ├── booking/
│           │   ├── pricing/
│           │   └── integration/
│           └── resources/
│               └── application-test.yml
├── frontend/
│   ├── .eslintrc.cjs
│   ├── .prettierrc
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── vite.config.js
│   ├── public/
│   │   ├── favicon.ico
│   │   └── images/
│   │       ├── hero-banner.jpg
│   │       └── placeholder-room.jpg
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── styles/
│       │   ├── globals.css
│       │   ├── variables.css
│       │   └── animations.css
│       ├── assets/
│       │   ├── logo.svg
│       │   ├── icons/
│       │   │   ├── calendar.svg
│       │   │   ├── user.svg
│       │   │   └── room.svg
│       │   └── images/
│       │       ├── auth-bg.jpg
│       │       ├── default-avatar.png
│       │       └── room-default.jpg
│       ├── components/
│       │   ├── common/
│       │   │   ├── PageHeader.jsx
│       │   │   ├── SectionTitle.jsx
│       │   │   └── EmptyState.jsx
│       │   ├── ui/
│       │   │   ├── Button.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── DataTable.jsx
│       │   │   ├── Pagination.jsx
│       │   │   ├── FormField.jsx
│       │   │   └── StatusBadge.jsx
│       │   └── layout/
│       │       ├── Sidebar.jsx
│       │       ├── Topbar.jsx
│       │       └── Footer.jsx
│       ├── layouts/
│       │   ├── PublicLayout.jsx
│       │   ├── CustomerLayout.jsx
│       │   ├── StaffLayout.jsx
│       │   ├── ManagerLayout.jsx
│       │   └── OwnerLayout.jsx
│       ├── pages/
│       │   ├── public/
│       │   │   ├── Home.jsx
│       │   │   ├── RoomList.jsx
│       │   │   ├── RoomDetail.jsx
│       │   │   ├── About.jsx
│       │   │   ├── Contact.jsx
│       │   │   ├── Login.jsx
│       │   │   └── Register.jsx
│       │   ├── customer/
│       │   │   ├── Home.jsx
│       │   │   ├── Search.jsx
│       │   │   ├── RoomDetail.jsx
│       │   │   ├── Booking/
│       │   │   │   ├── BookingCreate.jsx
│       │   │   │   ├── BookingReview.jsx
│       │   │   │   ├── BookingPayment.jsx
│       │   │   │   └── BookingSuccess.jsx
│       │   │   ├── MyBookings/
│       │   │   │   ├── BookingList.jsx
│       │   │   │   └── BookingDetail.jsx
│       │   │   ├── Profile/
│       │   │   │   ├── ProfileView.jsx
│       │   │   │   └── ProfileEdit.jsx
│       │   │   ├── Settings/
│       │   │   │   └── ChangePassword.jsx
│       │   │   └── Feedback/
│       │   │       ├── CreateFeedback.jsx
│       │   │       └── MyFeedbacks.jsx
│       │   ├── staff/
│       │   │   ├── Dashboard.jsx
│       │   │   ├── TodayBookings.jsx
│       │   │   ├── Checkin.jsx
│       │   │   ├── Checkout.jsx
│       │   │   ├── RoomStatus.jsx
│       │   │   └── ServiceUsage.jsx
│       │   ├── manager/
│       │   │   ├── Dashboard.jsx
│       │   │   ├── Rooms/
│       │   │   │   ├── RoomList.jsx
│       │   │   │   ├── RoomCreate.jsx
│       │   │   │   └── RoomEdit.jsx
│       │   │   ├── Bookings/
│       │   │   │   ├── BookingList.jsx
│       │   │   │   └── BookingDetail.jsx
│       │   │   ├── Services/
│       │   │   │   ├── ServiceList.jsx
│       │   │   │   ├── ServiceCreate.jsx
│       │   │   │   └── ServiceEdit.jsx
│       │   │   ├── Feedbacks/
│       │   │   │   ├── FeedbackList.jsx
│       │   │   │   └── ReplyFeedback.jsx
│       │   │   ├── PricingRequests/
│       │   │   │   ├── RequestList.jsx
│       │   │   │   └── CreateRequest.jsx
│       │   │   └── Reports/
│       │   │       ├── RevenueReport.jsx
│       │   │       └── BookingReport.jsx
│       │   └── owner/
│       │       ├── Dashboard.jsx
│       │       ├── Branches/
│       │       │   ├── BranchList.jsx
│       │       │   ├── BranchCreate.jsx
│       │       │   └── BranchEdit.jsx
│       │       ├── Users/
│       │       │   ├── UserList.jsx
│       │       │   └── RoleManagement.jsx
│       │       ├── Pricing/
│       │       │   ├── PricingList.jsx
│       │       │   ├── PricingCreate.jsx
│       │       │   └── PricingEdit.jsx
│       │       ├── PricingRequests/
│       │       │   ├── RequestList.jsx
│       │       │   ├── ApproveRequest.jsx
│       │       │   └── RejectRequest.jsx
│       │       ├── Reports/
│       │       │   ├── GlobalRevenue.jsx
│       │       │   └── BranchComparison.jsx
│       │       └── Logs/
│       │           └── SystemLogs.jsx
│       ├── routes/
│       │   ├── index.jsx
│       │   ├── roleRoutes.jsx
│       │   ├── guards/
│       │   │   ├── AuthGuard.jsx
│       │   │   ├── RoleGuard.jsx
│       │   │   └── GuestGuard.jsx
│       │   └── pathConstants.js
│       ├── services/
│       │   ├── apiClient.js
│       │   ├── authService.js
│       │   ├── bookingService.js
│       │   ├── roomService.js
│       │   ├── feedbackService.js
│       │   ├── pricingService.js
│       │   ├── branchService.js
│       │   ├── reportService.js
│       │   └── userService.js
│       ├── store/
│       │   ├── index.js
│       │   ├── auth/
│       │   │   ├── authSlice.js
│       │   │   └── authSelectors.js
│       │   ├── booking/
│       │   │   ├── bookingSlice.js
│       │   │   └── bookingSelectors.js
│       │   ├── pricing/
│       │   │   ├── pricingSlice.js
│       │   │   └── pricingSelectors.js
│       │   ├── report/
│       │   │   ├── reportSlice.js
│       │   │   └── reportSelectors.js
│       │   └── ui/
│       │       ├── uiSlice.js
│       │       └── uiSelectors.js
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useDebounce.js
│       │   ├── usePagination.js
│       │   ├── usePermission.js
│       │   └── useToast.js
│       ├── utils/
│       │   ├── currency.js
│       │   ├── dateTime.js
│       │   ├── validators.js
│       │   ├── queryParams.js
│       │   └── formatter.js
│       └── constants/
│           ├── appConstants.js
│           ├── roleConstants.js
│           ├── apiEndpoints.js
│           ├── bookingStatus.js
│           └── paymentStatus.js
├── docs/
│   ├── architecture/
│   │   ├── system-context.png
│   │   ├── container-diagram.png
│   │   └── deployment-diagram.png
│   ├── erd/
│   │   ├── erd-postgres.png
│   │   └── erd-cross-db.png
│   ├── ERD.png
│   ├── architecture.png
│   ├── api-docs.md
│   ├── api/
│   │   ├── auth-api.md
│   │   ├── customer-api.md
│   │   ├── staff-api.md
│   │   ├── manager-api.md
│   │   ├── owner-api.md
│   │   └── internal-api.md
│   ├── db/
│   │   ├── postgres-schema.md
│   │   ├── mongodb-schema.md
│   │   └── migration-notes.md
│   └── sequence/
│       ├── booking.png
│       ├── pricing-approval.png
│       ├── auth-register-verify.png
│       ├── customer-checkout-payment.png
│       ├── staff-checkin-checkout.png
│       └── feedback-rating-sync.png
├── scripts/
│   ├── dev-up.ps1
│   ├── dev-down.ps1
│   ├── backend-test.ps1
│   ├── frontend-test.ps1
│   ├── format-check.ps1
│   ├── seed-postgres.ps1
│   ├── seed-mongo.ps1
│   ├── backup-postgres.ps1
│   └── backup-mongo.ps1
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env
├── .env.example
├── .gitignore
└── README.md
```

## 4. Phân quyền và chức năng theo vai trò
### 4.1 Guest (chưa đăng nhập)
- Xem danh sách phòng/room type nổi bật theo profit.
- Xem chi tiết phòng: ảnh, rating, feedback.
- Xem trang giới thiệu, liên hệ.
- Đăng ký, đăng nhập, kích hoạt qua email.

### 4.2 Customer
- Tìm kiếm/lọc phòng theo chi nhánh, giá, sức chứa, rating, tiện ích.
- Tạo booking, chọn dịch vụ prebook hoặc on-site.
- Thanh toán online (VNPay mock/sandbox).
- Quản lý lịch sử booking, hủy booking theo điều kiện.
- Quản lý profile/settings, gửi feedback.

### 4.3 Staff
- Xem booking hôm nay.
- Check-in/check-out.
- Cập nhật trạng thái phòng.
- Ghi nhận dịch vụ phát sinh tại chỗ (on-site).

### 4.4 Manager
- Quản lý phòng/dịch vụ/booking trong chi nhánh.
- Quản lý feedback (xem, phản hồi).
- Tạo và theo dõi pricing request gửi owner.
- Dashboard chi nhánh, báo cáo doanh thu.

### 4.5 Owner
- Quản lý toàn bộ chi nhánh, người dùng, vai trò.
- Quản lý policy giá toàn hệ thống.
- Duyệt/từ chối pricing request.
- Dashboard tổng + so sánh giữa các chi nhánh.
- Xem log hệ thống và báo cáo tổng hợp.

## 5. API khung chuẩn theo luồng
Gợi ý prefix chung: `/api`.

### 5.1 Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/verify-email`
- `POST /api/auth/refresh-token`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### 5.2 Public
- `GET /api/public/rooms`
- `GET /api/public/rooms/{id}`
- `GET /api/public/branches`
- `GET /api/public/feedbacks/{room_id}`
- `GET /api/public/top-room-types`

### 5.3 Customer
- `POST /api/customer/bookings`
- `GET /api/customer/bookings`
- `GET /api/customer/bookings/{id}`
- `PUT /api/customer/bookings/{id}/cancel`
- `POST /api/customer/payments`
- `POST /api/customer/feedbacks`
- `GET /api/customer/feedbacks/my`
- `GET /api/customer/profile`
- `PUT /api/customer/profile`

### 5.4 Staff
- `GET /api/staff/bookings/today`
- `PUT /api/staff/bookings/{id}/checkin`
- `PUT /api/staff/bookings/{id}/checkout`
- `POST /api/staff/bookings/walk-in`
- `GET /api/staff/rooms/status`
- `PUT /api/staff/rooms/{id}/update-status`
- `PUT /api/staff/bookings/{id}/services`

### 5.5 Manager
- `POST /api/manager/pricing-requests`
- `GET /api/manager/pricing-requests`
- `GET /api/manager/pricing-requests/{id}`
- `POST /api/manager/rooms`
- `PUT /api/manager/rooms/{id}`
- `DELETE /api/manager/rooms/{id}`
- `GET /api/manager/bookings`
- `GET /api/manager/feedbacks`
- `POST /api/manager/feedbacks/reply`

### 5.6 Owner
- `POST /api/owner/pricing`
- `PUT /api/owner/pricing/{id}`
- `GET /api/owner/pricing`
- `GET /api/owner/pricing-requests`
- `PUT /api/owner/pricing-requests/{id}/approve`
- `PUT /api/owner/pricing-requests/{id}/reject`
- `POST /api/owner/branches`
- `GET /api/owner/users`
- `PUT /api/owner/users/{id}/role`
- `GET /api/owner/dashboard`
- `GET /api/owner/reports`

### 5.7 Internal
- `GET /api/internal/payments/vnpay-callback`
- `GET /api/internal/analytics/top-rooms`
- `GET /api/internal/analytics/conversion`
- `POST /api/internal/notifications/email`

## 6. Luồng nghiệp vụ chính (business flow)
### 6.1 Luồng booking chống double booking
1. Customer gửi request đặt phòng.
2. Backend mở transaction PostgreSQL.
3. Lock dòng phòng bằng `SELECT ... FOR UPDATE`.
4. Kiểm tra overlap booking theo date range.
5. Tạo booking trạng thái HOLD + thời gian hết giữ chỗ.
6. Cập nhật phòng sang HELD.
7. Thanh toán thành công -> CONFIRMED + phòng OCCUPIED.
8. Quá hạn giữ chỗ/không thanh toán -> EXPIRED hoặc CANCELLED.

### 6.2 Luồng pricing request
1. Manager tạo đề xuất giá.
2. Owner xem danh sách pending request.
3. Owner approve/reject.
4. Nếu áp dụng làm tăng/giảm mạnh, trigger ghi audit log.

### 6.3 Luồng feedback và đồng bộ rating
1. Customer gửi feedback vào MongoDB (document + images + metadata).
2. Job nền tính lại `average_rating`, `review_count`.
3. Đồng bộ sang PostgreSQL (`room_types`) để truy vấn lọc nhanh.

### 6.4 Luồng dashboard
- Revenue/profit: tính từ PostgreSQL (SUM/GROUP BY/window function).
- Behavior/conversion: tổng hợp từ MongoDB `activity_logs`.
- Dashboard owner hiển thị tổng hệ thống + so sánh chi nhánh.

## 7. Data distribution (polyglot)
### 7.1 PostgreSQL
Dùng cho dữ liệu giao dịch và dữ liệu cần ACID:
- users, user_profiles
- branches, branch_images
- room_types, room_type_images
- rooms, room_images
- services, service_images
- bookings, booking_services
- payments
- pricing_seasons, room_rate_change_audit

### 7.2 MongoDB
Dùng cho dữ liệu linh hoạt, ghi nhiều, phân tích nhanh:
- `sessions`: session login (TTL index)
- `verification_tokens`: token xác thực email (TTL index)
- `feedbacks`: feedback dạng document, nhiều ảnh, phản hồi lồng
- `activity_logs`: log hành vi tìm kiếm/xem/đặt
- `room_cache` / `hotel_catalogs`: cache catalog phục vụ search nhanh

### 7.3 Cross-DB mapping
- Liên kết logic qua ID (`user_id`, `booking_id`, `room_id`, `branch_id`).
- Không dùng foreign key vật lý giữa Postgres và Mongo.

## 8. Khung schema PostgreSQL (bảng và thuộc tính)

## 8.1 ENUM
- `user_role`: CUSTOMER, STAFF, MANAGER, OWNER
- `room_status`: AVAILABLE, HELD, OCCUPIED, MAINTENANCE
- `booking_status`: HOLD, PENDING_PAYMENT, CONFIRMED, CANCELLED, EXPIRED
- `payment_status`: INITIATED, PENDING, SUCCESS, FAILED, REFUNDED
- `service_mode`: PREBOOK, ON_SITE, BOTH

## 8.2 Bảng lõi
### users
- `id` UUID PK
- `email` varchar(255) unique not null
- `password_hash` varchar(255) not null
- `role` user_role not null
- `is_active` boolean
- `email_verified` boolean
- `created_at`, `updated_at` timestamptz

### user_profiles
- `user_id` UUID PK/FK -> users.id
- `full_name`, `phone`, `avatar_url`, `address`, `preferred_language`
- `created_at`, `updated_at`

### branches
- `id` UUID PK
- `parent_branch_id` UUID FK tự tham chiếu
- `code` unique, `name`, `country`, `city`, `address`, `phone`, `email`, `timezone`
- `is_active`, `created_at`, `updated_at`

### branch_images
- `id` UUID PK
- `branch_id` UUID FK
- `image_url`, `alt_text`, `is_cover`, `sort_order`, `created_at`, `updated_at`

### room_types
- `id` UUID PK
- `branch_id` UUID FK
- `code`, `name`, `slug`, `description`
- `base_price` numeric(12,2)
- `capacity` int
- `bed_type`
- `amenities` jsonb
- `average_rating` numeric(3,2)
- `review_count` int
- `revenue_cached` numeric(14,2)
- `is_featured`, `is_active`
- `created_at`, `updated_at`

### room_type_images
- `id` UUID PK
- `room_type_id` UUID FK
- `image_url`, `alt_text`, `is_cover`, `sort_order`, `created_at`, `updated_at`

### rooms
- `id` UUID PK
- `room_type_id` UUID FK
- `room_number`, `floor`
- `status` room_status
- `rate` numeric(12,2)
- `max_occupancy` int
- `current_booking_id` UUID FK -> bookings.id
- `notes`, `created_at`, `updated_at`

### room_images
- `id` UUID PK
- `room_id` UUID FK
- `image_url`, `alt_text`, `is_cover`, `sort_order`, `created_at`, `updated_at`

### services
- `id` UUID PK
- `branch_id` UUID FK
- `code`, `name`, `description`, `thumbnail_url`
- `price` numeric(12,2)
- `service_mode` enum
- `is_active`, `created_at`, `updated_at`

### service_images
- `id` UUID PK
- `service_id` UUID FK
- `image_url`, `alt_text`, `is_cover`, `sort_order`, `created_at`, `updated_at`

### bookings
- `id` UUID PK
- `customer_id` UUID FK -> users.id
- `room_id` UUID FK -> rooms.id
- `branch_id` UUID FK -> branches.id
- `check_in_date`, `check_out_date`
- `adults`, `children`
- `total_price`
- `status` booking_status
- `hold_expires_at`, `payment_due_at`
- `source_channel`
- `cancel_reason`, `confirmed_at`, `cancelled_at`
- `created_at`, `updated_at`

### booking_services
- `id` UUID PK
- `booking_id` UUID FK -> bookings.id
- `service_id` UUID FK -> services.id
- `quantity`, `actual_price`, `created_at`, `updated_at`

### payments
- `id` UUID PK
- `booking_id` UUID unique FK -> bookings.id
- `provider`, `transaction_ref`, `amount`, `currency`
- `status` payment_status
- `paid_at`, `raw_payload` jsonb
- `created_at`, `updated_at`

### pricing_seasons
- `id` UUID PK
- `branch_id` UUID FK
- `name`, `starts_on`, `ends_on`, `discount_percent`, `notes`
- `is_active`, `created_at`, `updated_at`

### room_rate_change_audit
- `id` bigserial PK
- `room_id` UUID FK
- `old_rate`, `new_rate`, `change_percent`
- `changed_by`, `note`, `changed_at`

## 8.3 Constraints và index trọng yếu
- Unique active booking per room:
  - `ux_active_booking_per_room` với status in (HOLD, PENDING_PAYMENT, CONFIRMED).
- Index tìm kiếm chính:
  - branches(country, city)
  - room_types(branch_id, is_active)
  - room_types amenities GIN
  - rooms(room_type_id, status)
  - bookings(room_id, status, check_in_date, check_out_date)
  - bookings(customer_id, created_at desc)

## 9. Views, functions, trigger cần có
### 9.1 Views chính
- `v_branch_tree`
- `v_branch_cover_image`
- `v_public_room_showcase`
- `v_room_showcase`
- `v_service_showcase`
- `v_room_type_profit_ranked`
- `v_top_room_types_by_profit`
- `v_room_revenue_by_quarter`
- `v_top_3_revenue_rooms_per_branch_quarter`
- `v_branch_dashboard_summary`

### 9.2 Functions/Trigger
- `fn_touch_updated_at` + trigger cập nhật `updated_at` tự động.
- `fn_audit_room_rate_change`:
  - Audit khi thay đổi giá phòng > 50%.
- `fn_hold_room_booking`:
  - Lock phòng + check overlap + tạo HOLD.
- `fn_confirm_room_booking`:
  - Xác nhận booking + cập nhật payment/room status.

## 10. Khung document MongoDB
### sessions
```json
{
  "_id": "...",
  "user_id": "uuid",
  "ip": "1.2.3.4",
  "device_info": {"os": "Windows", "browser": "Chrome"},
  "expires_at": "ISODate"
}
```

### verification_tokens
```json
{
  "_id": "...",
  "token_hash": "...",
  "email": "user@mail.com",
  "type": "EMAIL_VERIFY",
  "expires_at": "ISODate"
}
```

### feedbacks
```json
{
  "_id": "...",
  "booking_id": "uuid",
  "user_id": "uuid",
  "room_id": "uuid",
  "rating": 5,
  "content": "...",
  "images": ["url1", "url2"],
  "manager_reply": {
    "manager_id": "uuid",
    "content": "...",
    "replied_at": "ISODate"
  },
  "metadata": {
    "sentiment": "positive",
    "source": "web"
  },
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### activity_logs
```json
{
  "_id": "...",
  "user_id": "uuid",
  "action": "SEARCH|VIEW|BOOK|PAY",
  "target_type": "ROOM|BOOKING|PAYMENT",
  "target_id": "uuid",
  "details": {"filters": {"city": "Da Nang", "rating": 5}},
  "timestamp": "ISODate"
}
```

## 11. Docker Compose chuẩn
```yaml
version: "3.9"
services:
  postgres:
    image: postgres:15
    container_name: hotel_postgres
    restart: always
    environment:
      POSTGRES_DB: hotel
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: 123456
    volumes:
      - pg_data:/var/lib/postgresql/data

  mongo:
    image: mongo:6
    container_name: hotel_mongo
    restart: always
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    container_name: hotel_backend
    depends_on:
      - postgres
      - mongo
    environment:
      DB_HOST: postgres
      MONGO_HOST: mongo
    ports:
      - "8080:8080"

  frontend:
    build: ./frontend
    container_name: hotel_frontend
    ports:
      - "3000:3000"

volumes:
  pg_data:
  mongo_data:
```

## 12. Checklist bàn giao/nộp đồ án
- Có ERD + architecture diagram.
- Có tài liệu API theo role.
- Có migration V1..V4 chạy được trên PostgreSQL.
- Có seed data demo luồng đầy đủ.
- Có collection JSON cho MongoDB + index TTL.
- Có chứng minh chống double booking bằng transaction + lock.
- Có trigger audit thay đổi giá > 50%.
- Có query window function xếp hạng doanh thu theo chi nhánh/quý.
- Có dashboard owner so sánh nhiều chi nhánh.
- Có docker compose chạy end-to-end.
- Đề xuất loại phòng nổi bật theo profit.
- Có xử lý phản hồi feedback và đồng bộ rating.
- Có báo cáo doanh thu theo phòng/chi nhánh/quý.
- Có báo cáo hành vi tìm kiếm/xem/đặt để đưa ra gợi ý người dùng.
- Xây dựng API chuẩn RESTful, có phân quyền rõ ràng.
- Xây dựng chatbot hỗ trợ khách hàng realtime (nếu có thời gian).
- Có test case cho các luồng chính (booking, pricing request, feedback).
- Có logging chi tiết cho các hành động quan trọng (booking, payment, pricing change).
- Có xử lý lỗi toàn cục và trả về response chuẩn.
## 13. Ghi chú chốt
- Đây là bản master spec hợp nhất từ các file phân tích (1,2,3) và đã chuẩn hóa theo kiến trúc triển khai thực tế của hệ thống.
- Khi code, ưu tiên bám theo tài liệu này để tránh lệch giữa frontend, backend và database.
