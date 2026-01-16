import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TelegramBot } from './telegram/bot.js';
import { ClaudeService } from './services/claude.js';
import { ConversationManager } from './services/conversation.js';
import { TonService } from './services/ton.js';
import { JiraService } from './services/jira.js';
import { MiniAppServer } from './miniapp/server.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { setupMCPHandlers } from './mcp/handlers.js';

async function main() {
  try {
    logger.info('Starting Telegram Claude MCP Connector...');

    const server = new Server(
      {
        name: config.mcp.serverName,
        version: config.mcp.serverVersion,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    const claudeService = new ClaudeService(config.claude);
    const conversationManager = new ConversationManager(config.redis);
    const tonService = new TonService(config.ton);
    const jiraService = config.jira.apiKey ? new JiraService(config.jira as any) : null;
    
    await conversationManager.connect();
    
    if (config.ton.walletMnemonic) {
      await tonService.initialize();
      logger.info('TON blockchain service initialized');
    } else {
      logger.warn('TON wallet mnemonic not configured, TON features will be limited');
    }
    
    const telegramBot = new TelegramBot(
      config.telegram,
      claudeService,
      conversationManager,
      tonService
    );

    setupMCPHandlers(
      server,
      telegramBot,
      claudeService,
      conversationManager,
      tonService,
      jiraService
    );
    
    if (jiraService) {
      logger.info('JIRA service initialized');
    }

    await telegramBot.launch();
    
    if (config.telegram.miniAppUrl && config.telegram.miniAppSecret) {
      const miniAppServer = new MiniAppServer({
        port: 3001,
        secret: config.telegram.miniAppSecret,
        tonService,
        claudeService,
        conversationManager,
      });
      
      await miniAppServer.start();
      logger.info('Mini App server started');
    }
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    logger.info('MCP Server connected via stdio');
    logger.info('Telegram bot is running...');

    process.once('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      telegramBot.stop('SIGINT');
      await conversationManager.disconnect();
      process.exit(0);
    });

    process.once('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      telegramBot.stop('SIGTERM');
      await conversationManager.disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unhandled error in main:', error);
  process.exit(1);
});