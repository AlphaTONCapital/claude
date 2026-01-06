import axios from 'axios';
import { logger } from '../utils/logger.js';

export interface JiraConfig {
  apiKey: string;
  domain: string;
  email: string;
  projectKey: string;
}

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    priority?: {
      name: string;
    };
    created: string;
    updated: string;
    issuetype: {
      name: string;
    };
  };
}

export interface CreateIssueParams {
  summary: string;
  description?: string;
  issueType: 'Task' | 'Bug' | 'Story' | 'Epic';
  assignee?: string;
  priority?: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  labels?: string[];
  components?: string[];
}

export class JiraService {
  private baseUrl: string;
  private headers: any;
  private projectKey: string;

  constructor(private config: JiraConfig) {
    this.baseUrl = `https://${config.domain}/rest/api/3`;
    this.projectKey = config.projectKey || 'TCMCP';
    
    const auth = Buffer.from(`${config.email}:${config.apiKey}`).toString('base64');
    this.headers = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async createProject() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/project`,
        {
          key: this.projectKey,
          name: 'Telegram Claude MCP TON',
          projectTypeKey: 'software',
          description: 'Telegram Claude MCP TON Connector Project',
          leadAccountId: await this.getUserAccountId(this.config.email),
        },
        { headers: this.headers }
      );
      
      logger.info('Project created:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        logger.info('Project might already exist');
      } else {
        logger.error('Error creating project:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  async getUserAccountId(email: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/user/search?query=${email}`,
        { headers: this.headers }
      );
      
      if (response.data && response.data.length > 0) {
        return response.data[0].accountId;
      }
      
