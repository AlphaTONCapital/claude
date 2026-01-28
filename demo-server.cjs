const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// State management
let walletState = {
  address: 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
  balance: 5.234,
  staked: 0,
  tokens: {
    USDT: 150.00,
    NOT: 5000,
    STON: 25.5
  }
};

let pendingAction = null;

// API Routes
app.get('/api/wallet', (req, res) => {
  res.json(walletState);
});

app.post('/api/chat', (req, res) => {
  const { message, currentBalance } = req.body;
  const msg = message.toLowerCase();

  // Sync balance from client
  if (currentBalance !== undefined) {
    walletState.balance = currentBalance;
  }

  let response = '';
  let effects = [];

  // ==================== BALANCE CHECK ====================
  if (msg.includes('balance') || msg.includes("what's my") || msg.includes('how much')) {
    response = `📊 Your current balance is **${walletState.balance.toFixed(3)} TON** (~$${(walletState.balance * 1.53).toFixed(2)} USD)

Your token holdings:
• USDT: ${walletState.tokens.USDT.toFixed(2)}
• NOT: ${walletState.tokens.NOT.toLocaleString()}
• STON: ${walletState.tokens.STON.toFixed(1)}

💡 Your portfolio is looking healthy!`;

    effects = [
      { type: 'highlight_panel', panel: 'wallet-panel' },
      { type: 'toast', message: 'Balance retrieved', variant: 'info' }
    ];
  }

  // ==================== SPENDING ANALYSIS ====================
  else if (msg.includes('analyze') || msg.includes('spending') || msg.includes('history')) {
    response = `📊 **Spending Analysis (Last 7 Days)**

💸 Total Sent: 4.50 TON
💰 Total Received: 2.25 TON
📉 Net Flow: -2.25 TON

**By Category:**
• DeFi: 3.0 TON (67%)
• NFTs: 1.0 TON (22%)
• Payments: 0.5 TON (11%)

💡 Most spending is on DeFi. Consider staking for passive income!`;

    effects = [
      { type: 'highlight_panel', panel: 'tx-panel' },
      { type: 'toast', message: 'Analysis complete', variant: 'success' }
    ];
  }

  // ==================== SEND TON ====================
  else if (msg.includes('send') && (msg.includes('ton') || msg.includes('0.5') || msg.includes('1'))) {
    const amountMatch = msg.match(/([\d.]+)\s*ton/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0.5;

    pendingAction = { type: 'send', amount };

    response = `✅ **Transaction Prepared**

Amount: ${amount} TON (~$${(amount * 1.53).toFixed(2)})
To: EQBvW8Z5hu...
Network Fee: ~0.003 TON

After this transaction: ${(walletState.balance - amount - 0.003).toFixed(3)} TON remaining

Type **"confirm"** to send or **"cancel"** to abort.`;

    effects = [
      { type: 'highlight_panel', panel: 'wallet-panel' },
      { type: 'toast', message: 'Transaction ready', variant: 'info' }
    ];
  }

  // ==================== CONFIRM TRANSACTION ====================
  else if (msg.includes('confirm') && pendingAction) {
    if (pendingAction.type === 'send') {
      const newBalance = walletState.balance - pendingAction.amount - 0.003;
      const hash = 'tx_' + Math.random().toString(36).substring(2, 14);

      response = `🚀 **Transaction Sent!**

✅ Status: Confirmed
📝 Hash: ${hash}
💰 Amount: -${pendingAction.amount} TON
📍 New Balance: ${newBalance.toFixed(3)} TON

🔗 View on TONScan`;

      effects = [
        { type: 'balance_change', from: walletState.balance, to: newBalance },
        { type: 'add_transaction', tx: { hash, amount: `-${pendingAction.amount}`, comment: 'Transfer' } },
        { type: 'toast', message: 'Transaction confirmed!', variant: 'success' }
      ];

      walletState.balance = newBalance;
    }
    else if (pendingAction.type === 'stake') {
      const newBalance = walletState.balance - pendingAction.amount;

      response = `🔒 **Staking Confirmed!**

✅ Staked: ${pendingAction.amount} TON
📈 APY: 4.5%
💰 Est. Annual Reward: ~${(pendingAction.amount * 0.045).toFixed(3)} TON

Your TON is now earning yield. You can unstake anytime.`;

      effects = [
        { type: 'stake', amount: pendingAction.amount, apy: '4.5%' },
        { type: 'add_transaction', tx: { hash: 'stake_' + Date.now().toString(36), amount: `-${pendingAction.amount}`, comment: 'Staked to tsTON' } },
        { type: 'toast', message: 'Staking successful!', variant: 'success' }
      ];

      walletState.balance = newBalance;
      walletState.staked += pendingAction.amount;
    }
    else if (pendingAction.type === 'swap') {
      const { fromAmount, toToken, toAmount } = pendingAction;
      const newBalance = walletState.balance - fromAmount;

      response = `🔄 **Swap Completed!**

✅ Sold: ${fromAmount} TON
✅ Received: ${toAmount.toFixed(2)} ${toToken}
📊 Rate: 1 TON = ${(toAmount / fromAmount).toFixed(2)} ${toToken}

New ${toToken} balance: ${(walletState.tokens[toToken] + toAmount).toFixed(2)}`;

      effects = [
        { type: 'balance_change', from: walletState.balance, to: newBalance },
        { type: 'token_change', token: toToken, to: walletState.tokens[toToken] + toAmount },
        { type: 'add_transaction', tx: { hash: 'swap_' + Date.now().toString(36), amount: `-${fromAmount}`, comment: `Swap to ${toToken}` } },
        { type: 'toast', message: 'Swap successful!', variant: 'success' }
      ];

      walletState.balance = newBalance;
      walletState.tokens[toToken] += toAmount;
    }

    pendingAction = null;
  }

  // ==================== CANCEL ====================
  else if (msg.includes('cancel')) {
    pendingAction = null;
    response = `❌ Transaction cancelled. What else can I help you with?`;
    effects = [{ type: 'toast', message: 'Cancelled', variant: 'info' }];
  }

  // ==================== STAKING ====================
  else if (msg.includes('stake') || msg.includes('staking') || msg.includes('yield') || msg.includes('earn')) {
    if (msg.includes('stake') && msg.match(/stake\s+([\d.]+)/i)) {
      const amountMatch = msg.match(/([\d.]+)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 2;

      pendingAction = { type: 'stake', amount };

      response = `💰 **Stake ${amount} TON?**

Protocol: tsTON Liquid Staking
APY: 4.5%
Est. Annual Reward: ~${(amount * 0.045).toFixed(3)} TON (~$${(amount * 0.045 * 1.53).toFixed(2)})

✅ Instant unstake available
✅ No lockup period

Type **"confirm"** to stake or **"cancel"** to abort.`;

      effects = [{ type: 'highlight_panel', panel: 'wallet-panel' }];
    } else {
      response = `💰 **Staking Options**

**tsTON Liquid Staking**
• APY: 4.5%
• No lockup, instant unstake
• Min: 1 TON

**STON.fi LP (TON/USDT)**
• APY: 12-15%
• Impermanent loss risk

With ${walletState.balance.toFixed(3)} TON, you'd earn:
• ~$${(walletState.balance * 0.045 * 1.53).toFixed(2)}/year on tsTON

Say **"Stake 2 TON"** to get started!`;

      effects = [{ type: 'highlight_panel', panel: 'wallet-panel' }];
    }
  }

  // ==================== SWAP ====================
  else if (msg.includes('swap')) {
    if (msg.includes('ton') && (msg.includes('usdt') || msg.includes('for'))) {
      const amountMatch = msg.match(/([\d.]+)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 1;
      const usdtAmount = amount * 1.53;

      pendingAction = { type: 'swap', fromAmount: amount, toToken: 'USDT', toAmount: usdtAmount };

      response = `🔄 **Swap Preview**

Sell: ${amount} TON
Receive: ~${usdtAmount.toFixed(2)} USDT
Rate: 1 TON = $1.53 USDT
Fee: 0.3%

Slippage tolerance: 0.5%

Type **"confirm"** to swap or **"cancel"** to abort.`;

      effects = [{ type: 'highlight_panel', panel: 'wallet-panel' }];
    } else {
      response = `🔄 **Swap Tokens via STON.fi**

Current rates:
• 1 TON → 1.53 USDT
• 1 TON → 153 NOT
• 100 NOT → 1.00 USDT

Say **"Swap 1 TON for USDT"** to proceed!`;

      effects = [{ type: 'highlight_panel', panel: 'actions-panel' }];
    }
  }

  // ==================== NFT ====================
  else if (msg.includes('nft')) {
    response = `🖼️ **Your NFT Collection**

**TON Diamond #1234** 💎
• Collection: TON Diamonds
• Floor: 2.5 TON (~$3.83)
• Rarity: Top 15%

**Punk #5678** 👾
• Collection: TON Punks
• Floor: 15 TON (~$22.95)
• Rarity: Top 5%
• 📈 Up 3x from purchase!

Total NFT Value: ~17.5 TON (~$26.78)`;

    effects = [
      { type: 'highlight_panel', panel: 'nft-panel' },
      { type: 'toast', message: 'NFTs loaded', variant: 'info' }
    ];
  }

  // ==================== DEFAULT ====================
  else {
    response = `I'm Claude, your AI wallet assistant! Try:

• **"What's my balance?"** - Check your TON
• **"Analyze my spending"** - See spending patterns
• **"Send 0.5 TON"** - Transfer funds
• **"Stake 2 TON"** - Earn yield
• **"Swap 1 TON for USDT"** - Exchange tokens
• **"Show my NFTs"** - View collection`;

    effects = [];
  }

  // Add delay for realistic feel
  setTimeout(() => {
    res.json({ response, effects });
  }, 800);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = 3456;
app.listen(PORT, () => {
  console.log(`\n🚀 Demo server running at http://localhost:${PORT}/dashboard.html\n`);
  console.log('Demo commands to try:');
  console.log('  "What\'s my balance?"');
  console.log('  "Analyze my spending"');
  console.log('  "Send 0.5 TON"');
  console.log('  "confirm"');
  console.log('  "Stake 2 TON"');
  console.log('  "Swap 1 TON for USDT"');
  console.log('');
});
