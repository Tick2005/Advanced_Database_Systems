# 🎨 FRONTEND DEPLOYMENT OPTIONS

## Overview

Your frontend is built with **React + Vite**. You have several options to deploy it:

---

## Option 1: Serve from Spring Boot (Simplest)

### Advantages:
- ✅ Single deployment
- ✅ No CORS issues
- ✅ Single domain
- ✅ Easier to manage

### Disadvantages:
- ❌ Backend serves static files (uses memory)
- ❌ Can't scale frontend independently

### Steps:

#### 1.1 Build Frontend
```powershell
cd frontend
npm install
npm run build
# Generates: frontend/dist/
```

#### 1.2 Copy to Backend Static Folder
```powershell
# Create static folder if doesn't exist
New-Item -ItemType Directory -Path backend/src/main/resources/static -Force

# Copy frontend build
Copy-Item -Recurse frontend/dist/* backend/src/main/resources/static/
```

#### 1.3 Configure Spring Boot
In `backend/src/main/resources/application.yml`:
```yaml
spring:
  web:
    resources:
      static-locations: classpath:/static/
```

#### 1.4 Rebuild Backend & Deploy
```powershell
# Rebuild Docker image
docker build -t hotel-backend:latest -f Dockerfile .

# Push to ECR
docker push $AccountId.dkr.ecr.ap-southeast-1.amazonaws.com/hotel-backend:latest

# Deploy to EB
eb deploy luxstayhotel-origin-env
```

#### 1.5 Verify
```powershell
# Test frontend
curl http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com/

# Should return HTML (not JSON)
```

---

## Option 2: AWS S3 + CloudFront (Recommended for Scale)

### Advantages:
- ✅ Independent scaling
- ✅ Global CDN (CloudFront)
- ✅ Better performance
- ✅ Cost-effective for static content

### Disadvantages:
- ❌ Requires CDN setup
- ❌ CORS configuration needed
- ❌ More complex setup

### Steps:

#### 2.1 Create S3 Bucket
```powershell
$bucketName = "luxstayhotel-frontend"

aws s3 mb s3://$bucketName --region ap-southeast-1
```

#### 2.2 Enable Static Hosting
```powershell
$hostingConfig = @{
    IndexDocument = @{
        Suffix = "index.html"
    }
    ErrorDocument = @{
        Key = "index.html"
    }
} | ConvertTo-Json

aws s3api put-bucket-website `
  --bucket $bucketName `
  --website-configuration $hostingConfig
```

#### 2.3 Block Public Access
```powershell
aws s3api put-public-access-block `
  --bucket $bucketName `
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false
```

#### 2.4 Create Bucket Policy
```powershell
$bucketPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "CloudFrontAccess"
            Effect = "Allow"
            Principal = @{
                Service = "cloudfront.amazonaws.com"
            }
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$bucketName/*"
            Condition = @{
                StringEquals = @{
                    "AWS:SourceArn" = "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
                }
            }
        }
    )
} | ConvertTo-Json -Depth 10

# Update after creating CloudFront distribution
```

#### 2.5 Build Frontend
```powershell
cd frontend
npm install
npm run build

# Create .env file for API URL
# VITE_API_URL=http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com
```

#### 2.6 Upload to S3
```powershell
aws s3 sync frontend/dist/ s3://$bucketName/ `
  --delete `
  --cache-control "max-age=3600" `
  --exclude ".git*" `
  --exclude "*.map"

# Cache index.html without caching
aws s3 cp frontend/dist/index.html s3://$bucketName/index.html `
  --cache-control "max-age=0, no-cache, no-store, must-revalidate" `
  --content-type "text/html"
```

#### 2.7 Create CloudFront Distribution
```powershell
$distributionConfig = @{
    CallerReference = (New-Guid).ToString()
    DefaultRootObject = "index.html"
    Comment = "Distribution for LuxStay Hotel Frontend"
    DefaultCacheBehavior = @{
        TargetOriginId = "S3Origin"
        ViewerProtocolPolicy = "allow-all"
        AllowedMethods = @{
            Quantity = 2
            Items = @("GET", "HEAD")
        }
        CachePolicyId = "658327ea-f89d-4fab-a63d-7e88639e58f6"  # Managed-CachingOptimized
        OriginRequestPolicyId = "216adef5-5c7f-47e4-b989-5492eafa07d3"  # Managed-CORS-S3Origin
    }
    Origins = @{
        Quantity = 1
        Items = @(
            @{
                Id = "S3Origin"
                DomainName = "$bucketName.s3.$region.amazonaws.com"
                S3OriginConfig = @{
                    OriginAccessIdentity = ""
                }
            }
        )
    }
    Enabled = $true
    ErrorCachingMinTTL = 300
    DefaultCacheBehavior = @{
        PathPattern = "/*"
        ViewerProtocolPolicy = "allow-all"
        TargetOriginId = "S3Origin"
    }
} | ConvertTo-Json -Depth 10

aws cloudfront create-distribution `
  --distribution-config $distributionConfig `
  --region ap-southeast-1
```

