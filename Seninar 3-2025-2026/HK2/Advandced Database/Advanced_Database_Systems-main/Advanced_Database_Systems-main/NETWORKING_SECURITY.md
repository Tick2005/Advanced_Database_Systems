# 🔐 NETWORKING & SECURITY SETUP

## Security Groups Configuration

### EB Security Group (for EC2 instances)
```powershell
$sgName = "hotel-backend-sg"

# Create Security Group
aws ec2 create-security-group `
  --group-name $sgName `
  --description "Security group for Hotel Backend EB" `
  --region ap-southeast-1

# Allow HTTP from internet
aws ec2 authorize-security-group-ingress `
  --group-name $sgName `
  --protocol tcp `
  --port 80 `
  --cidr 0.0.0.0/0 `
  --region ap-southeast-1

# Allow HTTPS from internet
aws ec2 authorize-security-group-ingress `
  --group-name $sgName `
  --protocol tcp `
  --port 443 `
  --cidr 0.0.0.0/0 `
  --region ap-southeast-1
```

### RDS Security Group
```powershell
$rdsSgName = "hotel-db-sg"

# Create Security Group
aws ec2 create-security-group `
  --group-name $rdsSgName `
  --description "Security group for Hotel RDS" `
  --region ap-southeast-1

# Allow PostgreSQL from EB
aws ec2 authorize-security-group-ingress `
  --group-name $rdsSgName `
  --protocol tcp `
  --port 5432 `
  --source-group $sgName `
  --region ap-southeast-1
```

### DocumentDB Security Group
```powershell
$docdbSgName = "hotel-docdb-sg"

# Create Security Group
aws ec2 create-security-group `
  --group-name $docdbSgName `
  --description "Security group for Hotel DocumentDB" `
  --region ap-southeast-1

# Allow MongoDB from EB
aws ec2 authorize-security-group-ingress `
  --group-name $docdbSgName `
  --protocol tcp `
  --port 27017 `
  --source-group $sgName `
  --region ap-southeast-1
```

---

## RDS Setup Details

### Create RDS Instance
```powershell
aws rds create-db-instance `
  --db-instance-identifier hotel-postgres `
  --db-instance-class db.t3.micro `
  --engine postgres `
  --engine-version 15.3 `
  --master-username admin `
  --master-user-password "YOUR_STRONG_PASSWORD" `
  --allocated-storage 20 `
  --storage-type gp2 `
  --vpc-security-group-ids sg-xxxxxxxx `
  --db-name hotel `
  --publicly-accessible false `
  --multi-az false `
  --backup-retention-period 7 `
  --region ap-southeast-1 `
  --tags Key=Name,Value=hotel-backend-db Key=Environment,Value=production
```

### Get RDS Endpoint
```powershell
aws rds describe-db-instances `
  --db-instance-identifier hotel-postgres `
  --query 'DBInstances[0].Endpoint.Address' `
  --region ap-southeast-1
```

---

## DocumentDB Setup Details

### Create DocumentDB Cluster
```powershell
aws docdb create-db-cluster `
  --db-cluster-identifier hotel-mongodb `
  --engine docdb `
  --engine-version 5.0.0 `
  --master-username admin `
  --master-user-password "YOUR_STRONG_PASSWORD" `
  --backup-retention-period 7 `
  --storage-encrypted true `
  --region ap-southeast-1 `
  --tags Key=Name,Value=hotel-backend-docdb Key=Environment,Value=production
```

### Create DocumentDB Instance
```powershell
aws docdb create-db-instance `
  --db-instance-identifier hotel-mongodb-instance-1 `
  --db-instance-class db.t3.small `
  --engine docdb `
  --db-cluster-identifier hotel-mongodb `
  --region ap-southeast-1 `
  --tags Key=Name,Value=hotel-backend-docdb-instance Key=Environment,Value=production
```

### Wait for Cluster to be Ready
```powershell
# This may take 10-15 minutes
aws docdb describe-db-clusters `
  --db-cluster-identifier hotel-mongodb `
  --query 'DBClusters[0].Status' `
  --region ap-southeast-1
