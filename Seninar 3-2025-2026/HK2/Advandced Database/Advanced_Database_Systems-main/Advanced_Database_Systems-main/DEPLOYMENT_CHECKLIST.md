# ✅ DEPLOYMENT CHECKLIST - Step by Step

## 📋 PRE-DEPLOYMENT PHASE

### Phase 0: Prerequisites Setup (One-time only)

- [ ] Install AWS CLI v2
  - Download: https://awscli.amazonaws.com/AWSCLIV2.msi
  - Verify: `aws --version`

- [ ] Install EB CLI
  - Command: `pip install awsebcli --upgrade --user`
  - Verify: `eb --version`

- [ ] Configure AWS Credentials
  - Command: `aws configure`
  - Input AWS Access Key ID
  - Input AWS Secret Access Key
  - Region: `ap-southeast-1`
  - Format: `json`

- [ ] Verify AWS Access
  - Command: `aws sts get-caller-identity`
  - Save your **Account ID** for later

- [ ] Install Docker Desktop
  - Download: https://www.docker.com/products/docker-desktop
  - Verify: `docker --version`

- [ ] Clone/Open Repository
  - Path: `d:\Seninar 3-2025-2026\HK2\Advandced Database\Advanced_Database_Systems-main\Advanced_Database_Systems-main`

---

## 🗄️ PHASE 1: DATABASE SETUP

### Create PostgreSQL (RDS)

- [ ] Go to AWS RDS Console
- [ ] Click "Create Database"
- [ ] Select "PostgreSQL"
- [ ] Instance Details:
  - [ ] DB Instance Identifier: `hotel-postgres`
  - [ ] Master Username: `admin`
  - [ ] Master Password: (save securely - will need in env)
  - [ ] DB Name: `hotel`
  - [ ] Instance Class: `db.t3.micro`
  - [ ] Storage: `20 GB gp2`
  - [ ] Publicly Accessible: `No`
  - [ ] Multi-AZ: `No` (for dev)
  - [ ] Backup Retention: `7 days`
  - [ ] Region: `ap-southeast-1`

- [ ] After creation, note the **Endpoint** (e.g., `hotel-postgres-xxx.ap-southeast-1.rds.amazonaws.com`)

### Create MongoDB (DocumentDB)

- [ ] Go to AWS DocumentDB Console
- [ ] Create DB Cluster:
  - [ ] Cluster ID: `hotel-mongodb`
  - [ ] Master Username: `admin`
  - [ ] Master Password: (save securely)
  - [ ] Region: `ap-southeast-1`
  - [ ] Engine Version: `5.0.0` or latest
  - [ ] Storage Encrypted: `Yes`
  - [ ] Backup Retention: `7 days`

- [ ] Create DB Instance in cluster:
  - [ ] Instance Class: `db.t3.small`
  - [ ] Wait 10-15 minutes for cluster to be ready

- [ ] After creation, note the **Endpoint** (e.g., `hotel-mongodb-xxx.docdb.ap-southeast-1.amazonaws.com`)

---

## 🐳 PHASE 2: DOCKER & ECR SETUP

### Create ECR Repository

```powershell
aws ecr create-repository --repository-name hotel-backend --region ap-southeast-1
```

- [ ] Save the **ECR URI** (format: `ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/hotel-backend`)

### Build Docker Image

```powershell
cd "d:\Seninar 3-2025-2026\HK2\Advandced Database\Advanced_Database_Systems-main\Advanced_Database_Systems-main"
docker build -t hotel-backend:latest -f Dockerfile .
```

- [ ] Wait for build to complete (~3-5 minutes)
- [ ] Verify: `docker images | grep hotel-backend`

### Push to ECR

```powershell
$AccountId = "YOUR_ACCOUNT_ID"  # From Phase 0
$Region = "ap-southeast-1"

# Login
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $AccountId.dkr.ecr.$Region.amazonaws.com

# Tag
docker tag hotel-backend:latest $AccountId.dkr.ecr.$Region.amazonaws.com/hotel-backend:latest

# Push
docker push $AccountId.dkr.ecr.$Region.amazonaws.com/hotel-backend:latest
```

- [ ] Verify push in AWS ECR Console

---

## 🔐 PHASE 3: SECRETS & CONFIGURATION

### Store Secrets in AWS Secrets Manager

```powershell
# Database password
aws secretsmanager create-secret `
  --name hotel-db-password `
  --secret-string "YOUR_RDS_PASSWORD" `
  --region ap-southeast-1

# VNPAY secret
aws secretsmanager create-secret `
  --name vnpay-hash-secret `
  --secret-string "YOUR_VNPAY_SECRET" `
  --region ap-southeast-1

# Mail password
aws secretsmanager create-secret `
  --name mail-password `
  --secret-string "YOUR_MAIL_PASSWORD" `
  --region ap-southeast-1

