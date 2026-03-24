const path = require('path');
const SwaggerParser = require('swagger-parser');

function isHttpUrl(value = '') {
  return /^https?:\/\//i.test(value);
}

async function loadRoutes(swaggerSource) {
  let sourceToLoad = swaggerSource || '../api-server/openapi.yaml';

  if (!isHttpUrl(sourceToLoad)) {
    sourceToLoad = path.resolve(__dirname, '..', sourceToLoad);
  }

  const api = await SwaggerParser.validate(sourceToLoad);
  const routes = [];

  for (const [routePath, methods] of Object.entries(api.paths || {})) {
    for (const [method, config] of Object.entries(methods || {})) {
      routes.push({
        method: method.toUpperCase(),
        path: routePath,
        summary: config.summary || '',
        description: config.description || config.summary || '',
        parameters: config.parameters || [],
        requestBody: config.requestBody || null,
        tags: config.tags || []
      });
    }
  }

  return routes;
}

module.exports = { loadRoutes, isHttpUrl };
