const toolRegistry = [
  {
    id: 'configCaptureComponent',
    name: 'configCaptureComponent',
    description: 'Captures Swagger URL, API base URL, max routes, and response mode before execution.',
    category: 'ui_component',
    capabilities: ['form', 'wizard', 'metadata capture'],
    inputSchema: {
      type: 'object',
      properties: {
        apiBaseUrl: { type: 'string' },
        swaggerUrl: { type: 'string' },
        maxRoutes: { type: 'number' },
        responseMode: { type: 'string', enum: ['table', 'list', 'visual'] }
      },
      required: ['apiBaseUrl', 'swaggerUrl']
    }
  },
  {
    id: 'swaggerRouteDiscovery',
    name: 'swaggerRouteDiscovery',
    description: 'Loads an OpenAPI document from URL or file path and extracts candidate routes.',
    category: 'mcp_tool',
    capabilities: ['swagger parsing', 'route extraction', 'tag analysis']
  },
  {
    id: 'payloadGenerator',
    name: 'payloadGenerator',
    description: 'Creates dummy payloads from JSON schemas for quick functional evaluation.',
    category: 'mcp_tool',
    capabilities: ['schema traversal', 'sample payload generation']
  },
  {
    id: 'apiInvoker',
    name: 'apiInvoker',
    description: 'Executes HTTP requests against the target API and captures status, data, and errors.',
    category: 'mcp_tool',
    capabilities: ['http execution', 'evidence capture', 'error surfacing']
  },
  {
    id: 'responseEvaluator',
    name: 'responseEvaluator',
    description: 'Evaluates whether the returned status and payload align with the requested scenario.',
    category: 'mcp_tool',
    capabilities: ['pass/fail scoring', 'human friendly reasoning']
  },
  {
    id: 'resultRenderer',
    name: 'resultRenderer',
    description: 'Transforms execution output into table, list, and visual summaries.',
    category: 'ui_component',
    capabilities: ['table view', 'list view', 'visual cards']
  },
  {
    id: 'postmanCollectionProvider',
    name: 'postmanCollectionProvider',
    description: 'Provides a Postman collection for manual validation and demonstration.',
    category: 'resource',
    capabilities: ['postman export', 'demo handoff']
  }
];

const agentCatalog = [
  {
    id: 'system-functional-evaluation-agent',
    shortCode: 'Q',
    title: 'System Functional Evaluation Agent',
    description: 'Conversational QA agent for Swagger-driven API testing with MCP-style tools and human-friendly reporting.',
    longDescription: 'Captures metadata, asks for a prompt, orchestrates tool execution, and renders the outcome in table, list, or visual mode.',
    createdAt: 'Mar 24, 2026, 08:20 PM',
    toolCount: 7,
    resources: ['Swagger/OpenAPI', 'Prompt templates', 'Postman collection', 'MCP registry'],
    tags: ['QA', 'API', 'MCP', 'Conversation']
  },
  {
    id: 'application-form-validation-agent-los',
    shortCode: 'A',
    title: 'Application Form Validation Agent - LOS',
    description: 'Evaluates form payloads, required sections, and workflow readiness for LOS onboarding.',
    createdAt: 'Jan 22, 2026, 11:38 AM',
    toolCount: 5,
    resources: ['Validation rules', 'Section schemas']
  },
  {
    id: 'admin-report-agent-los',
    shortCode: 'A',
    title: 'Admin Report Agent - LOS',
    description: 'Summarizes key loan origination metrics and operational insights for internal teams.',
    createdAt: 'Nov 19, 2025, 10:08 AM',
    toolCount: 1,
    resources: ['Reports', 'Summaries']
  },
  {
    id: 'support-agent',
    shortCode: 'S',
    title: 'Support Agent',
    description: 'AI-powered support agent.',
    createdAt: 'Jun 23, 2025, 03:55 PM',
    toolCount: 2,
    resources: ['Support KB']
  }
];

module.exports = { toolRegistry, agentCatalog };