# JWT secret
aws secretsmanager create-secret `
  --name hotel-jwt-secret `
  --secret-string "YOUR_JWT_SECRET_KEY" `
  --region ap-southeast-1
```

- [ ] Verify secrets in AWS Secrets Manager Console

### Update Configuration Files

- [ ] Open `Dockerrun.aws.json`
- [ ] Replace:
  - [ ] `ACCOUNT_ID` → Your AWS Account ID
  - [ ] `REGION` → `ap-southeast-1`
  - [ ] `YOUR_RDS_ENDPOINT` → RDS endpoint from Phase 1
  - [ ] `YOUR_DOCUMENTDB_ENDPOINT` → DocumentDB endpoint from Phase 1

- [ ] Save file

---

## 🚀 PHASE 4: ELASTIC BEANSTALK SETUP

### Initialize EB (First time only)

```powershell
cd "d:\Seninar 3-2025-2026\HK2\Advandced Database\Advanced_Database_Systems-main\Advanced_Database_Systems-main"
eb init -p docker hotel-backend --region ap-southeast-1
```

- [ ] Confirm default application name: `hotel-backend`
- [ ] Confirm default environment name: (press Enter)

### Option A: Create New EB Environment

```powershell
eb create luxstayhotel-origin-env `
  --instance-type t3.small `
  --scale 1 `
  --region ap-southeast-1
```

- [ ] Wait for environment creation (~10-15 minutes)
- [ ] Confirm "Environment successfully created"

### Option B: Deploy to Existing Environment

```powershell
eb deploy luxstayhotel-origin-env
```

- [ ] Wait for deployment (~5-10 minutes)

### Set Environment Variables

```powershell
eb setenv `
  SPRING_PROFILES_ACTIVE=prod `
  JWT_SECRET="YOUR_JWT_SECRET_KEY" `
  MAIL_HOST="smtp.gmail.com" `
  MAIL_PORT="587" `
  MAIL_USERNAME="your-email@gmail.com" `
  VNPAY_TMN_CODE="YOUR_VNPAY_CODE"
```

- [ ] Wait for environment update

---

## ✅ PHASE 5: VERIFICATION & TESTING

### Check Deployment Status

```powershell
eb status
```

- [ ] Status should be: "Ready"
- [ ] Environment Name: `luxstayhotel-origin-env`

### View Logs

```powershell
eb logs
```

- [ ] Check for any ERROR messages
- [ ] Should see application startup logs

### Test Health Endpoint

```powershell
curl http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com/actuator/health
```

- [ ] Response should be: `{"status":"UP"}`

### Test API Endpoints

```powershell
# Test Swagger/OpenAPI
curl http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com/swagger-ui.html

# Test specific endpoint (replace with actual endpoint)
curl http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com/api/hotels
```

- [ ] Verify API responses are working
- [ ] No CORS errors in browser console

---

## 🎨 PHASE 6: FRONTEND DEPLOYMENT (Choose One)

### Option 1: Serve from Spring Boot (Recommended - Simplest)

```powershell
# Build frontend
cd frontend
npm install
npm run build