```

### Get DocumentDB Endpoint
```powershell
aws docdb describe-db-clusters `
  --db-cluster-identifier hotel-mongodb `
  --query 'DBClusters[0].Endpoint' `
  --region ap-southeast-1
```

---

## ECR Repository Setup

```powershell
# Create repository
aws ecr create-repository `
  --repository-name hotel-backend `
  --region ap-southeast-1

# Set lifecycle policy (keep last 5 images)
$lifecyclePolicy = @{
    rules = @(
        @{
            rulePriority = 1
            description = "Keep last 5 images"
            selection = @{
                tagStatus = "any"
                countType = "imageCountMoreThan"
                countNumber = 5
            }
            action = @{
                type = "expire"
            }
        }
    )
} | ConvertTo-Json -Depth 10

aws ecr put-lifecycle-policy `
  --repository-name hotel-backend `
  --lifecycle-policy-text $lifecyclePolicy `
  --region ap-southeast-1
```

---

## VPC & Network Configuration (Optional)

### Create VPC for Database Subnet Group
```powershell
# Create VPC
$vpcId = (aws ec2 create-vpc `
  --cidr-block 10.0.0.0/16 `
  --region ap-southeast-1 `
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=hotel-vpc}]' `
  --query 'Vpc.VpcId' `
  --output text)

Write-Host "VPC ID: $vpcId"

# Create Subnets
$subnet1 = aws ec2 create-subnet `
  --vpc-id $vpcId `
  --cidr-block 10.0.1.0/24 `
  --availability-zone ap-southeast-1a `
  --region ap-southeast-1 `
  --query 'Subnet.SubnetId' `
  --output text

$subnet2 = aws ec2 create-subnet `
  --vpc-id $vpcId `
  --cidr-block 10.0.2.0/24 `
  --availability-zone ap-southeast-1b `
  --region ap-southeast-1 `
  --query 'Subnet.SubnetId' `
  --output text

Write-Host "Subnet 1: $subnet1"
Write-Host "Subnet 2: $subnet2"

# Create DB Subnet Group
aws rds create-db-subnet-group `
  --db-subnet-group-name hotel-db-subnet-group `
  --db-subnet-group-description "Subnet group for hotel databases" `
  --subnet-ids $subnet1 $subnet2 `
  --region ap-southeast-1 `
  --tags Key=Name,Value=hotel-db-subnet-group
```

---

## Secrets Manager Setup

```powershell
# Create secret for DB password
aws secretsmanager create-secret `
  --name hotel-db-password `
  --description "Password for hotel PostgreSQL database" `
  --secret-string "YOUR_STRONG_DB_PASSWORD" `
  --region ap-southeast-1 `
  --tags Key=Environment,Value=production Key=Service,Value=hotel-backend

# Create secret for VNPAY
aws secretsmanager create-secret `
  --name vnpay-hash-secret `
  --description "VNPAY payment hash secret" `
  --secret-string "YOUR_VNPAY_SECRET" `
  --region ap-southeast-1 `
  --tags Key=Environment,Value=production Key=Service,Value=hotel-backend

# Create secret for Mail
aws secretsmanager create-secret `
  --name hotel-mail-password `
  --description "Mail server password" `
  --secret-string "YOUR_MAIL_PASSWORD" `
  --region ap-southeast-1 `
  --tags Key=Environment,Value=production Key=Service,Value=hotel-backend

# Create secret for JWT
aws secretsmanager create-secret `
  --name hotel-jwt-secret `
  --description "JWT signing secret" `
  --secret-string "YOUR_JWT_SECRET_KEY" `
  --region ap-southeast-1 `
  --tags Key=Environment,Value=production Key=Service,Value=hotel-backend
```

---

## IAM Role for EB to Access Secrets

```powershell
# Create IAM policy for Secrets Manager access
$policyDocument = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Action = @(
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            )
            Resource = @(
                "arn:aws:secretsmanager:ap-southeast-1:ACCOUNT_ID:secret:hotel-*",
                "arn:aws:secretsmanager:ap-southeast-1:ACCOUNT_ID:secret:vnpay-*"
            )
        }
    )
} | ConvertTo-Json -Depth 10

