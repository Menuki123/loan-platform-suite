const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const fs = require('fs');
const yaml = require('js-yaml');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  console.log('=================================');
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  console.log('[API] Body:', req.body);

  res.on('finish', () => {
    console.log(`[API] Completed ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${Date.now() - start}ms`);
    console.log('=================================');
  });

  next();
});

const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

const customerRoutes = require('./routes/customers');
const loanRoutes = require('./routes/loans');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/reports');
const underwritingRoutes = require('./routes/underwriting');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const applicationFormRoutes = require('./routes/applicationForms');

app.use('/customers', customerRoutes);
app.use('/loans', loanRoutes);
app.use('/payments', paymentRoutes);
app.use('/reports', reportRoutes);
app.use('/underwriting', underwritingRoutes);
app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/application-forms', applicationFormRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-server' });
});

app.get('/openapi.yaml', (_req, res) => {
  res.sendFile(path.join(__dirname, 'openapi.yaml'));
});

app.get('/openapi.json', (_req, res) => {
  try {
    const yamlPath = path.join(__dirname, 'openapi.yaml');
    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const jsonSpec = yaml.load(fileContents);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(jsonSpec);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to load Swagger JSON', details: error.message });
  }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  console.log(`Swagger YAML available at http://localhost:${PORT}/openapi.yaml`);
  console.log(`Swagger JSON available at http://localhost:${PORT}/openapi.json`);
});
