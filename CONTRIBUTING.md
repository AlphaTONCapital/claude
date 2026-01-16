# Contributing to Telegram Claude MCP TON Connector

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Quick Start for Contributors

1. **Fork and clone the repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/telegram-claude-mcp.git
   cd telegram-claude-mcp
   ```

2. **Set up development environment**
   ```bash
   ./scripts/quick-start.sh
   ```

3. **Create a branch for your feature**
   ```bash
   git checkout -b feature/my-new-feature
   ```

4. **Make your changes and test**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

5. **Submit a pull request**

## Development Setup

### Prerequisites

- Node.js 20+ and npm
- Redis server (for testing)
- Docker (optional, for full testing)

### Environment Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure your test environment:**
   Edit `.env.local` with test API keys:
   ```bash
   # Use testnet for development
   TON_NETWORK=testnet
   TON_TESTNET=true
   
   # Test bot token (create a separate bot for testing)
   TELEGRAM_BOT_TOKEN=your_test_bot_token
   
   # Use test API keys
   ANTHROPIC_API_KEY=your_test_api_key
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Testing

We maintain comprehensive test coverage. Please ensure all tests pass:

```bash
# Run all tests
npm test

# Run with coverage
npm run test -- --coverage

# Run specific test files
npm test src/services/claude.test.ts

# Run integration tests
npm run test:integration
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Auto-fix issues
npm run lint -- --fix

# Check TypeScript
npm run typecheck
```

### Code Guidelines

1. **TypeScript**: All code must be properly typed
2. **Testing**: New features require tests (aim for 80%+ coverage)
3. **Documentation**: Update docs for user-facing changes
4. **Error Handling**: Use proper error handling patterns
5. **Security**: Never commit secrets or private keys

## Pull Request Process

1. **Update documentation** if you're changing user-facing functionality
2. **Add tests** for new features or bug fixes
3. **Ensure CI passes** - all tests, linting, and type checking must pass
4. **Update the changelog** for significant changes
5. **Request review** from maintainers

### PR Guidelines

- **Title**: Use descriptive titles (e.g., "Add TON NFT support" not "Update ton.ts")
- **Description**: Explain what and why, not just how
- **Size**: Keep PRs focused and reasonably sized
- **Tests**: Include test cases for new functionality
- **Documentation**: Update relevant docs

## Issue Reporting

### Bug Reports

Great bug reports tend to have:

- **Quick summary** and/or background
- **Steps to reproduce** - be specific!
- **What you expected** would happen
- **What actually happens**
- **Environment details** (OS, Node version, etc.)
- **Additional context** like screenshots, logs

Use our bug report template when creating issues.

### Feature Requests

We welcome feature requests! Please:

- **Check existing issues** first
- **Describe the problem** you're trying to solve
- **Propose a solution** if you have ideas
- **Consider alternatives** - are there other ways to solve this?

## Architecture Guidelines

### Project Structure

```
src/
├── bot/           # Telegram bot implementation
├── services/      # Core business logic
├── mcp/          # MCP protocol handlers
├── utils/        # Shared utilities
├── types/        # TypeScript definitions
└── config/       # Configuration management
```

### Service Pattern

New services should follow this pattern:

```typescript
export class MyService {
  constructor(private config: MyServiceConfig) {}
  
  async initialize(): Promise<void> {
    // Setup logic with error handling
  }
  
  async shutdown(): Promise<void> {
    // Cleanup logic
  }
  
  // Public methods with proper error handling
}
```

### MCP Tools

When adding MCP tools:

1. **Define the tool** in the appropriate handler file
2. **Add comprehensive input validation**
3. **Include proper error responses**
4. **Write integration tests**
5. **Update documentation**

### Error Handling

Use this pattern for service methods:

```typescript
async function serviceMethod(input: InputType): Promise<OutputType> {
  try {
    // Main logic
    return result;
  } catch (error) {
    logger.error('Service method failed:', error);
    throw new ServiceError('User-friendly message', error);
  }
}
```

## Security Guidelines

- **Never commit secrets** - use environment variables
- **Validate all inputs** - especially from external APIs
- **Use HTTPS** for all external communications
- **Follow principle of least privilege**
- **Audit dependencies** regularly

## Documentation

### Code Documentation

- **JSDoc comments** for public APIs
- **Inline comments** for complex logic only
- **README updates** for user-facing changes

### API Documentation

Update `docs/API.md` when adding new MCP tools or changing existing ones.

## Release Process

Releases are handled by maintainers:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Tag the release
4. Publish to npm (if applicable)

## Getting Help

- **GitHub Discussions** - for questions and general discussion
- **GitHub Issues** - for bugs and feature requests
- **Code Review** - maintainers will help with PRs

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). By participating, you agree to uphold this code.

### Our Standards

- **Be respectful** and inclusive
- **Accept constructive criticism** gracefully  
- **Focus on what's best** for the community
- **Show empathy** towards other contributors

## Recognition

Contributors are recognized in:
- GitHub contributor graphs
- Release notes for significant contributions
- Optional: AUTHORS file for major contributors

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Quick Reference

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm test               # Run tests
npm run lint           # Check code style

# Validation
./scripts/validate-all.sh   # Full validation
node healthcheck.js        # Health check

# Docker
docker-compose up -d       # Start services
./scripts/deploy.sh        # Production deploy
```

### File Structure

```bash
# Core files to know
src/index.ts              # Main entry point
src/config/index.ts       # Configuration
src/mcp/handlers.ts       # MCP tool definitions
src/services/            # Business logic
tests/                   # Test files
```

Thank you for contributing! 🚀