# Claude Desktop MCP Setup Guide

This guide shows how to connect the Telegram Claude MCP TON Connector to Claude Desktop, enabling you to use Telegram, TON blockchain, and JIRA tools directly from Claude.

## Prerequisites

1. **Claude Desktop** installed on your machine
2. **Telegram Claude MCP Connector** deployed and running
3. All environment variables configured in `.env.production`

## Setup Instructions

### 1. Locate Claude Desktop Configuration

Find your Claude Desktop configuration directory:

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

### 2. Add MCP Server Configuration

Edit the `claude_desktop_config.json` file and add the MCP server configuration:

```json
{
  "mcpServers": {
    "telegram-claude-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/your/telegram-claude-mcp",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Important:** Replace `/path/to/your/telegram-claude-mcp` with the actual path where you deployed the connector.

### 3. Alternative: NPM Start Configuration

If you prefer to use npm start:

```json
{
  "mcpServers": {
    "telegram-claude-mcp": {
      "command": "npm",
      "args": ["start"],
      "cwd": "/path/to/your/telegram-claude-mcp",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 4. Docker Deployment Configuration

If you're running the connector in Docker:

```json
{
  "mcpServers": {
    "telegram-claude-mcp": {
      "command": "docker",
      "args": [
        "exec", 
        "telegram-claude-mcp", 
        "node", 
        "dist/index.js"
      ]
    }
  }
}
```

### 5. Remote Server Configuration

For remote deployments, you can use SSH:

```json
{
  "mcpServers": {
    "telegram-claude-mcp": {
      "command": "ssh",
      "args": [
        "user@your-server.com",
        "cd /path/to/telegram-claude-mcp && npm start"
      ]
    }
  }
}
```

## Available Tools

Once connected, you'll have access to these MCP tools:

### Telegram Tools
- `send_telegram_message` - Send messages to Telegram chats
- `get_conversation_history` - Retrieve chat history
- `clear_conversation` - Clear conversation data
- `broadcast_message` - Send messages to all users
- `get_bot_stats` - Get bot usage statistics

### TON Blockchain Tools
- `ton_get_wallet_info` - Get wallet information
- `ton_get_balance` - Check TON balance
- `ton_send_transaction` - Send TON transactions
- `ton_get_transaction_status` - Check transaction status
- `ton_get_transaction_history` - Get transaction history
- `ton_validate_address` - Validate TON addresses
- `ton_get_jetton_balance` - Get Jetton token balance
- `ton_get_nft_info` - Get NFT information

### JIRA Tools (if enabled)
- `jira_create_issue` - Create JIRA issues
- `jira_get_issue` - Get issue details
- `jira_update_issue` - Update existing issues
- `jira_transition_issue` - Change issue status
- `jira_search_issues` - Search issues with JQL
- `jira_create_board` - Create JIRA boards
- `jira_get_boards` - List all boards
- `jira_get_board_issues` - Get issues from a board
- `jira_create_project_tasks` - Create predefined tasks

## Available Resources

Access these MCP resources:

- `telegram://conversations` - All active conversations
- `telegram://stats` - Bot usage statistics  
- `ton://wallet` - TON wallet information
- `ton://transactions` - Recent TON transactions
- `jira://boards` - JIRA boards (if enabled)
- `jira://issues` - JIRA issues (if enabled)

## Testing the Connection

1. **Restart Claude Desktop** after making configuration changes

2. **Test basic functionality** by asking Claude to use a tool:
   ```
   Please get the bot statistics using the get_bot_stats tool
   ```

3. **Verify MCP connection** by checking if Claude can see the tools:
   ```
   What MCP tools do you have access to?
   ```

## Troubleshooting

### Connection Issues

1. **Check file paths** - Ensure the `cwd` path is correct
2. **Verify permissions** - Make sure Claude Desktop can access the directory
3. **Check logs** - Look at Claude Desktop console for error messages
4. **Environment variables** - Ensure all required env vars are set

### Common Error Messages

**"Command not found"**
- Verify Node.js is installed and in PATH
- Check the correct path to your project

**"Permission denied"**
- Ensure Claude Desktop has read access to the project directory
- Check file permissions on the executable

**"Environment variable missing"**
- Copy `.env.production` to `.env` if needed
- Verify all required API keys are configured

### Debug Mode

Enable debug logging by adding to your environment:

```json
{
  "mcpServers": {
    "telegram-claude-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/your/telegram-claude-mcp",
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## Security Considerations

1. **API Keys** - Keep your configuration file secure
2. **File Permissions** - Limit access to the config directory
3. **Network Access** - Ensure firewall allows necessary connections
4. **Updates** - Keep Claude Desktop and the connector updated

## Advanced Configuration

### Multiple Instances

You can run multiple instances for different environments:

```json
{
  "mcpServers": {
    "telegram-mcp-prod": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/production/telegram-claude-mcp",
      "env": {
        "NODE_ENV": "production"
      }
    },
    "telegram-mcp-staging": {
      "command": "node", 
      "args": ["dist/index.js"],
      "cwd": "/path/to/staging/telegram-claude-mcp",
      "env": {
        "NODE_ENV": "staging"
      }
    }
  }
}
```

### Custom Environment Variables

Pass additional configuration:

```json
{
  "mcpServers": {
    "telegram-claude-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/telegram-claude-mcp",
      "env": {
        "NODE_ENV": "production",
        "TELEGRAM_BOT_TOKEN": "your_token",
        "ANTHROPIC_API_KEY": "your_key",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Support

If you encounter issues:

1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review application logs in `/var/log/telegram-claude-mcp/`
3. Verify all services are running: Redis, Telegram Bot, TON API access
4. Test the connector independently before connecting to Claude Desktop

For additional help, refer to the [Claude MCP documentation](https://docs.anthropic.com/claude/docs/mcp) or file an issue in the project repository.