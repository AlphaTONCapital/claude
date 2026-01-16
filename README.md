# Telegram Claude MCP TON Connector

> **Bridge Claude AI, Telegram, and TON Blockchain with seamless Model Context Protocol integration**

A production-ready connector that enables Claude AI to interact with Telegram bots, TON blockchain operations, and JIRA project management through the Model Context Protocol (MCP). Built for developers who want to create powerful AI-powered Telegram bots with blockchain capabilities.

## Features

### 🤖 Telegram Bot Integration
- Full Claude AI conversation capabilities
- User authentication and rate limiting
- Conversation history management with Redis
- Admin commands for bot management
- TON blockchain commands for wallet management

### 💎 TON Blockchain Integration
- Wallet management (create, import, balance checking)
- Send and receive TON transactions
- Transaction history and status tracking
- Jetton token support
- NFT information retrieval
- Smart contract deployment capabilities

### 🛠️ MCP Tools
- `ton_get_wallet_info` - Get wallet information
- `ton_get_balance` - Check TON balance
- `ton_send_transaction` - Send TON tokens
- `ton_get_transaction_status` - Check transaction status
- `ton_get_transaction_history` - View transaction history
- `ton_validate_address` - Validate TON addresses
- `ton_get_jetton_balance` - Check Jetton token balances
- `ton_get_nft_info` - Get NFT information
- Telegram messaging and conversation management tools

### 📱 Telegram Mini App
- Web interface for TON wallet management
- Real-time balance updates
- Transaction sending interface
- Transaction history viewer
- Claude AI chat integration
- Secure authentication via Telegram Web App

## Prerequisites

- Node.js 18+ and npm
- Redis server
- Telegram Bot Token
- Anthropic Claude API Key
- TON wallet mnemonic (for full functionality)
- TON API key (optional, for enhanced features)

## Quick Start

The fastest way to get started:

```bash
# Quick setup (development)
./scripts/quick-start.sh

# Production deployment  
./scripts/deploy.sh
```

## Manual Installation

1. Clone the repository:
```bash
git clone https://github.com/anthropics/telegram-claude-mcp.git
cd telegram-claude-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment configuration:
```bash
cp .env.example .env.local
```

4. Configure your `.env` file with your credentials:
```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_DOMAIN=https://your-domain.com
TELEGRAM_WEBHOOK_PORT=3000
TELEGRAM_MINI_APP_URL=https://your-mini-app-domain.com
TELEGRAM_MINI_APP_SECRET=your_bot_token_here

# Claude API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4096

# TON Blockchain Configuration
TON_NETWORK=testnet
TON_API_KEY=your_toncenter_api_key
TON_WALLET_MNEMONIC=your wallet mnemonic phrase here
TON_WALLET_VERSION=v4R2
TON_RPC_ENDPOINT=https://testnet.toncenter.com/api/v2/jsonRPC
TON_API_ENDPOINT=https://testnet.toncenter.com/api/v2

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# MCP Server Configuration
MCP_SERVER_NAME=telegram-claude-mcp
MCP_SERVER_VERSION=1.0.0
MCP_SERVER_PORT=8080
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

### Using with Claude Desktop

1. The quick-start script automatically sets up Claude Desktop integration
2. Or manually add to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json` 
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "telegram-claude-mcp": {
      "command": "npm",
      "args": ["start"],
      "cwd": "/path/to/telegram-claude-mcp",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

3. Restart Claude Desktop and the MCP tools will be available:
   - `send_telegram_message` - Send messages via Telegram
   - `ton_get_balance` - Check TON wallet balance  
   - `jira_create_issue` - Create JIRA issues
   - And 20+ more tools!

📖 **See [Claude Desktop Setup Guide](./docs/CLAUDE_DESKTOP_SETUP.md) for detailed instructions.**

### Production Deployment

#### Docker (Recommended)
```bash
# Production with all services
./scripts/deploy.sh

