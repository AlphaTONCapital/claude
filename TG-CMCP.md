# TON Claude MCP - Telegram Mini App Demo Guide

**Version:** 1.0.0
**Demo Duration:** ~5 minutes
**Target Audience:** Lawyers, Stakeholders, Technical Evaluators

---

## Table of Contents

1. [Overview](#overview)
2. [Application Architecture](#application-architecture)
3. [Configuration & Customization](#configuration--customization)
4. [Demo Script](#demo-script)
   - [0:00 - App Launch & Introduction](#000---app-launch--introduction)
   - [0:30 - Balance Check](#030---balance-check)
   - [1:00 - Spending Analysis](#100---spending-analysis)
   - [1:30 - Send Transaction](#130---send-transaction)
   - [2:15 - Transaction Confirmation](#215---transaction-confirmation)
   - [2:45 - Token Swap](#245---token-swap)
   - [3:30 - Staking](#330---staking)
   - [4:15 - NFT Collection](#415---nft-collection)
   - [4:45 - Tab Navigation Demo](#445---tab-navigation-demo)
5. [Features Demonstrated](#features-demonstrated)
6. [API Integrations](#api-integrations)
7. [Security Considerations](#security-considerations)
8. [Open Source & Customization](#open-source--customization)

---

## Overview

TON Claude MCP is a **mobile-first Telegram Mini App** that combines:
- **Claude AI** as an intelligent wallet assistant
- **TON Blockchain** integration for transactions
- **Real-time UI feedback** showing AI actions affecting wallet state

The application demonstrates how conversational AI can safely manage cryptocurrency operations with human-in-the-loop confirmation for all financial actions.

### Key Value Propositions

| Feature | Benefit |
|---------|---------|
| Conversational Interface | Natural language wallet management |
| Visual Feedback | See AI actions reflected in real-time |
| Human Confirmation | All transactions require explicit approval |
| Open Source | Fully customizable and auditable |

---

## Application Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Telegram Mini App                    │
│  ┌─────────────────────────────────────────────┐    │
│  │              Chat Interface                  │    │
│  │         (Claude AI Assistant)                │    │
│  └─────────────────────────────────────────────┘    │
│                        │                             │
│  ┌─────────┬─────────┬─────────┬─────────┬────────┐ │
│  │  Chat   │ Wallet  │Activity │  NFTs   │ Market │ │
│  │   Tab   │   Tab   │   Tab   │   Tab   │   Tab  │ │
│  └─────────┴─────────┴─────────┴─────────┴────────┘ │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                  Backend Server                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  Chat API    │  │  Wallet API  │                 │
│  └──────────────┘  └──────────────┘                 │
│                        │                             │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │   TON SDK    │  │   Claude AI  │                 │
│  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────┘
```

---

## Configuration & Customization

This is a **user-customizable open source application**. Users can enter their own credentials for all services.

### Required Environment Variables

Create a `.env.local` file with your credentials:

```bash
# Telegram Bot (Create via @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Claude AI (Get from console.anthropic.com)
ANTHROPIC_API_KEY=your_anthropic_key_here

# TON Blockchain (Optional - for real transactions)
TON_API_KEY=your_toncenter_api_key
TON_WALLET_MNEMONIC=your_wallet_mnemonic

# Redis (for session management)
REDIS_URL=redis://localhost:6379
```

### How to Get Credentials

| Service | How to Obtain |
|---------|---------------|
| Telegram Bot Token | Message @BotFather on Telegram, create new bot |
| Anthropic API Key | Sign up at console.anthropic.com |
| TON API Key | Register at toncenter.com |
| Redis | Local install or cloud service (Upstash, Redis Cloud) |

---

## Demo Script

### 0:00 - App Launch & Introduction

**Timestamp: 0:00 - 0:30**

**What to Show:**
- Open Telegram and launch the Mini App
- Show the clean mobile interface
- Point out the key UI elements:
  - Header with TON price ($1.53)
  - Balance bar showing 5.234 TON
  - Tab navigation (Chat, Wallet, Activity, NFTs, Market)
  - Chat interface with Claude's welcome message

**Script:**
> "This is TON Claude MCP, an AI-powered wallet assistant built as a Telegram Mini App. The interface is mobile-first, with chat as the primary interaction method. Notice the live TON price and your wallet balance always visible at the top."

**Features Visible:**
- [ ] Header with price ticker
- [ ] Balance bar with TON amount
- [ ] Tab navigation bar
- [ ] Welcome message from Claude

---

### 0:30 - Balance Check

**Timestamp: 0:30 - 1:00**

**User Input:**
```
What's my balance?
```

**Expected Response:**
Claude shows detailed balance breakdown with portfolio analysis.

**Visual Effects:**
1. User message appears in blue bubble
2. Typing indicator shows (3 bouncing dots)
3. Claude's response appears with:
   - "WALLET API" tool badge
   - Timestamp
4. **Wallet tab glows cyan** - indicating data was fetched

**What to Point Out:**
> "When I ask about my balance, notice how the Wallet tab lights up. This shows Claude is actually querying the wallet API. The tool badge in the message shows which APIs were used."

---

### 1:00 - Spending Analysis

**Timestamp: 1:00 - 1:30**

**User Input:**
```
Analyze my spending
```

**Expected Response:**
Claude provides spending breakdown by category with insights.

**Visual Effects:**
1. **Activity tab glows** - transaction data being analyzed
2. Response includes spending categories (DeFi, NFTs, Payments)
3. Suggestions for optimization

**What to Point Out:**
> "Claude analyzes my transaction history and categorizes spending. Notice the Activity tab glowing - that's the AI accessing my transaction data. It even provides actionable suggestions like staking for passive income."

---

### 1:30 - Send Transaction

**Timestamp: 1:30 - 2:15**

**User Input:**
```
Send 0.5 TON
```

**Expected Response:**
Claude prepares the transaction but **does not execute** - waits for confirmation.

**Visual Effects:**
1. Transaction preview appears
2. "SEND TX" tool badge (orange)
3. **Wallet tab glows**
4. Claude asks: "Type 'confirm' to send or 'cancel' to abort"

**Critical Security Point:**
> "This is crucial - Claude prepared the transaction but did NOT send it. The AI always requires explicit human confirmation before any financial action. This is the human-in-the-loop safety pattern."

**Show in Response:**
- Amount: 0.5 TON
- Network fee estimate
- New balance after transaction

---

### 2:15 - Transaction Confirmation

**Timestamp: 2:15 - 2:45**

**User Input:**
```
confirm
```

**Expected Response:**
Transaction is executed with full visual feedback.

**Visual Effects (in sequence):**
1. **Balance animates down**: 5.234 → 4.731 TON (smooth counting animation)
2. **Toast notification**: "Transaction confirmed!" (green, top of screen)
3. **Activity tab glows and shows badge "1"** - new transaction
4. Response shows:
   - Transaction hash
   - Status: Confirmed
   - Multiple tool badges: "SEND TX" + "WALLET API"

**What to Point Out:**
> "Watch the balance - it animates in real-time. The toast confirms the transaction. Notice the Activity tab is glowing with a badge - that means there's a new transaction to view."

**Click Activity Tab:**
Show the new transaction at the top of the list with "Just now" timestamp.

---

### 2:45 - Token Swap

**Timestamp: 2:45 - 3:30**

**User Input:**
```
Swap 1 TON for USDT
```

**Expected Response:**
Swap preview with exchange rate and slippage.

**Visual Effects:**
1. "DEX SWAP" tool badge (purple)
2. Shows rate: 1 TON = 1.53 USDT
3. Fee: 0.3%

**User Input:**
```
confirm
```

**Visual Effects After Confirm:**
1. **Balance animates**: 4.731 → 3.731 TON
2. **USDT balance updates**: 150.00 → 151.53 (with green flash)
3. **Wallet tab glows with badge**
4. Toast: "Swap successful!"

**What to Point Out:**
> "The swap happens through STON.fi DEX. Notice both the TON balance going down and the USDT balance going up - with a nice green flash to highlight the increase."

---

### 3:30 - Staking

**Timestamp: 3:30 - 4:15**

**User Input:**
```
Stake 2 TON
```

**Expected Response:**
Staking options with APY information.

**Visual Effects:**
1. "STAKING" tool badge (orange)
2. Shows APY: 4.5%
3. Annual reward estimate

**User Input:**
```
confirm
```

**Visual Effects After Confirm:**
1. **Balance animates down**: 3.731 → 1.731 TON
2. **Staking badge appears** in balance bar: "🔒 2.00 Staked"
3. **Wallet tab glows**
4. Toast: "Staking successful!"

**What to Point Out:**
> "After staking, notice the new staking badge that appeared next to the balance. This shows your staked TON at a glance. The 4.5% APY means you'd earn about 0.09 TON per year on this stake."

---

### 4:15 - NFT Collection

**Timestamp: 4:15 - 4:45**

**User Input:**
```
Show my NFTs
```

**Expected Response:**
NFT collection with floor prices and rarity.

**Visual Effects:**
1. "NFT API" tool badge (pink)
2. **NFTs tab glows**
3. Response lists NFTs with values

**Click NFTs Tab:**
Show the visual NFT grid with:
- Diamond #1234 (Floor: 2.5 TON)
- Punk #5678 (Floor: 15 TON)

**What to Point Out:**
> "The NFT tab lit up when Claude queried my collection. Click it to see the visual gallery. Floor prices are pulled from TON marketplaces."

---

### 4:45 - Tab Navigation Demo

**Timestamp: 4:45 - 5:00**

**Walk Through Each Tab:**

1. **Wallet Tab** - Full token list with quick action buttons (Send, Swap, Stake, Receive)
2. **Activity Tab** - Transaction history with new transaction at top
3. **NFTs Tab** - Visual NFT gallery
4. **Market Tab** - TON price, volume, market cap, rank, TVL

**What to Point Out:**
> "Each tab provides detailed information. The chat remains the primary interface, but these tabs let you dive deeper. When actions happen in chat, the relevant tabs glow to draw your attention."

---

## Features Demonstrated

| Timestamp | Feature | Visual Indicator |
|-----------|---------|------------------|
| 0:00 | App Launch | Mobile-first UI |
| 0:30 | Balance Query | Wallet API badge, tab glow |
| 1:00 | Spending Analysis | Activity tab glow |
| 1:30 | Transaction Prep | SEND TX badge, no auto-execute |
| 2:15 | Transaction Confirm | Balance animation, toast, activity badge |
| 2:45 | Token Swap | DEX SWAP badge, token flash |
| 3:30 | Staking | Staking badge appears |
| 4:15 | NFT Query | NFT API badge, tab glow |
| 4:45 | Tab Navigation | All panels accessible |

---

## API Integrations

| API | Purpose | Authentication |
|-----|---------|----------------|
| Claude AI | Natural language understanding, intent extraction | Anthropic API Key |
| TON Center | Blockchain queries, transaction submission | TON API Key |
| STON.fi | DEX swaps, liquidity | Public API |
| GetGems | NFT data, floor prices | Public API |
| CoinGecko | TON price, market data | Public API |

---

## Security Considerations

### Human-in-the-Loop Pattern
- **All financial actions require explicit confirmation**
- Claude never auto-executes transactions
- User must type "confirm" to proceed

### Credential Security
- Bot tokens stored in `.env.local` (gitignored)
- API keys never exposed to frontend
- Telegram Web App validation on backend

### Transaction Safety
- Transaction preview before execution
- Fee estimation shown upfront
- New balance calculated before confirmation

---

## Open Source & Customization

### Repository Structure

```
telegram-claude-mcp/
├── public/
│   └── dashboard.html      # Telegram Mini App UI
├── demo-server.cjs         # Demo backend (simulated)
├── src/
│   ├── bot/               # Telegram bot handlers
│   ├── services/          # TON, Claude, JIRA integrations
│   └── mcp/               # MCP server implementation
├── .env.example           # Configuration template
└── TG-CMCP.md            # This documentation
```

### Customization Points

1. **AI Personality**: Modify Claude's system prompt in `src/services/claude.ts`
2. **Supported Tokens**: Add tokens in `demo-server.cjs` token list
3. **UI Theme**: CSS variables in `dashboard.html` for Telegram theme integration
4. **New Features**: Add tools in MCP server for Claude to use

### Running Your Own Instance

```bash
# 1. Clone the repository
git clone https://github.com/your-org/telegram-claude-mcp.git
cd telegram-claude-mcp

# 2. Install dependencies
npm install

# 3. Copy and configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run the demo server
node demo-server.cjs

# 5. Open in browser or configure as Telegram Mini App
# Browser: http://localhost:3456/dashboard.html
# Telegram: Configure bot with menu button pointing to your hosted URL
```

---

## Summary

TON Claude MCP demonstrates:

1. **Conversational Crypto Management** - Natural language interface for wallet operations
2. **Visual AI Feedback** - See exactly what the AI is doing via glowing tabs and tool badges
3. **Human-in-the-Loop Safety** - All transactions require explicit user confirmation
4. **Open Source Flexibility** - Users provide their own credentials; fully customizable
5. **Mobile-First Design** - Optimized for Telegram Mini App experience

The combination of Claude's intelligence with explicit human approval creates a powerful yet safe interface for managing cryptocurrency assets.

---

*Document Version: 1.0.0*
*Last Updated: January 2026*
*Created for LARP Assessment Presentation*
