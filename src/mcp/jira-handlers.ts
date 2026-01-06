import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { JiraService } from '../services/jira.js';
import { logger } from '../utils/logger.js';

export function setupJiraMCPHandlers(server: Server, jiraService: JiraService) {
  // TODO: Fix MCP SDK compatibility issues
  console.log('JIRA MCP handlers setup - temporarily disabled for build compatibility');
  /*
  const jiraTools = [
    {
      name: 'jira_create_issue',
      description: 'Create a new JIRA issue',
      inputSchema: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Issue summary/title',
          },
          description: {
            type: 'string',
            description: 'Issue description',
          },
          issueType: {
            type: 'string',
            enum: ['Task', 'Bug', 'Story', 'Epic'],
            description: 'Type of issue',
          },
          assignee: {
            type: 'string',
            description: 'Email of the assignee',
          },
          priority: {
            type: 'string',
            enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
            description: 'Issue priority',
          },
          labels: {
            type: 'array',
            items: { type: 'string' },
            description: 'Issue labels',
          },
        },
        required: ['summary', 'issueType'],
      },
    },
    {
      name: 'jira_get_issue',
      description: 'Get details of a JIRA issue',
      inputSchema: {
        type: 'object',
        properties: {
          issueKey: {
            type: 'string',
            description: 'JIRA issue key (e.g., TCMCP-1)',
          },
        },
        required: ['issueKey'],
      },
    },
    {
      name: 'jira_update_issue',
      description: 'Update a JIRA issue',
      inputSchema: {
        type: 'object',
        properties: {
          issueKey: {
            type: 'string',
            description: 'JIRA issue key',
          },
          updates: {
            type: 'object',
            description: 'Fields to update',
          },
        },
        required: ['issueKey', 'updates'],
      },
    },
    {
      name: 'jira_transition_issue',
      description: 'Change the status of a JIRA issue',
      inputSchema: {
        type: 'object',
        properties: {
          issueKey: {
            type: 'string',
            description: 'JIRA issue key',
          },
          transitionName: {
            type: 'string',
            description: 'Name of the transition (e.g., Done, In Progress)',
          },
        },
        required: ['issueKey', 'transitionName'],
      },
    },
    {
      name: 'jira_search_issues',
      description: 'Search JIRA issues using JQL',
      inputSchema: {
        type: 'object',
        properties: {
          jql: {
            type: 'string',
            description: 'JIRA Query Language string',
          },
        },
        required: ['jql'],
      },
    },
    {
      name: 'jira_create_board',
      description: 'Create a new JIRA board',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Board name',
          },
        },
        required: ['name'],
      },
    },
    {
      name: 'jira_get_boards',
      description: 'Get all boards for the project',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'jira_get_board_issues',
      description: 'Get all issues on a board',
      inputSchema: {
        type: 'object',
        properties: {
          boardId: {
            type: 'number',
            description: 'Board ID',
          },
        },
        required: ['boardId'],
      },
    },
    {
      name: 'jira_create_project_tasks',
      description: 'Create all predefined project tasks with assignments',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  server.setRequestHandler({
    tools: {},
    resources: {},
  }, {
    async listTools() {
      return {
        tools: jiraTools,
      };
    },

    async callTool({ name, arguments: args }: { name: string; arguments: any }) {
      
      switch (name) {
        case 'jira_create_issue': {
          try {
            const issue = await jiraService.createIssue(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(issue, null, 2),
                },
              ],
            };
          } catch (error) {
            logger.error('Error creating JIRA issue:', error);
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to create issue: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'jira_get_issue': {
          const { issueKey } = args as { issueKey: string };
          try {
            const issue = await jiraService.getIssue(issueKey);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(issue, null, 2),
                },
              ],
            };
          } catch (error) {
            logger.error('Error getting JIRA issue:', error);
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to get issue: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'jira_update_issue': {
          const { issueKey, updates } = args as { issueKey: string; updates: any };
          try {
            await jiraService.updateIssue(issueKey, updates);
            return {
              content: [
                {
                  type: 'text',
                  text: `Issue ${issueKey} updated successfully`,
                },
              ],
            };
          } catch (error) {
            logger.error('Error updating JIRA issue:', error);
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to update issue: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'jira_transition_issue': {
          const { issueKey, transitionName } = args as { issueKey: string; transitionName: string };
          try {
            await jiraService.transitionIssue(issueKey, transitionName);
            return {
              content: [
                {
                  type: 'text',
                  text: `Issue ${issueKey} transitioned to ${transitionName}`,
                },
              ],
            };
          } catch (error) {
            logger.error('Error transitioning JIRA issue:', error);
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to transition issue: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'jira_search_issues': {
          const { jql } = args as { jql: string };
          try {
            const issues = await jiraService.searchIssues(jql);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(issues, null, 2),
                },
              ],
            };
          } catch (error) {
            logger.error('Error searching JIRA issues:', error);
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to search issues: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'jira_create_board': {
          const { name } = args as { name: string };
          try {
            const board = await jiraService.createBoard(name);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(board, null, 2),
                },
              ],
            };
          } catch (error) {
            logger.error('Error creating JIRA board:', error);
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to create board: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'jira_get_boards': {
          try {
            const boards = await jiraService.getBoards();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(boards, null, 2),
                },
              ],
            };
          } catch (error) {
            logger.error('Error getting JIRA boards:', error);
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to get boards: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'jira_get_board_issues': {
          const { boardId } = args as { boardId: number };
          try {
            const issues = await jiraService.getBoardIssues(boardId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(issues, null, 2),
                },
              ],
            };
          } catch (error) {
            logger.error('Error getting board issues:', error);
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to get board issues: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'jira_create_project_tasks': {
          try {
            const issues = await jiraService.createProjectTasks();
            return {
              content: [
                {
                  type: 'text',
                  text: `Created ${issues.length} project tasks successfully`,
                },
              ],
            };
          } catch (error) {
            logger.error('Error creating project tasks:', error);
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to create project tasks: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${name}`,
              },
            ],
            isError: true,
          };
      }
    },

    async listResources() {
      return {
        resources: [
          {
            uri: 'jira://boards',
            name: 'JIRA Boards',
            description: 'All JIRA boards for the project',
            mimeType: 'application/json',
          },
          {
            uri: 'jira://issues',
            name: 'JIRA Issues',
            description: 'All JIRA issues in the project',
            mimeType: 'application/json',
          },
        ],
      };
    },

    async readResource({ uri }: { uri: string }) {
      
      if (uri === 'jira://boards') {
        try {
          const boards = await jiraService.getBoards();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(boards, null, 2),
              },
            ],
          };
        } catch (error) {
          logger.error('Error reading JIRA boards resource:', error);
          throw error;
        }
      }

      if (uri === 'jira://issues') {
        try {
          const issues = await jiraService.searchIssues(`project = ${jiraService['projectKey']}`);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(issues, null, 2),
              },
            ],
          };
        } catch (error) {
          logger.error('Error reading JIRA issues resource:', error);
          throw error;
        }
      }

      throw new Error(`Unknown resource: ${uri}`);
    },
  });
  */
}