# With monitoring stack
./scripts/deploy.sh --with-monitoring

# Manual Docker
docker-compose -f docker-compose.production.yml up -d
```

#### Cloud Platforms
- **Heroku**: One-click deploy with Redis addon
- **DigitalOcean**: App Platform deployment  
- **AWS**: ECS/Fargate deployment
- **VPS**: Traditional server setup with PM2

📖 **See [Production Deployment Guide](./PRODUCTION.md) for complete instructions.**

## Bot Commands

### Basic Commands
- `/start` - Start interaction with the bot
- `/help` - Show available commands
- `/new` - Start a new conversation
- `/clear` - Clear conversation history
- `/status` - Check bot status
- `/settings` - View current settings

### TON Commands
- `/wallet` - View wallet information
- `/balance [address]` - Check TON balance
- `/send <address> <amount> [comment]` - Send TON tokens
- `/tx <hash>` - Check transaction status
- `/history [address] [limit]` - View transaction history

### Admin Commands
- `/stats` - View bot statistics (admin only)
- `/broadcast <message>` - Broadcast message to all users (admin only)

## Mini App Setup

1. Create a Telegram Bot via [@BotFather](https://t.me/botfather)
2. Set up the Mini App URL:
```
/setmenubutton
```
3. Configure the webhook URL in your bot settings
4. The mini app will be accessible through the bot's menu button

## Architecture

### Components

1. **MCP Server** - Handles Model Context Protocol communication
2. **Telegram Bot** - Manages user interactions via Telegram
3. **TON Service** - Interfaces with TON blockchain
4. **Claude Service** - Manages AI conversation capabilities
5. **Conversation Manager** - Handles conversation state with Redis
6. **Mini App Server** - Serves the web interface for Telegram Web App

### Data Flow

```
User → Telegram Bot → MCP Server → Claude AI
                    ↓
                TON Blockchain
                    ↓
              Redis Storage
```

## Security Considerations

- Store sensitive keys in environment variables
- Use HTTPS for webhook and mini app domains
- Implement rate limiting for API endpoints
- Validate Telegram Web App data signatures
- Never expose private keys or mnemonics in code
- Use testnet for development and testing

## Testing

Run tests:
```bash
npm test
```

## Troubleshooting

### Bot not responding
- Check bot token is correct
- Verify Redis is running
- Check logs for error messages

### TON transactions failing
- Ensure wallet has sufficient balance
- Verify network settings (mainnet/testnet)
- Check TON API key validity

### Mini app not loading
- Verify CORS settings
- Check Telegram Web App initialization
- Ensure HTTPS is configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on:
- Setting up the development environment
- Code style and conventions
- Submitting pull requests
- Reporting issues

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- [Anthropic MCP SDK](https://github.com/anthropics/mcp-sdk) - Model Context Protocol implementation
- [TON Documentation](https://docs.ton.org/) - TON Blockchain documentation
- [Telegram Bot API](https://core.telegram.org/bots/api) - Telegram Bot API reference

## Support

### 📚 Documentation
- [Production Deployment Guide](./PRODUCTION.md) - Complete production setup
- [Claude Desktop Setup](./docs/CLAUDE_DESKTOP_SETUP.md) - MCP integration
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) - Common issues
- [API Documentation](./docs/API.md) - Technical reference

### 🛠️ Quick Commands
```bash
# Health check
node healthcheck.js

# Validate setup
./scripts/validate-all.sh  

# View logs
docker-compose logs -f app
```

### 🆘 Getting Help
- 🐛 [GitHub Issues](https://github.com/anthropics/telegram-claude-mcp/issues)
- 💬 [GitHub Discussions](https://github.com/anthropics/telegram-claude-mcp/discussions) 
- 📖 Check logs first: `docker-compose logs -f`

### Security

For security vulnerabilities, please email security@anthropic.com instead of using the issue tracker.