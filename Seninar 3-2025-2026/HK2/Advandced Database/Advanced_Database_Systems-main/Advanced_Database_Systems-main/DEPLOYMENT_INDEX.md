# 📚 DEPLOYMENT DOCUMENTATION INDEX

## 📖 Overview

This folder contains **complete deployment guidance** for deploying your LuxStay Hotel project to AWS Elastic Beanstalk.

**Domain**: http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com/

---

## 📋 DOCUMENTS GUIDE

### 1. **START HERE** → [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) ⭐
   - **Best for**: Step-by-step execution
   - **Length**: Comprehensive checklist
   - **What it covers**: 
     - All 9 phases with checkbox items
     - Exact commands to run
     - Expected outcomes
     - Timeline & cost estimate
   - **Time to complete**: 1.5-2.5 hours
   - **When to use**: First-time deployment

### 2. [QUICK_DEPLOY.md](QUICK_DEPLOY.md) ⚡
   - **Best for**: Quick reference after first setup
   - **Length**: 2 pages
   - **What it covers**:
     - Installation (one-time only)
     - Prerequisites setup
     - 7 key deployment steps
     - Common issues & solutions
     - Automated script reference
   - **When to use**: Re-deployments or quick overview

### 3. [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) 🚀
   - **Best for**: Detailed explanations
   - **Length**: 5+ pages
   - **What it covers**:
     - Full explanations for each step
     - All 8 deployment phases
     - Troubleshooting section
     - Verification procedures
     - Monitoring & logging
   - **When to use**: Understanding the "why" behind steps

### 4. [NETWORKING_SECURITY.md](NETWORKING_SECURITY.md) 🔐
   - **Best for**: Security configuration
   - **Length**: 4+ pages
   - **What it covers**:
     - Security groups setup
     - RDS detailed configuration
     - DocumentDB setup
     - ECR repository
     - VPC networking
     - Secrets Manager
     - IAM roles
     - SSL/TLS certificates
     - Backup strategy
   - **When to use**: Production deployment or security concerns

### 5. [FRONTEND_DEPLOYMENT.md](FRONTEND_DEPLOYMENT.md) 🎨
   - **Best for**: Frontend deployment options
   - **Length**: 4+ pages
   - **What it covers**:
     - 4 deployment options:
       - Option 1: Serve from Spring Boot (Recommended)
       - Option 2: AWS S3 + CloudFront
       - Option 3: AWS Amplify
       - Option 4: Elastic Beanstalk Node.js
     - CORS configuration
     - API URL configuration
     - Cost comparison
   - **When to use**: When deploying frontend

---

## 🎯 QUICK START PATHS

### Path A: First-time Deployment (Recommended)
```
1. Read: DEPLOYMENT_CHECKLIST.md → Understand all phases
2. Follow: DEPLOYMENT_CHECKLIST.md → Execute each phase checkbox
3. Refer: QUICK_DEPLOY.md → For syntax of commands
4. If issues: DEPLOY_GUIDE.md → For detailed explanations
5. If frontend: FRONTEND_DEPLOYMENT.md → For frontend options
6. If security: NETWORKING_SECURITY.md → For security details
```

### Path B: Quick Re-deployment
```
1. Read: QUICK_DEPLOY.md → Refresh memory
2. Run: scripts/deploy-eb.ps1 → Automated deployment
3. Check: QUICK_DEPLOY.md → "Verify Deployment" section
```

### Path C: Production Deployment
```
1. Read: DEPLOYMENT_CHECKLIST.md → Full understanding
2. Read: NETWORKING_SECURITY.md → Security setup
3. Follow: All security recommendations
4. Deploy: Following DEPLOYMENT_CHECKLIST.md phases
5. Monitor: Using CloudWatch alarms from NETWORKING_SECURITY.md
```

