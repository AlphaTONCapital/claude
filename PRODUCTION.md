# Production Deployment Guide

🚀 **Complete guide to deploy the Telegram Claude MCP TON Connector in production**

## Quick Start

For immediate deployment, use our automated scripts:

```bash
# Quick setup for development
./scripts/quick-start.sh

# Production deployment
./scripts/deploy.sh

# With monitoring stack
./scripts/deploy.sh --with-monitoring
```

## Production Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude        │    │   Telegram      │    │   TON           │
│   Desktop       │    │   API           │    │   Blockchain    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ MCP Protocol         │ Webhook/Bot API      │ RPC API
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                         │
│                    (SSL/TLS Termination)                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│               Telegram Claude MCP Connector                    │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Telegram    │  │ MCP Server  │  │ TON Service │             │
│  │ Bot Handler │  │             │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Claude AI   │  │ JIRA        │  │ Mini App    │             │
│  │ Service     │  │ Integration │  │ Server      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Redis Database                            │
│                 (Session & Conversation Storage)               │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Setup

### 1. Server Requirements

**Minimum:**
- 1 vCPU, 1GB RAM
- 10GB SSD storage
- Ubuntu 20.04+ or Docker support

**Recommended:**
- 2 vCPU, 2GB RAM
- 20GB SSD storage
- Load balancer for HA

### 2. Domain & SSL

```bash
# Set up domain DNS
your-domain.com → your-server-ip

# Install SSL certificate (Let's Encrypt)
sudo apt install certbot nginx
sudo certbot --nginx -d your-domain.com
```

### 3. Environment Configuration

Create `.env.production`:

```bash
cp .env.production.example .env.production
nano .env.production
```

**Critical Settings:**
```bash
# Production mode
NODE_ENV=production
PORT=3000

# Your domain for webhooks
TELEGRAM_WEBHOOK_DOMAIN=https://your-domain.com

# API Keys (REQUIRED)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHI...
ANTHROPIC_API_KEY=sk-ant-api03-...
TON_WALLET_MNEMONIC="word1 word2 ... word24"

# Security
REDIS_PASSWORD=your_secure_redis_password
SESSION_SECRET=your_very_secure_random_string
```

## Deployment Options

### Option 1: Docker Deployment (Recommended)

```bash
# 1. Build and start services
docker-compose -f docker-compose.production.yml up -d

# 2. Check status
docker-compose -f docker-compose.production.yml ps

# 3. View logs
docker-compose -f docker-compose.production.yml logs -f app

# 4. Run health check
docker exec telegram-claude-mcp-prod node healthcheck.js
```

**Services Included:**
- Main application container
- Redis database
- Nginx reverse proxy
- Optional monitoring (Prometheus + Grafana)

### Option 2: Direct Server Deployment

```bash
# 1. Install dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs redis-server nginx

# 2. Install PM2 process manager
sudo npm install -g pm2

# 3. Clone and build
git clone https://github.com/anthropics/telegram-claude-mcp.git
cd telegram-claude-mcp
npm ci --only=production
npm run build

# 4. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Cloud Platform Deployment

#### Heroku
```bash
# Deploy to Heroku
heroku create your-app-name
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

#### DigitalOcean App Platform
```yaml
# .do/app.yaml
name: telegram-claude-mcp
services:
- name: app
  source_dir: /
  github:
    repo: your-username/telegram-claude-mcp
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
databases:
- name: redis
  engine: REDIS
  version: "7"
```

## MCP Client Setup

### Claude Desktop Integration

1. **Find Claude Desktop config:**
   ```bash
   # macOS
   ~/Library/Application Support/Claude/claude_desktop_config.json
   
   # Windows
   %APPDATA%\Claude\claude_desktop_config.json
   
   # Linux  
   ~/.config/Claude/claude_desktop_config.json
   ```

2. **Add MCP server configuration:**
   ```json
   {
     "mcpServers": {
       "telegram-claude-mcp": {
         "command": "node",
         "args": ["dist/index.js"],
         "cwd": "/path/to/telegram-claude-mcp",
         "env": {
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### Verify MCP Connection

Ask Claude in the desktop app:
```
What MCP tools do you have access to?
```

You should see tools like:
- `send_telegram_message`
- `ton_get_balance`
- `jira_create_issue`
- And many more!

## Security Configuration

### 1. Firewall Setup

```bash
# UFW configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Nginx Security

