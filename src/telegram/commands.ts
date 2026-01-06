import { Context } from 'telegraf';
import { ConversationManager } from '../services/conversation.js';
import { BotContext } from './bot.js';

export const commands = {
  start: async (ctx: Context) => {
    await ctx.reply(
      `Welcome to Claude Telegram Bot! 🤖\n\n` +
      `I'm powered by Claude AI and can help you with various tasks.\n\n` +
      `Commands:\n` +
      `/help - Show available commands\n` +
      `/new - Start a new conversation\n` +
      `/clear - Clear conversation history\n` +
      `/status - Check your conversation status\n` +
      `/settings - View current settings\n\n` +
      `Just send me a message to start chatting!`
    );
  },

  help: async (ctx: Context) => {
    await ctx.reply(
      `Available Commands:\n\n` +
      `/start - Welcome message\n` +
      `/help - Show this help message\n` +
      `/new - Start a fresh conversation\n` +
      `/clear - Clear all conversation history\n` +
      `/status - Check conversation status\n` +
      `/settings - View current bot settings\n\n` +
      `Tips:\n` +
      `• Send me any text message to chat\n` +
      `• I remember our conversation context\n` +
      `• Use /new to reset the context\n` +
      `• Messages are processed with Claude AI`
    );
  },

  status: (conversationManager: ConversationManager) => async (ctx: BotContext) => {
    if (!ctx.userId) return;
    
    try {
      const conversation = await conversationManager.getConversation(ctx.userId);
      const messageCount = conversation.getMessages().length;
      const lastActivity = conversation.getLastActivity();
      
      await ctx.reply(
        `📊 Conversation Status:\n\n` +
        `Messages: ${messageCount}\n` +
        `Last activity: ${lastActivity ? new Date(lastActivity).toLocaleString() : 'Never'}\n` +
        `User ID: ${ctx.userId}\n` +
        `Chat ID: ${ctx.chatId}`
      );
    } catch (error) {
      await ctx.reply('Failed to retrieve conversation status.');
    }
  },

  settings: async (ctx: Context) => {
    await ctx.reply(
      `⚙️ Current Settings:\n\n` +
      `Model: Claude 3.5 Sonnet\n` +
      `Max tokens: 4096\n` +
      `Conversation timeout: 30 minutes\n` +
      `Rate limit: 20 messages per minute\n\n` +
      `These settings are configured by the administrator.`
    );
  },

  adminStats: (conversationManager: ConversationManager) => async (ctx: BotContext) => {
    if (!ctx.isAdmin) {
      await ctx.reply('This command is only available to administrators.');
      return;
    }
    
    try {
      const stats = await conversationManager.getStats();
      await ctx.reply(
        `📈 Bot Statistics:\n\n` +
        `Total users: ${stats.totalUsers}\n` +
        `Active conversations: ${stats.activeConversations}\n` +
        `Total messages: ${stats.totalMessages}\n` +
        `Average messages per user: ${stats.avgMessagesPerUser}\n` +
        `Last activity: ${stats.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'Never'}`
      );
    } catch (error) {
      await ctx.reply('Failed to retrieve statistics.');
    }
  },

  broadcast: async (ctx: BotContext) => {
    if (!ctx.isAdmin) {
      await ctx.reply('This command is only available to administrators.');
      return;
    }
    
    const text = ctx.message && 'text' in ctx.message 
      ? ctx.message.text.replace('/broadcast', '').trim()
      : '';
    
    if (!text) {
      await ctx.reply('Usage: /broadcast <message>');
      return;
    }
    
    await ctx.reply('Broadcasting feature requires implementation in the bot instance.');
  },
};