const agentCatalog = [
  {
    id: 'create-agent',
    type: 'create',
    name: 'Create New Agent',
    summary: 'Start a new AI agent with MCP-ready tools, conversation prompts, and execution resources.',
    toolCount: null,
    createdAt: 'Ready to configure'
  },
  {
    id: 'los-validation',
    type: 'agent',
    name: 'Application Form Validation Agent - LOS',
    summary: 'Conversation-first agent for validating LOS application forms, workflow gates, and required details.',
    toolCount: 9,
    createdAt: 'Jan 22, 2026, 11:38 AM'
  },
  {
    id: 'cms-assistant',
    type: 'agent',
    name: 'CMS - Assistant Tab',
    summary: 'Analyzes customer and product data, supports operational actions, and provides guided assistant behaviour.',
    toolCount: 10,
    createdAt: 'Oct 21, 2025, 06:35 PM'
  },
  {
    id: 'contract-analysis',
    type: 'agent',
    name: 'Customer Contract Analysis Agent - CMS',
    summary: 'Reviews contract content, surfaces business risks, and summarizes findings for business users.',
    toolCount: 10,
    createdAt: 'Nov 19, 2025, 10:01 AM'
  },
  {
    id: 'ptp-request',
    type: 'agent',
    name: 'Customer PTP Request Agent',
    summary: 'Generates configuration and JSON-driven assistant experiences with reusable prompts and tools.',
    toolCount: 8,
    createdAt: 'Oct 2, 2025, 02:05 PM'
  },
  {
    id: 'support-agent',
    type: 'agent',
    name: 'Support Agent',
    summary: 'General-purpose AI support agent with guided tooling, execution summaries, and reusable prompt packs.',
    toolCount: 6,
    createdAt: 'Jun 23, 2025, 03:55 PM'
  },
  {
    id: 'portfolio-intelligence',
    type: 'agent',
    name: 'Supervisor & Portfolio Intelligence',
    summary: 'High-level assistant for benchmarking similar cases, risk summarization, and portfolio monitoring.',
    toolCount: 7,
    createdAt: 'Jan 22, 2026, 10:39 AM'
  },
  {
    id: 'action-escalation',
    type: 'agent',
    name: 'Action & Escalation Guidance',
    summary: 'Suggests next best operational actions using status, risk, and collection pathway signals.',
    toolCount: 7,
    createdAt: 'Jan 22, 2026, 10:36 AM'
  },
  {
    id: 'admin-report',
    type: 'agent',
    name: 'Admin Report Agent - LOS',
    summary: 'Answers simple business questions and converts execution data into loan system operational insights.',
    toolCount: 7,
    createdAt: 'Nov 19, 2025, 10:08 AM'
  }
];

module.exports = { agentCatalog };
