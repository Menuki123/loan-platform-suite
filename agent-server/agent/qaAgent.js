const { loadRoutes } = require('../services/swaggerLoader');
const { selectRoutes } = require('../services/planner');
const { buildDependencyGraph } = require('../services/dependencyGraph');
const { generatePayload } = require('../tools/payloadGenerator');
const { invokeApi } = require('../tools/apiInvoker');
const { evaluateResponse } = require('../tools/evaluator');

function buildAssistantNarrative({ failed, reviewed }) {
  if (failed > 0) {
    return 'The agent reviewed the requested flow, executed the selected routes, and found at least one behavior that did not match the expected validation or business rules.';
  }

  if (reviewed > 0) {
    return 'The agent executed the selected routes successfully, but some responses should still be reviewed manually because the outcome was not fully conclusive.';
  }

  return 'The agent executed the selected routes and the observed behavior matched the expected validation and workflow rules for the tested scenario.';
}

async function runAgent({ prompt, apiBaseUrl, swaggerSource, maxRoutes, conversationMode = true }) {
  const { routes, meta } = await loadRoutes(swaggerSource);
  console.log('[AGENT] Loaded routes:', routes.length);

  const selectedRoutes = await selectRoutes(prompt, routes, maxRoutes);
  console.log('[AGENT] Selected routes:', selectedRoutes.map(r => `${r.method} ${r.path}`));

  const dependencyGraph = buildDependencyGraph(selectedRoutes);
  const results = [];

  for (const route of selectedRoutes) {
    const schema = route.requestBody?.content?.['application/json']?.schema;
    const payload = generatePayload(schema);

    console.log('[AGENT] Executing:', route.method, route.path);

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

  const userVerdict = failed > 0 ? 'FAIL' : reviewed > 0 ? 'REVIEW' : 'PASS';
  const overview = conversationMode
    ? 'Conversation mode completed. The agent first accepted setup metadata, then executed the requested API checks, and now returns a human-friendly summary.'
    : 'The agent executed the requested API checks and returned a human-friendly summary.';

  return {
    status: 'success',
    mode: conversationMode ? 'conversation' : 'direct',
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
    decision: userVerdict,
    llmReasoning: {
      description: buildAssistantNarrative({ failed, reviewed })
    },
    userSummary: {
      overview,
      result:
        userVerdict === 'FAIL'
          ? 'Some parts of the system did not behave as expected.'
          : userVerdict === 'REVIEW'
            ? 'The main flow ran, but some responses still need manual review.'
            : 'The tested scenario behaved correctly.',
      impact:
        userVerdict === 'FAIL'
          ? 'There may be missing validations, incorrect workflow handling, or endpoint issues that should be fixed before release.'
          : userVerdict === 'REVIEW'
            ? 'The feature is partly validated, but a few behaviors need closer confirmation before sign-off.'
            : 'The tested feature appears ready for demonstration or further regression coverage.',
      finalVerdict: userVerdict
    },
    executionContext: {
      apiBaseUrl,
      swaggerSource,
      maxRoutes,
      selectedRoutes: selectedRoutes.map(r => `${r.method} ${r.path}`),
      apiSpec: meta
    },
    testInputs: results.map(r => ({
      route: r.route,
      payload: r.payload
    }))
  };
}

module.exports = { runAgent };
