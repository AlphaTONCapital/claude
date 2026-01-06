import { JiraService, CreateIssueParams } from './jira.js';
import { logger } from '../utils/logger.js';

export class ComprehensiveJiraTaskCreator {
  constructor(private jiraService: JiraService) {}

  async createAllProjectTasks(): Promise<void> {
    logger.info('Creating comprehensive project tasks...');

    // Development Tasks - Logan
    const developmentTasks = this.getLogianDevelopmentTasks();
    await this.createTaskBatch('Development Tasks (Logan)', developmentTasks);

    // AWS Infrastructure Tasks - Damir  
    const infrastructureTasks = this.getDamirInfrastructureTasks();
    await this.createTaskBatch('AWS Infrastructure Tasks (Damir)', infrastructureTasks);

    // Project Management & QA Tasks - Liza
    const managementTasks = this.getLizaManagementTasks();
    await this.createTaskBatch('Project Management & QA Tasks (Liza)', managementTasks);

    logger.info('All comprehensive tasks created successfully!');
  }

  private getLogianDevelopmentTasks(): CreateIssueParams[] {
    return [
      // Critical Bug Fixes
      {
        summary: 'Fix TypeScript compilation errors',
        description: 'Resolve all TypeScript errors in MCP handlers, TON service, and other components. Ensure strict type safety.',
        issueType: 'Bug',
        assignee: 'l@alphaton.capital',
        priority: 'Highest',
        labels: ['typescript', 'critical', 'compilation'],
      },
      {
        summary: 'Fix TON service transaction handling',
        description: 'Resolve TON SDK integration issues, fix transaction hash handling, and proper error management.',
        issueType: 'Bug', 
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['ton', 'blockchain', 'transactions'],
      },
      {
        summary: 'Fix MCP Server handler registration',
        description: 'Resolve MCP server handler registration issues and ensure proper tool/resource registration.',
        issueType: 'Bug',
        assignee: 'l@alphaton.capital', 
        priority: 'High',
        labels: ['mcp', 'server', 'handlers'],
      },

      // Core Development Features
      {
        summary: 'Complete Telegram bot command system',
        description: 'Implement all planned bot commands with proper error handling and user feedback.',
        issueType: 'Story',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['telegram', 'bot', 'commands'],
      },
      {
        summary: 'Implement comprehensive test suite',
        description: 'Write unit, integration, and e2e tests for all components. Target 80%+ coverage.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['testing', 'coverage', 'quality'],
      },
      {
        summary: 'Add TON wallet multi-signature support', 
        description: 'Implement multi-signature wallet functionality for enhanced security.',
        issueType: 'Story',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['ton', 'wallet', 'security'],
      },
      {
        summary: 'Implement TON smart contract interactions',
        description: 'Add ability to interact with custom TON smart contracts and deploy new ones.',
        issueType: 'Story',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['ton', 'smart-contracts', 'deployment'],
      },
      {
        summary: 'Add Jetton token management features',
        description: 'Complete Jetton token support with transfers, balance checking, and metadata retrieval.',
        issueType: 'Story',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['ton', 'jetton', 'tokens'],
      },
      {
        summary: 'Implement NFT marketplace integration',
        description: 'Add NFT viewing, trading, and management capabilities.',
        issueType: 'Story',
        assignee: 'l@alphaton.capital',
        priority: 'Low',
        labels: ['ton', 'nft', 'marketplace'],
      },

      // Security & Performance
      {
        summary: 'Implement comprehensive input validation',
        description: 'Add input validation for all user inputs, API requests, and external data.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['security', 'validation', 'input'],
      },
      {
        summary: 'Add rate limiting and anti-spam measures',
        description: 'Implement sophisticated rate limiting and anti-spam protection for bot and API.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['security', 'rate-limiting', 'spam-protection'],
      },
      {
        summary: 'Optimize performance and caching',
        description: 'Implement caching strategies, optimize database queries, and improve response times.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['performance', 'caching', 'optimization'],
      },
      {
        summary: 'Add comprehensive logging and error tracking',
        description: 'Implement structured logging, error tracking, and debugging capabilities.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['logging', 'monitoring', 'debugging'],
      },

      // Mini App Development
      {
        summary: 'Complete Telegram Mini App UI/UX',
        description: 'Finish Mini App interface with responsive design and smooth user experience.',
        issueType: 'Story',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['miniapp', 'frontend', 'ui-ux'],
      },
      {
        summary: 'Add Mini App wallet connection',
        description: 'Implement TON wallet connection for Mini App with proper authentication.',
        issueType: 'Story',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['miniapp', 'wallet', 'authentication'],
      },
      {
        summary: 'Implement Mini App notifications',
        description: 'Add real-time notifications for transactions and important events.',
        issueType: 'Story',
        assignee: 'l@alphaton.capital',
        priority: 'Low',
        labels: ['miniapp', 'notifications', 'real-time'],
      },

      // Documentation & Code Quality
      {
        summary: 'Complete API documentation',
        description: 'Write comprehensive API documentation for all endpoints and MCP tools.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['documentation', 'api', 'reference'],
      },
      {
        summary: 'Add code comments and inline documentation',
        description: 'Add comprehensive comments to complex code sections and functions.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Low',
        labels: ['documentation', 'code-comments', 'maintainability'],
      },
      {
        summary: 'Refactor and optimize code structure',
        description: 'Refactor code for better maintainability, readability, and performance.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['refactoring', 'code-quality', 'maintainability'],
      },

      // Advanced Features
      {
        summary: 'Add DeFi integration features',
        description: 'Implement staking, swapping, and yield farming capabilities.',
        issueType: 'Epic',
        assignee: 'l@alphaton.capital',
        priority: 'Low',
        labels: ['defi', 'staking', 'advanced'],
      },
      {
        summary: 'Implement cross-chain bridge support',
        description: 'Add support for cross-chain operations and bridge integrations.',
        issueType: 'Story',
        assignee: 'l@alphaton.capital',
        priority: 'Low',
        labels: ['cross-chain', 'bridge', 'advanced'],
      },
    ];
  }

