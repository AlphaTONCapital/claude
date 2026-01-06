# API Documentation

## MCP Tools Reference

The Telegram Claude MCP TON Connector provides comprehensive Model Context Protocol tools for interacting with the TON blockchain, Telegram bot, and JIRA integration.

## TON Blockchain Tools

### `ton_get_wallet_info`

Get comprehensive wallet information including address, balance, and sequence number.

**Parameters:** None (uses configured wallet)

**Returns:**
```json
{
  "address": "EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2",
  "balance": "1.234567890",
  "seqno": 42,
  "workchain": 0
}
```

### `ton_get_balance`

Check TON balance for any address.

**Parameters:**
- `address` (optional): TON address to check. Uses wallet address if not provided.

**Returns:**
```json
{
  "balance": "1.234567890",
  "address": "EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2"
}
```

### `ton_send_transaction`

Send TON tokens to another address.

**Parameters:**
- `to` (required): Recipient TON address
- `amount` (required): Amount in TON (string)
- `comment` (optional): Transaction comment

**Returns:**
```json
{
  "hash": "abc123...",
  "success": true,
  "seqno": 43
}
```

### `ton_validate_address`

Validate a TON address format.

**Parameters:**
- `address` (required): Address to validate

**Returns:**
```json
{
  "valid": true,
  "address": "EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2"
}
```

### `ton_get_transaction_status`

Get the status of a transaction by hash.

**Parameters:**
- `hash` (required): Transaction hash

**Returns:**
```json
{
  "hash": "abc123...",
  "status": "confirmed",
  "lt": "123456789",
  "now": 1640995200,
  "fee": "0.001"
}
```

### `ton_get_transaction_history`

Get transaction history for an address.

**Parameters:**
- `address` (optional): Address to get history for
- `limit` (optional): Number of transactions to return (default: 10)

**Returns:**
```json
{
  "transactions": [
    {
      "hash": "abc123...",
      "type": "out",
      "amount": "1.0",
      "fee": "0.001",
      "comment": "Payment",
      "timestamp": 1640995200
    }
  ]
}
```

### `ton_estimate_fee`

Estimate transaction fee for a transfer.

**Parameters:**
- `to` (required): Recipient address
- `amount` (required): Amount to send
- `comment` (optional): Transaction comment

**Returns:**
```json
{
  "fee": "0.001234",
  "gasFee": "0.001000",
  "storageFee": "0.000234"
}
```

### `ton_create_wallet`

Create a new TON wallet.

**Parameters:**
- `version` (optional): Wallet version (default: "v4R2")

**Returns:**
```json
{
  "address": "EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2",
  "mnemonic": ["word1", "word2", "..."],
  "publicKey": "abc123...",
  "version": "v4R2"
}
```

## JIRA Integration Tools

### `jira_create_issue`

Create a new JIRA issue.

**Parameters:**
- `summary` (required): Issue title
- `description` (optional): Issue description
- `issueType` (required): "Task", "Bug", "Story", or "Epic"
- `assignee` (optional): Email of assignee
- `priority` (optional): "Highest", "High", "Medium", "Low", "Lowest"
- `labels` (optional): Array of label strings

**Returns:**
```json
{
  "key": "TCMCP-123",
  "id": "10001",
  "self": "https://domain.atlassian.net/rest/api/3/issue/10001"
}
```

### `jira_get_issue`

Get details of a JIRA issue.

**Parameters:**
- `issueKey` (required): JIRA issue key (e.g., "TCMCP-123")

**Returns:**
```json
{
  "key": "TCMCP-123",
  "fields": {
    "summary": "Issue title",
    "description": "Issue description",
    "status": { "name": "To Do" },
    "assignee": { "displayName": "John Doe" },
    "priority": { "name": "High" }
  }
}
```

### `jira_search_issues`

Search for JIRA issues using JQL.

**Parameters:**
- `jql` (required): JIRA Query Language string

**Returns:**
```json
{
  "issues": [
    {
      "key": "TCMCP-123",
      "fields": { "summary": "Issue title" }
    }
  ],
  "total": 1
}
```

### `jira_update_issue`

Update a JIRA issue.

**Parameters:**
- `issueKey` (required): Issue key to update
- `updates` (required): Object with fields to update

**Returns:**
```json
{
  "success": true,
  "message": "Issue TCMCP-123 updated successfully"
}
```

### `jira_transition_issue`

Change the status of a JIRA issue.

**Parameters:**
- `issueKey` (required): Issue key
- `transitionName` (required): Name of transition (e.g., "Done", "In Progress")

**Returns:**
```json
{
  "success": true,
  "message": "Issue TCMCP-123 transitioned to Done"
}
```

### `jira_create_project_tasks`

Create all predefined project tasks with assignments.

**Parameters:** None

**Returns:**
```json
{
  "created": 18,
  "tasks": ["TCMCP-1", "TCMCP-2", "..."]
}
```

## Telegram Bot Tools

### `telegram_send_message`

Send a message to a Telegram user.

**Parameters:**
- `chatId` (required): Telegram chat ID
- `text` (required): Message text
- `parseMode` (optional): "Markdown" or "HTML"

**Returns:**
```json
{
  "messageId": 123,
  "success": true
}
```

### `telegram_broadcast_message`

Broadcast a message to all bot users.

**Parameters:**
- `text` (required): Message to broadcast

**Returns:**
```json
{
  "sent": 150,
  "failed": 2,
  "total": 152
}
```

### `telegram_get_user_stats`

Get statistics about bot users.

**Parameters:** None

**Returns:**
```json
{
  "totalUsers": 152,
  "activeUsers": 89,
  "todayMessages": 234
}
```

## Error Responses

All tools return structured error responses when operations fail:

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common error codes:
- `INVALID_ADDRESS`: Invalid TON address format
- `INSUFFICIENT_BALANCE`: Not enough TON for transaction
- `NETWORK_ERROR`: Blockchain network error
- `AUTH_ERROR`: Authentication failure
- `VALIDATION_ERROR`: Input validation failed
- `RATE_LIMITED`: Too many requests

## Rate Limits

- TON API: 10 requests per second
- JIRA API: 150 requests per hour
- Telegram API: 30 messages per second
- Claude API: 50 requests per minute

## Authentication

### TON Blockchain
- Wallet authentication via mnemonic phrase
- API key for enhanced features (optional)

### JIRA Integration
- Basic authentication with email and API token
- Domain-specific configuration

### Telegram
- Bot token authentication
- User ID-based authorization
- Admin user verification

## Best Practices

1. **Error Handling**: Always check for error responses
2. **Rate Limiting**: Implement backoff strategies
3. **Security**: Never expose private keys or tokens
4. **Validation**: Validate addresses and amounts before transactions
5. **Logging**: Log operations for debugging and auditing
6. **Testing**: Use testnet for development and testing

## SDK Integration

### Node.js Example

```javascript
import { TonService } from './services/ton.js';

const tonService = new TonService({
  network: 'testnet',
  apiKey: process.env.TON_API_KEY,
  walletMnemonic: process.env.TON_WALLET_MNEMONIC
});

// Get wallet balance
const balance = await tonService.getBalance();
console.log(`Balance: ${balance} TON`);

// Send transaction
const tx = await tonService.sendTransaction(
  'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
  '1.0',
  'Payment'
);
console.log(`Transaction hash: ${tx.hash}`);
```

### MCP Client Example

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: "telegram-claude-mcp",
  version: "1.0.0"
});

// Call TON tool
const result = await client.callTool({
  name: 'ton_get_balance',
  arguments: {
    address: 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2'
  }
});

console.log(result);
```