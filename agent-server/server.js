require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { runAgent } = require('./agent/qaAgent');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/qa/bootstrap', (req, res) => {
    res.json({
        status: 'success',
        stage: 'collect_meta',
        component: {
            type: 'config_form',
            title: 'Credit / LOS Agent Configuration',
            description: 'Provide the Swagger URL and runtime configuration before starting the agent.',
            fields: [
                {
                    key: 'apiBaseUrl',
                    label: 'API Base URL',
                    type: 'text',
                    required: true,
                    placeholder: 'https://your-api-host.com'
                },
                {
                    key: 'swaggerUrl',
                    label: 'Swagger URL',
                    type: 'text',
                    required: true,
                    placeholder: 'https://your-api-host.com/openapi.yaml'
                },
                {
                    key: 'maxRoutes',
                    label: 'Max Routes',
                    type: 'number',
                    required: true,
                    defaultValue: 4
                }
            ]
        }
    });
});

app.get('/qa/run', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Use POST /qa/run with a JSON body in Postman'
    });
});

app.get('/', (req, res) => {
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

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'agent-server'
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
            maxRoutes: Number(req.body.maxRoutes || 6)
        });

        console.log('[AGENT] Run result:', JSON.stringify(result, null, 2));
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
