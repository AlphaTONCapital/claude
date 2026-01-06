import { JiraService } from '../src/services/jira.js';
import { ComprehensiveJiraTaskCreator } from '../src/services/comprehensive-jira-tasks.js';
import { config } from '../src/config/index.js';
import { logger } from '../src/utils/logger.js';

async function createAllProjectTasks() {
  console.log('🚀 Creating ALL project tasks...\n');
  console.log('📋 This will create approximately 60+ tasks:');
  console.log('   • 20 Development tasks (Logan)');
  console.log('   • 16 AWS Infrastructure tasks (Damir)');  
  console.log('   • 17 Project Management & QA tasks (Liza)\n');
  
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

  const taskCreator = new ComprehensiveJiraTaskCreator(jiraService);

  try {
    console.log('⏳ Starting task creation process...\n');
    
    const startTime = Date.now();
    await taskCreator.createAllProjectTasks();
    const endTime = Date.now();
    
    console.log('\n🎉 ALL PROJECT TASKS CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Total time: ${((endTime - startTime) / 1000).toFixed(1)} seconds`);
    console.log(`📌 Project: https://${config.jira.domain}/projects/TCMCP`);
    console.log(`📋 Board: https://${config.jira.domain}/jira/software/c/projects/TCMCP/boards/280`);
    console.log(`📝 Issues: https://${config.jira.domain}/jira/software/c/projects/TCMCP/issues`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📊 Task Distribution:');
    console.log('┌────────────────────────────────────────────────────┐');
    console.log('│ LOGAN (Development)                                │');
    console.log('│ • Bug fixes (TypeScript, TON, MCP)                │');
    console.log('│ • Core features (Bot commands, Tests, Security)   │');
    console.log('│ • Advanced features (Multi-sig, Smart contracts)  │');
    console.log('│ • Mini App development                             │');
    console.log('│ • Documentation & Code quality                     │');
    console.log('├────────────────────────────────────────────────────┤');
    console.log('│ DAMIR (AWS Infrastructure)                        │');
    console.log('│ • Production environment setup                     │');
    console.log('│ • CI/CD pipeline configuration                     │');
    console.log('│ • Monitoring & logging infrastructure              │');
    console.log('│ • Security & backup systems                        │');
    console.log('│ • Scaling & optimization                           │');
    console.log('├────────────────────────────────────────────────────┤');
    console.log('│ LIZA (Project Management & QA)                    │');
    console.log('│ • Project roadmap & milestone planning            │');
    console.log('│ • QA strategy & testing coordination               │');
    console.log('│ • Documentation & training materials               │');
    console.log('│ • Release management & risk assessment             │');
    console.log('│ • Process improvement & team coordination          │');
    console.log('└────────────────────────────────────────────────────┘');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Review tasks in JIRA board');
    console.log('2. Prioritize tasks based on project timeline');
    console.log('3. Start with critical bug fixes and infrastructure');
    console.log('4. Coordinate team assignments and sprint planning');
    console.log('5. Begin development following claude.md guidelines');

  } catch (error: any) {
    console.error('❌ Error creating tasks:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the task creation
createAllProjectTasks().then(() => {
  console.log('\n✨ Task creation completed!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});