# Copy to backend static folder
Copy-Item -Recurse dist/* ..\backend\src\main\resources\static\

# Rebuild backend
cd ..
docker build -t hotel-backend:latest -f Dockerfile .

# Push to ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com
docker tag hotel-backend:latest ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/hotel-backend:latest
docker push ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/hotel-backend:latest

# Deploy
eb deploy luxstayhotel-origin-env
```

- [ ] Build completed without errors
- [ ] Frontend served from backend
- [ ] Test: http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com/

### Option 2: AWS S3 + CloudFront

See **FRONTEND_DEPLOYMENT.md** - Option 2

- [ ] S3 bucket created
- [ ] Frontend uploaded to S3
- [ ] CloudFront distribution created
- [ ] CORS configured on backend

### Option 3: AWS Amplify

See **FRONTEND_DEPLOYMENT.md** - Option 3

- [ ] GitHub repository connected
- [ ] Amplify deployment configured
- [ ] Auto-deploy on Git push enabled

---

## 📊 PHASE 7: MONITORING & MONITORING (Optional but Recommended)

### CloudWatch Setup

```powershell
# Create log group
aws logs create-log-group --log-group-name "/aws/elasticbeanstalk/hotel-backend" --region ap-southeast-1

# Set retention
aws logs put-retention-policy --log-group-name "/aws/elasticbeanstalk/hotel-backend" --retention-in-days 30 --region ap-southeast-1
```

- [ ] Log group created

### View Application Logs

```powershell
# Real-time logs
eb logs -l

# Or save to file
eb logs > deployment.log
```

- [ ] Review logs for errors
- [ ] Confirm no memory leaks or crashes

### CloudWatch Alarms (Optional)

```powershell
# High CPU alarm
aws cloudwatch put-metric-alarm `
  --alarm-name hotel-backend-high-cpu `
  --alarm-description "Alert when CPU > 80%" `
  --metric-name CPUUtilization `
  --namespace AWS/ElasticBeanstalk `
  --statistic Average `
  --period 300 `
  --threshold 80 `
  --comparison-operator GreaterThanThreshold
```

- [ ] Alarm created (optional)

---

## 🔒 PHASE 8: SECURITY (Optional but Recommended)

### SSL/TLS Certificate

- [ ] Go to AWS Certificate Manager
- [ ] Request certificate for your domain
- [ ] Add to EB Load Balancer (if using custom domain)

- [ ] SSL certificate requested or assigned

### Security Groups

- [ ] EB Security Group allows port 80, 443
- [ ] RDS Security Group allows port 5432 from EB
- [ ] DocumentDB Security Group allows port 27017 from EB

---

## 📱 PHASE 9: TESTING & VALIDATION

### Functional Testing

- [ ] Frontend loads without errors
- [ ] Login/authentication works
- [ ] Create/read/update/delete operations work
- [ ] Payment integration (VNPAY) works
- [ ] Email notifications work
- [ ] Database queries work

### Performance Testing

```powershell
# Load testing (optional)
# Use tools like: Apache JMeter, Locust, or k6
```

- [ ] Response time acceptable (< 2 seconds)
- [ ] No timeouts
- [ ] Memory usage stable

### Security Testing

- [ ] No sensitive data in logs
- [ ] CORS correctly configured
- [ ] JWT tokens working
- [ ] Database credentials not exposed

---

## 🎯 FINAL CHECKLIST

- [ ] Domain accessible: http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com/
- [ ] Health check: `/actuator/health` returns `UP`
- [ ] API working: Test at least 3 endpoints
- [ ] Frontend loads: No JavaScript errors
- [ ] Database connection: Data persisted correctly
- [ ] Logs clean: No ERROR level messages
- [ ] Auto-scaling: Configured (optional)
- [ ] Backups: Enabled for RDS and DocumentDB

---

## 🚨 TROUBLESHOOTING DURING DEPLOYMENT

### Issue: Container won't start
```powershell
# View detailed logs
eb logs -l

# Look for:
# - Java errors
# - Database connection issues
# - Out of memory errors
```

### Issue: Database connection failed
```powershell
# Check RDS status
aws rds describe-db-instances --db-instance-identifier hotel-postgres --region ap-southeast-1

# Check security groups
aws ec2 describe-security-groups --region ap-southeast-1
```

### Issue: CORS errors
```powershell
# Update CORS settings
eb setenv CORS_ALLOWED_ORIGINS="http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com"

# Rebuild and deploy
eb deploy luxstayhotel-origin-env
```

### Issue: Deployment timeout
```powershell
# Abort current deployment
eb abort

# Try again
eb deploy luxstayhotel-origin-env
```

---

## 📞 IMPORTANT REFERENCES

- Full Guide: [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)
- Quick Start: [QUICK_DEPLOY.md](QUICK_DEPLOY.md)
- Networking: [NETWORKING_SECURITY.md](NETWORKING_SECURITY.md)
- Frontend: [FRONTEND_DEPLOYMENT.md](FRONTEND_DEPLOYMENT.md)

---

## ⏱️ ESTIMATED TIMELINE

- Phase 0 (Prerequisites): 15-30 minutes
- Phase 1 (Databases): 20-30 minutes (wait time)
- Phase 2 (Docker): 5-10 minutes
- Phase 3 (Secrets): 5 minutes
- Phase 4 (EB Setup): 15-20 minutes (wait time)
- Phase 5 (Verification): 10 minutes
- Phase 6 (Frontend): 10-20 minutes
- Phase 7-9 (Monitoring & Testing): 15-30 minutes

**Total: ~1.5-2.5 hours** (including wait times)

---

## 💰 COST ESTIMATE (Monthly)

| Service | Cost |
|---------|------|
| EB (t3.small) | $25-35 |
| RDS (db.t3.micro) | $10-15 |
| DocumentDB (db.t3.small) | $15-20 |
| Data Transfer | $1-5 |
| **Total** | **~$51-75** |

---

## ✨ NEXT STEPS AFTER DEPLOYMENT

1. **Monitor Logs**: `eb logs -l` (ongoing)
2. **Set Up Auto-Scaling**: For high traffic
3. **Add Custom Domain**: Point DNS to EB domain
4. **SSL/TLS**: Set up HTTPS
5. **Database Backups**: Enable automated backups
6. **Performance Optimization**: Monitor and optimize
7. **CI/CD Pipeline**: Set up automated deployments

---

**You're ready to deploy! Start with Phase 0 and follow each phase in order.**

**Good luck! 🚀**
