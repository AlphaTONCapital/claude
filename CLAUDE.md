# Claude Code Assistant Rules - Telegram Claude MCP TON Connector

## 🚀 Project Overview
This is a Telegram bot with Claude AI integration, TON blockchain connectivity, JIRA project management, and MCP server implementation. The project requires strict adherence to testing, type safety, and integration validation workflows.

## 🔧 Environment Setup

### Required Environment Variables
Before any development work, verify these are configured in `.env.local`:
```bash
# Telegram Bot
BOT_TOKEN=                    # From BotFather
WEBHOOK_URL=                  # Production URL for webhook

# Claude AI
CLAUDE_API_KEY=               # Anthropic API key

# TON Blockchain
TON_WALLET_ADDRESS=           # Main wallet address
TON_TESTNET=                  # true/false
TON_API_ENDPOINT=            # TON API endpoint

# JIRA Integration
JIRA_API_KEY=                # JIRA API token
JIRA_DOMAIN=                 # JIRA instance domain
JIRA_EMAIL=                  # JIRA user email

# MCP Server
MCP_SERVER_PORT=             # Default: 3000
MCP_TRANSPORT=               # stdio/websocket

# Database
DATABASE_URL=                # PostgreSQL connection string
REDIS_URL=                   # Redis connection (optional)
```

## 📝 Development Workflow

### Before Starting ANY Task

1. **Run Health Checks**
   ```bash
   npm run test          # Run test suite
   npm run typecheck     # TypeScript validation
   npm run lint          # ESLint checks
   ```

2. **Verify Integrations**
   ```bash
   npm run test:jira     # Test JIRA connection
   npm run test:ton      # Test TON blockchain connection
   npm run test:bot      # Test Telegram bot
   ```

### 🎯 Task Management

When implementing features, follow this structure:

1. **Search and understand existing code**
   - Use Grep/Glob to find related implementations
   - Read existing service files before creating new ones
   - Check test files for usage examples

2. **Implement with proper structure**
   ```typescript
   // All new services should follow this pattern
   export class ServiceName {
     constructor(private config: ServiceConfig) {}
     
     async initialize(): Promise<void> {
       // Initialization logic with error handling
     }
     
     async shutdown(): Promise<void> {
       // Cleanup logic
     }
   }
   ```

3. **Test thoroughly**
   ```bash
   npm run test:unit     # Unit tests
   npm run test:integration  # Integration tests
   npm run test:coverage # Ensure >80% coverage
   ```

## 🏗️ Project Structure

```
src/
├── bot/                 # Telegram bot implementation
│   ├── bot.ts          # Main bot instance
│   ├── commands/       # Command handlers
│   ├── handlers/       # Message handlers
│   └── middleware/     # Bot middleware
├── services/           # Core services
│   ├── claude.ts       # Claude AI service
│   ├── ton.ts          # TON blockchain service
│   ├── jira.ts         # JIRA integration
│   └── mcp.ts          # MCP server
├── miniapp/            # Telegram Mini App
│   ├── app.tsx         # Main app component
│   ├── components/     # React components
│   └── hooks/          # Custom hooks
├── utils/              # Utilities
│   ├── logger.ts       # Logging utility
│   ├── validation.ts   # Input validation
│   └── crypto.ts       # Cryptography helpers
├── types/              # TypeScript definitions
└── tests/              # Test files
    ├── unit/          # Unit tests
    ├── integration/   # Integration tests
    └── fixtures/      # Test fixtures
```

## 🔒 Code Standards

### TypeScript Requirements
- **Strict mode enabled** - No `any` types
- **All functions must have return types**
- **Interfaces for all service contracts**
- **Proper error types for all exceptions**

### Error Handling Pattern
```typescript
// Required for all async operations
async function safeOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`${errorMessage}:`, error);
    throw new ServiceError(errorMessage, error);
  }
}
```

### Testing Requirements
- **Minimum 80% code coverage**
- **All new features must have tests**
- **Integration tests for external services**
- **Mock external dependencies in unit tests**

## 📊 Performance Standards

### Response Time Requirements
- Bot commands: <500ms response time
- TON transactions: <2s confirmation
- JIRA operations: <1s response
- MCP requests: <200ms response

