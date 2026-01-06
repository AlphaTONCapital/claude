import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { ClaudeService } from '../services/claude.js';
import { ConversationManager } from '../services/conversation.js';
import { TonService } from '../services/ton.js';
import { logger } from '../utils/logger.js';
import { Config } from '../config/index.js';
import { RateLimiter } from '../utils/rateLimiter.js';
import { commands } from './commands.js';
import { tonCommands } from './ton-commands.js';

export interface BotContext extends Context {
  userId?: string;
  chatId?: number;
  isAdmin?: boolean;
}

export class TelegramBot {
  private bot: Telegraf<BotContext>;
  private claudeService: ClaudeService;
  private conversationManager: ConversationManager;
  private tonService: TonService;
  private config: Config['telegram'];
  private rateLimiter: RateLimiter;

  constructor(
    config: Config['telegram'],
    claudeService: ClaudeService,
    conversationManager: ConversationManager,
    tonService: TonService
  ) {
    this.config = config;
    this.claudeService = claudeService;
    this.conversationManager = conversationManager;
    this.tonService = tonService;
    this.bot = new Telegraf(config.botToken);
    this.rateLimiter = new RateLimiter();
    
    this.setupMiddleware();
    this.setupHandlers();
    this.setupCommands();
  }

  private setupMiddleware() {
    this.bot.use(async (ctx, next) => {
      if (ctx.from) {
        ctx.userId = ctx.from.id.toString();
        ctx.chatId = ctx.chat?.id;
        ctx.isAdmin = this.config.adminUsers.includes(ctx.userId);

        if (this.config.allowedUsers.length > 0 && 
            !this.config.allowedUsers.includes(ctx.userId) && 
            !ctx.isAdmin) {
          await ctx.reply('Sorry, you are not authorized to use this bot.');
          return;
        }

        if (!this.rateLimiter.checkLimit(ctx.userId)) {
          await ctx.reply('Rate limit exceeded. Please wait a moment before sending more messages.');
          return;
        }
      }
      
      return next();
    });

    this.bot.use(async (ctx, next) => {
      const start = Date.now();
      try {
        await next();
        const duration = Date.now() - start;
        logger.debug(`Request processed in ${duration}ms`, {
          userId: ctx.userId,
          chatId: ctx.chatId,
        });
      } catch (error) {
        logger.error('Error processing request:', error);
        await ctx.reply('An error occurred while processing your request. Please try again.');
      }
    });
  }

  private setupCommands() {
    this.bot.command('start', commands.start);
    this.bot.command('help', commands.help);
    this.bot.command('new', async (ctx) => {
      if (!ctx.userId) return;
      await this.conversationManager.clearConversation(ctx.userId);
      await ctx.reply('Started a new conversation. Previous context has been cleared.');
    });
    this.bot.command('status', commands.status(this.conversationManager));
    this.bot.command('settings', commands.settings);
    this.bot.command('clear', async (ctx) => {
      if (!ctx.userId) return;
      await this.conversationManager.clearConversation(ctx.userId);
      await ctx.reply('Conversation history cleared.');
    });
    
    if (this.config.adminUsers.length > 0) {
      this.bot.command('stats', commands.adminStats(this.conversationManager));
      this.bot.command('broadcast', commands.broadcast);
    }
    
    this.bot.command('wallet', tonCommands.wallet(this.tonService));
    this.bot.command('balance', tonCommands.balance(this.tonService));
    this.bot.command('send', tonCommands.send(this.tonService));
    this.bot.command('tx', tonCommands.transactionStatus(this.tonService));
    this.bot.command('history', tonCommands.history(this.tonService));
  }

  private setupHandlers() {
    this.bot.on(message('text'), async (ctx) => {
      if (!ctx.userId || !ctx.message?.text) return;
      
      const messageText = ctx.message.text;
      
      if (messageText.startsWith('/')) {
        return;
      }

      const typing = ctx.sendChatAction('typing');
      
      try {
        const conversation = await this.conversationManager.getConversation(ctx.userId);
        
        conversation.addUserMessage(messageText);
        
        const response = await this.claudeService.generateResponse(
          conversation.getMessages(),
          ctx.userId
        );
        
        conversation.addAssistantMessage(response);
        
        await this.conversationManager.saveConversation(ctx.userId, conversation);
        
        const chunks = this.splitMessage(response);
        for (const chunk of chunks) {
          await ctx.reply(chunk, { parse_mode: 'Markdown' });
        }
        
      } catch (error) {
        logger.error('Error handling message:', error);
        await ctx.reply('Sorry, I encountered an error while processing your message. Please try again.');
      } finally {
        typing.then(stop => stop()).catch(() => {});
      }
    });

    this.bot.on(message('voice'), async (ctx) => {
      await ctx.reply('Voice messages are not yet supported. Please send text messages.');
    });

    this.bot.on(message('photo'), async (ctx) => {
      await ctx.reply('Image analysis is not yet supported. Please send text messages.');
    });

    this.bot.on(message('document'), async (ctx) => {
      await ctx.reply('Document processing is not yet supported. Please send text messages.');
    });
  }

  private splitMessage(text: string, maxLength = 4000): string[] {
    if (text.length <= maxLength) return [text];
    
    const chunks: string[] = [];
    let currentChunk = '';
    
    const lines = text.split('\n');
    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > maxLength) {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }
    
    if (currentChunk) chunks.push(currentChunk);
    
    return chunks;
  }

  async launch() {
    if (this.config.webhookDomain) {
      const webhookUrl = `${this.config.webhookDomain}/webhook/${this.bot.secretPathComponent()}`;
      await this.bot.telegram.setWebhook(webhookUrl);
      logger.info(`Webhook set to: ${webhookUrl}`);
    } else {
      await this.bot.launch();
      logger.info('Bot launched in polling mode');
    }
  }

  stop(signal?: string) {
    this.bot.stop(signal);
  }

  getBot() {
    return this.bot;
  }

  async sendMessage(chatId: number, text: string) {
    await this.bot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  async broadcastMessage(text: string) {
    const userIds = await this.conversationManager.getAllUserIds();
    let sent = 0;
    let failed = 0;
    
    for (const userId of userIds) {
      try {
        await this.bot.telegram.sendMessage(userId, text, { parse_mode: 'Markdown' });
        sent++;
      } catch (error) {
        logger.error(`Failed to send broadcast to ${userId}:`, error);
        failed++;
      }
    }
    
    return { sent, failed };
  }
}