# Create IAM policy
aws iam put-role-policy `
  --role-name aws-elasticbeanstalk-ec2-role `
  --policy-name hotel-secrets-access `
  --policy-document $policyDocument `
  --region ap-southeast-1

# Also add ECR access
aws iam attach-role-policy `
  --role-name aws-elasticbeanstalk-ec2-role `
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
```

---

## CloudWatch Monitoring Setup

```powershell
# Create CloudWatch Log Group
aws logs create-log-group `
  --log-group-name "/aws/elasticbeanstalk/hotel-backend" `
  --region ap-southeast-1

# Set retention
aws logs put-retention-policy `
  --log-group-name "/aws/elasticbeanstalk/hotel-backend" `
  --retention-in-days 30 `
  --region ap-southeast-1

# Create CloudWatch Alarms for CPU
aws cloudwatch put-metric-alarm `
  --alarm-name hotel-backend-high-cpu `
  --alarm-description "Alert when EB CPU is high" `
  --metric-name CPUUtilization `
  --namespace AWS/ElasticBeanstalk `
  --statistic Average `
  --period 300 `
  --threshold 80 `
  --comparison-operator GreaterThanThreshold `
  --evaluation-periods 2 `
  --region ap-southeast-1
```

---

## SSL/TLS Certificate Setup

### Option 1: AWS Certificate Manager (Free)
```powershell
# Request certificate
aws acm request-certificate `
  --domain-name luxstayhotel-origin-env.eba-5nhij6eb.ap-southeast-1.elasticbeanstalk.com `
  --region ap-southeast-1

# Use in EB Listener configuration (AWS Console)
```

### Option 2: Custom Domain with ACM
```powershell
# If you have a custom domain
aws acm request-certificate `
  --domain-name yourdomain.com `
  --subject-alternative-names "*.yourdomain.com" `
  --region ap-southeast-1
```

---

## Health Check Configuration

```powershell
# Update EB environment health check
eb config

# Or via CLI
aws elasticbeanstalk update-environment `
  --environment-name luxstayhotel-origin-env `
  --option-settings `
    Namespace=aws:elasticbeanstalk:application,OptionName=Application Healthcheck URL,Value=/actuator/health `
  --region ap-southeast-1
```

---

## Backup Strategy

### RDS Automated Backups
```powershell
# Already set during creation with --backup-retention-period 7
# To modify:
aws rds modify-db-instance `
  --db-instance-identifier hotel-postgres `
  --backup-retention-period 30 `
  --region ap-southeast-1
```

### Manual RDS Snapshot
```powershell
aws rds create-db-snapshot `
  --db-instance-identifier hotel-postgres `
  --db-snapshot-identifier hotel-postgres-manual-$(Get-Date -Format "yyyyMMdd-HHmmss") `
  --region ap-southeast-1
```

---

## Verification Checklist

```powershell
# 1. Check RDS
aws rds describe-db-instances --db-instance-identifier hotel-postgres --region ap-southeast-1

# 2. Check DocumentDB
aws docdb describe-db-clusters --db-cluster-identifier hotel-mongodb --region ap-southeast-1

# 3. Check ECR
aws ecr describe-repositories --repository-names hotel-backend --region ap-southeast-1

# 4. Check Secrets
aws secretsmanager list-secrets --region ap-southeast-1 --filters Key=name,Values=hotel

# 5. Check Security Groups
aws ec2 describe-security-groups --region ap-southeast-1

# 6. Check EB Environment
eb status
```

---

## Troubleshooting Network Issues

### RDS Connection Test
```powershell
# From EB instance (SSH)
$ psql -h <RDS-ENDPOINT> -U admin -d hotel -c "\l"
```

### DocumentDB Connection Test
```powershell
# From EB instance (SSH)
$ mongosh "mongodb://admin:PASSWORD@<DOCDB-ENDPOINT>:27017/hotel?authSource=admin"
```

### Check EB Environment Details
```powershell
eb printenv
```

---

This setup ensures:
- ✅ Secure database access
- ✅ Proper network isolation
- ✅ Encrypted secrets
- ✅ Monitoring and logging
- ✅ Backup and recovery
- ✅ SSL/TLS encryption
