import { ClaudeService } from '../../src/services/claude';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('@anthropic-ai/sdk');

describe('ClaudeService', () => {
  let claudeService: ClaudeService;
  
  beforeEach(() => {
    const mockConfig = {
      apiKey: 'test-api-key',
      model: 'claude-3-sonnet-20240229' as const,
      maxTokens: 1000,
      temperature: 0.7,
    };
    
    claudeService = new ClaudeService(mockConfig);
  });

  describe('constructor', () => {
    it('should create instance with provided config', () => {
      expect(claudeService).toBeInstanceOf(ClaudeService);
    });
  });

  describe('generateResponse', () => {
    it('should be defined', () => {
      expect(claudeService.generateResponse).toBeDefined();
    });
  });

  describe('getSystemPrompt', () => {
    it('should get system prompt', () => {
      const prompt = claudeService['getSystemPrompt']();
      
      expect(prompt).toContain('Telegram Claude MCP TON Connector');
      expect(prompt).toContain('TON blockchain');
    });
  });
});