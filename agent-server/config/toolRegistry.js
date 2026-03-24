const toolRegistry = [
  {
    id: 'swaggerCaptureComponent',
    name: 'swaggerCaptureComponent',
    description: 'Predefined UI tool that captures Swagger URL, API base URL, execution depth, and runtime metadata before prompting.',
    category: 'UI Component',
    power: 'High',
    mcpReady: true,
    inputs: ['apiBaseUrl', 'swaggerUrl', 'maxRoutes', 'authMode', 'environment'],
    outputs: ['agentConfig']
  },
  {
    id: 'postmanCollectionExporter',
    name: 'postmanCollectionExporter',
    description: 'Creates a Postman collection from the selected endpoints so business and QA teams can verify flows outside the chat experience.',
    category: 'Interoperability',
    power: 'High',
    mcpReady: true,
    inputs: ['selectedRoutes', 'apiBaseUrl'],
    outputs: ['postmanCollectionUrl']
  },
  {
    id: 'humanFriendlyResultComponent',
    name: 'humanFriendlyResultComponent',
    description: 'Transforms technical execution logs into business-friendly cards, summaries, and route-level findings.',
    category: 'Presentation',
    power: 'High',
    mcpReady: true,
    inputs: ['executionResults'],
    outputs: ['summaryCard', 'decision', 'keyFindings']
  },
  {
    id: 'agentPlanner',
    name: 'agentPlanner',
    description: 'Uses the user prompt and Swagger routes to choose the most relevant endpoints for evaluation.',
    category: 'AI Planning',
    power: 'High',
    mcpReady: true,
    inputs: ['prompt', 'routes', 'maxRoutes'],
    outputs: ['selectedRoutes']
  },
  {
    id: 'payloadGenerator',
    name: 'payloadGenerator',
    description: 'Builds dummy request bodies automatically from OpenAPI schemas and workflow assumptions.',
    category: 'Automation',
    power: 'Medium',
    mcpReady: true,
    inputs: ['schema', 'workflowContext'],
    outputs: ['payload']
  },
  {
    id: 'apiInvoker',
    name: 'apiInvoker',
    description: 'Executes selected API routes against the configured environment and captures evidence for review.',
    category: 'Execution',
    power: 'High',
    mcpReady: true,
    inputs: ['apiBaseUrl', 'route', 'payload'],
    outputs: ['response', 'statusCode', 'timing']
  },
  {
    id: 'resultEvaluator',
    name: 'resultEvaluator',
    description: 'Evaluates API responses against expected status rules, validations, and business outcomes.',
    category: 'Quality Assurance',
    power: 'High',
    mcpReady: true,
    inputs: ['route', 'response'],
    outputs: ['passFailReview', 'reason']
  },
  {
    id: 'promptStudio',
    name: 'promptStudio',
    description: 'Provides reusable AI prompt templates for smoke tests, workflow validation, large JSON checks, and business summaries.',
    category: 'Prompt Engineering',
    power: 'Medium',
    mcpReady: true,
    inputs: ['businessGoal'],
    outputs: ['promptTemplate']
  }
];

module.exports = { toolRegistry };
