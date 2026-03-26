require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { runAgent } = require('./agent/qaAgent');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const defaultApiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
const defaultSwaggerUrl = process.env.SWAGGER_URL || `${defaultApiBaseUrl}/openapi.yaml`;
const defaultMaxRoutes = Number(process.env.MAX_ROUTES || 6);

app.get('/', (_req, res) => {
  res.json({
    status: 'success',
    message: 'Agent server is running',
    endpoints: {
      health: 'GET /health',
      bootstrap: 'GET /qa/bootstrap',
      run: 'POST /qa/run'
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'agent-server' });
});

app.get('/qa/bootstrap', (_req, res) => {
  res.json({
    status: 'success',
    component: {
      type: 'config_form',
      title: 'Swagger configuration',
      fields: [
        {
          key: 'swaggerUrl',
          label: 'Swagger URL',
          type: 'text',
          required: true,
          defaultValue: defaultSwaggerUrl,
          placeholder: 'http://localhost:3000/openapi.yaml'
        }
      ]
    },
    defaults: {
      apiBaseUrl: defaultApiBaseUrl,
      swaggerUrl: defaultSwaggerUrl,
      maxRoutes: defaultMaxRoutes
    }
  });
});

app.get('/qa/run', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Use POST /qa/run with a JSON body in Postman'
  });
});

app.post('/qa/run', async (req, res) => {
  try {
    const prompt = req.body.prompt || 'Run a general API functional evaluation';
    const swaggerSource = req.body.swaggerUrl || req.body.swaggerPath || defaultSwaggerUrl;
    const apiBaseUrl = req.body.apiBaseUrl || defaultApiBaseUrl;
    const maxRoutes = Number(req.body.maxRoutes || defaultMaxRoutes);

    console.log('[AGENT] Incoming prompt:', prompt);
    console.log('[AGENT] API Base URL:', apiBaseUrl);
    console.log('[AGENT] Swagger Source:', swaggerSource);
    console.log('[AGENT] Max Routes:', maxRoutes);

    const result = await runAgent({
      prompt,
      apiBaseUrl,
      swaggerPath: swaggerSource,
      maxRoutes
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
