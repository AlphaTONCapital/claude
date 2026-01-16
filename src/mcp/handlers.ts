import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { TelegramBot } from '../telegram/bot.js';
import { ClaudeService } from '../services/claude.js';
import { ConversationManager } from '../services/conversation.js';
import { TonService } from '../services/ton.js';
import { JiraService } from '../services/jira.js';
import { logger } from '../utils/logger.js';
import { tonTools, tonResources, handleTonToolCall, handleTonResourceRead } from './ton-handlers.js';
import { jiraTools, jiraResources, handleJiraToolCall, handleJiraResourceRead } from './jira-handlers.js';

export function setupMCPHandlers(
  server: Server,
  bot: TelegramBot,
  claudeService: ClaudeService,
  conversationManager: ConversationManager,
  tonService: TonService,
  jiraService: JiraService | null
) {
  // Define Telegram tools
  const telegramTools = [
    {
      name: 'send_telegram_message',
      description: 'Send a message to a Telegram chat',
      inputSchema: {
        type: 'object',
        properties: {
          chatId: {
            type: 'number',
            description: 'The Telegram chat ID to send the message to',
          },
          message: {
            type: 'string',
            description: 'The message to send',
          },
        },
        required: ['chatId', 'message'],
      },
    },
    {
      name: 'get_conversation_history',
      description: 'Get the conversation history for a user',
      inputSchema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'The user ID to get conversation history for',
          },
        },
        required: ['userId'],
      },
    },
    {
      name: 'clear_conversation',
      description: 'Clear the conversation history for a user',
      inputSchema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'The user ID to clear conversation for',
          },
        },
        required: ['userId'],
      },
    },
    {
      name: 'broadcast_message',
      description: 'Broadcast a message to all bot users',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The message to broadcast',
          },
        },
        required: ['message'],
      },
    },
    {
      name: 'get_bot_stats',
      description: 'Get statistics about the bot usage',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  const telegramResources = [
    {
      uri: 'telegram://conversations',
      name: 'All Conversations',
      description: 'Access to all active conversations',
      mimeType: 'application/json',
    },
    {
      uri: 'telegram://stats',
      name: 'Bot Statistics',
      description: 'Current bot usage statistics',
      mimeType: 'application/json',
    },
  ];

  // List Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = [
      ...telegramTools,
      ...tonTools,
      ...(jiraService ? jiraTools : []),
    ];

    return {
      tools,
    };
  });

  // Call Tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.debug(`MCP tool called: ${name}`, args);

    try {
      // Try Telegram tools first
      switch (name) {
        case 'send_telegram_message': {
          const { chatId, message } = args as { chatId: number; message: string };
          await bot.sendMessage(chatId, message);
          return {
            content: [
              {
                type: 'text',
                text: `Message sent successfully to chat ${chatId}`,
              },
            ],
          };
        }

        case 'get_conversation_history': {
          const { userId } = args as { userId: string };
          const conversation = await conversationManager.getConversation(userId);
          const messages = conversation.getMessages();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(messages, null, 2),
              },
            ],
          };
        }

        case 'clear_conversation': {
          const { userId } = args as { userId: string };
          await conversationManager.clearConversation(userId);
          return {
            content: [
              {
                type: 'text',
                text: `Conversation cleared for user ${userId}`,
              },
            ],
          };
        }

        case 'broadcast_message': {
          const { message } = args as { message: string };
          const result = await bot.broadcastMessage(message);
          return {
            content: [
              {
                type: 'text',
                text: `Broadcast sent successfully. Sent: ${result.sent}, Failed: ${result.failed}`,
              },
            ],
          };
        }

        case 'get_bot_stats': {
          const stats = await conversationManager.getStats();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };
        }
      }

      // Try TON tools
      const tonResult = await handleTonToolCall(name, args, tonService);
      if (tonResult) {
        if (tonResult.isError) {
             return {
                content: tonResult.content,
                isError: true,
             }
        }
        return { content: tonResult.content };
      }

      // Try JIRA tools if enabled
      if (jiraService) {
        const jiraResult = await handleJiraToolCall(name, args, jiraService);
        if (jiraResult) {
             if (jiraResult.isError) {
                 return {
                    content: jiraResult.content,
                    isError: true,
                 }
            }
            return { content: jiraResult.content };
        }
      }

      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);

    } catch (error) {
      if (error instanceof McpError) throw error;
      
      logger.error(`Error executing tool ${name}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  // List Resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = [
      ...telegramResources,
      ...tonResources,
      ...(jiraService ? jiraResources : []),
    ];

    return {
      resources,
    };
  });

  // Read Resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    logger.debug(`MCP resource requested: ${uri}`);

    try {
      if (uri.startsWith('telegram://')) {
        if (uri === 'telegram://conversations') {
          const userIds = await conversationManager.getAllUserIds();
          const conversations = [];
          
          for (const userId of userIds) {
            const conversation = await conversationManager.getConversation(userId);
            conversations.push({
              userId,
              messages: conversation.getMessages(),
              lastActivity: conversation.getLastActivity(),
            });
          }
          
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(conversations, null, 2),
              },
            ],
          };
        }

        if (uri === 'telegram://stats') {
          const stats = await conversationManager.getStats();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };
        }
      }

      if (uri.startsWith('ton://')) {
        const result = await handleTonResourceRead(uri, tonService);
        if (result) return result;
      }

      if (uri.startsWith('jira://') && jiraService) {
        const result = await handleJiraResourceRead(uri, jiraService);
        if (result) return result;
      }

      throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);

    } catch (error) {
      logger.error(`Error reading resource ${uri}:`, error);
      throw error; // MCP SDK handles error responses
    }
  });

  // List Prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'telegram_assistant',
          description: 'Default Telegram assistant prompt',
          arguments: [
            {
              name: 'context',
              description: 'Additional context for the assistant',
              required: false,
            },
          ],
        },
      ],
    };
  });

  // Get Prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'telegram_assistant') {
      const context = (args as { context?: string })?.context || '';
      return {
        description: 'Telegram assistant prompt',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You are a helpful Telegram assistant integrated via MCP. ${context}`,
            },
          },
        ],
      };
    }
    
    throw new McpError(ErrorCode.MethodNotFound, `Unknown prompt: ${name}`);
  });
}
