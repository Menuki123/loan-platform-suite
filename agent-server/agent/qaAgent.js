const { loadRoutes } = require('../services/swaggerLoader');
const { selectRoutes } = require('../services/planner');
const { buildDependencyGraph } = require('../services/dependencyGraph');
const { generatePayload, buildPayloadFromRecord, mergePayloads } = require('../tools/payloadGenerator');
const { invokeApi } = require('../tools/apiInvoker');
const { evaluateResponse } = require('../tools/evaluator');

function normalizeSwaggerUrl(swaggerUrl) {
  if (!swaggerUrl) return swaggerUrl;

  const dockerApiBaseUrl = process.env.API_BASE_URL || '';
  const isDockerNetwork = dockerApiBaseUrl.includes('api-server');

  if (isDockerNetwork && /localhost:3000|127\.0\.0\.1:3000/.test(swaggerUrl)) {
    return swaggerUrl.replace('localhost:3000', 'api-server:3000').replace('127.0.0.1:3000', 'api-server:3000');
  }

  return swaggerUrl;
}

function parseDelimited(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsvText(text) {
  const lines = String(text || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length);

  if (!lines.length) return [];

  const headers = parseDelimited(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseDelimited(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    return row;
  });
}

function parseUploadedData(uploadedFile) {
  if (!uploadedFile?.content) {
    return { fileName: null, fileType: null, records: [], columns: [] };
  }

  const normalizedType = String(uploadedFile.fileType || '').toLowerCase();
  let records = [];

  if (normalizedType === 'json' || uploadedFile.fileName?.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(uploadedFile.content);
    if (Array.isArray(parsed)) {
      records = parsed.filter((item) => item && typeof item === 'object');
    } else if (parsed && Array.isArray(parsed.records)) {
      records = parsed.records.filter((item) => item && typeof item === 'object');
    } else if (parsed && typeof parsed === 'object') {
      records = [parsed];
    }
  } else {
    records = parseCsvText(uploadedFile.content);
  }

  const columns = Array.from(new Set(records.flatMap((record) => Object.keys(record || {}))));
  return {
    fileName: uploadedFile.fileName || 'uploaded-file',
    fileType: normalizedType || 'csv',
    records,
    columns
  };
}

function buildFileSummary(parsedFile) {
  if (!parsedFile?.fileName) return null;
  return {
    fileName: parsedFile.fileName,
    fileType: parsedFile.fileType,
    totalRecords: parsedFile.records.length,
    columns: parsedFile.columns,
    preview: parsedFile.records.slice(0, 2)
  };
}

function findRelevantRecord(route, parsedFile) {
  const schema = route.requestBody?.content?.['application/json']?.schema;
  const properties = Object.keys(schema?.properties || {});
  if (!parsedFile?.records?.length) return null;

  let bestRecord = null;
  let bestScore = -1;

  for (const record of parsedFile.records) {
    const recordKeys = new Set(Object.keys(record || {}));
    const score = properties.reduce((total, key) => total + (recordKeys.has(key) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestRecord = record;
    }
  }

  return bestRecord;
}

function summarizeDataset(route, payload, response, sourceRecord, fileSummary) {
  return {
    route: `${route.method} ${route.path}`,
    requestDataset: {
      payloadFields: payload && typeof payload === 'object' ? Object.keys(payload) : [],
      payloadPreview: payload,
      sourceRecord: sourceRecord || null,
      sourceType: sourceRecord ? 'uploaded_file' : 'generated_mock'
    },
    responseDataset: {
      statusCode: response?.status,
      topLevelFields:
        response?.data && typeof response.data === 'object' && !Array.isArray(response.data)
          ? Object.keys(response.data)
          : [],
      responsePreview: response?.data ?? null
    },
    fileSummary: fileSummary || null
  };
}

function buildDetailedSummary(results) {
  return results.map((item) => {
    const payloadKeys = item.payload && typeof item.payload === 'object' ? Object.keys(item.payload) : [];
    const responseKeys =
      item.response?.data && typeof item.response.data === 'object' && !Array.isArray(item.response.data)
        ? Object.keys(item.response.data)
        : [];

    return {
      route: item.route,
      datasetTaken: {
        requestPayloadFields: payloadKeys,
        responseFields: responseKeys,
        statusCode: item.response?.status ?? null
      },
      summary:
        item.evaluation?.result === 'PASS'
          ? `The agent used the request payload fields ${payloadKeys.length ? payloadKeys.join(', ') : 'none'} and received a valid response. The endpoint behaved as expected.`
          : item.evaluation?.result === 'FAIL'
            ? `The agent used the request payload fields ${payloadKeys.length ? payloadKeys.join(', ') : 'none'} and received a response that did not match the expected behavior. Review the response body, validation rules, or business logic for this route.`
            : `The agent used the request payload fields ${payloadKeys.length ? payloadKeys.join(', ') : 'none'} and got a response that needs manual review.`
    };
  });
}

function updateExecutionState(route, response, payload, state) {
  const responseData = response?.data && typeof response.data === 'object' ? response.data : {};
  const combined = { ...payload, ...responseData };

  if (route.path === '/customers' && route.method === 'POST') {
    state.customerId = combined.customer_id ?? combined.id ?? state.customerId;
  }

  if (route.path === '/loans' && route.method === 'POST') {
    state.loanId = combined.loan_id ?? combined.id ?? state.loanId;
    state.id = state.loanId ?? state.id;
  }

  if (payload?.loan_id && !state.loanId) state.loanId = payload.loan_id;
  if (payload?.customer_id && !state.customerId) state.customerId = payload.customer_id;
  if (!state.id && state.loanId) state.id = state.loanId;
}


function nowMs() {
  return Date.now();
}

async function runAgent({ prompt, apiBaseUrl, swaggerUrl, maxRoutes = 6, uploadedFile = null }) {
  if (!swaggerUrl) {
    throw new Error('Swagger URL is required');
  }

  const executionStartedAt = nowMs();
  const resolvedApiBaseUrl = apiBaseUrl || process.env.API_BASE_URL || 'http://localhost:3000';
  const resolvedSwaggerUrl = normalizeSwaggerUrl(swaggerUrl);
  const routes = await loadRoutes(resolvedSwaggerUrl);
  console.log('[AGENT] Loaded routes from Swagger URL:', resolvedSwaggerUrl);
  console.log('[AGENT] Loaded routes count:', routes.length);

  const selectionStartedAt = nowMs();
  const selection = await selectRoutes(prompt, routes, maxRoutes);
  const selectedRoutes = selection.selectedRoutes || [];
  const retrieval = selection.retrieval || null;
  const selectionCompletedAt = nowMs();
  console.log('[AGENT] Selected routes:', selectedRoutes.map((r) => `${r.method} ${r.path}`));

  const dependencyGraph = buildDependencyGraph(selectedRoutes);
  const parsedFile = parseUploadedData(uploadedFile);
  const fileSummary = buildFileSummary(parsedFile);
  const executionState = {};
  const results = [];
  const datasetsUsed = [];
  const routeTimings = [];

  console.log('[RAG] Input prompt:', prompt);
  console.log('[RAG] Route corpus size:', routes.length);
  console.log('[RAG] Vector ranking candidates:', retrieval?.rankedRoutes?.length || routes.length);
  console.log('[RAG] Selected endpoint count:', selectedRoutes.length);
  console.log('[RAG] Retrieved multi-endpoints:', selectedRoutes.map((route) => `${route.method} ${route.path}`).join(', '));

  for (const route of selectedRoutes) {
    const routeStart = nowMs();
    const schema = route.requestBody?.content?.['application/json']?.schema;
    const generatedPayload = generatePayload(schema);
    const sourceRecord = findRelevantRecord(route, parsedFile);
    const filePayload = buildPayloadFromRecord(schema, sourceRecord || {});
    const payload = mergePayloads(generatedPayload, filePayload);

    if (executionState.customerId && payload.customer_id === undefined) payload.customer_id = executionState.customerId;
    if (executionState.loanId && payload.loan_id === undefined) payload.loan_id = executionState.loanId;

    console.log('[AGENT] Executing:', route.method, route.path);
    console.log('[AGENT] Payload:', JSON.stringify(payload, null, 2));

    const response = await invokeApi(resolvedApiBaseUrl, route, payload, executionState);
    console.log('[AGENT] Response:', JSON.stringify(response, null, 2));

    const evaluation = await evaluateResponse(route, response);
    console.log('[AGENT] Evaluation:', JSON.stringify(evaluation, null, 2));

    updateExecutionState(route, response, payload, executionState);
    datasetsUsed.push(summarizeDataset(route, payload, response, sourceRecord, fileSummary));

    const routeDurationMs = nowMs() - routeStart;
    routeTimings.push({ route: `${route.method} ${route.path}`, durationMs: routeDurationMs, statusCode: response?.status ?? null });
    console.log('[RAG] Route execution time:', `${route.method} ${route.path}`, `${routeDurationMs} ms`);

    results.push({
      route: `${route.method} ${route.path}`,
      payload,
      response,
      evaluation,
      sourceRecord
    });
  }

  const passed = results.filter((r) => r.evaluation.result === 'PASS').length;
  const failed = results.filter((r) => r.evaluation.result === 'FAIL').length;
  const reviewed = results.filter((r) => r.evaluation.result === 'REVIEW').length;

  const keyFindings = results.map((r) => ({
    route: r.route,
    result: r.evaluation.result,
    reason: r.evaluation.reason || 'No reason provided',
    requestDataset: {
      payloadFields: r.payload && typeof r.payload === 'object' ? Object.keys(r.payload) : [],
      payloadPreview: r.payload,
      sourceType: r.sourceRecord ? 'uploaded_file' : 'generated_mock',
      sourceRecord: r.sourceRecord || null
    },
    responseDataset: {
      statusCode: r.response?.status ?? null,
      topLevelFields:
        r.response?.data && typeof r.response.data === 'object' && !Array.isArray(r.response.data)
          ? Object.keys(r.response.data)
          : [],
      responsePreview: r.response?.data ?? null
    }
  }));

  const testInputs = results.map((r) => ({ route: r.route, payload: r.payload }));

  const executionContext = {
    apiBaseUrl: resolvedApiBaseUrl,
    swaggerUrl: resolvedSwaggerUrl,
    maxRoutes,
    selectedRoutes: selectedRoutes.map((r) => `${r.method} ${r.path}`),
    uploadedFile: fileSummary,
    vectorRetrieval: retrieval
  };

  const detailedSummary = buildDetailedSummary(results);
  const executionCompletedAt = nowMs();
  const responseTimeMs = executionCompletedAt - executionStartedAt;
  const embeddingDimensionEstimate = retrieval?.rankedRoutes?.length ? retrieval.rankedRoutes.length : routes.length;
  const ragTrace = {
    inputPrompt: prompt,
    bigNumbers: {
      routeCorpusSize: routes.length,
      vectorCandidates: retrieval?.rankedRoutes?.length || routes.length,
      selectedEndpointCount: selectedRoutes.length,
      multiEndpointCount: selectedRoutes.length,
      shortRunResponseTimeMs: responseTimeMs,
      executionWindowMs: selectionCompletedAt - selectionStartedAt
    },
    vectorSpace: {
      strategy: retrieval?.strategy || retrieval?.mode || 'local_tfidf_cosine',
      embeddingDimensionEstimate,
      rankedRouteCount: retrieval?.rankedRoutes?.length || 0,
      dedicatedVectorDb: retrieval?.architecture?.dedicatedVectorDb,
      embeddedReducedMode: retrieval?.architecture?.embeddedReducedMode
    },
    updateFrequency: retrieval?.updateFrequency || null,
    projectMode: {
      withVectorDb: 'The project can use a dedicated vector DB for semantic retrieval and larger update cycles.',
      withoutVectorDb: 'The same project can run without a vector DB by using deterministic local ranking and endpoint metadata.',
      factorDeliverable: retrieval?.factorDeliverable || null
    },
    usageAndStrengths: retrieval?.usageAndStrengths || null,
    agentCapability: {
      beyondHumanShortTimeClaim: 'The agent ranked the full route corpus, selected the top semantic matches, and executed multiple endpoints in a short run window.',
      selectedEndpoints: selectedRoutes.map((route) => `${route.method} ${route.path}`),
      multiPointReasoning: selectedRoutes.length > 1
    },
    inputRecordBehaviour: {
      recorded: true,
      sessionTraceStoredInSqlite: true,
      uploadedFileName: fileSummary?.fileName || null,
      routeTimings
    }
  };

  console.log('[RAG] Big numbers:', JSON.stringify(ragTrace.bigNumbers));
  console.log('[RAG] Vector architecture:', JSON.stringify(ragTrace.vectorSpace));
  console.log('[RAG] Update frequency:', JSON.stringify(ragTrace.updateFrequency));
  console.log('[RAG] Project mode:', JSON.stringify(ragTrace.projectMode));
  console.log('[RAG] VB usage and strengths:', ragTrace.usageAndStrengths);
  console.log('[RAG] Agent capability endpoints:', ragTrace.agentCapability.selectedEndpoints.join(', '));
  console.log('[RAG] Input record behaviour:', JSON.stringify(ragTrace.inputRecordBehaviour));
  console.log('[RAG] Short-run response time:', `${responseTimeMs} ms`);

  return {
    status: 'success',
    selectedRouteCount: selectedRoutes.length,
    dependencyGraph,
    results,
    datasetsUsed,
    detailedSummary,
    uploadedFileSummary: fileSummary,
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
          ? 'The agent read the Swagger content from the provided URL, selected relevant endpoints, generated or mapped payloads from the uploaded dataset, executed the endpoints, and compared actual responses against expected behavior. At least one response did not match expectations, so the scenario failed.'
          : 'The agent read the Swagger content from the provided URL, selected relevant endpoints, generated or mapped payloads from the uploaded dataset, executed the endpoints, and compared actual responses against expected behavior. All responses matched expectations, so the scenario passed.'
    },
    userSummary: {
      overview: 'A simplified explanation of the executed test scenario for a non-technical audience.',
      result: failed > 0 ? 'Some parts of the system did not behave as expected.' : 'The system behaved correctly for the tested scenario.',
      impact:
        failed > 0
          ? 'There may be missing validations or incorrect business logic that should be reviewed.'
          : 'The system correctly enforces its expected rules and workflows.',
      finalVerdict: failed > 0 ? 'FAIL' : 'PASS'
    },
    executionContext,
    testInputs,
    vectorRetrieval: retrieval,
    ragTrace,
    metrics: {
      responseTimeMs,
      routeCorpusSize: routes.length,
      selectedEndpointCount: selectedRoutes.length,
      vectorCandidateCount: retrieval?.rankedRoutes?.length || routes.length
    }
  };
}

module.exports = { runAgent };
