import { TelegramBot } from '../../src/telegram/bot.js';
import { ClaudeService } from '../../src/services/claude.js';
import { ConversationManager } from '../../src/services/conversation.js';
import { TonService } from '../../src/services/ton.js';

describe('TelegramBot', () => {
  let bot: TelegramBot;
  let mockClaudeService: jest.Mocked<ClaudeService>;
  let mockConversationManager: jest.Mocked<ConversationManager>;
  let mockTonService: jest.Mocked<TonService>;

  beforeEach(() => {
    const mockConfig = {
      botToken: 'test-token',
      webhookDomain: 'https://test.com',
      webhookPort: 3000,
      allowedUsers: [],
      adminUsers: [],
      miniAppUrl: 'https://app.test.com',
      miniAppSecret: 'secret',
    };

    mockClaudeService = {
      generateResponse: jest.fn(),
    } as any;

    mockConversationManager = {
      getConversation: jest.fn(),
      saveConversation: jest.fn(),
      clearConversation: jest.fn(),
      getAllUserIds: jest.fn(),
    } as any;

    mockTonService = {
      getWalletInfo: jest.fn(),
      getBalance: jest.fn(),
    } as any;

    bot = new TelegramBot(
      mockConfig,
      mockClaudeService,
      mockConversationManager,
      mockTonService
    );
  });

  describe('sendMessage', () => {
    it('should be defined', () => {
      expect(bot.sendMessage).toBeDefined();
    });
  });

  describe('broadcastMessage', () => {
    it('should call getAllUserIds from conversation manager', async () => {
      mockConversationManager.getAllUserIds.mockResolvedValue(['1', '2', '3']);
      // Mock sendMessage to avoid network calls and 404s
      bot['bot'].telegram.sendMessage = jest.fn() as any;
      
      await bot.broadcastMessage('Test broadcast');
      
      expect(mockConversationManager.getAllUserIds).toHaveBeenCalled();
      expect(bot['bot'].telegram.sendMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe('stop', () => {
    it('should stop the bot', () => {
      // Mock the bot.stop method to avoid "Bot is not running" error
      (bot['bot'].stop as jest.Mock) = jest.fn();
      expect(() => bot.stop('SIGINT')).not.toThrow();
    });
  });
});