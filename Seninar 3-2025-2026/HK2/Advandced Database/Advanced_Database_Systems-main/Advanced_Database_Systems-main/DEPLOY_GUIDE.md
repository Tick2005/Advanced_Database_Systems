# 🚀 HƯỚNG DẪN DEPLOY LÊN ELASTIC BEANSTALK

## Domain của bạn
```
http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com/
```

## 📋 YÊU CẦU TRƯỚC DEPLOY

### Cần chuẩn bị trước:
1. **AWS Account** với quyền truy cập
2. **AWS CLI** đã cài đặt và cấu hình
3. **Docker Desktop** (để build image locally)
4. **EB CLI** đã cài đặt
5. **Git** (để quản lý code)

### Cài đặt tools:
```powershell
# Cài AWS CLI
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Cài EB CLI
pip install awsebcli --upgrade --user

# Cài Docker Desktop
# https://www.docker.com/products/docker-desktop

# Cài Git
# https://git-scm.com/download/win
```

---

## 🔧 BƯỚC 1: CÀI ĐẶT VÀ KHỞI TẠO EB

### 1.1 Cấu hình AWS CLI
```powershell
aws configure
# Nhập:
# AWS Access Key ID: [YOUR_KEY]
# AWS Secret Access Key: [YOUR_SECRET]
# Default region: ap-southeast-1
# Default output format: json
```

### 1.2 Khởi tạo Elastic Beanstalk
```powershell
cd d:\Seninar 3-2025-2026\HK2\Advandced Database\Advanced_Database_Systems-main\Advanced_Database_Systems-main

# Khởi tạo EB
eb init -p docker hotel-backend --region ap-southeast-1

# Hoặc nếu environment đã tồn tại
eb init -p docker hotel-backend --region ap-southeast-1 -e luxstayhotel-origin-env
```

---

## 📦 BƯỚC 2: CÀI ĐẶT CƠ SỞ DỮ LIỆU

### 2.1 Tạo RDS (PostgreSQL)
```powershell
# Tạo DB instance trong AWS Console hoặc CLI
aws rds create-db-instance \
  --db-instance-identifier hotel-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password "YOUR_STRONG_PASSWORD" \
  --allocated-storage 20 \
  --region ap-southeast-1 \
  --db-name hotel \
  --publicly-accessible false

# Lưu lại endpoint RDS (cần cho Dockerrun.aws.json)
```

### 2.2 Tạo DocumentDB (MongoDB)
```powershell
# Tạo DocumentDB cluster (MongoDB-compatible)
aws docdb create-db-cluster \
  --db-cluster-identifier hotel-mongodb \
  --engine docdb \
  --master-username admin \
  --master-user-password "YOUR_STRONG_PASSWORD" \
  --region ap-southeast-1

# Tạo DB instance trong cluster
aws docdb create-db-instance \
  --db-instance-identifier hotel-mongodb-instance \
  --db-instance-class db.t3.small \
  --engine docdb \
  --db-cluster-identifier hotel-mongodb \
  --region ap-southeast-1
```

---

## 🐳 BƯỚC 3: CÀI ĐẶT DOCKER IMAGE VÀO ECR

### 3.1 Tạo ECR Repository
```powershell
# Tạo repository cho backend
aws ecr create-repository \
  --repository-name hotel-backend \
  --region ap-southeast-1

# Lưu lại URI (ví dụ: ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/hotel-backend)
```

### 3.2 Build Docker Image
```powershell
# Build image
docker build -t hotel-backend:latest -f Dockerfile .

# Hoặc build từ backend folder
cd backend
docker build -t hotel-backend:latest .
cd ..
```

### 3.3 Push Image lên ECR
```powershell
# Đăng nhập vào ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com

# Tag image
docker tag hotel-backend:latest ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/hotel-backend:latest

# Push image
docker push ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/hotel-backend:latest
```

---

## ⚙️ BƯỚC 4: CẤU HÌNH ENVIRONMENT VARIABLES

### 4.1 Cập nhật Dockerrun.aws.json
Thay thế các giá trị sau trong `Dockerrun.aws.json`:

```json
{
  "environment": [
    {
      "name": "DB_URL",
      "value": "jdbc:postgresql://ENDPOINT_RDS:5432/hotel"
    },
    {
      "name": "DB_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:ACCOUNT_ID:secret:hotel-db-password"
    },
    {
      "name": "MONGODB_URI",
      "value": "mongodb://admin:PASSWORD@ENDPOINT_DOCUMENTDB:27017/hotel"
    }
  ]
}
```

### 4.2 Lưu secrets trong AWS Secrets Manager
```powershell
# Lưu DB password
aws secretsmanager create-secret \
  --name hotel-db-password \
  --secret-string "YOUR_DB_PASSWORD" \
  --region ap-southeast-1

# Lưu VNPAY secret
aws secretsmanager create-secret \
  --name vnpay-hash-secret \
  --secret-string "YOUR_VNPAY_SECRET" \
  --region ap-southeast-1

# Lưu Mail password
aws secretsmanager create-secret \
  --name mail-password \
  --secret-string "YOUR_MAIL_PASSWORD" \
  --region ap-southeast-1
```

### 4.3 Cấu hình Environment trong EB Console
Hoặc sử dụng EB CLI:
```powershell
eb setenv \
  JWT_SECRET="YOUR_JWT_SECRET_KEY" \
  MAIL_HOST="smtp.gmail.com" \
  MAIL_PORT="587" \
  MAIL_USERNAME="your-email@gmail.com" \
  VNPAY_TMN_CODE="YOUR_VNPAY_CODE"
```

