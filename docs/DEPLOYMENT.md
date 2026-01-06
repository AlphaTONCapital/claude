# Deployment Guide

## Overview

This guide covers deploying the Telegram Claude MCP TON Connector in production environments. The application supports multiple deployment strategies including Docker, traditional server deployment, and cloud platforms.

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0 or higher
- **Memory**: Minimum 512MB RAM, recommended 1GB+
- **Storage**: 1GB available disk space
- **Network**: Stable internet connection with HTTPS support

### External Services
- **Redis Server**: For conversation and session management
- **Telegram Bot**: Created via [@BotFather](https://t.me/botfather)
- **Anthropic API**: Claude AI API access
- **TON API**: TON Center API key (optional but recommended)
- **Domain**: HTTPS domain for webhooks and mini app

### Required Credentials
- Telegram bot token
- Anthropic Claude API key
- TON wallet mnemonic phrase
- JIRA API credentials (if using JIRA integration)
- SSL certificate for HTTPS

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file with the following configuration:

```bash
# Application Environment
NODE_ENV=production
PORT=3000

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_DOMAIN=https://your-domain.com
TELEGRAM_WEBHOOK_PORT=3000
TELEGRAM_ALLOWED_USERS=user1,user2,user3
TELEGRAM_ADMIN_USERS=admin1,admin2
TELEGRAM_MINI_APP_URL=https://your-domain.com/app
TELEGRAM_MINI_APP_SECRET=your_bot_token_here

# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7

# TON Blockchain Configuration
TON_NETWORK=mainnet
TON_API_KEY=your_toncenter_api_key
TON_WALLET_MNEMONIC="word1 word2 word3 ... word24"
TON_WALLET_VERSION=v4R2
TON_RPC_ENDPOINT=https://toncenter.com/api/v2/jsonRPC
TON_API_ENDPOINT=https://toncenter.com/api/v2

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_secure_password
REDIS_DB=0

# JIRA Configuration (Optional)
JIRA_API_KEY=your_jira_api_token
JIRA_DOMAIN=your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_PROJECT_KEY=TCMCP

# MCP Server Configuration
MCP_SERVER_NAME=telegram-claude-mcp
MCP_SERVER_VERSION=1.0.0
MCP_SERVER_PORT=8080
MCP_TRANSPORT=stdio

# Security Configuration
SESSION_SECRET=your_very_secure_random_string
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/telegram-claude-mcp/app.log
```

## Deployment Methods

### 1. Docker Deployment (Recommended)

#### Docker Compose Setup

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/var/log/telegram-claude-mcp
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  redis_data:

networks:
  app-network:
    driver: bridge
```

#### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs

EXPOSE 3000 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["npm", "start"]
```

#### Deployment Commands

```bash
# Build and start containers
docker-compose -f docker-compose.production.yml up -d --build

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop containers
docker-compose -f docker-compose.production.yml down

# Update application
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d --force-recreate
```

### 2. Traditional Server Deployment

#### Server Setup (Ubuntu/Debian)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Redis
sudo apt install redis-server -y

# Install PM2 for process management
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash telegram-bot
sudo su - telegram-bot
```

#### Application Setup

```bash
# Clone and setup application
git clone <repository-url> telegram-claude-mcp
cd telegram-claude-mcp

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Setup environment
cp .env.production .env

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'telegram-claude-mcp',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    log_file: '/var/log/telegram-claude-mcp/combined.log',
    out_file: '/var/log/telegram-claude-mcp/out.log',
    error_file: '/var/log/telegram-claude-mcp/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/telegram-claude-mcp
sudo chown telegram-bot:telegram-bot /var/log/telegram-claude-mcp

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Cloud Platform Deployment

#### Heroku Deployment

Create `Procfile`:
```
web: npm start
worker: node dist/mcp-server.js
```

Create `heroku.yml`:
```yaml
build:
  docker:
    web: Dockerfile
addons:
  - plan: heroku-redis:hobby-dev
```

Deploy to Heroku:
```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set ANTHROPIC_API_KEY=your_key
# ... set all other environment variables

# Deploy
git push heroku main

# Scale processes
heroku ps:scale web=1 worker=1

# View logs
heroku logs --tail
```

#### AWS ECS Deployment

Create `task-definition.json`:
```json
{
  "family": "telegram-claude-mcp",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "telegram-claude-mcp",
      "image": "your-ecr-repo/telegram-claude-mcp:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "TELEGRAM_BOT_TOKEN",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:telegram-bot-token"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/telegram-claude-mcp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## SSL/HTTPS Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/telegram-claude-mcp`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-domain.com.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.com.key;
    
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Let's Encrypt SSL

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Database Setup

### Redis Configuration

#### Redis Server Configuration (`/etc/redis/redis.conf`):
```
bind 127.0.0.1
port 6379
requirepass your_secure_password
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### Redis Cluster (for high availability):
```bash
# Install Redis Sentinel
sudo apt install redis-sentinel -y

# Configure sentinel (/etc/redis/sentinel.conf)
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel auth-pass mymaster your_secure_password
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 10000
```

## Monitoring and Logging

### Application Health Check

Create `healthcheck.js`:
```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  timeout: 2000,
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode == 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', function(err) {
  console.log('ERROR:', err);
  process.exit(1);
});

request.end();
```

### Log Rotation

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/telegram-claude-mcp << 'EOF'
/var/log/telegram-claude-mcp/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 telegram-bot telegram-bot
    postrotate
        /usr/bin/pm2 reloadLogs
    endscript
}
EOF
```

### Monitoring with Prometheus

Add to application (`src/metrics.ts`):
```typescript
import prometheus from 'prom-client';

const register = new prometheus.Registry();

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['route', 'method', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const activeUsers = new prometheus.Gauge({
  name: 'telegram_active_users',
  help: 'Number of active Telegram users'
});

register.registerMetric(httpRequestDuration);
register.registerMetric(activeUsers);

export { register, httpRequestDuration, activeUsers };
```

## Security Considerations

### Firewall Configuration
```bash
# UFW setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Environment Security
- Use Docker secrets or cloud secret management
- Rotate API keys regularly
- Implement rate limiting
- Use HTTPS everywhere
- Validate Telegram webhook signatures
- Set up fail2ban for SSH protection

### Backup Strategy
```bash
# Automated Redis backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/redis"
REDIS_PASSWORD="your_password"

mkdir -p $BACKUP_DIR
redis-cli -a $REDIS_PASSWORD --rdb $BACKUP_DIR/redis_$DATE.rdb
find $BACKUP_DIR -name "redis_*.rdb" -mtime +7 -delete
```

## Troubleshooting

### Common Issues

1. **Bot not receiving webhooks**
   - Check firewall settings
   - Verify SSL certificate
   - Test webhook URL accessibility

2. **Redis connection errors**
   - Check Redis service status: `sudo systemctl status redis`
   - Verify password and connection string
   - Check network connectivity

3. **TON transaction failures**
   - Verify wallet balance
   - Check network status
   - Validate API credentials

4. **High memory usage**
   - Monitor conversation storage
   - Implement conversation cleanup
   - Check for memory leaks

### Maintenance Tasks

- Weekly: Review logs and performance metrics
- Monthly: Update dependencies and security patches
- Quarterly: Rotate API keys and passwords
- Yearly: SSL certificate renewal (if not automated)

## Performance Optimization

- Use PM2 cluster mode for multiple instances
- Implement Redis clustering for high availability
- Set up CDN for static assets
- Configure proper caching headers
- Monitor and optimize database queries
- Implement graceful shutdowns

For additional support, refer to the troubleshooting guide or contact the development team.