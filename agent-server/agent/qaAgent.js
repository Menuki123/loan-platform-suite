const { loadRoutes } = require('../services/swaggerLoader');
const { selectRoutes } = require('../services/planner');
const { buildDependencyGraph } = require('../services/dependencyGraph');
const { generatePayload } = require('../tools/payloadGenerator');
const { invokeApi } = require('../tools/apiInvoker');
const { evaluateResponse } = require('../tools/evaluator');

async function runAgent({ prompt, apiBaseUrl, swaggerSource, maxRoutes }) {
    const routes = await loadRoutes(swaggerSource);
    console.log('[AGENT] Loaded routes:', routes.length);

    const selectedRoutes = await selectRoutes(prompt, routes, maxRoutes);
    console.log(
        '[AGENT] Selected routes:',
        selectedRoutes.map(r => `${r.method} ${r.path}`)
    );

    const dependencyGraph = buildDependencyGraph(selectedRoutes);
    const results = [];

    for (const route of selectedRoutes) {
        const schema = route.requestBody?.content?.['application/json']?.schema;
        const payload = generatePayload(schema);

        console.log('[AGENT] Executing:', route.method, route.path);
        console.log('[AGENT] Payload:', JSON.stringify(payload, null, 2));

        const response = await invokeApi(apiBaseUrl, route, payload);
        console.log('[AGENT] Response:', JSON.stringify(response, null, 2));

        const evaluation = await evaluateResponse(route, response);
        console.log('[AGENT] Evaluation:', JSON.stringify(evaluation, null, 2));

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

    const testInputs = results.map(r => ({
        route: r.route,
        payload: r.payload
    }));

    const executionContext = {
        apiBaseUrl,
        swaggerSource,
        maxRoutes,
        selectedRoutes: selectedRoutes.map(r => `${r.method} ${r.path}`)
    };

    return {
        status: 'success',
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
            description:
                failed > 0
                    ? 'The agent interpreted the prompt, selected relevant endpoints from the Swagger specification, generated dummy payloads, executed the endpoints, and compared actual responses against expected validation and business-rule behavior. At least one response did not match expectations, so the scenario failed.'
                    : 'The agent interpreted the prompt, selected relevant endpoints from the Swagger specification, generated dummy payloads, executed the endpoints, and compared actual responses against expected validation and business-rule behavior. All responses matched expectations, so the scenario passed.'
        },
        userSummary: {
            overview: 'A simplified explanation of the executed test scenario for a non-technical audience.',
            result:
                failed > 0
                    ? 'Some parts of the system did not behave as expected.'
                    : 'The system behaved correctly for the tested scenario.',
            impact:
                failed > 0
                    ? 'There may be missing validations or incorrect business logic that should be reviewed.'
                    : 'The system correctly enforces its expected rules and workflows.',
            finalVerdict: failed > 0 ? 'FAIL' : 'PASS'
        },
        executionContext,
        testInputs
    };
}

module.exports = { runAgent };
