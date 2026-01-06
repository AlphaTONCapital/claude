import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import { Config } from '../config/index.js';
import { Message } from './conversation.js';

export class ClaudeService {
  private client: Anthropic;
  private config: Config['claude'];

  constructor(config: Config['claude']) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async generateResponse(messages: Message[], userId: string): Promise<string> {
    try {
      logger.debug('Generating Claude response', { userId, messageCount: messages.length });

      const formattedMessages = this.formatMessages(messages);
      
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: formattedMessages,
        temperature: 0.7,
        system: this.getSystemPrompt(),
      });

      if (response.content[0].type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const responseText = response.content[0].text;
      
      logger.info('Claude response generated', {
        userId,
        responseLength: responseText.length,
        tokensUsed: response.usage?.output_tokens,
      });

      return responseText;
    } catch (error) {
      logger.error('Error generating Claude response:', error);
      
      if (error instanceof Anthropic.APIError) {
        if (error.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.status === 401) {
          throw new Error('Invalid API key. Please contact the administrator.');
        } else if (error.status === 400) {
          throw new Error('Invalid request. Message may be too long or malformed.');
        }
      }
      
      throw new Error('Failed to generate response. Please try again.');
    }
  }

  private formatMessages(messages: Message[]): Anthropic.MessageParam[] {
    return messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
  }

  private getSystemPrompt(): string {
    return `You are a helpful AI assistant integrated with Telegram through the Model Context Protocol (MCP). 
    You should:
    - Be conversational and friendly
    - Provide accurate and helpful information
    - Format responses for Telegram (use Markdown when appropriate)
    - Keep responses concise but informative
    - Remember conversation context
    - Be respectful and professional
    
    You can use Markdown formatting in your responses:
    - *bold* text with asterisks
    - _italic_ text with underscores
    - \`code\` with backticks
    - \`\`\`language\ncode blocks\n\`\`\`
    - [links](url) with brackets and parentheses
    
    Current capabilities:
    - Text-based conversations
    - Context awareness within conversations
    - Multi-turn dialogue support`;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.config.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error) {
      logger.error('Claude API connection test failed:', error);
      return false;
    }
  }

  async streamResponse(
    messages: Message[],
    userId: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const formattedMessages = this.formatMessages(messages);
      
      const stream = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: formattedMessages,
        temperature: 0.7,
        system: this.getSystemPrompt(),
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          onChunk(chunk.delta.text);
        }
      }
    } catch (error) {
      logger.error('Error streaming Claude response:', error);
      throw new Error('Failed to stream response. Please try again.');
    }
  }
}