### Path D: Troubleshooting Issues
```
1. Check: QUICK_DEPLOY.md → "Common Issues & Solutions"
2. Check: DEPLOY_GUIDE.md → "Troubleshooting" section
3. Check: NETWORKING_SECURITY.md → "Verification Checklist"
4. Review: Logs using: eb logs -l
```

---

## 📦 CREATED FILES

### Configuration Files (Auto-created)
```
.ebextensions/
├── 00-nginx.config          # Nginx proxy configuration
└── 01-docker.config         # Docker build configuration

Dockerrun.aws.json           # EB Docker container config
.gitignore.eb                # EB-specific git ignore
```

### Deployment Scripts
```
scripts/
└── deploy-eb.ps1            # Automated deployment script
```

### Documentation Files
```
DEPLOYMENT_CHECKLIST.md      # Step-by-step checklist (START HERE)
QUICK_DEPLOY.md              # Quick reference guide
DEPLOY_GUIDE.md              # Detailed guide
NETWORKING_SECURITY.md       # Security & networking setup
FRONTEND_DEPLOYMENT.md       # Frontend deployment options
DEPLOYMENT_INDEX.md          # This file
```

---

## 🔧 COMMAND REFERENCE

### Install Tools (One-time)
```powershell
# AWS CLI
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# EB CLI
pip install awsebcli --upgrade --user

# Configure AWS
aws configure
```

### Build & Deploy
```powershell
# Build Docker image
docker build -t hotel-backend:latest -f Dockerfile .

# Push to ECR
docker push ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/hotel-backend:latest

# Deploy to EB
eb deploy luxstayhotel-origin-env

# View logs
eb logs -l

# Check status
eb status
```

### Frontend Build
```powershell
# Build frontend
cd frontend
npm install
npm run build

# Copy to backend static folder
Copy-Item -Recurse dist/* ../backend/src/main/resources/static/
```

### Automated Deploy
```powershell
# Full deployment
.\scripts\deploy-eb.ps1 `
  -AwsAccountId "YOUR_ACCOUNT_ID" `
  -BuildImage `
  -PushImage `
  -Deploy `
  -ShowLogs
