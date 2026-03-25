require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { runAgent } = require('./agent/qaAgent');
const { toolRegistry } = require('./config/toolRegistry');
const { agentCatalog } = require('./config/agentCatalog');
const { promptTemplates } = require('./config/promptTemplates');
const postmanCollection = require('./postman/loan-platform-agent.postman_collection.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'AI agent server is running',
    endpoints: {
      health: 'GET /health',
      bootstrap: 'GET /qa/bootstrap',
      run: 'POST /qa/run',
      tools: 'GET /mcp/tools',
      prompts: 'GET /prompts/templates',
      catalog: 'GET /agents/catalog',
      postman: 'GET /qa/postman-collection'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'agent-server', mode: 'conversation-first' });
});

app.get('/agents/catalog', (req, res) => {
  res.json({ status: 'success', agents: agentCatalog });
});

app.get('/mcp/tools', (req, res) => {
  res.json({ status: 'success', protocol: 'mcp-inspired-registry', tools: toolRegistry });
});

app.get('/prompts/templates', (req, res) => {
  res.json({ status: 'success', prompts: promptTemplates });
});

app.get('/qa/postman-collection', (req, res) => {
  res.json(postmanCollection);
});

app.get('/qa/bootstrap', (req, res) => {
  res.json({
    status: 'success',
    stage: 'collect_meta',
    component: {
      type: 'config_form',
      title: 'System Evaluation Configuration',
      description: 'Capture Swagger URL and runtime metadata before the QA agent asks for the evaluation prompt.',
      fields: [
        { key: 'apiBaseUrl', label: 'API Base URL', type: 'text', required: true, placeholder: 'https://your-api-host.com' },
        { key: 'swaggerUrl', label: 'Swagger URL', type: 'text', required: true, placeholder: 'https://your-api-host.com/openapi.yaml' },
        { key: 'maxRoutes', label: 'Max Routes', type: 'number', required: true, defaultValue: 4 },
        { key: 'environment', label: 'Environment', type: 'select', required: true, options: ['local', 'uat', 'qa', 'prod-safe'], defaultValue: 'local' },
        { key: 'responseMode', label: 'Response Mode', type: 'select', required: true, options: ['cards', 'list', 'table'], defaultValue: 'cards' }
      ]
    },
    nextStep: 'collect_prompt',
    tools: toolRegistry,
    prompts: promptTemplates
  });
});

app.post('/qa/run', async (req, res) => {
  try {
    const swaggerSource = req.body.swaggerUrl || req.body.swaggerPath || '../api-server/openapi.yaml';

    const result = await runAgent({
      prompt: req.body.prompt,
      apiBaseUrl: req.body.apiBaseUrl || 'http://localhost:3000',
      swaggerSource,
      maxRoutes: Number(req.body.maxRoutes || 6),
      responseMode: req.body.responseMode || 'cards'
    });

    res.json(result);
  } catch (error) {
    console.error('[AGENT] Error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.AGENT_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Agent server running on port ${PORT}`);
});
