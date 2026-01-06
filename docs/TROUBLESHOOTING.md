# Troubleshooting Guide

## Common Issues and Solutions

### Telegram Bot Issues

#### Bot Not Responding to Commands

**Symptoms:**
- No response from bot when sending commands
- Commands appear to be ignored
- Bot shows offline status

**Possible Causes:**
1. Invalid bot token
2. Webhook configuration issues
3. Server connectivity problems
4. Rate limiting

**Solutions:**
```bash
# 1. Verify bot token
curl -X GET "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"

# 2. Check webhook status
curl -X GET "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# 3. Test webhook endpoint
curl -X POST "https://your-domain.com/webhook" -H "Content-Type: application/json" -d '{}'

# 4. Check application logs
tail -f /var/log/telegram-claude-mcp/app.log
```

**Prevention:**
- Use environment variables for bot token
- Implement proper webhook validation
- Set up monitoring and alerting
- Configure rate limiting properly

#### Webhook Certificate Issues

**Symptoms:**
- Webhook not receiving updates
- SSL/TLS handshake failures
- Certificate verification errors

**Solutions:**
```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Verify certificate chain
ssl-cert-check -c /etc/ssl/certs/your-domain.com.crt

# Test webhook URL
curl -I https://your-domain.com/webhook

# Re-register webhook with Telegram
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-domain.com/webhook"}'
```

#### Message Formatting Errors

**Symptoms:**
- Messages appear with broken formatting
- Markdown/HTML parsing errors
- Special characters not displaying correctly

**Solutions:**
```typescript
// Escape special characters in Markdown
function escapeMarkdown(text: string): string {
  return text.replace(/[*_`\[\]()~>#+=|{}.!-]/g, '\\$&');
}

// Use proper HTML entities for HTML parse mode
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Example usage
bot.telegram.sendMessage(chatId, escapeMarkdown(text), {
  parse_mode: 'MarkdownV2'
});
```

### TON Blockchain Issues

#### Transaction Failures

**Symptoms:**
- Transactions not being sent
- "Insufficient balance" errors
- Network timeout errors
- Invalid address errors

**Diagnostic Steps:**
```bash
# Check wallet balance
npm run ton:balance

# Verify network connectivity
curl -X POST "https://toncenter.com/api/v2/getAddressInformation" \
  -H "Content-Type: application/json" \
  -d '{"address":"EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2"}'

# Test transaction estimation
npm run ton:estimate -- --to=EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2 --amount=0.1
```

**Common Solutions:**

1. **Insufficient Balance:**
```typescript
// Always check balance before sending
const balance = await tonService.getBalance();
const fee = await tonService.estimateFee(to, amount);

if (parseFloat(balance) < parseFloat(amount) + parseFloat(fee)) {
  throw new Error(`Insufficient balance. Required: ${amount + fee}, Available: ${balance}`);
}
```

2. **Invalid Address:**
```typescript
// Validate address format
if (!await tonService.validateAddress(address)) {
  throw new Error('Invalid TON address format');
}
```

3. **Network Issues:**
```typescript
// Implement retry logic with exponential backoff
async function sendTransactionWithRetry(to: string, amount: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await tonService.sendTransaction(to, amount);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

#### Wallet Connection Issues

**Symptoms:**
- Cannot access wallet information
- Mnemonic phrase not working
- Sequence number errors

**Solutions:**
```typescript
// Verify wallet configuration
const walletConfig = {
  network: process.env.TON_NETWORK || 'testnet',
  mnemonic: process.env.TON_WALLET_MNEMONIC,
  version: process.env.TON_WALLET_VERSION || 'v4R2'
};

// Test wallet initialization
try {
  const wallet = await tonService.initializeWallet(walletConfig);
  console.log('Wallet initialized:', wallet.address);
} catch (error) {
  console.error('Wallet initialization failed:', error);
}

// Check sequence number
const seqno = await tonService.getSeqno();
console.log('Current sequence number:', seqno);
```

### Claude AI Integration Issues

#### API Rate Limiting

**Symptoms:**
- 429 Too Many Requests errors
- Delayed responses
- API quota exceeded messages

**Solutions:**
```typescript
// Implement rate limiting with queue
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 50,
  interval: 'minute'
});

async function generateResponseWithRateLimit(messages: Message[]) {
  await limiter.removeTokens(1);
  return await claudeService.generateResponse(messages);
}

// Monitor API usage
let apiCallCount = 0;
const resetTime = Date.now() + (60 * 1000); // Reset every minute

function trackApiCall() {
  apiCallCount++;
  if (Date.now() > resetTime) {
    apiCallCount = 0;
  }
  
  if (apiCallCount > 45) { // Leave buffer before limit
    throw new Error('Approaching rate limit, please try again later');
  }
}
```

#### Response Quality Issues

**Symptoms:**
- Inconsistent response quality
- Responses not following expected format
- Context not being maintained

**Solutions:**
```typescript
// Improve system prompts
const systemPrompt = `
You are a helpful TON blockchain assistant integrated with Telegram.

Context Guidelines:
- Always maintain conversation context
- Provide accurate TON blockchain information
- Format responses for Telegram (use Markdown)
- Keep responses concise but informative
- Ask for clarification when needed

Response Format:
- Use bullet points for lists
- Include transaction hashes when relevant
- Provide clear error explanations
- Suggest next actions when appropriate
`;

// Implement conversation context management
class ConversationContext {
  private context: Map<string, any> = new Map();
  
  updateContext(userId: string, key: string, value: any) {
    const userContext = this.context.get(userId) || {};
    userContext[key] = value;
    this.context.set(userId, userContext);
  }
  
  getContext(userId: string): any {
    return this.context.get(userId) || {};
  }
}
```

### Redis Connection Issues

#### Connection Timeouts

**Symptoms:**
- Redis connection timeout errors
- Data not persisting
- Conversation history lost

**Diagnostic Commands:**
```bash
# Test Redis connectivity
redis-cli ping

# Check Redis memory usage
redis-cli info memory

# Monitor Redis commands
redis-cli monitor

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

**Solutions:**
```typescript
// Implement connection retry logic
import { createClient } from 'redis';

const createRedisClient = async () => {
  const client = createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 5) return false;
        return Math.min(retries * 50, 1000);
      }
    }
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('Redis Client Connected');
  });

  client.on('reconnecting', () => {
    console.log('Redis Client Reconnecting...');
  });

  await client.connect();
  return client;
};

