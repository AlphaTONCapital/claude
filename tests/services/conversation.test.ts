import { ConversationManager, Conversation } from '../../src/services/conversation';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createClient } from 'redis';

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  })),
}));

describe('ConversationManager', () => {
  let conversationManager: ConversationManager;
  let mockRedisClient: any;
  
  beforeEach(async () => {
    mockRedisClient = {
      connect: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      quit: jest.fn(),
      on: jest.fn(),
    };
    
    (createClient as jest.Mock).mockReturnValue(mockRedisClient);
    
    conversationManager = new ConversationManager({
      url: 'redis://localhost:6379',
      password: undefined,
      db: 0,
    }, 60);
    
    // Connect to initialize Redis client
    await conversationManager.connect();
  });

  describe('getConversation', () => {
    it('should create new conversation if none exists', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      
      const conversation = await conversationManager.getConversation('user123');
      
      expect(conversation).toBeInstanceOf(Conversation);
      expect(conversation.getMessages()).toHaveLength(0);
    });

    it('should load existing conversation from Redis', async () => {
      const existingConversation = {
        messages: [{ role: 'user', content: 'Hello' }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingConversation));
      
      const conversation = await conversationManager.getConversation('user123');
      
      expect(conversation.getMessages()).toHaveLength(1);
      expect(conversation.getMessages()[0].content).toBe('Hello');
    });
  });

  describe('saveConversation', () => {
    it('should save conversation to Redis', async () => {
      const conversation = new Conversation('user123');
      conversation.addUserMessage('Test message');
      
      await conversationManager.saveConversation('user123', conversation);
      
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'conversation:user123',
        expect.any(String),
        expect.objectContaining({ EX: expect.any(Number) })
      );
    });
  });

  describe('clearConversation', () => {
    it('should delete conversation from Redis', async () => {
      await conversationManager.clearConversation('user123');
      
      expect(mockRedisClient.del).toHaveBeenCalledWith('conversation:user123');
    });
  });

  describe('getAllUserIds', () => {
    it('should return all user IDs with conversations', async () => {
      mockRedisClient.keys.mockResolvedValue([
        'conversation:user1',
        'conversation:user2',
        'conversation:user3',
      ]);
      
      const userIds = await conversationManager.getAllUserIds();
      
      expect(userIds).toEqual(['user1', 'user2', 'user3']);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('conversation:*');
    });
  });
});

describe('Conversation', () => {
  let conversation: Conversation;
  
  beforeEach(() => {
    conversation = new Conversation('test-user');
  });

  describe('addUserMessage', () => {
    it('should add user message to conversation', () => {
      conversation.addUserMessage('Hello');
      
      const messages = conversation.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Hello');
    });
  });

  describe('addAssistantMessage', () => {
    it('should add assistant message to conversation', () => {
      conversation.addAssistantMessage('Hi there!');
      
      const messages = conversation.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('assistant');
      expect(messages[0].content).toBe('Hi there!');
    });
  });

  describe('trimMessages', () => {
    it('should trim messages when exceeding max count', () => {
      const maxMessages = 5;
      const conv = new Conversation('test-user');
      
      for (let i = 0; i < 10; i++) {
        conv.addUserMessage(`Message ${i}`);
      }
      
      conv.trimMessages(5);
      const messages = conv.getMessages();
      expect(messages).toHaveLength(5);
      expect(messages[0].content).toBe('Message 5'); // Should keep the latest messages
    });
  });

  describe('toJSON', () => {
    it('should serialize conversation to JSON', () => {
      conversation.addUserMessage('Hello');
      conversation.addAssistantMessage('Hi!');
      
      const json = conversation.toJSON();
      
      expect(json.messages).toHaveLength(2);
      expect(json.lastActivity).toBeDefined();
      expect(json.userId).toBe('test-user');
    });
  });

  describe('fromJSON', () => {
    it('should create conversation from JSON', () => {
      const json = {
        messages: [
          { role: 'user', content: 'Hello', timestamp: Date.now() },
          { role: 'assistant', content: 'Hi!', timestamp: Date.now() },
        ],
        lastActivity: Date.now(),
      };
      
      const conv = Conversation.fromJSON(json, 'test-user');
      
      expect(conv.getMessages()).toHaveLength(2);
      expect(conv.getMessages()[0].content).toBe('Hello');
    });
  });
});