```

---

## ⏱️ TIMELINE

| Phase | Task | Duration |
|-------|------|----------|
| 0 | Prerequisites & Tools | 15-30 min |
| 1 | Create RDS & DocumentDB | 20-30 min |
| 2 | Docker Build & Push | 5-10 min |
| 3 | Secrets & Configuration | 5 min |
| 4 | EB Setup & Deploy | 15-20 min |
| 5 | Verification & Testing | 10 min |
| 6 | Frontend Deployment | 10-20 min |
| 7-9 | Monitoring & Security | 15-30 min |
| **Total** | | **1.5-2.5 hours** |

---

## 💰 ESTIMATED MONTHLY COST

| Service | Cost |
|---------|------|
| Elastic Beanstalk (t3.small) | $25-35 |
| RDS PostgreSQL (db.t3.micro) | $10-15 |
| DocumentDB (db.t3.small) | $15-20 |
| Data Transfer | $1-5 |
| **Total** | **~$51-75** |

---

## 🆘 COMMON ISSUES

| Issue | Guide | Section |
|-------|-------|---------|
| Container won't start | DEPLOY_GUIDE.md | Troubleshooting |
| Database connection failed | NETWORKING_SECURITY.md | Verification |
| CORS errors | FRONTEND_DEPLOYMENT.md | CORS Configuration |
| Deployment timeout | QUICK_DEPLOY.md | Common Issues |
| SSH into EC2 | DEPLOY_GUIDE.md | Monitoring |

---

## ✅ CHECKLIST FOR SUCCESS

Before you start:
- [ ] AWS Account created
- [ ] AWS credentials configured
- [ ] AWS CLI installed
- [ ] EB CLI installed
- [ ] Docker Desktop installed
- [ ] Node.js & npm installed (for frontend)
- [ ] Git installed
- [ ] Repository cloned locally

---

## 📞 KEY INFORMATION TO GATHER

Before starting deployment, gather:

**AWS Account**
- [ ] Account ID
- [ ] Access Key ID
- [ ] Secret Access Key
- [ ] Region: `ap-southeast-1`

**Database**
- [ ] PostgreSQL admin password (generate strong one)
- [ ] MongoDB admin password (generate strong one)

**Integrations**
- [ ] VNPAY TMN Code
- [ ] VNPAY Hash Secret
- [ ] Gmail/Mail credentials
- [ ] JWT Secret Key

**Domain**
- [ ] EB Domain: `luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com`
- [ ] Custom domain (optional)

---

## 🚀 DEPLOYMENT WORKFLOW DIAGRAM

```
┌─────────────────────────────────────────────────┐
│           1. Prerequisites Setup                 │
│       (AWS, EB CLI, Docker, Node)               │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│      2. Create Databases (RDS + DocumentDB)     │
│              Wait 20-30 minutes                  │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│    3. Create Docker Image & Push to ECR         │
│        docker build → docker push               │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│    4. Store Secrets in Secrets Manager          │
│      Configure Dockerrun.aws.json               │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  5. Deploy to Elastic Beanstalk                 │
│        eb init → eb create/deploy               │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  6. Verify Deployment                           │
│  - Health check: /actuator/health               │
│  - API test: /api endpoints                     │
│  - Logs: eb logs -l                             │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  7. Deploy Frontend                             │
│  - Build: npm run build                         │
│  - Option 1: Copy to static/ (Simple)           │
│  - Option 2: S3 + CloudFront (Scalable)         │
│  - Option 3: AWS Amplify (CI/CD)                │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  8. Monitor & Maintain                          │
│  - CloudWatch logs                              │
│  - Auto-scaling setup                           │
│  - Backup strategy                              │
└──────────────────────────────────────────────────┘
```

---

## 📚 ADDITIONAL RESOURCES

### AWS Documentation
- [Elastic Beanstalk User Guide](https://docs.aws.amazon.com/elasticbeanstalk/)
- [RDS PostgreSQL Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [DocumentDB Guide](https://docs.aws.amazon.com/documentdb/latest/developerguide/)
- [ECR Guide](https://docs.aws.amazon.com/AmazonECR/latest/userguide/)

### Spring Boot
- [Spring Boot Docker Guide](https://spring.io/guides/topicals/spring-boot-docker/)
- [Spring Boot AWS Guide](https://github.com/awslabs/aws-springboot-starter)

### React/Frontend
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [React Environment Variables](https://vitejs.dev/guide/env-and-modes.html)

---

## 🎓 LEARNING PATH

If you're new to AWS deployment:

1. **Understand the basics**
   - What is Elastic Beanstalk?
   - What is RDS?
   - What is Docker?

2. **Follow DEPLOYMENT_CHECKLIST.md**
   - Complete Phase 0 (Prerequisites)
   - Complete Phase 1 (Databases)
   - Complete Phase 2 (Docker)

3. **Deploy the backend**
   - Complete Phase 4 (EB Setup)
   - Complete Phase 5 (Verification)

4. **Deploy the frontend**
   - Read FRONTEND_DEPLOYMENT.md
   - Choose Option 1 (Simplest)
   - Complete Phase 6

5. **Monitor and maintain**
   - Read NETWORKING_SECURITY.md
   - Set up CloudWatch alarms
   - Regular log monitoring

---

## ✨ YOU'RE READY!

**Start with**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

**Then follow**: Each phase checkbox by checkbox

**Estimated time**: 1.5-2.5 hours

**Good luck!** 🚀

---

## 📝 NOTES

- Keep all secrets secure - don't commit to Git
- Use AWS Secrets Manager for sensitive data
- Monitor costs regularly
- Set up alerts for high costs
- Enable backups for databases
- Test thoroughly before going live

---

**Document Version**: 1.0  
**Last Updated**: May 4, 2026  
**Status**: Ready for Deployment