  private getDamirInfrastructureTasks(): CreateIssueParams[] {
    return [
      // Core Infrastructure
      {
        summary: 'Setup AWS production environment',
        description: 'Configure AWS account, VPC, subnets, security groups, and basic infrastructure.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Highest',
        labels: ['aws', 'infrastructure', 'production', 'assign-to-damir'],
      },
      {
        summary: 'Configure production EC2 instances',
        description: 'Setup EC2 instances with auto-scaling groups, load balancers, and proper security.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Highest',
        labels: ['aws', 'ec2', 'auto-scaling', 'assign-to-damir'],
      },
      {
        summary: 'Setup RDS PostgreSQL cluster',
        description: 'Configure production PostgreSQL database with multi-AZ deployment and backups.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['aws', 'rds', 'database', 'assign-to-damir'],
      },
      {
        summary: 'Configure Redis ElastiCache cluster',
        description: 'Setup Redis cluster for session management and caching with proper security.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['aws', 'redis', 'caching', 'assign-to-damir'],
      },

      // CI/CD and Deployment
      {
        summary: 'Setup CI/CD pipeline with GitHub Actions',
        description: 'Configure automated testing, building, and deployment pipeline.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['cicd', 'github-actions', 'automation', 'assign-to-damir'],
      },
      {
        summary: 'Configure Docker containers and ECR',
        description: 'Setup container registry and optimize Docker images for production.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['docker', 'ecr', 'containers', 'assign-to-damir'],
      },
      {
        summary: 'Implement blue-green deployment strategy',
        description: 'Setup zero-downtime deployment with blue-green deployment strategy.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['deployment', 'blue-green', 'zero-downtime', 'assign-to-damir'],
      },

      // Monitoring and Logging
      {
        summary: 'Setup CloudWatch monitoring and alerting',
        description: 'Configure comprehensive monitoring, metrics, and alerting for all services.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['aws', 'cloudwatch', 'monitoring', 'assign-to-damir'],
      },
      {
        summary: 'Configure centralized logging with ELK stack',
        description: 'Setup Elasticsearch, Logstash, and Kibana for centralized log management.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['logging', 'elk', 'elasticsearch', 'assign-to-damir'],
      },
      {
        summary: 'Setup APM and performance monitoring',
        description: 'Configure application performance monitoring and distributed tracing.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['apm', 'performance', 'tracing', 'assign-to-damir'],
      },

      // Security and Backup
      {
        summary: 'Implement backup and disaster recovery',
        description: 'Setup automated backups, disaster recovery procedures, and data retention policies.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['backup', 'disaster-recovery', 'data-retention', 'assign-to-damir'],
      },
      {
        summary: 'Configure security scanning and compliance',
        description: 'Setup security scanning, vulnerability assessments, and compliance monitoring.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['security', 'scanning', 'compliance', 'assign-to-damir'],
      },
      {
        summary: 'Setup SSL/TLS certificates and HTTPS',
        description: 'Configure SSL certificates, HTTPS enforcement, and security headers.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['ssl', 'https', 'security', 'assign-to-damir'],
      },

      // Scaling and Optimization
      {
        summary: 'Configure auto-scaling policies',
        description: 'Setup intelligent auto-scaling based on metrics and predictive scaling.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['auto-scaling', 'optimization', 'policies', 'assign-to-damir'],
      },
      {
        summary: 'Setup CDN and edge caching',
        description: 'Configure CloudFront CDN for static assets and API caching.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['cdn', 'caching', 'cloudfront', 'assign-to-damir'],
      },
      {
        summary: 'Implement cost optimization strategies',
        description: 'Setup cost monitoring, resource optimization, and spending alerts.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Low',
        labels: ['cost-optimization', 'monitoring', 'efficiency', 'assign-to-damir'],
      },
    ];
  }

