import { JiraService } from '../src/services/jira.js';
import { config } from '../src/config/index.js';
import { logger } from '../src/utils/logger.js';

async function setupJiraProject() {
  console.log('🚀 Setting up JIRA project...\n');
  
  if (!config.jira.apiKey) {
    console.error('❌ JIRA API key not configured in environment');
    process.exit(1);
  }

  const jiraService = new JiraService({
    apiKey: config.jira.apiKey!,
    domain: config.jira.domain!,
    email: config.jira.email!,
    projectKey: 'TCMCP',
  });

  try {
    // Step 1: Create Project
    console.log('📁 Creating JIRA project...');
    try {
      await jiraService.createProject();
      console.log('✅ Project created successfully');
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log('ℹ️  Project already exists, continuing...');
      } else {
        throw error;
      }
    }

    // Step 2: Create Board
    console.log('\n📋 Creating Kanban board...');
    try {
      const board = await jiraService.createBoard('Telegram Claude MCP Board');
      console.log(`✅ Board created: ${board.name} (ID: ${board.id})`);
    } catch (error: any) {
      if (error.response?.data?.errorMessages?.[0]?.includes('already exists')) {
        console.log('ℹ️  Board already exists, continuing...');
      } else {
        console.warn('⚠️  Could not create board:', error.response?.data || error.message);
      }
    }

    // Step 3: Create Tasks
    console.log('\n📝 Creating project tasks...');
    console.log('This will create 20 tasks with proper assignments:');
    console.log('  - 5 completed tasks (Logan)');
    console.log('  - 5 infrastructure tasks (Damir)');
    console.log('  - 5 development tasks (Logan)');
    console.log('  - 5 project management tasks (Liza)\n');

    const tasks = await jiraService.createProjectTasks();
    console.log(`✅ Successfully created ${tasks.length} tasks`);

    // Step 4: Get Board URL
    console.log('\n🎉 JIRA Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📌 Project URL: https://${config.jira.domain}/projects/TCMCP`);
    console.log(`📊 Board URL: https://${config.jira.domain}/jira/software/c/projects/TCMCP/boards`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error: any) {
    console.error('❌ Error setting up JIRA:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the setup
setupJiraProject().then(() => {
  console.log('\n✨ All done!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});