```nginx
# nginx.conf security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000";

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

### 3. Environment Security

- Never commit API keys to version control
- Use Docker secrets in production
- Rotate passwords regularly
- Monitor access logs

## Monitoring & Maintenance

### Health Checks

```bash
# Manual health check
node healthcheck.js

# Docker health check
docker exec telegram-claude-mcp-prod node healthcheck.js

# HTTP health endpoint
curl https://your-domain.com/health
```

### Monitoring Stack (Optional)

Enable with monitoring flag:
```bash
./scripts/deploy.sh --with-monitoring
```

**Services:**
- **Prometheus**: Metrics collection (http://localhost:9090)
- **Grafana**: Dashboards (http://localhost:3001)

### Log Management

```bash
# View application logs
docker-compose -f docker-compose.production.yml logs -f app

# View all service logs
docker-compose -f docker-compose.production.yml logs -f

# Follow specific service
docker logs -f telegram-claude-mcp-prod
```

### Backup Strategy

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/telegram-claude-mcp"

mkdir -p $BACKUP_DIR

# Backup Redis
docker exec telegram-claude-redis-prod redis-cli save
docker cp telegram-claude-redis-prod:/data/. $BACKUP_DIR/redis_$DATE/

# Backup logs
cp -r logs/ $BACKUP_DIR/logs_$DATE/

# Backup environment
cp .env.production $BACKUP_DIR/env_$DATE

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x backup.sh
```

## Troubleshooting

### Common Issues

1. **Bot not receiving messages**
   ```bash
   # Check webhook status
   curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
   
   # Set webhook
   curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
        -d "url=https://your-domain.com/webhook"
   ```

2. **MCP connection failed**
   ```bash
   # Check if server is running
   ps aux | grep node
   
   # Check MCP port
   netstat -tlnp | grep 8080
   
   # Test MCP server
   echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | \
   node dist/index.js
   ```

3. **Redis connection errors**
   ```bash
   # Check Redis status
   docker exec telegram-claude-redis-prod redis-cli ping
   
   # Check Redis logs
   docker logs telegram-claude-redis-prod
   ```

4. **High memory usage**
   ```bash
   # Monitor memory
   docker stats telegram-claude-mcp-prod
   
   # Check for memory leaks
   node --expose-gc --inspect dist/index.js
   ```

### Performance Optimization

1. **Enable PM2 Cluster Mode**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'telegram-claude-mcp',
       script: 'dist/index.js',
       instances: 'max',
       exec_mode: 'cluster'
     }]
   };
   ```

2. **Redis Optimization**
   ```bash
   # Tune Redis memory
   redis-cli config set maxmemory 512mb
   redis-cli config set maxmemory-policy allkeys-lru
   ```

3. **Nginx Caching**
   ```nginx
   # nginx.conf
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1M;
       add_header Cache-Control "public, immutable";
   }
   ```

## Updates & Maintenance

### Rolling Updates

```bash
# 1. Backup current deployment
./backup.sh

# 2. Pull latest code
git pull origin main

# 3. Build new image
docker-compose -f docker-compose.production.yml build app

# 4. Rolling restart
docker-compose -f docker-compose.production.yml up -d --no-deps app

# 5. Verify health
docker exec telegram-claude-mcp-prod node healthcheck.js
```

### Maintenance Schedule

- **Daily**: Check logs and health status
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Rotate API keys and passwords

## Support

### Getting Help

1. **Check logs first:**
   ```bash
   docker-compose logs -f app
   ```

2. **Run diagnostics:**
   ```bash
   node healthcheck.js
   ./scripts/validate-all.sh
   ```

3. **Review configuration:**
   - Verify all API keys in `.env.production`
   - Check domain DNS and SSL setup
   - Validate webhook configuration

### Community & Documentation

- 📚 [Full Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/anthropics/telegram-claude-mcp/issues)
- 💬 [Discussion Forum](https://github.com/anthropics/telegram-claude-mcp/discussions)
- 🔧 [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

---

## Success! 🎉

Your Telegram Claude MCP TON Connector is now running in production! 

**Test your deployment:**
1. Send a message to your Telegram bot
2. Use MCP tools in Claude Desktop
3. Check health endpoint: `https://your-domain.com/health`
4. View monitoring: `https://your-domain.com:3001` (if enabled)

**Next steps:**
- Configure your specific use cases
- Set up automated backups
- Monitor performance and logs
- Explore advanced features

Happy connecting! 🚀