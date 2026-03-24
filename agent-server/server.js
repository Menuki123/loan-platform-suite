require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { runAgent } = require('./agent/qaAgent');
const { toolRegistry, agentCatalog } = require('./config/toolRegistry');
const { promptTemplates } = require('./config/promptTemplates');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    service: 'agent-server',
    message: 'System Functional Evaluation Agent server is running',
    endpoints: {
      health: 'GET /health',
      agents: 'GET /agents/catalog',
      tools: 'GET /mcp/tools',
      prompts: 'GET /prompts/templates',
      bootstrap: 'GET /qa/bootstrap',
      run: 'POST /qa/run',
      postman: 'GET /qa/postman-collection'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'agent-server' });
});

app.get('/agents/catalog', (req, res) => {
  res.json({ status: 'success', items: agentCatalog });
});

app.get('/mcp/tools', (req, res) => {
  res.json({
    status: 'success',
    protocol: 'MCP-inspired registry',
    tools: toolRegistry
  });
});

app.get('/prompts/templates', (req, res) => {
  res.json({ status: 'success', items: promptTemplates });
});

app.get('/qa/bootstrap', (req, res) => {
  res.json({
    status: 'success',
    stage: 'collect_meta',
    agent: agentCatalog[0],
    component: {
      type: 'config_form',
      title: 'Execution Configuration',
      description: 'Capture Swagger URL and runtime metadata before the conversation continues.',
      fields: [
        { key: 'apiBaseUrl', label: 'API Base URL', type: 'text', required: true, placeholder: 'http://localhost:3000' },
        { key: 'swaggerUrl', label: 'Swagger URL', type: 'text', required: true, placeholder: 'http://localhost:3000/openapi.yaml' },
        { key: 'maxRoutes', label: 'Max Routes', type: 'number', required: true, defaultValue: 4 },
        { key: 'responseMode', label: 'Response Mode', type: 'select', required: true, options: ['table', 'list', 'visual'], defaultValue: 'table' }
      ]
    },
    capabilities: [
      'Reads Swagger/OpenAPI from URL or local path',
      'Uses MCP-style tool registry and prompt templates',
      'Runs the agent in conversation mode',
      'Shows results in table, list, or visual format',
      'Supports Postman for manual verification'
    ]
  });
});

app.get('/qa/postman-collection', (req, res) => {
  const filePath = path.join(__dirname, 'postman', 'loan-platform-agent.postman_collection.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  res.type('application/json').send(raw);
});

app.post('/qa/run', async (req, res) => {
  try {
    const swaggerSource = req.body.swaggerUrl || req.body.swaggerPath || '../api-server/openapi.yaml';
    const result = await runAgent({
      prompt: req.body.prompt || 'Validate the exposed API and explain the outcome clearly.',
      apiBaseUrl: req.body.apiBaseUrl || 'http://localhost:3000',
      swaggerSource,
      maxRoutes: Number(req.body.maxRoutes || 4),
      responseMode: req.body.responseMode || 'table'
    });

    res.json(result);
  } catch (error) {
    console.error('[AGENT] Error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Agent execution failed' });
  }
});

const PORT = process.env.AGENT_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Agent server running on port ${PORT}`);
});
