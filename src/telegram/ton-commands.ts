import { Context } from 'telegraf';
import { TonService } from '../services/ton.js';
import { logger } from '../utils/logger.js';

export const tonCommands = {
  wallet: (tonService: TonService) => async (ctx: Context) => {
    try {
      const info = await tonService.getWalletInfo();
      const message = `💎 *TON Wallet Information*\n\n` +
        `📍 Address: \`${info.address}\`\n` +
        `💰 Balance: ${info.balance} TON\n` +
        `✅ Status: ${info.isActive ? 'Active' : 'Inactive'}\n` +
        (info.lastTransactionHash ? `📝 Last TX: \`${info.lastTransactionHash.substring(0, 16)}...\`` : '');
      
      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error getting wallet info:', error);
      await ctx.reply('❌ Failed to get wallet information. Please try again later.');
    }
  },

  balance: (tonService: TonService) => async (ctx: Context) => {
    try {
      const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
      const args = text.split(' ').slice(1);
      const address = args[0];
      
      if (address && !(await tonService.validateAddress(address))) {
        await ctx.reply('❌ Invalid TON address format. Please check and try again.');
        return;
      }
      
      const balance = await tonService.getBalance(address);
      const displayAddress = address ? `Address: \`${address}\`\n` : 'Your wallet ';
      
      await ctx.reply(
        `💰 *TON Balance*\n\n${displayAddress}Balance: ${balance} TON`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('Error getting balance:', error);
      await ctx.reply('❌ Failed to get balance. Please try again later.');
    }
  },

  send: (tonService: TonService) => async (ctx: Context) => {
    try {
      const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
      const args = text.split(' ').slice(1);
      
      if (args.length < 2) {
        await ctx.reply(
          '📝 *Usage:* `/send <address> <amount> [comment]`\n\n' +
          'Example: `/send EQD... 0.5 Payment for services`',
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      const [toAddress, amount, ...commentParts] = args;
      const comment = commentParts.join(' ');
      
      if (!(await tonService.validateAddress(toAddress))) {
        await ctx.reply('❌ Invalid recipient address format. Please check and try again.');
        return;
      }
      
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        await ctx.reply('❌ Invalid amount. Please enter a positive number.');
        return;
      }
      
      await ctx.reply('⏳ Processing transaction...');
      
      const result = await tonService.sendTransaction(toAddress, amount, comment);
      
      await ctx.reply(
        `✅ *Transaction Sent!*\n\n` +
        `📝 Hash: \`${result.hash}\`\n` +
        `💸 Amount: ${result.amount} TON\n` +
        `📊 Status: ${result.status}\n` +
        `⏰ Time: ${new Date(result.timestamp).toLocaleString()}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('Error sending transaction:', error);
      await ctx.reply('❌ Failed to send transaction. Please check your balance and try again.');
    }
  },

  transactionStatus: (tonService: TonService) => async (ctx: Context) => {
    try {
      const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
      const args = text.split(' ').slice(1);
      
      if (args.length !== 1) {
        await ctx.reply(
          '📝 *Usage:* `/tx <transaction_hash>`\n\n' +
          'Example: `/tx abc123...`',
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      const hash = args[0];
      const status = await tonService.getTransactionStatus(hash);
      
      await ctx.reply(
        `📊 *Transaction Status*\n\n` +
        `📝 Hash: \`${status.hash}\`\n` +
        `✅ Status: ${status.status}\n` +
        `💸 Amount: ${status.amount} TON\n` +
        (status.fee ? `💰 Fee: ${status.fee} TON\n` : '') +
        `⏰ Time: ${new Date(status.timestamp).toLocaleString()}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('Error getting transaction status:', error);
      await ctx.reply('❌ Failed to get transaction status. Please check the hash and try again.');
    }
  },

  history: (tonService: TonService) => async (ctx: Context) => {
    try {
      const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
      const args = text.split(' ').slice(1);
      const address = args[0];
      const limit = args[1] ? parseInt(args[1]) : 5;
      
      if (address && !(await tonService.validateAddress(address))) {
        await ctx.reply('❌ Invalid TON address format. Please check and try again.');
        return;
      }
      
      const history = await tonService.getTransactionHistory(address, limit);
      
      if (history.length === 0) {
        await ctx.reply('📭 No transaction history found.');
        return;
      }
      
      let message = `📜 *Transaction History*\n\n`;
      for (const tx of history) {
        message += `📝 \`${tx.hash.substring(0, 16)}...\`\n`;
        message += `  💸 ${tx.amount} TON | ${tx.fee ? `Fee: ${tx.fee} TON | ` : ''}`;
        message += `${new Date(tx.timestamp).toLocaleDateString()}\n\n`;
      }
      
      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error getting transaction history:', error);
      await ctx.reply('❌ Failed to get transaction history. Please try again later.');
    }
  },
};