### Resource Limits
- Memory usage: <512MB
- CPU usage: <50% average
- Database connections: Max 10 concurrent
- API rate limits: Respect all service limits

## 🚀 Deployment Checklist

Before deploying or committing:

1. **Run Full Validation**
   ```bash
   npm run validate:all
   ```
   This includes:
   - TypeScript compilation
   - Linting
   - All tests
   - Coverage check
   - Build verification

2. **Check Service Health**
   ```bash
   npm run health:check
   ```
   Verifies:
   - Database connection
   - External API access
   - Configuration validity

3. **Update Documentation**
   - Update API documentation if endpoints changed
   - Update README if setup changed
   - Update CHANGELOG for user-facing changes

## 🎯 Common Tasks

### Adding a New Bot Command
1. Create handler in `src/bot/commands/`
2. Register in `src/bot/bot.ts`
3. Add tests in `tests/unit/bot/commands/`
4. Update command list in bot settings

### Adding TON Functionality
1. Implement in `src/services/ton.ts`
2. Add types in `src/types/ton.ts`
3. Create integration tests
4. Update wallet management if needed

### Integrating with JIRA
1. Use existing `src/services/jira.ts`
2. Add new methods following existing patterns
3. Handle rate limiting and retries
4. Log all operations for audit

### Extending MCP Server
1. Add tools in `src/services/mcp.ts`
2. Define tool schemas properly
3. Implement handlers with error boundaries
4. Add corresponding tests

## ⚠️ Critical Rules

### NEVER:
- Commit API keys or secrets
- Skip tests before committing
- Ignore TypeScript errors
- Create files without tests
- Modify database schema without migration
- Deploy without running full validation

### ALWAYS:
- Run `npm run validate:all` before commits
- Check existing implementations before creating new files
- Handle errors properly with logging
- Use TypeScript strict mode
- Follow existing code patterns
- Test with both testnet and mainnet configs

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **Bot not responding**
   - Check BOT_TOKEN is valid
   - Verify webhook URL if using webhooks
   - Check bot polling if not using webhooks

2. **TON transactions failing**
   - Verify wallet has sufficient balance
   - Check network (testnet vs mainnet)
   - Review transaction parameters

3. **JIRA integration errors**
   - Validate API key and permissions
   - Check JIRA domain configuration
   - Review rate limiting

4. **MCP server issues**
   - Verify transport configuration
   - Check tool registration
   - Review request/response schemas

## 📝 Commit Message Format

```
type(scope): brief description

- Detailed change 1
- Detailed change 2

Tests: Added/Updated/Passed
Coverage: XX%
Breaking: Yes/No
```

Types: feat, fix, docs, style, refactor, test, chore
Scopes: bot, ton, jira, mcp, miniapp, utils

## 🚨 Pre-Commit Validation

The following MUST pass before any commit:
```bash
#!/bin/bash
set -e

echo "🔍 Running pre-commit validation..."

# 1. TypeScript
npm run typecheck
echo "✅ TypeScript validation passed"

# 2. Linting
npm run lint
echo "✅ ESLint validation passed"

# 3. Tests
npm run test
echo "✅ All tests passed"

# 4. Build
npm run build
echo "✅ Build successful"

# 5. Service checks (if configured)
npm run test:integrations 2>/dev/null || echo "⚠️ Integration tests skipped (services not configured)"

echo "🚀 Pre-commit validation completed successfully"
```

## 📚 Resources

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [TON Documentation](https://docs.ton.org/)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [MCP Specification](https://github.com/anthropics/mcp)
- [JIRA REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

## 🤝 Development Guidelines for Claude

When working on this project:

1. **Always check existing code first** - Use Grep/Glob before creating new files
2. **Follow established patterns** - Match the style of surrounding code
3. **Test as you go** - Run tests after each significant change
4. **Handle errors gracefully** - All async operations need error handling
5. **Document complex logic** - Add comments only when logic is non-obvious
6. **Validate inputs** - Check all external inputs before processing
7. **Log important operations** - Use appropriate log levels
8. **Respect rate limits** - Implement backoff for external APIs
9. **Clean up resources** - Properly close connections and clear timers
10. **Think about security** - Never log sensitive data, validate all inputs