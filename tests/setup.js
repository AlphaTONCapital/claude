// Test environment setup
// Set required environment variables for tests

process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
process.env.ANTHROPIC_API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.TON_NETWORK = 'testnet';
process.env.TON_RPC_ENDPOINT = 'https://testnet.toncenter.com/api/v2/jsonRPC';
process.env.TON_API_ENDPOINT = 'https://testnet.toncenter.com/api/v2';
