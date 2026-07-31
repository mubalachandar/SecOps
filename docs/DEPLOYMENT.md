# Production Deployment Guide

## Prerequisites
- AWS EC2 Instance (t2.micro or larger, Ubuntu 22.04 LTS)
- Domain Name (Optional, mapped to EC2 Elastic IP)
- Docker and Docker Compose installed locally
- Google AI Studio account (Gemini API Key)

---

## Section 1: EC2 Setup

1. **Connect to your EC2 instance**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```
2. **Install Docker and Docker Compose**:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose git curl
   sudo systemctl enable --now docker
   sudo usermod -aG docker ubuntu
   ```
   *(Log out and log back in to apply the docker group permissions)*
3. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/secops-ai-copilot.git
   cd secops-ai-copilot
   ```

---

## Section 2: Environment Configuration

Create the root `.env` file (`cp .env.example .env`) and populate the following:

- `DATABASE_URL`: Local PostgreSQL connection string (e.g. `postgresql://postgres:postgrespassword@postgres:5432/secops`).
- `REDIS_URL`: Local Redis connection string (e.g. `redis://redis:6379`).
- `GEMINI_API_KEY`: Key generated from Google AI Studio.
- `JWT_SECRET`: Generate a random 64-character hex string (e.g., `openssl rand -hex 32`).
- `FRONTEND_URL`: The URL where your frontend lives (e.g., `https://yourdomain.com`).
- `CORS_ORIGINS`: Comma separated origins allowed to hit the API.
- `AWS_ACCESS_KEY_ID` & `SECRET`: An IAM user with read access to the CloudTrail S3 bucket.

---

## Section 3: SSL Setup (Let's Encrypt)

1. **Install Certbot**:
   ```bash
   sudo apt install -y certbot
   ```
2. **Generate Certificates**:
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```
3. **Copy Certs to Nginx Volume**:
   ```bash
   mkdir -p ./nginx/certs
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/certs/cert.pem
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/certs/key.pem
   sudo chown -R ubuntu:ubuntu ./nginx/certs
   ```
   *Note: Ensure `.env` paths point to `./nginx/certs/cert.pem`.*

---

## Section 4: Deploy

Execute the deployment script:
```bash
chmod +x deploy.sh
./deploy.sh --seed
```
Verify the health check prints `DEPLOYMENT SUCCESS`.
View live logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Section 5: GitHub Actions Setup

To enable automated CD on push to `main`, add these Secrets in your GitHub Repository settings (`Settings > Secrets and variables > Actions`):

- `DATABASE_URL`, `REDIS_URL`, `GEMINI_API_KEY`, `JWT_SECRET`
- `EC2_HOST`: The IP address of your EC2 instance.
- `EC2_SSH_KEY`: The raw private key (`.pem` file contents) used to SSH into EC2.
- `BACKEND_ENV_PROD`: The complete contents of your production `backend/.env`.
- `FRONTEND_ENV_PROD`: The complete contents of your production `frontend/.env`.
- `SLACK_WEBHOOK_URL`: (Optional) Slack webhook for deployment notifications.

---

## Section 6: Monitoring & Troubleshooting

### Monitoring Commands
- **View Container Status**: `docker ps`
- **Restart Services**: `docker-compose -f docker-compose.prod.yml restart`
- **Rebuild Frontend Only**: `docker-compose -f docker-compose.prod.yml up -d --build frontend`

### Troubleshooting

1. **Symptom: 502 Bad Gateway**
   * **Cause**: Backend container crashed or isn't listening on port 5000.
   * **Fix**: `docker logs secops-backend`. Check if DB connection failed.

2. **Symptom: Nginx container continuously restarting**
   * **Cause**: Missing SSL certificates or bad path mapping.
   * **Fix**: Ensure `./nginx/certs` contains valid `cert.pem` and `key.pem`.

3. **Symptom: Login Fails with 500**
   * **Cause**: Database has not been seeded.
   * **Fix**: Run `docker exec -it secops-backend npm run seed`.

4. **Symptom: "Origin is not allowed by CORS"**
   * **Cause**: `FRONTEND_URL` mismatch.
   * **Fix**: Update `.env` to precisely match the browser URL (no trailing slashes).

5. **Symptom: CloudTrail alerts not triggering**
   * **Cause**: AWS credentials invalid or bucket name incorrect.
   * **Fix**: Verify IAM policy has `s3:GetObject` and `s3:ListBucket`.
