import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  telegram: z.object({
    botToken: z.string(),
    webhookDomain: z.string().optional(),
    webhookPort: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().default(3000)),
    allowedUsers: z.string().transform(s => s ? s.split(',').map(u => u.trim()) : []).default(''),
    adminUsers: z.string().transform(s => s ? s.split(',').map(u => u.trim()) : []).default(''),
    miniAppUrl: z.string().optional(),
    miniAppSecret: z.string().optional(),
  }),
  claude: z.object({
    apiKey: z.string(),
    model: z.string().default('claude-3-5-sonnet-20241022'),
    maxTokens: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().default(4096)),
  }),
  mcp: z.object({
    serverName: z.string().default('telegram-claude-mcp'),
    serverVersion: z.string().default('1.0.0'),
    serverPort: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().default(8080)),
  }),
  redis: z.object({
    url: z.string().default('redis://localhost:6379'),
    password: z.string().optional(),
    db: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().default(0)),
  }),
  ton: z.object({
    network: z.enum(['mainnet', 'testnet']).default('testnet'),
    apiKey: z.string().optional(),
    walletMnemonic: z.string().optional(),
    walletVersion: z.string().default('v4R2'),
    rpcEndpoint: z.string().default('https://testnet.toncenter.com/api/v2/jsonRPC'),
    apiEndpoint: z.string().default('https://testnet.toncenter.com/api/v2'),
  }),
  jira: z.object({
    apiKey: z.string().optional(),
    domain: z.string().optional(),
    email: z.string().optional(),
    projectKey: z.string().default('TCMCP'),
  }),
  app: z.object({
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    maxMessageLength: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().default(4000)),
    conversationTimeoutMinutes: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().default(30)),
  }),
  rateLimit: z.object({
    maxRequests: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().default(20)),
    windowMs: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().default(60000)),
  }),
});

const rawConfig = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
    webhookDomain: process.env.TELEGRAM_WEBHOOK_DOMAIN,
    webhookPort: process.env.TELEGRAM_WEBHOOK_PORT,
    allowedUsers: process.env.ALLOWED_USERS || '',
    adminUsers: process.env.ADMIN_USERS || '',
    miniAppUrl: process.env.TELEGRAM_MINI_APP_URL,
    miniAppSecret: process.env.TELEGRAM_MINI_APP_SECRET,
  },
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: process.env.CLAUDE_MODEL,
    maxTokens: process.env.CLAUDE_MAX_TOKENS,
  },
  mcp: {
    serverName: process.env.MCP_SERVER_NAME,
    serverVersion: process.env.MCP_SERVER_VERSION,
    serverPort: process.env.MCP_SERVER_PORT,
  },
  redis: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB,
  },
  ton: {
    network: process.env.TON_NETWORK as 'mainnet' | 'testnet' | undefined,
    apiKey: process.env.TON_API_KEY,
    walletMnemonic: process.env.TON_WALLET_MNEMONIC,
    walletVersion: process.env.TON_WALLET_VERSION,
    rpcEndpoint: process.env.TON_RPC_ENDPOINT,
    apiEndpoint: process.env.TON_API_ENDPOINT,
  },
  jira: {
    apiKey: process.env.JIRA_API_KEY,
    domain: process.env.JIRA_DOMAIN,
    email: process.env.JIRA_EMAIL,
    projectKey: process.env.JIRA_PROJECT_KEY,
  },
  app: {
    nodeEnv: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL,
    maxMessageLength: process.env.MAX_MESSAGE_LENGTH,
    conversationTimeoutMinutes: process.env.CONVERSATION_TIMEOUT_MINUTES,
  },
  rateLimit: {
    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
    windowMs: process.env.RATE_LIMIT_WINDOW_MS,
  },
};

export const config = configSchema.parse(rawConfig);

export type Config = z.infer<typeof configSchema>;