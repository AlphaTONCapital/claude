# LARP Assessment Demo Guide

## Demo Overview
This demo showcases the transformation of a Telegram-Claude-TON MCP connector from "performative" code (LARP) to production-ready implementation. We fixed 23 issues where code appeared functional but was actually stubbed, fake, or broken.

---

## Pre-Demo Setup (Before Recording)

```bash
# Navigate to the project
cd /Users/futjr/.claude-worktrees/telegram-claude-mcp/elegant-raman

# Ensure dependencies are installed
npm install

# Verify everything works
npm run typecheck && npm test && npm run build
```

---

## Demo Script (10-15 minutes)

### Part 1: Introduction (1 min)
**What to say:**
> "Today I'm demoing a LARP assessment - that's 'Look-Alike Real Program' - where we identify code that appears functional but is actually performative or stubbed. This is a Telegram bot with Claude AI and TON blockchain integration."

**Show:**
- Open the project in your IDE
- Briefly show the project structure

---

### Part 2: Show the Problem - Before State (3 min)

**Open the plan file to show what was found:**
```bash
cat /Users/futjr/.claude/plans/compiled-sprouting-panda.md
```

**Key points to highlight:**

1. **Fake Transaction Hashes** - Show the issue description:
   > "Transaction hashes were `tx_${Date.now()}_${seqno}` - you couldn't track real transactions on the blockchain."

2. **Stubbed Functions** - Mention:
   > "The `getJettonBalance()` function just threw 'not implemented'. The `deployContract()` returned fake hashes."

3. **No-Op Decorators** - Show:
   > "The cache invalidation decorator had its implementation commented out - it literally did nothing."

4. **Hardcoded Settings** - Mention:
   > "The `/settings` command showed hardcoded values instead of actual config."

---

### Part 3: Show the Fixes - Code Walkthrough (5 min)

#### Fix 1: Real Transaction Hashes
**Open:** `src/services/ton.ts`

**Navigate to line ~187 and show `waitForTransaction()`:**
```typescript
private async waitForTransaction(seqno: number, maxAttempts: number = 30, intervalMs: number = 1000): Promise<string> {
  // ... polls blockchain until transaction confirms
  // Returns REAL hash: transactions[0].hash().toString('hex')
}
```

**What to say:**
> "Now we poll the blockchain until the transaction confirms, then return the actual transaction hash from the blockchain explorer."

#### Fix 2: Jetton Balance Implementation
**Navigate to line ~329 and show `getJettonBalance()`:**
```typescript
async getJettonBalance(jettonMasterAddress: string, ownerAddress?: string): Promise<string> {
  // Resolves Jetton wallet address via get_wallet_address
  // Then queries the actual balance
}
```

**What to say:**
> "Instead of throwing 'not implemented', we now resolve the Jetton wallet address using the TEP-74 standard and query the real balance."

#### Fix 3: Cache Invalidation Decorator
**Open:** `src/utils/cache.ts`

**Navigate to line ~261 and show `invalidateCache()`:**
```typescript
export function invalidateCache(cacheKey: string | ((args: any[]) => string)) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // ... ACTUALLY deletes the cache key now
    await cache.del(key);
    logger.debug(`Cache invalidated: ${key}`);
  };
}
```

**What to say:**
> "The decorator implementation was commented out. Now it actually invalidates the cache after method execution."

#### Fix 4: Settings Command
**Open:** `src/telegram/commands.ts`

**Show the settings command (line ~58):**
```typescript
settings: (config: Config) => async (ctx: Context) => {
  await ctx.reply(
    `Model: ${config.claude.model}\n` +  // Reads from REAL config
    `Max tokens: ${config.claude.maxTokens}\n`
  );
}
```

**What to say:**
> "Settings now reads from the actual Config object instead of showing hardcoded values."

---

### Part 4: Run the Test Suite (2 min)

**Run tests:**
```bash
npm test
```

**What to say:**
> "We expanded test coverage from about 25 tests to 71 tests. All passing."

**Show the output:**
```
Test Suites: 6 passed, 6 total
Tests:       71 passed, 71 total
```

**Highlight specific test files:**
```bash
# Show TON tests
cat tests/services/ton.test.ts | head -50
```

**What to say:**
> "We added tests for edge cases like invalid mnemonics, uninitialized wallets, and address validation."

---

### Part 5: Full Validation (1 min)

**Run full validation:**
```bash
npm run typecheck && npm run lint && npm run build
```

**What to say:**
> "TypeScript compiles with no errors, ESLint passes with only pre-existing warnings, and the build succeeds."

---

### Part 6: Summary Slide (1 min)

**Show the summary (you can display this in your IDE or a markdown preview):**

| Category | Issues Fixed |
|----------|-------------|
| TON Blockchain | 7 fake implementations → real blockchain calls |
| Cache System | No-op decorator → working invalidation |
| Telegram Bot | 3 stubbed commands → real functionality |
| Tests | 25 → 71 tests with edge cases |

**Key metrics:**
- 23 LARP issues identified and fixed
- 71 tests passing
- 0 TypeScript errors
- Production-ready code

**What to say:**
> "In total, we identified and fixed 23 LARP issues. The code is now production-ready with real blockchain integration, working cache invalidation, and comprehensive test coverage."

---

## Quick Commands Reference

```bash
# Run all validation
npm run typecheck && npm test && npm run lint && npm run build

# Just tests
npm test

# Show test coverage
npm run test:coverage

# View the plan
cat /Users/futjr/.claude/plans/compiled-sprouting-panda.md
```

---

## Files to Have Open in IDE

1. `src/services/ton.ts` - Main TON fixes
2. `src/utils/cache.ts` - Cache decorator fix
3. `src/telegram/commands.ts` - Bot command fixes
4. `tests/services/ton.test.ts` - Test examples
5. `/Users/futjr/.claude/plans/compiled-sprouting-panda.md` - The plan

---

## Talking Points for Q&A

1. **"What's a LARP assessment?"**
   > Code that looks functional but is actually performative - stubbed functions, fake data, mocked-away logic.

2. **"How did you find these issues?"**
   > Systematic code review looking for: hardcoded values, commented-out code, functions that throw "not implemented", tests that mock the code under test.

3. **"What was the hardest fix?"**
   > The TON transaction hash issue - had to implement proper blockchain polling with the `waitForTransaction()` helper.

4. **"How do you verify it's actually fixed?"**
   > Real tests that exercise the code paths, not mocks of the code under test. Plus manual verification with testnet.
