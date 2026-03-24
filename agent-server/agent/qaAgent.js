const { loadRoutes } = require('../services/swaggerLoader');
const { selectRoutes } = require('../services/planner');
const { buildDependencyGraph } = require('../services/dependencyGraph');
const { generatePayload } = require('../tools/payloadGenerator');
const { invokeApi } = require('../tools/apiInvoker');
const { evaluateResponse } = require('../tools/evaluator');
const { toolRegistry } = require('../config/toolRegistry');
const { promptTemplates } = require('../config/promptTemplates');

function buildBusinessSummary(failed) {
  return {
    overview: 'The AI agent collected metadata, selected relevant API operations, executed a guided evaluation, and converted the technical output into a business-friendly summary.',
    result: failed > 0 ? 'Some routes did not behave as expected during the conversation-driven evaluation.' : 'The selected routes behaved correctly during the conversation-driven evaluation.',
    impact: failed > 0 ? 'Business users may face validation, workflow, or integration issues. The failing routes should be reviewed before wider rollout.' : 'The current flow appears stable for the tested scenario and is suitable for demo or stakeholder review.',
    finalVerdict: failed > 0 ? 'FAIL' : 'PASS'
  };
}

async function runAgent({ prompt, apiBaseUrl, swaggerSource, maxRoutes }) {
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
      evaluation
    });
  }

  const passed = results.filter(r => r.evaluation.result === 'PASS').length;
  const failed = results.filter(r => r.evaluation.result === 'FAIL').length;
  const reviewed = results.filter(r => r.evaluation.result === 'REVIEW').length;

  const keyFindings = results.map(r => ({
    route: r.route,
    result: r.evaluation.result,
    reason: r.evaluation.reason || 'No reason provided'
  }));

  return {
    status: 'success',
    mode: 'conversation-first',
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
    decision: failed > 0 ? 'FAIL' : 'PASS',
    llmReasoning: {
      description: failed > 0
        ? 'The AI agent interpreted the prompt, selected relevant endpoints from the Swagger specification, generated test payloads, executed the endpoints, and found at least one route that did not satisfy the expected business or validation behaviour.'
        : 'The AI agent interpreted the prompt, selected relevant endpoints from the Swagger specification, generated test payloads, executed the endpoints, and all selected routes matched the expected business and validation behaviour.'
    },
    userSummary: buildBusinessSummary(failed),
    executionContext: {
      apiBaseUrl,
      swaggerSource,
      maxRoutes,
      selectedRoutes: selectedRoutes.map(r => `${r.method} ${r.path}`)
    },
    testInputs: results.map(r => ({ route: r.route, payload: r.payload })),
    mcp: {
      enabled: true,
      registryMode: 'discovery',
      availableTools: toolRegistry.map(tool => ({
        id: tool.id,
        name: tool.name,
        category: tool.category,
        mcpReady: tool.mcpReady
      }))
    },
    promptRecommendations: promptTemplates.slice(0, 3),
    humanFriendlyComponent: {
      type: 'execution_summary_card',
      title: 'AI Agent Execution Summary',
      decision: failed > 0 ? 'FAIL' : 'PASS',
      subtitle: 'Conversation-mode result generated from selected routes and business-friendly explanations.'
    }
  };
}

module.exports = { runAgent };
