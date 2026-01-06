import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger.js';
import { Config } from '../config/index.js';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export class Conversation {
  private messages: Message[] = [];
  private lastActivity: number;
  private userId: string;

  constructor(userId: string, messages: Message[] = []) {
    this.userId = userId;
    this.messages = messages;
    this.lastActivity = Date.now();
  }

  addUserMessage(content: string) {
    this.messages.push({
      role: 'user',
      content,
      timestamp: Date.now(),
    });
    this.lastActivity = Date.now();
  }

  addAssistantMessage(content: string) {
    this.messages.push({
      role: 'assistant',
      content,
      timestamp: Date.now(),
    });
    this.lastActivity = Date.now();
  }

  addSystemMessage(content: string) {
    this.messages.push({
      role: 'system',
      content,
      timestamp: Date.now(),
    });
    this.lastActivity = Date.now();
  }

  getMessages(): Message[] {
    return this.messages;
  }

  getLastActivity(): number {
    return this.lastActivity;
  }

  clearMessages() {
    this.messages = [];
    this.lastActivity = Date.now();
  }

  trimMessages(maxMessages: number = 20) {
    if (this.messages.length > maxMessages) {
      this.messages = this.messages.slice(-maxMessages);
    }
  }

  toJSON() {
    return {
      userId: this.userId,
      messages: this.messages,
      lastActivity: this.lastActivity,
    };
  }

  static fromJSON(data: any, userId: string): Conversation {
    return new Conversation(userId, data.messages || []);
  }
}

export class ConversationManager {
  private redis: RedisClientType | null = null;
  private config: Config['redis'];
  private conversations: Map<string, Conversation> = new Map();
  private conversationTimeout: number;

  constructor(config: Config['redis'], conversationTimeoutMinutes: number = 30) {
    this.config = config;
    this.conversationTimeout = conversationTimeoutMinutes * 60 * 1000;
  }

  async connect() {
    try {
      this.redis = createClient({
        url: this.config.url,
        password: this.config.password,
        database: this.config.db,
      });

      this.redis.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      this.redis.on('ready', () => {
        logger.info('Redis client connected and ready');
      });

      await this.redis.connect();
      logger.info('Connected to Redis');
    } catch (error) {
      logger.warn('Failed to connect to Redis, using in-memory storage:', error);
      this.redis = null;
    }
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      logger.info('Disconnected from Redis');
    }
  }

  async getConversation(userId: string): Promise<Conversation> {
    const key = `conversation:${userId}`;

    if (this.redis) {
      try {
        const data = await this.redis.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          const conversation = Conversation.fromJSON(parsed, userId);
          
          if (Date.now() - conversation.getLastActivity() > this.conversationTimeout) {
            await this.clearConversation(userId);
            return new Conversation(userId);
          }
          
          return conversation;
        }
      } catch (error) {
        logger.error('Error getting conversation from Redis:', error);
      }
    } else {
      const conversation = this.conversations.get(userId);
      if (conversation) {
        if (Date.now() - conversation.getLastActivity() > this.conversationTimeout) {
          this.conversations.delete(userId);
          return new Conversation(userId);
        }
        return conversation;
      }
    }

    return new Conversation(userId);
  }

  async saveConversation(userId: string, conversation: Conversation) {
    const key = `conversation:${userId}`;
    conversation.trimMessages(50);

    if (this.redis) {
      try {
        await this.redis.set(
          key,
          JSON.stringify(conversation.toJSON()),
          { EX: this.conversationTimeout / 1000 }
        );
      } catch (error) {
        logger.error('Error saving conversation to Redis:', error);
        this.conversations.set(userId, conversation);
      }
    } else {
      this.conversations.set(userId, conversation);
    }
  }

  async clearConversation(userId: string) {
    const key = `conversation:${userId}`;

    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        logger.error('Error clearing conversation from Redis:', error);
      }
    } else {
      this.conversations.delete(userId);
    }
  }

  async getAllUserIds(): Promise<string[]> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys('conversation:*');
        return keys.map(key => key.replace('conversation:', ''));
      } catch (error) {
        logger.error('Error getting user IDs from Redis:', error);
        return Array.from(this.conversations.keys());
      }
    } else {
      return Array.from(this.conversations.keys());
    }
  }

  async getStats(): Promise<{
    totalUsers: number;
    activeConversations: number;
    totalMessages: number;
    avgMessagesPerUser: number;
    lastActivity: number | null;
  }> {
    const userIds = await this.getAllUserIds();
    let totalMessages = 0;
    let activeConversations = 0;
    let lastActivity: number | null = null;

    for (const userId of userIds) {
      const conversation = await this.getConversation(userId);
      const messages = conversation.getMessages();
      
      if (messages.length > 0) {
        activeConversations++;
        totalMessages += messages.length;
        
        const convLastActivity = conversation.getLastActivity();
        if (!lastActivity || convLastActivity > lastActivity) {
          lastActivity = convLastActivity;
        }
      }
    }

    return {
      totalUsers: userIds.length,
      activeConversations,
      totalMessages,
      avgMessagesPerUser: userIds.length > 0 ? Math.round(totalMessages / userIds.length) : 0,
      lastActivity,
    };
  }
}