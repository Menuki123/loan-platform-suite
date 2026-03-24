require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { runAgent } = require('./agent/qaAgent');
const { getToolRegistry } = require('./config/toolRegistry');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Agent server is running',
    endpoints: {
      health: 'GET /health',
      bootstrap: 'GET /qa/bootstrap',
      tools: 'GET /mcp/tools',
      run: 'POST /qa/run',
      postmanCollection: 'GET /qa/postman-collection'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'agent-server'
  });
});

app.get('/mcp/tools', (req, res) => {
  res.json({
    status: 'success',
    protocol: 'mcp-inspired-tool-registry',
    tools: getToolRegistry()
  });
});

app.get('/qa/bootstrap', (req, res) => {
  res.json({
    status: 'success',
    stage: 'collect_meta',
    conversationMode: true,
    component: {
      type: 'config_form',
      title: 'System Functional Evaluation Agent',
      description: 'Provide API and Swagger metadata first. After that, the agent will ask for the testing prompt.',
      fields: [
        {
          key: 'apiBaseUrl',
          label: 'API Base URL',
          type: 'text',
          required: true,
          placeholder: 'http://localhost:3000',
          defaultValue: 'http://localhost:3000'
        },
        {
          key: 'swaggerUrl',
          label: 'Swagger URL',
          type: 'text',
          required: true,
          placeholder: 'http://localhost:3000/openapi.yaml',
          defaultValue: 'http://localhost:3000/openapi.yaml'
        },
        {
          key: 'maxRoutes',
          label: 'Max Routes',
          type: 'number',
          required: true,
          defaultValue: 4
        }
      ],
      promptSuggestions: [
        'Test the full loan workflow and explain each failed stage simply.',
        'Check whether the system blocks invalid customer onboarding data.',
        'Review the payment flow and summarize any validation issues for business users.'
      ]
    }
  });
});

app.get('/qa/postman-collection', (req, res) => {
  const filePath = path.join(__dirname, 'postman', 'loan-platform-agent.postman_collection.json');
  const content = fs.readFileSync(filePath, 'utf8');
  res.setHeader('Content-Type', 'application/json');
  res.send(content);
});

app.get('/qa/run', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Use POST /qa/run with JSON body. You can also inspect GET /qa/bootstrap first.'
  });
});

app.post('/qa/run', async (req, res) => {
  try {
    const swaggerSource = req.body.swaggerUrl || req.body.swaggerPath || '../api-server/openapi.yaml';

    console.log('[AGENT] Incoming prompt:', req.body.prompt);
    console.log('[AGENT] API Base URL:', req.body.apiBaseUrl);
    console.log('[AGENT] Swagger Source:', swaggerSource);
    console.log('[AGENT] Max Routes:', req.body.maxRoutes);

    const result = await runAgent({
      prompt: req.body.prompt,
      apiBaseUrl: req.body.apiBaseUrl || 'http://localhost:3000',
      swaggerSource,
      maxRoutes: Number(req.body.maxRoutes || 6),
      conversationMode: req.body.conversationMode !== false
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
