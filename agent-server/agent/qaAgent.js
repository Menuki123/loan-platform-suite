const { loadRoutes } = require('../services/swaggerLoader');
const { selectRoutes } = require('../services/planner');
const { buildDependencyGraph } = require('../services/dependencyGraph');
const { generatePayload } = require('../tools/payloadGenerator');
const { invokeApi } = require('../tools/apiInvoker');
const { evaluateResponse } = require('../tools/evaluator');

async function runAgent({ prompt, apiBaseUrl, swaggerSource, maxRoutes, responseMode = 'table' }) {
  const routes = await loadRoutes(swaggerSource);

  const selectedRoutes = await selectRoutes(prompt, routes, maxRoutes);
  const dependencyGraph = buildDependencyGraph(selectedRoutes);
  const results = [];

  for (const route of selectedRoutes) {
    const schema = route.requestBody?.content?.['application/json']?.schema;
    const payload = generatePayload(schema);
    const response = await invokeApi(apiBaseUrl, route, payload);
    const evaluation = await evaluateResponse(route, response);

    results.push({
      route: `${route.method} ${route.path}`,
      payload,
      response,
      evaluation,
      tagSummary: route.tags?.join(', ') || 'General'
    });
  }

  const passed = results.filter(r => r.evaluation.result === 'PASS').length;
  const failed = results.filter(r => r.evaluation.result === 'FAIL').length;
  const reviewed = results.filter(r => r.evaluation.result === 'REVIEW').length;

  const keyFindings = results.map(r => ({
    route: r.route,
    result: r.evaluation.result,
    reason: r.evaluation.reason || 'No reason provided',
    statusCode: r.response?.status ?? 'N/A'
  }));

  const executionContext = {
    apiBaseUrl,
    swaggerSource,
    maxRoutes,
    responseMode,
    selectedRoutes: selectedRoutes.map(r => `${r.method} ${r.path}`)
  };

  const decision = failed > 0 ? 'FAIL' : 'PASS';
  const outcomeSentence = failed > 0
    ? 'Some parts of the system did not behave as expected.'
    : 'The system behaved correctly for the tested scenario.';

  return {
    status: 'success',
    agent: {
      title: 'System Functional Evaluation Agent',
      mode: 'conversation',
      protocol: 'MCP-inspired tool orchestration'
    },
    selectedRouteCount: selectedRoutes.length,
    dependencyGraph,
    results,
    summary: {
      totalTests: results.length,
      passed,
      failed,
      reviewed,
      keyFindings
    },
    decision,
    userSummary: {
      overview: 'The agent read the API description, selected the most relevant routes, generated sample payloads, executed the API calls, and translated the outcome into human-friendly language.',
      result: outcomeSentence,
      impact: failed > 0
        ? 'There may be workflow, validation, or integration issues that should be reviewed before release.'
        : 'The tested path is behaving in line with the expected business rules.',
      finalVerdict: decision
    },
    responseModes: {
      active: responseMode,
      supported: ['table', 'list', 'visual']
    },
    executionContext,
    toolEvents: [
      { tool: 'configCaptureComponent', state: 'completed' },
      { tool: 'swaggerRouteDiscovery', state: 'completed' },
      { tool: 'payloadGenerator', state: 'completed' },
      { tool: 'apiInvoker', state: 'completed' },
      { tool: 'responseEvaluator', state: 'completed' },
      { tool: 'resultRenderer', state: 'completed' }
    ]
  };
}

module.exports = { runAgent };