      throw new Error(`User not found: ${email}`);
    } catch (error) {
      logger.error('Error getting user account ID:', error);
      throw error;
    }
  }

  async createIssue(params: CreateIssueParams): Promise<JiraIssue> {
    try {
      let assigneeId;
      if (params.assignee) {
        assigneeId = await this.getUserAccountId(params.assignee);
      }

      const issueData = {
        fields: {
          project: {
            key: this.projectKey,
          },
          summary: params.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: params.description || params.summary,
                  },
                ],
              },
            ],
          },
          issuetype: {
            name: params.issueType,
          },
          ...(assigneeId && { assignee: { accountId: assigneeId } }),
          ...(params.priority && { priority: { name: params.priority } }),
          ...(params.labels && { labels: params.labels }),
        },
      };

      const response = await axios.post(
        `${this.baseUrl}/issue`,
        issueData,
        { headers: this.headers }
      );

      logger.info(`Issue created: ${response.data.key}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating issue:', error.response?.data || error.message);
      throw error;
    }
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/issue/${issueKey}`,
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      logger.error('Error getting issue:', error);
      throw error;
    }
  }

  async updateIssue(issueKey: string, updates: any): Promise<void> {
    try {
      await axios.put(
        `${this.baseUrl}/issue/${issueKey}`,
        { fields: updates },
        { headers: this.headers }
      );
      
      logger.info(`Issue updated: ${issueKey}`);
    } catch (error) {
      logger.error('Error updating issue:', error);
      throw error;
    }
  }

  async transitionIssue(issueKey: string, transitionName: string): Promise<void> {
    try {
      const transitionsResponse = await axios.get(
        `${this.baseUrl}/issue/${issueKey}/transitions`,
        { headers: this.headers }
      );
      
      const transition = transitionsResponse.data.transitions.find(
        (t: any) => t.name.toLowerCase() === transitionName.toLowerCase()
      );
      
      if (!transition) {
        throw new Error(`Transition '${transitionName}' not found`);
      }

      await axios.post(
        `${this.baseUrl}/issue/${issueKey}/transitions`,
        { transition: { id: transition.id } },
        { headers: this.headers }
      );
      
      logger.info(`Issue transitioned: ${issueKey} -> ${transitionName}`);
    } catch (error) {
      logger.error('Error transitioning issue:', error);
      throw error;
    }
  }

  async searchIssues(jql: string): Promise<JiraIssue[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/search?jql=${encodeURIComponent(jql)}`,
        { headers: this.headers }
      );
      
      return response.data.issues;
    } catch (error) {
      logger.error('Error searching issues:', error);
      throw error;
    }
  }

  async createBoard(name: string): Promise<any> {
    try {
      const response = await axios.post(
        `https://${this.config.domain}/rest/agile/1.0/board`,
        {
          name,
          type: 'kanban',
          filterId: await this.createFilter(`${name} Filter`),
        },
        { headers: this.headers }
      );
      
      logger.info('Board created:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating board:', error.response?.data || error.message);
      throw error;
    }
  }

  private async createFilter(name: string): Promise<number> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/filter`,
        {
          name,
          jql: `project = ${this.projectKey}`,
          favourite: true,
        },
        { headers: this.headers }
      );
      
      return response.data.id;
    } catch (error) {
      logger.error('Error creating filter:', error);
      throw error;
    }
  }

  async getBoards(): Promise<any[]> {
    try {
      const response = await axios.get(
        `https://${this.config.domain}/rest/agile/1.0/board?projectKeyOrId=${this.projectKey}`,
        { headers: this.headers }
      );
      
      return response.data.values;
    } catch (error) {
      logger.error('Error getting boards:', error);
      throw error;
    }
  }

  async getBoardIssues(boardId: number): Promise<JiraIssue[]> {
    try {
      const response = await axios.get(
        `https://${this.config.domain}/rest/agile/1.0/board/${boardId}/issue`,
        { headers: this.headers }
      );
      
      return response.data.issues;
    } catch (error) {
      logger.error('Error getting board issues:', error);
      throw error;
    }
  }

  async createProjectTasks() {
    const tasks = [
      // Completed tasks
      {
        summary: 'Setup project repository and initial structure',
        description: 'Initialize Git repository, create folder structure, setup TypeScript configuration',
        assignee: 'l@alphaton.capital',
        status: 'Done',
        issueType: 'Task' as const,
        priority: 'High' as const,
      },
      {
        summary: 'Implement TON blockchain service integration',
        description: 'Create TON service with wallet management, transaction handling, and blockchain interaction',
        assignee: 'l@alphaton.capital',
        status: 'Done',
        issueType: 'Task' as const,
        priority: 'High' as const,
      },
      {
        summary: 'Setup MCP server with TON handlers',
        description: 'Implement Model Context Protocol server with TON blockchain specific handlers',
        assignee: 'l@alphaton.capital',
        status: 'Done',
        issueType: 'Task' as const,
        priority: 'High' as const,
      },
      {
        summary: 'Create Telegram bot with commands',
        description: 'Implement Telegram bot with wallet, balance, and transaction commands',
        assignee: 'l@alphaton.capital',
        status: 'Done',
        issueType: 'Task' as const,
        priority: 'High' as const,
      },
      {
        summary: 'Develop Telegram Mini App frontend',
        description: 'Create web interface for Telegram Mini App with wallet UI and transaction features',
        assignee: 'l@alphaton.capital',
        status: 'Done',
        issueType: 'Task' as const,
        priority: 'Medium' as const,
      },

      // Future tasks - Backend Infrastructure (Damir)
      {
        summary: 'Setup AWS infrastructure for production deployment',
        description: 'Configure EC2, RDS, ElastiCache, and load balancer for production environment',
        assignee: 'l@alphaton.capital',
        status: 'To Do',
        issueType: 'Task' as const,
        priority: 'High' as const,
      },
      {
        summary: 'Implement Redis cluster for scalable session management',
        description: 'Setup Redis cluster with proper replication and failover mechanisms',
        assignee: 'l@alphaton.capital',
        status: 'To Do',
        issueType: 'Task' as const,
        priority: 'Medium' as const,
      },
      {
        summary: 'Configure CI/CD pipeline with GitHub Actions',
        description: 'Setup automated testing, building, and deployment pipeline',
        assignee: 'l@alphaton.capital',
        status: 'To Do',
        issueType: 'Task' as const,
        priority: 'High' as const,
      },
      {
        summary: 'Implement monitoring and logging infrastructure',
        description: 'Setup CloudWatch, Prometheus, and Grafana for system monitoring',
        assignee: 'l@alphaton.capital',
        status: 'To Do',
        issueType: 'Task' as const,
        priority: 'Medium' as const,
      },
      {
        summary: 'Setup database backup and disaster recovery',
        description: 'Implement automated backups and recovery procedures',
        assignee: 'l@alphaton.capital',
        status: 'To Do',
        issueType: 'Task' as const,
        priority: 'High' as const,
      },

      // Future tasks - Development (Logan)
      {
        summary: 'Implement smart contract interaction features',
        description: 'Add ability to interact with custom TON smart contracts',
        assignee: 'l@alphaton.capital',
        status: 'To Do',
        issueType: 'Story' as const,
        priority: 'Medium' as const,
      },
      {
        summary: 'Add multi-wallet support',
        description: 'Allow users to manage multiple TON wallets',
        assignee: 'l@alphaton.capital',
        status: 'To Do',
        issueType: 'Story' as const,
        priority: 'Low' as const,
      },
      {
        summary: 'Implement DeFi features integration',
        description: 'Add staking, swapping, and yield farming capabilities',
        assignee: 'l@alphaton.capital',
        status: 'To Do',
        issueType: 'Story' as const,
        priority: 'Low' as const,
      },
      {
        summary: 'Create comprehensive test suite',
        description: 'Write unit, integration, and e2e tests for all components',
        assignee: 'l@alphaton.capital',
        status: 'In Progress',
        issueType: 'Task' as const,
        priority: 'High' as const,
      },
      {
        summary: 'Optimize performance and caching',
        description: 'Implement caching strategies and performance optimizations',
        assignee: 'l@alphaton.capital',
        status: 'To Do',
        issueType: 'Task' as const,
        priority: 'Medium' as const,
      },

      // Project Management tasks (assigned to Logan temporarily)
      {
        summary: 'Create project documentation and user guides',
        description: 'Write comprehensive documentation for developers and end users',
        assignee: 'l@alphaton.capital',
        status: 'In Progress',
        issueType: 'Task' as const,
        priority: 'High' as const,
      },
      {
        summary: 'Define project roadmap and milestones',
        description: 'Create detailed project timeline with deliverables',
        assignee: 'l@alphaton.capital',
        status: 'To Do',
        issueType: 'Task' as const,
        priority: 'High' as const,
      },
      {
        summary: 'Coordinate team sprints and meetings',
        description: 'Organize sprint planning, daily standups, and retrospectives',
        assignee: 'l@alphaton.capital',
        status: 'In Progress',
        issueType: 'Task' as const,
        priority: 'High' as const,
      },
      {
        summary: 'User acceptance testing coordination',
        description: 'Organize UAT sessions and collect user feedback',
        assignee: 'l@alphaton.capital',
        status: 'To Do',
        issueType: 'Task' as const,
        priority: 'Medium' as const,
      },
      {
        summary: 'Stakeholder communication and reporting',
        description: 'Regular updates to stakeholders on project progress',
        assignee: 'l@alphaton.capital',
        status: 'In Progress',
        issueType: 'Task' as const,
        priority: 'Medium' as const,
      },
    ];

    const createdIssues = [];
    
    for (const task of tasks) {
      try {
        const issue = await this.createIssue({
          summary: task.summary,
          description: task.description,
          issueType: task.issueType,
          assignee: task.assignee,
          priority: task.priority,
          labels: ['telegram-claude-mcp', 'ton-blockchain'],
        });
        
        createdIssues.push(issue);
        
        if (task.status === 'Done') {
          await this.transitionIssue(issue.key, 'Done');
        } else if (task.status === 'In Progress') {
          await this.transitionIssue(issue.key, 'In Progress');
        }
        
        logger.info(`Created task: ${issue.key} - ${task.summary}`);
      } catch (error) {
        logger.error(`Failed to create task: ${task.summary}`, error);
      }
    }
    
    return createdIssues;
  }
}