// Implement graceful fallback
class ConversationManager {
  private redis: RedisClient | null = null;
  private memoryFallback: Map<string, any> = new Map();

  async getConversation(userId: string): Promise<Conversation> {
    try {
      if (this.redis) {
        const data = await this.redis.get(`conversation:${userId}`);
        if (data) return Conversation.fromJSON(JSON.parse(data), userId);
      }
    } catch (error) {
      console.warn('Redis error, using memory fallback:', error);
    }

    // Fallback to in-memory storage
    return this.memoryFallback.get(userId) || new Conversation(userId);
  }
}
```

### JIRA Integration Issues

#### Authentication Failures

**Symptoms:**
- 401 Unauthorized errors
- Cannot access JIRA resources
- API token not working

**Solutions:**
```bash
# Test JIRA authentication
curl -X GET \
  -H "Authorization: Basic $(echo -n 'email@example.com:api_token' | base64)" \
  "https://your-domain.atlassian.net/rest/api/3/myself"

# Verify JIRA permissions
curl -X GET \
  -H "Authorization: Basic $(echo -n 'email@example.com:api_token' | base64)" \
  "https://your-domain.atlassian.net/rest/api/3/permissions"
```

```typescript
// Validate JIRA configuration
async function validateJiraConfig() {
  try {
    const response = await axios.get(
      `https://${jiraConfig.domain}/rest/api/3/myself`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${jiraConfig.email}:${jiraConfig.apiKey}`).toString('base64')}`,
          'Accept': 'application/json',
        },
      }
    );
    
    console.log('JIRA connection successful:', response.data.displayName);
    return true;
  } catch (error) {
    console.error('JIRA authentication failed:', error.response?.data || error.message);
    return false;
  }
}
```

#### Project Creation Issues

**Symptoms:**
- Cannot create projects
- Project key already exists
- Permission denied errors

**Solutions:**
```typescript
// Check if project exists before creating
async function ensureProjectExists(projectKey: string) {
  try {
    await jiraService.getProject(projectKey);
    console.log(`Project ${projectKey} already exists`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      // Project doesn't exist, create it
      return await jiraService.createProject(projectKey);
    }
    throw error;
  }
}

// Implement proper error handling
async function createProjectWithFallback(projectData: any) {
  try {
    return await jiraService.createProject(projectData);
  } catch (error) {
    if (error.response?.status === 400) {
      // Try with different project key
      projectData.key = `${projectData.key}_${Date.now()}`;
      return await jiraService.createProject(projectData);
    }
    throw error;
  }
}
```

### Performance Issues

#### High Memory Usage

**Symptoms:**
- Application consuming excessive memory
- Out of memory errors
- Slow response times

**Diagnostic Tools:**
```bash
# Monitor memory usage
ps aux | grep node

# Use Node.js built-in profiler
node --inspect dist/index.js

# Check heap usage
curl http://localhost:3000/health/memory
```

**Solutions:**
```typescript
// Implement memory monitoring
import { performance, PerformanceObserver } from 'perf_hooks';

const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.name === 'measure_memory') {
      console.log('Memory usage:', entry.detail);
      
      // Alert if memory usage is too high
      if (entry.detail.usedJSHeapSize > 512 * 1024 * 1024) { // 512MB
        console.warn('High memory usage detected!');
        // Trigger garbage collection or cleanup
        global.gc?.();
      }
    }
  });
});

