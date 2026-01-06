import { TelegramBot } from '../../src/telegram/bot';
import { ClaudeService } from '../../src/services/claude';
import { ConversationManager } from '../../src/services/conversation';
import { TonService } from '../../src/services/ton';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

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
    it('should broadcast to all users', async () => {
      mockConversationManager.getAllUserIds.mockResolvedValue(['1', '2', '3']);
      
      const telegramMock = bot.getBot().telegram;
      telegramMock.sendMessage = jest.fn().mockResolvedValue(true);
      
      const result = await bot.broadcastMessage('Test broadcast');
      
      expect(mockConversationManager.getAllUserIds).toHaveBeenCalled();
      expect(result.sent + result.failed).toBe(3);
    });
  });

  describe('stop', () => {
    it('should stop the bot', () => {
      expect(() => bot.stop('SIGINT')).not.toThrow();
    });
  });
});