---

## 🚀 BƯỚC 5: DEPLOY

### 5.1 Tạo/Deploy lên EB Environment

**Cách 1: Tạo environment mới**
```powershell
eb create luxstayhotel-origin-env \
  --instance-type t3.small \
  --scale 1 \
  --region ap-southeast-1
```

**Cách 2: Deploy lên environment hiện tại**
```powershell
# Xem environment hiện tại
eb list

# Deploy
eb deploy luxstayhotel-origin-env
```

### 5.2 Kiểm tra status deployment
```powershell
# Xem status
eb status

# Xem logs
eb logs

# Xem realtime logs
eb logs -l
```

---

## 🌐 BƯỚC 6: DEPLOY FRONTEND

### 6.1 Build Frontend
```powershell
cd frontend

# Cài dependencies
npm install

# Build
npm run build

# Kết quả nằm trong folder dist/
```

### 6.2 Tùy chọn A: Serve từ Spring Boot
Sao chép build folder vào Spring Boot static folder:
```powershell
Copy-Item -Recurse frontend/dist/* backend/src/main/resources/static/
```

Sau đó rebuild backend và deploy lại

### 6.2 Tùy chọn B: Upload lên S3 + CloudFront (Static Hosting)
```powershell
# Tạo S3 bucket
aws s3 mb s3://luxstayhotel-frontend --region ap-southeast-1

# Upload build files
aws s3 sync frontend/dist/ s3://luxstayhotel-frontend/ --delete

# Cấu hình CloudFront (qua AWS Console)
```

---

## 🔐 BƯỚC 7: CONFIGURE CORS VÀ SECURITY

### 7.1 CORS Configuration
Thêm vào `application.yml`:
```yaml
app:
  cors:
    allowed-origins: http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com,https://yourdomain.com
```

### 7.2 SSL Certificate
```powershell
# Tạo certificate qua AWS Certificate Manager
aws acm request-certificate \
  --domain-name luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com \
  --region ap-southeast-1

# Hoặc dùng custom domain + update bên registrar
```

---

## ✅ BƯỚC 8: TESTING & MONITORING

### 8.1 Test Health Check
```powershell
# Kiểm tra health endpoint
curl http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com/actuator/health

# Response mong muốn:
# {"status":"UP"}
```

### 8.2 Kiểm tra Logs
```powershell
# Logs từ EB
eb logs

# Logs chi tiết
eb logs -l

# Lưu logs vào file
eb logs > logs.txt
```

### 8.3 Monitor từ CloudWatch
```powershell
# Xem metrics
aws cloudwatch list-metrics \
  --namespace AWS/ElasticBeanstalk \
  --region ap-southeast-1
```

---

## 🐛 TROUBLESHOOTING

### Vấn đề: Container không start
```powershell
# Kiểm tra Docker image
docker images

# Kiểm tra ECR
aws ecr describe-images --repository-name hotel-backend --region ap-southeast-1

# Kiểm tra logs
eb logs -l
```

### Vấn đề: Database connection failed
```powershell
# Kiểm tra RDS
aws rds describe-db-instances --db-instance-identifier hotel-postgres --region ap-southeast-1

# Kiểm tra Security Group
aws ec2 describe-security-groups --region ap-southeast-1
```

### Vấn đề: CORS errors
```powershell
# Kiểm tra CORS config trong EB
eb printenv

# Cập nhật nếu cần
eb setenv CORS_ALLOWED_ORIGINS="http://your-domain"
```

---

## 📝 CHECKLIST TRƯỚC DEPLOY

- [ ] AWS Account setup xong
- [ ] AWS CLI & EB CLI đã cài
- [ ] RDS PostgreSQL tạo xong
- [ ] DocumentDB tạo xong
- [ ] ECR Repository tạo xong
- [ ] Docker image build & push xong
- [ ] Dockerrun.aws.json cấu hình xong
- [ ] Environment variables lưu trong Secrets Manager
- [ ] Security Groups cấu hình (cho phép port 5432, 27017)
- [ ] Frontend build xong
- [ ] EB Environment khởi tạo xong

---

## 🎯 DEPLOY WORKFLOW NHANH

```powershell
# 1. Build backend
docker build -t hotel-backend:latest -f Dockerfile .

# 2. Push lên ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com
docker tag hotel-backend:latest ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/hotel-backend:latest
docker push ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/hotel-backend:latest

# 3. Deploy lên EB
eb deploy luxstayhotel-origin-env

# 4. Kiểm tra status
eb status
eb logs -l
```

---

## 📞 GHI CHÚ QUAN TRỌNG

1. **Thay thế các giá trị:**
   - `ACCOUNT_ID` = AWS Account ID của bạn
   - `YOUR_JWT_SECRET` = Tạo secret key mạnh
   - `YOUR_DB_PASSWORD` = Password database mạnh
   - `YOUR_VNPAY_SECRET` = Secret từ VNPAY

2. **Security:**
   - KHÔNG commit secrets vào Git
   - Sử dụng AWS Secrets Manager
   - Thường xuyên rotate keys

3. **Cost:**
   - RDS t3.micro ~ $10-15/month
   - DocumentDB ~ $15-20/month
   - EB t3.small ~ $20-30/month
   - Total: ~$45-65/month

4. **Scaling:**
   - Sử dụng Auto Scaling Groups
   - Load Balancer cho high traffic

---

Hãy bắt đầu từ **BƯỚC 1** và làm lần lượt. Nếu gặp lỗi, hãy kiểm tra logs và liên hệ hỗ trợ.
