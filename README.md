# LuxStay - Hotel Management System

Hệ thống quản lý khách sạn toàn diện với các tính năng booking, quản lý phòng, feedback, và thanh toán VNPay.

## 📋 Yêu Cầu Hệ Thống

### Phương Pháp 1: Docker Compose (Khuyến Nghị - Đơn Giản Nhất)
- Docker Desktop (hoặc Docker Engine) - [Tải về](https://www.docker.com/products/docker-desktop)
- Docker Compose v2.0+
- Ít nhất 4GB RAM cấp cho Docker

### Phương Pháp 2: Chạy Cục Bộ
- **Backend**: Java 21 JDK, Maven 3.9+
- **Frontend**: Node.js 18+, npm 9+
- **Databases**: 
  - PostgreSQL 16
  - MongoDB 7

---

## 🚀 Cách Chạy 1: Docker Compose (Khuyến Nghị)

### Bước 1: Cấu Hình Environment
Tạo file `.env` trong thư mục gốc (nếu chưa có):

```bash
cp .env.example .env
```

Hoặc chỉnh sửa `.env` hiện có với các giá trị:

```env
DOMAIN=localhost
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=5000

DB_URL=jdbc:postgresql://postgres:5432/hotel
DB_USERNAME=hotel
DB_PASSWORD=hotel

MONGODB_URI=mongodb://mongo:27017/hotel
MONGODB_DATABASE=hotel

JWT_SECRET=your-secret-key-here-change-in-production
```

### Bước 2: Chạy Docker Compose

```bash
docker-compose up --build
```

**Lần đầu tiên**: Quá trình sẽ:
- Xây dựng Backend (Java)
- Xây dựng Frontend (React/Vite)
- Khởi động PostgreSQL
- Khởi động MongoDB
- Chạy các migration Flyway
- Khởi động Nginx Gateway

⏳ **Thời gian chờ**: 2-5 phút lần đầu, 30-60 giây lần tiếp theo

### Bước 3: Truy Cập Ứng Dụng

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **API Docs**: http://localhost/api/swagger-ui.html (nếu được kích hoạt)

### Dừng Docker Compose

```bash
docker-compose down
```

Để xóa volumes và dữ liệu:
```bash
docker-compose down -v
```

---

## 💻 Cách Chạy 2: Chạy Cục Bộ (Cho Phát Triển)

### Bước 1: Chuẩn Bị Databases

#### PostgreSQL
```bash
# Windows (nếu đã cài PostgreSQL)
# Hoặc dùng Docker để chạy riêng PostgreSQL:
docker run --name hotel-postgres -e POSTGRES_PASSWORD=hotel -e POSTGRES_USER=hotel -p 5432:5432 postgres:16-alpine

# Tạo database
createdb -U hotel -h localhost hotel
```

#### MongoDB
```bash
# Chạy MongoDB với Docker:
docker run --name hotel-mongo -p 27017:27017 mongo:7

# Hoặc nếu đã cài sẵn MongoDB
mongod
```

### Bước 2: Cấu Hình Backend

1. **Chỉnh sửa `.env`** tại thư mục gốc:
```env
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=5000

DB_URL=jdbc:postgresql://localhost:5432/hotel
DB_USERNAME=hotel
DB_PASSWORD=hotel

MONGODB_URI=mongodb://localhost:27017/hotel
MONGODB_DATABASE=hotel

JWT_SECRET=dev-secret-key
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

2. **Chạy Backend**:
```bash
cd backend

# Build
mvn clean install

# Chạy
mvn spring-boot:run
```

Backend sẽ khởi động tại: **http://localhost:5000**

### Bước 3: Cấu Hình Frontend

1. **Chỉnh sửa file** `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT_MS=10000
```

2. **Chạy Frontend**:
```bash
cd frontend

# Cài dependencies
npm install

# Chạy development server
npm run dev
```

Frontend sẽ khởi động tại: **http://localhost:5173**

---

## 📁 Cấu Trúc Dự Án

```
project/
├── backend/                    # Spring Boot API (Java 21)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/...    # Source code
│   │   │   └── resources/
│   │   │       ├── db/         # Flyway migrations
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       └── application-prod.yml
│   │   └── test/
│   ├── pom.xml                 # Maven config
│   └── Dockerfile
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── app/
│   │   ├── components/         # React components
│   │   ├── features/           # Feature modules
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API services
│   │   └── store/              # State management
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── infra/                      # Infrastructure
│   ├── nginx-local.conf        # Local Nginx config
│   └── nginx-gateway.conf      # Production Nginx config
│
├── docker-compose.yml          # Docker Compose setup
├── .env                        # Environment variables
└── README.md                   # Documentation
```

---

## 🔧 Cấu Hình Chi Tiết

### Environment Variables (`.env`)

| Biến | Mô Tả | Ví Dụ |
|------|-------|-------|
| `SPRING_PROFILES_ACTIVE` | Profile Spring (dev/prod) | `dev` |
| `SERVER_PORT` | Cổng Backend | `5000` |
| `DB_URL` | PostgreSQL connection URL | `jdbc:postgresql://localhost:5432/hotel` |
| `DB_USERNAME` | PostgreSQL user | `hotel` |
| `DB_PASSWORD` | PostgreSQL password | `hotel` |
| `MONGODB_URI` | MongoDB connection URL | `mongodb://localhost:27017/hotel` |
| `MONGODB_DATABASE` | MongoDB database name | `hotel` |
| `JWT_SECRET` | Khóa bí mật JWT | `your-secret-key` |
| `MAIL_USERNAME` | Gmail account | `your-email@gmail.com` |
| `MAIL_PASSWORD` | Gmail app password | (cấu hình 2FA) |
| `VNPAY_TMN_CODE` | VNPay merchant ID | `LWI01GQ0` |
| `VNPAY_HASH_SECRET` | VNPay hash secret | (từ VNPay) |

### Application Profiles

- **`dev`** (Development):
  - Hibernate DDL: `validate`
  - Flyway: enabled
  - SQL formatting: enabled
  - CORS: localhost

- **`prod`** (Production):
  - Hibernate DDL: `validate`
  - Flyway: enabled
  - CORS: configured domain
  - Production optimizations

---

## 📊 Tech Stack

### Backend
- **Framework**: Spring Boot 3.3.5
- **Language**: Java 21
- **Database**: PostgreSQL 16 + MongoDB 7
- **ORM**: Hibernate/JPA
- **Migration**: Flyway
- **Security**: Spring Security + JWT
- **Build**: Maven 3.9

### Frontend
- **Framework**: React 18.3
- **Build Tool**: Vite 5.4
- **Routing**: React Router v6
- **HTTP Client**: TanStack Query (React Query)
- **Charting**: Recharts
- **Styling**: CSS + Tailwind (if configured)

### DevOps
- **Container**: Docker + Docker Compose
- **Web Server**: Nginx 1.27 Alpine
- **Payment Gateway**: VNPay
- **Email**: Gmail SMTP

---

## 🔌 API Endpoints Chính

```
POST   /api/auth/login              # Đăng nhập
POST   /api/auth/register           # Đăng ký
POST   /api/auth/verify-email       # Xác minh email
POST   /api/auth/reset-password     # Reset password

GET    /api/rooms                   # Danh sách phòng
POST   /api/bookings                # Tạo booking
GET    /api/bookings/:id            # Chi tiết booking
POST   /api/bookings/:id/payment    # Thanh toán

GET    /api/branches                # Danh sách chi nhánh
GET    /api/dashboard/stats         # Thống kê dashboard

POST   /api/feedback                # Gửi feedback
GET    /api/feedback                # Danh sách feedback
```

---

## 🐛 Troubleshooting

### Backend không kết nối PostgreSQL
```bash
# Kiểm tra kết nối
docker-compose logs postgres

# Hoặc nếu chạy cục bộ
psql -U hotel -h localhost -d hotel
```

### Frontend không kết nối Backend API
- Kiểm tra `VITE_API_BASE_URL` trong `.env`
- CORS headers trong `application.yml`
- Backend service đang chạy: `http://localhost:5000`

### Lỗi Flyway Migration
- Xóa volumes: `docker-compose down -v`
- Hoặc reset database:
  ```bash
  dropdb -U hotel hotel
  createdb -U hotel hotel
  ```

### Port đã được sử dụng
```bash
# Thay đổi port trong .env
SERVER_PORT=5001

# Hoặc tìm process đang sử dụng port
# Windows: netstat -ano | findstr :5000
# Linux/Mac: lsof -i :5000
```

---

## 📝 Database Migrations

Migrations được quản lý bởi **Flyway** tại:
```
backend/src/main/resources/db/migration/
```

Định dạng file: `V{number}__{description}.sql`

Ví dụ:
- `V1__initial_schema.sql`
- `V2__add_users_table.sql`

Flyway tự động chạy khi backend khởi động.

---

## 🔐 Security Notes

**⚠️ Trước khi deploy Production:**

1. **JWT Secret**: Thay `JWT_SECRET` bằng một key phức tạp
2. **Database Password**: Thay đổi `DB_PASSWORD`
3. **CORS**: Cập nhật `CORS_ALLOWED_ORIGINS`
4. **Mail**: Sử dụng App Password (không password thường)
5. **VNPay**: Sử dụng production credentials (không sandbox)

---

## 📚 Tài Liệu Thêm

- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [React Docs](https://react.dev)
- [Docker Docs](https://docs.docker.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [VNPay Integration](https://sandbox.vnpayment.vn)

---

## 💡 Development Tips

### Hot Reload
- **Frontend**: Vite tự động reload khi lưu file
- **Backend**: Cần restart sau khi lưu (hoặc cài Spring Dev Tools)

### Debugging
- **Backend**: Thêm breakpoints trong IDE, chạy `mvn -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=5005"`
- **Frontend**: Dùng DevTools của browser

### Database Inspection
```bash
# PostgreSQL
psql -U hotel -h localhost -d hotel
SELECT * FROM users;

# MongoDB
mongosh
use hotel
db.collections.find()
```

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra logs: `docker-compose logs -f [service]`
2. Kiểm tra `.env` có đầy đủ không
3. Xóa containers và volumes, chạy lại từ đầu
4. Kiểm tra firewall/antivirus không block ports

---

## 📄 License

MIT License - Xem file LICENSE để chi tiết
