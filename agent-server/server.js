const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { runAgent } = require('./agent/qaAgent');
const {
  ensureSession,
  saveMessage,
  saveSessionConfig,
  getSessionConfig,
  updateWorkflowStatus,
  getConversation
} = require('./db/chatDb');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const defaultApiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
const defaultSwaggerUrl = process.env.SWAGGER_URL || `${defaultApiBaseUrl}/openapi.json`;
const defaultMaxRoutes = Number(process.env.MAX_ROUTES || 6);

function makeSessionId() {
  return crypto.randomUUID();
}

async function buildConversationPayload(sessionId) {
  const [messages, session] = await Promise.all([
    getConversation(sessionId),
    getSessionConfig(sessionId)
  ]);

  return {
    status: 'success',
    sessionId,
    workflowStatus: session?.workflow_status || 'DRAFT',
    sessionConfig: session
      ? {
          swaggerUrl: session.swagger_url,
          apiBaseUrl: session.api_base_url,
          maxRoutes: session.max_routes,
          workflowStatus: session.workflow_status,
          createdAt: session.created_at,
          updatedAt: session.updated_at
        }
      : null,
    messages
  };
}

app.get('/', (_req, res) => {
  res.json({
    status: 'success',
    message: 'Agent server is running',
    endpoints: {
      health: 'GET /health',
      bootstrap: 'GET /qa/bootstrap',
      configure: 'POST /qa/configure',
      run: 'POST /qa/run',
      runWithFile: 'POST /qa/run (optionally include uploadedFile JSON payload)',
      conversation: 'GET /qa/conversations/:sessionId',
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'agent-server' });
});

app.get('/qa/bootstrap', async (_req, res) => {
  const sessionId = makeSessionId();
  await ensureSession(sessionId, {
    swaggerUrl: defaultSwaggerUrl,
    apiBaseUrl: defaultApiBaseUrl,
    maxRoutes: defaultMaxRoutes,
    workflowStatus: 'DRAFT'
  });

  res.json({
    status: 'success',
    sessionId,
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
          placeholder: 'http://localhost:3000/openapi.json'
        }
      ]
    },
    defaults: {
      apiBaseUrl: defaultApiBaseUrl,
      swaggerUrl: defaultSwaggerUrl,
      maxRoutes: defaultMaxRoutes,
      workflowStatus: 'DRAFT'
    }
  });
});

app.post('/qa/configure', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || makeSessionId();
    const swaggerUrl = req.body.swaggerUrl;
    const apiBaseUrl = req.body.apiBaseUrl || defaultApiBaseUrl;
    const maxRoutes = Number(req.body.maxRoutes || defaultMaxRoutes);

    if (!swaggerUrl) {
      return res.status(400).json({ status: 'error', message: 'Swagger URL is required' });
    }

    await saveSessionConfig({ sessionId, swaggerUrl, apiBaseUrl, maxRoutes, workflowStatus: 'DRAFT' });
    await saveMessage({
      sessionId,
      role: 'tool',
      messageType: 'config_tool',
      content: 'Swagger configuration captured through frontend tool',
      metadata: { swaggerUrl, apiBaseUrl, maxRoutes }
    });

    res.json({
      status: 'success',
      sessionId,
      workflowStatus: 'DRAFT',
      message: 'Configuration captured through the frontend tool. Now send the evaluation prompt.'
    });
  } catch (error) {
    console.error('[CONFIG ERROR]', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/qa/run', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Use POST /qa/run with a JSON body in Postman'
  });
});

app.post('/qa/run', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || makeSessionId();
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).json({ status: 'error', message: 'Prompt is required' });
    }

    let swaggerUrl = req.body.swaggerUrl;
    let apiBaseUrl = req.body.apiBaseUrl || defaultApiBaseUrl;
    let maxRoutes = Number(req.body.maxRoutes || defaultMaxRoutes);

    const savedConfig = await getSessionConfig(sessionId);
    if (savedConfig) {
      swaggerUrl = swaggerUrl || savedConfig.swagger_url;
      apiBaseUrl = req.body.apiBaseUrl || savedConfig.api_base_url || apiBaseUrl;
      maxRoutes = Number(req.body.maxRoutes || savedConfig.max_routes || maxRoutes);
    }

    if (!swaggerUrl) {
      return res.status(400).json({ status: 'error', message: 'Swagger URL is required' });
    }

    await saveMessage({
      sessionId,
      role: 'user',
      messageType: 'text',
      content: prompt,
      metadata: { source: 'conversation_prompt' }
    });

    await saveMessage({
      sessionId,
      role: 'assistant',
      messageType: 'text',
      content: 'Running the evaluation now...'
    });

    const result = await runAgent({
      prompt,
      apiBaseUrl,
      swaggerUrl,
      maxRoutes,
      uploadedFile: req.body.uploadedFile || null
    });

    await saveMessage({
      sessionId,
      role: 'assistant',
      messageType: 'result_tool',
      content: `Evaluation completed with final result: ${result.decision}`,
      metadata: result
    });

    await saveMessage({
      sessionId,
      role: 'assistant',
      messageType: 'text',
      content: `Evaluation completed with final result: ${result.decision}`
    });

    res.json({ sessionId, workflowStatus: savedConfig?.workflow_status || 'DRAFT', ...result });
  } catch (error) {
    console.error('[AGENT ERROR]', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/qa/workflow/:sessionId/submit', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getSessionConfig(sessionId);

    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }

    const updated = await updateWorkflowStatus(sessionId, 'SUBMITTED');
    await saveMessage({
      sessionId,
      role: 'assistant',
      messageType: 'workflow',
      content: 'Workflow updated to SUBMITTED. Ready for approval.'
    });

    res.json({ status: 'success', sessionId, workflowStatus: updated.workflow_status, message: 'Session submitted successfully.' });
  } catch (error) {
    console.error('[WORKFLOW SUBMIT ERROR]', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/qa/workflow/:sessionId/approve', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getSessionConfig(sessionId);

    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }

    const updated = await updateWorkflowStatus(sessionId, 'APPROVED');
    await saveMessage({
      sessionId,
      role: 'assistant',
      messageType: 'workflow',
      content: 'Workflow updated to APPROVED. The conversation is now in the approval state.'
    });

    res.json({ status: 'success', sessionId, workflowStatus: updated.workflow_status, message: 'Session approved successfully.' });
  } catch (error) {
    console.error('[WORKFLOW APPROVE ERROR]', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/qa/conversations/:sessionId', async (req, res) => {
  try {
    const payload = await buildConversationPayload(req.params.sessionId);
    res.json(payload);
  } catch (error) {
    console.error('[CONVERSATION ERROR]', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.AGENT_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Agent server running on port ${PORT}`);
});