obs.observe({ entryTypes: ['measure'] });

// Periodic memory monitoring
setInterval(() => {
  performance.measure('measure_memory');
}, 60000); // Every minute

// Clean up old conversations
class ConversationManager {
  private cleanupInterval: NodeJS.Timer;
  
  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldConversations();
    }, 30 * 60 * 1000); // Every 30 minutes
  }
  
  private async cleanupOldConversations() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    for (const [userId, conversation] of this.conversations.entries()) {
      if (conversation.getLastActivity() < cutoffTime) {
        this.conversations.delete(userId);
      }
    }
  }
}
```

#### Slow Response Times

**Symptoms:**
- Delayed bot responses
- Timeout errors
- Poor user experience

**Solutions:**
```typescript
// Implement response time monitoring
import { performance } from 'perf_hooks';

function measureResponseTime(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    try {
      const result = await originalMethod.apply(this, args);
      const duration = performance.now() - start;
      
      if (duration > 2000) { // Warn if over 2 seconds
        console.warn(`Slow method ${propertyKey}: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Failed method ${propertyKey} after ${duration}ms:`, error);
      throw error;
    }
  };
  
  return descriptor;
}

// Use caching for expensive operations
import NodeCache from 'node-cache';

const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 60 // Check for expired keys every minute
});

class TonService {
  @measureResponseTime
  async getBalance(address?: string): Promise<string> {
    const cacheKey = `balance:${address || this.walletAddress}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached as string;
    }
    
    const balance = await this.fetchBalance(address);
    cache.set(cacheKey, balance);
    
    return balance;
  }
}
```

## Debugging Tools and Techniques

### Enable Debug Logging

```typescript
// Environment-based logging
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: '/var/log/telegram-claude-mcp/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: '/var/log/telegram-claude-mcp/combined.log'
    })
  ]
});

// Debug-specific logging
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}
```

### Health Check Endpoints

```typescript
// Implement comprehensive health checks
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      redis: await checkRedisHealth(),
      telegram: await checkTelegramHealth(),
      claude: await checkClaudeHealth(),
      ton: await checkTonHealth()
    }
  };
  
  const allHealthy = Object.values(health.services).every(status => status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json(health);
});

async function checkRedisHealth(): Promise<string> {
  try {
    await redis.ping();
    return 'healthy';
  } catch (error) {
    return 'unhealthy';
  }
}
```

### Error Reporting

```typescript
// Implement structured error reporting
class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

function reportError(error: Error, context?: any) {
  const errorReport = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context,
    process: {
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
  
  console.error('Error Report:', JSON.stringify(errorReport, null, 2));
  
  // Send to external monitoring service
  // await sendToSentry(errorReport);
}
```

## Getting Help

### Log Analysis

When reporting issues, include relevant log entries:

```bash
# Get recent logs
tail -n 100 /var/log/telegram-claude-mcp/combined.log

# Search for specific errors
grep -i "error\|failed\|exception" /var/log/telegram-claude-mcp/combined.log | tail -20

# Monitor logs in real-time
tail -f /var/log/telegram-claude-mcp/combined.log | grep -v "DEBUG"
```

### System Information Collection

```bash
#!/bin/bash
# System diagnostic script

echo "=== System Information ==="
uname -a
echo ""

echo "=== Node.js Version ==="
node --version
npm --version
echo ""

echo "=== Application Status ==="
pm2 list
echo ""

echo "=== Redis Status ==="
redis-cli ping 2>/dev/null && echo "Redis: OK" || echo "Redis: FAILED"
echo ""

echo "=== Disk Usage ==="
df -h /
echo ""

echo "=== Memory Usage ==="
free -h
echo ""

echo "=== Network Connectivity ==="
curl -s -o /dev/null -w "Telegram API: %{http_code}\n" https://api.telegram.org/bot/getMe || echo "Telegram API: FAILED"
curl -s -o /dev/null -w "Claude API: %{http_code}\n" https://api.anthropic.com/ || echo "Claude API: FAILED"
echo ""

echo "=== Recent Errors ==="
tail -n 10 /var/log/telegram-claude-mcp/error.log 2>/dev/null || echo "No error log found"
```

### Contact Support

When contacting support, please include:

1. **Error Description**: What exactly is happening vs. what you expected
2. **Environment**: Development, staging, or production
3. **Configuration**: Relevant environment variables (without sensitive values)
4. **Logs**: Recent error logs and system information
5. **Steps to Reproduce**: Exact steps that lead to the issue
6. **Timeline**: When the issue started and any recent changes

**Support Channels:**
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Email: support@example.com
- Telegram: @your_support_bot

Remember to never include sensitive information like API keys, passwords, or private keys in support requests.