  private getLizaManagementTasks(): CreateIssueParams[] {
    return [
      // Project Management
      {
        summary: 'Create detailed project roadmap and milestones',
        description: 'Develop comprehensive project timeline with clear deliverables and milestones.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Highest',
        labels: ['roadmap', 'milestones', 'planning', 'assign-to-liza'],
      },
      {
        summary: 'Coordinate team sprints and meetings',
        description: 'Organize sprint planning, daily standups, retrospectives, and team coordination.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['sprints', 'meetings', 'coordination', 'assign-to-liza'],
      },
      {
        summary: 'Define and track KPIs and success metrics',
        description: 'Establish key performance indicators and success metrics for the project.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['kpis', 'metrics', 'success-tracking', 'assign-to-liza'],
      },
      {
        summary: 'Manage stakeholder communication',
        description: 'Regular updates to stakeholders, progress reporting, and feedback collection.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['stakeholders', 'communication', 'reporting', 'assign-to-liza'],
      },

      // Quality Assurance
      {
        summary: 'Design comprehensive QA testing strategy',
        description: 'Create testing strategy covering unit, integration, E2E, and user acceptance testing.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['qa', 'testing-strategy', 'quality', 'assign-to-liza'],
      },
      {
        summary: 'Coordinate user acceptance testing (UAT)',
        description: 'Organize UAT sessions, collect user feedback, and manage testing cycles.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['uat', 'user-testing', 'feedback', 'assign-to-liza'],
      },
      {
        summary: 'Establish quality gates and review processes',
        description: 'Define quality gates, code review processes, and release criteria.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['quality-gates', 'review-process', 'criteria', 'assign-to-liza'],
      },
      {
        summary: 'Perform security and compliance audits',
        description: 'Coordinate security reviews, compliance checks, and vulnerability assessments.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['security-audit', 'compliance', 'vulnerability', 'assign-to-liza'],
      },

      // Documentation and Training
      {
        summary: 'Create comprehensive user documentation',
        description: 'Write user guides, tutorials, and help documentation for end users.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['documentation', 'user-guides', 'tutorials', 'assign-to-liza'],
      },
      {
        summary: 'Develop team training materials',
        description: 'Create training materials for development team and operational procedures.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['training', 'procedures', 'team-development', 'assign-to-liza'],
      },
      {
        summary: 'Conduct knowledge transfer sessions',
        description: 'Organize knowledge sharing sessions and cross-training for team members.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['knowledge-transfer', 'training', 'cross-training', 'assign-to-liza'],
      },

      // Release Management
      {
        summary: 'Plan and coordinate releases',
        description: 'Manage release planning, scheduling, and coordination across teams.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['release-management', 'planning', 'coordination', 'assign-to-liza'],
      },
      {
        summary: 'Establish rollback and incident response procedures',
        description: 'Create procedures for handling rollbacks, incidents, and emergency responses.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'High',
        labels: ['rollback', 'incident-response', 'emergency', 'assign-to-liza'],
      },
      {
        summary: 'Monitor post-release performance and user feedback',
        description: 'Track post-release metrics, user feedback, and system performance.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['post-release', 'monitoring', 'feedback', 'assign-to-liza'],
      },

      // Risk Management
      {
        summary: 'Identify and manage project risks',
        description: 'Conduct risk assessments, create mitigation strategies, and monitor risk factors.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['risk-management', 'assessment', 'mitigation', 'assign-to-liza'],
      },
      {
        summary: 'Ensure regulatory compliance',
        description: 'Monitor compliance requirements and ensure adherence to regulations.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['compliance', 'regulatory', 'adherence', 'assign-to-liza'],
      },

      // Process Improvement
      {
        summary: 'Analyze and improve development processes',
        description: 'Continuously analyze team processes and implement improvements.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Low',
        labels: ['process-improvement', 'analysis', 'optimization', 'assign-to-liza'],
      },
      {
        summary: 'Facilitate retrospectives and process reviews',
        description: 'Conduct regular retrospectives and process improvement sessions.',
        issueType: 'Task',
        assignee: 'l@alphaton.capital',
        priority: 'Medium',
        labels: ['retrospectives', 'process-review', 'improvement', 'assign-to-liza'],
      },
    ];
  }

  private async createTaskBatch(batchName: string, tasks: CreateIssueParams[]): Promise<void> {
    logger.info(`Creating ${batchName} - ${tasks.length} tasks`);
    
    let successCount = 0;
    let failureCount = 0;

    for (const task of tasks) {
      try {
        const issue = await this.jiraService.createIssue(task);
        logger.info(`✅ Created: ${issue.key} - ${task.summary}`);
        successCount++;
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        logger.error(`❌ Failed to create: ${task.summary}`, error.message);
        failureCount++;
      }
    }

    logger.info(`${batchName} Summary: ${successCount} success, ${failureCount} failed`);
  }
}