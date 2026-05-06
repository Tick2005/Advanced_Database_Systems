# 🚀 QUICK START DEPLOY TO ELASTIC BEANSTALK

## Environment Info
- **Domain**: http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com/
- **Region**: ap-southeast-1 (Singapore)
- **Stack**: Java 21 + Spring Boot + React + PostgreSQL + MongoDB

---

## 📋 INSTALLATION (Only first time)

```powershell
# 1. Install AWS CLI v2
# Download: https://awscli.amazonaws.com/AWSCLIV2.msi

# 2. Install EB CLI
pip install awsebcli --upgrade --user

# 3. Configure AWS credentials
aws configure
# Enter your AWS Access Key ID and Secret Access Key

# 4. Verify installation
aws --version
eb --version
```

---

## 🔑 PREREQUISITES SETUP

### Get your AWS Account ID
```powershell
aws sts get-caller-identity
# Copy the "Account" value
```

### Setup Environment Variables
```powershell
# Copy this and save for later use
$AccountId = "YOUR_AWS_ACCOUNT_ID"  # Get from above
$Region = "ap-southeast-1"
```

### Create Databases

**PostgreSQL (RDS)**:
- Go to AWS RDS Console
- Create DB Instance (PostgreSQL 15.x)
- Instance ID: `hotel-postgres`
- Master username: `admin`
- Master password: Save securely
- Publicly Accessible: No
- Note the endpoint: `hotel-postgres-xxx.ap-southeast-1.rds.amazonaws.com`

**MongoDB (DocumentDB)**:
- Go to AWS DocumentDB Console
- Create Cluster
- Cluster ID: `hotel-mongodb`
- Master username: `admin`
- Master password: Save securely
- Note the endpoint: `hotel-mongodb-xxx.docdb.ap-southeast-1.amazonaws.com`

---

## 📦 DEPLOYMENT STEPS

### Step 1: Create ECR Repository
```powershell
aws ecr create-repository `
  --repository-name hotel-backend `
  --region ap-southeast-1
```

### Step 2: Build Docker Image
```powershell
cd "d:\Seninar 3-2025-2026\HK2\Advandced Database\Advanced_Database_Systems-main\Advanced_Database_Systems-main"

docker build -t hotel-backend:latest -f Dockerfile .
```

### Step 3: Push to ECR
```powershell
$AccountId = "YOUR_ACCOUNT_ID"

# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | `
  docker login --username AWS --password-stdin $AccountId.dkr.ecr.ap-southeast-1.amazonaws.com

# Tag & Push
docker tag hotel-backend:latest `
  $AccountId.dkr.ecr.ap-southeast-1.amazonaws.com/hotel-backend:latest

docker push $AccountId.dkr.ecr.ap-southeast-1.amazonaws.com/hotel-backend:latest
```

### Step 4: Configure Dockerrun.aws.json
Edit `Dockerrun.aws.json` and replace:
- `ACCOUNT_ID` → Your AWS Account ID
- `REGION` → ap-southeast-1
- `YOUR_RDS_ENDPOINT` → From RDS (e.g., hotel-postgres-xxx.ap-southeast-1.rds.amazonaws.com:5432)
- `YOUR_DOCUMENTDB_ENDPOINT` → From DocumentDB
- Database credentials in Secrets Manager

### Step 5: Store Secrets
```powershell
# Store database password
aws secretsmanager create-secret `
  --name hotel-db-password `
  --secret-string "YOUR_DB_PASSWORD" `
  --region ap-southeast-1

# Store VNPAY secret
aws secretsmanager create-secret `
  --name vnpay-hash-secret `
  --secret-string "YOUR_VNPAY_SECRET" `
  --region ap-southeast-1

# Store mail password
aws secretsmanager create-secret `
  --name mail-password `
  --secret-string "YOUR_MAIL_PASSWORD" `
  --region ap-southeast-1
```

### Step 6: Deploy to EB
```powershell
# Initialize EB (first time only)
eb init -p docker hotel-backend --region ap-southeast-1

# Deploy to existing environment
eb deploy luxstayhotel-origin-env

# Or create new environment
eb create luxstayhotel-origin-env --instance-type t3.small
```

### Step 7: Verify Deployment
```powershell
# Check status
eb status

# View logs
eb logs

# Test health
curl http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com/actuator/health

# Should return: {"status":"UP"}
```

---

## 🔧 AUTOMATED DEPLOY SCRIPT

After first-time setup, use the automated script:

```powershell
# Full deployment with build, push, and deploy
.\scripts\deploy-eb.ps1 `
  -AwsAccountId "YOUR_ACCOUNT_ID" `
  -AwsRegion "ap-southeast-1" `
  -EbEnvName "luxstayhotel-origin-env" `
  -BuildImage `
  -PushImage `
  -Deploy `
  -ShowLogs
```

---

## 🐛 COMMON ISSUES & SOLUTIONS

| Issue | Solution |
|-------|----------|
| Container won't start | Check `eb logs -l` for errors |
| Database connection failed | Verify RDS/DocumentDB security groups allow EC2 |
| CORS errors | Update `CORS_ALLOWED_ORIGINS` env var |
| Out of memory | Increase instance type (t3.small → t3.medium) |
| Deployment timeout | Use `eb abort` and retry |

---

## 📊 MONITORING

```powershell
# Real-time logs
eb logs -l

# Save logs to file
eb logs > deployment.log

# View environment info
eb info

# SSH into EC2 (if needed)
eb ssh
```

---

## 🗑️ CLEANUP (When done or testing)

```powershell
# Terminate EB environment
eb terminate luxstayhotel-origin-env

# Delete ECR repository
aws ecr delete-repository --repository-name hotel-backend --force --region ap-southeast-1

# Delete databases (RDS & DocumentDB) from AWS Console

# Clean up Docker images
docker rmi hotel-backend:latest
```

---

## 📝 IMPORTANT NOTES

1. **First deployment takes ~5-10 minutes**
2. **Keep your AWS credentials secure** - Never commit to Git
3. **Use Secrets Manager** - Not environment variables for sensitive data
4. **Monitor costs** - t3.small ≈ $25/month + databases
5. **Set up auto-scaling** - For production traffic
6. **Enable backups** - For RDS and DocumentDB

---

## 🎯 NEXT STEPS

1. ✅ Complete Prerequisites Setup
2. ✅ Run Deployment Steps 1-7
3. ✅ Test health endpoint
4. ✅ Test API endpoints
5. ✅ Deploy frontend
6. ✅ Setup monitoring & logs
7. ✅ Configure domain/SSL (optional)

---

**Need help?** Check the full guide in `DEPLOY_GUIDE.md`