#### 2.8 Update API URL in Frontend
Update `frontend/src/services/api.js`:
```javascript
// Use CloudFront or direct EB URL
const API_BASE = process.env.VITE_API_URL || 
  'http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com'
```

#### 2.9 Verify
```powershell
# Get CloudFront URL from distribution
aws cloudfront list-distributions --region ap-southeast-1

# Test
curl https://d-xxxx.cloudfront.net/
```

---

## Option 3: AWS Amplify (Best for continuous deployment)

### Advantages:
- ✅ Auto CI/CD from Git
- ✅ Preview deployments
- ✅ Easy rollback
- ✅ Built-in custom domain

### Disadvantages:
- ❌ Requires Git repository
- ❌ Slightly more expensive
- ❌ Build time ~5-10 minutes

### Steps:

#### 3.1 Connect GitHub to Amplify
1. Go to AWS Amplify Console
2. Click "Connect to repo"
3. Select GitHub & authorize
4. Select your repository

#### 3.2 Configure Build Settings
```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - echo "Building frontend only"
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### 3.3 Set Environment Variables
In Amplify Console:
```
VITE_API_URL=http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com
```

#### 3.4 Deploy
Amplify auto-deploys on Git push

---

## Option 4: AWS Elastic Beanstalk (Node.js)

### Advantages:
- ✅ Single environment for everything
- ✅ Easy environment variables
- ✅ Scaling built-in

### Disadvantages:
- ❌ Overkill for static content
- ❌ Higher cost
- ❌ Backend takes resources

### Steps:

#### 4.1 Create separate EB for frontend
```powershell
eb init -p "Node.js 18" hotel-frontend --region ap-southeast-1

# Create .ebextensions/nodecommand.config
```

#### 4.2 Add Node.js server
```javascript
// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 4.3 Deploy
```powershell
eb deploy hotel-frontend-env
```

---

## 🎯 RECOMMENDED APPROACH

For your project, I recommend: **Option 1 (Serve from Spring Boot)**

### Reasons:
1. ✅ Simplest initial deployment
2. ✅ No extra services/costs
3. ✅ No CORS issues
4. ✅ Single deployment pipeline
5. ✅ Can upgrade later if needed

### Future: Migrate to Option 2
When you need:
- Better performance
- Global users
- Independent scaling
- CDN benefits

---

## CORS Configuration (For Separate Frontend)

If using Option 2 or 3, add to backend:

```yaml
# application-prod.yml
app:
  cors:
    allowed-origins: |
      http://localhost:5173,
      https://yourdomain.com,
      https://d-xxxx.cloudfront.net
```

Or in Spring Boot code:
```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://yourdomain.com")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

---

## API URL Configuration

### For Option 1 (Serve from Spring Boot):
```javascript
// frontend/src/services/api.js
const API_BASE = '/api'  // Same origin
```

### For Option 2/3 (Separate Frontend):
```javascript
// frontend/src/services/api.js
const API_BASE = process.env.VITE_API_URL || 
  'http://luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com/api'
```

---

## Testing Before Deploy

```powershell
# Local testing
cd frontend
npm run dev

# Test API calls
curl http://localhost:8080/api/hotels

# Build test
npm run build

# Check build size
du -sh dist/
```

---

## Monitoring Frontend

```powershell
# CloudFront metrics (if using Option 2)
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum

# S3 metrics
aws s3 ls s3://luxstayhotel-frontend/ --summarize --human-readable
```

---

## Cost Estimate

| Option | Monthly Cost |
|--------|-------------|
| Option 1 (Spring Boot) | +$0 (included in EB) |
| Option 2 (S3+CloudFront) | $2-10 + $0.085 per GB transferred |
| Option 3 (Amplify) | $1 build hours + hosting |
| Option 4 (EB Node) | $20-30 |

---

Choose your option and follow the steps. Start with **Option 1** for simplicity!
