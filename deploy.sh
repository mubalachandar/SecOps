#!/bin/bash
set -e

# ANSI Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Deployment of SecOps AI Copilot...${NC}"

# Check required env vars
REQUIRED_VARS=("DATABASE_URL" "REDIS_URL" "GEMINI_API_KEY" "JWT_SECRET")
for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        if grep -q "^${VAR}=" .env; then
            echo -e "${GREEN}Found ${VAR} in .env file.${NC}"
        else
            echo -e "${RED}Error: ${VAR} is not set in environment or .env file!${NC}"
            exit 1
        fi
    fi
done

echo -e "${YELLOW}Pulling latest code from main branch...${NC}"
git pull origin main || echo -e "${YELLOW}Not a git repository or pull failed, continuing...${NC}"

echo -e "${YELLOW}Building backend Docker image...${NC}"
docker build -t secops-backend:latest ./backend

echo -e "${YELLOW}Building frontend Docker image...${NC}"
docker build -t secops-frontend:latest ./frontend

echo -e "${YELLOW}Gracefully stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down --timeout 30

# Handle optional seed flag
if [[ "$1" == "--seed" ]]; then
    echo -e "${YELLOW}Running database seed...${NC}"
    # Run the backend container temporarily to seed
    docker run --rm --env-file .env --network host secops-backend:latest npm run seed
    echo -e "${GREEN}Database seed complete.${NC}"
fi

echo -e "${YELLOW}Starting new containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}Waiting 10 seconds for services to initialize...${NC}"
sleep 10

echo -e "${YELLOW}Performing health check...${NC}"
if curl -sSf http://localhost/health > /dev/null || curl -k -sSf https://localhost/api/v1/health > /dev/null || curl -sSf http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}Health check passed!${NC}"
    echo -e "${GREEN}DEPLOYMENT SUCCESS${NC}"
else
    echo -e "${RED}Health check failed!${NC}"
    echo -e "${RED}DEPLOYMENT FAILED${NC}"
    docker ps
    exit 1
fi

echo -e "${YELLOW}Running containers:${NC}"
docker ps

echo -e "${GREEN}Deployment completed successfully!${NC}"
