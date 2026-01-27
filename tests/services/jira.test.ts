import { JiraService } from '../../src/services/jira.js';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JiraService', () => {
  let jiraService: JiraService;
  
  beforeEach(() => {
    const mockConfig = {
      apiKey: 'test-api-key',
      domain: 'test.atlassian.net',
      email: 'test@example.com',
      projectKey: 'TEST',
    };
    
    jiraService = new JiraService(mockConfig);
    jest.clearAllMocks();
  });

  describe('getUserAccountId', () => {
    it('should return user account ID when user exists', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ accountId: 'test-account-id' }],
      });

      const accountId = await jiraService.getUserAccountId('test@example.com');
      expect(accountId).toBe('test-account-id');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/user/search?query=test@example.com'),
        expect.any(Object)
      );
    });

    it('should throw error when user not found', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      await expect(jiraService.getUserAccountId('nonexistent@example.com'))
        .rejects
        .toThrow('User not found: nonexistent@example.com');
    });
  });

  describe('createIssue', () => {
    it('should create an issue successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ accountId: 'test-account-id' }],
      });
      
      mockedAxios.post.mockResolvedValueOnce({
        data: { key: 'TEST-1', id: '10001' },
      });

      const result = await jiraService.createIssue({
        summary: 'Test Issue',
        description: 'Test Description',
        issueType: 'Task',
        assignee: 'test@example.com',
        priority: 'High',
      });

      expect(result.key).toBe('TEST-1');
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe('getIssue', () => {
    it('should retrieve an issue successfully', async () => {
      const mockIssue = {
        key: 'TEST-1',
        fields: {
          summary: 'Test Issue',
          status: { name: 'To Do' },
        },
      };
      
      mockedAxios.get.mockResolvedValueOnce({ data: mockIssue });

      const result = await jiraService.getIssue('TEST-1');
      expect(result.key).toBe('TEST-1');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/issue/TEST-1'),
        expect.any(Object)
      );
    });
  });

  describe('searchIssues', () => {
    it('should search issues with JQL', async () => {
      const mockIssues = {
        issues: [
          { key: 'TEST-1' },
          { key: 'TEST-2' },
        ],
      };
      
      mockedAxios.get.mockResolvedValueOnce({ data: mockIssues });

      const result = await jiraService.searchIssues('project = TEST');
      expect(result).toHaveLength(2);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/search?jql='),
        expect.any(Object)
      );
    });
  });
});