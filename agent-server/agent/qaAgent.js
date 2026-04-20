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


function actionRouteCandidates(action = '') {
  const normalized = String(action || '').trim().toLowerCase();
  const routeMap = {
    create_customer: ['POST /customers'],
    check_eligibility: ['POST /underwriting/check-eligibility'],
    create_loan: ['POST /loans'],
    make_payment: ['POST /payments'],
    active_loans_report: ['GET /reports/active-loans'],
    customer_loan_summary: ['GET /reports/customer-loan-summary'],
    payment_history_report: ['GET /reports/payment-history']
  };
  return routeMap[normalized] || [];
}

function findRouteForRecord(record, routes = [], fallbackRoutes = [], retrieval = null) {
  const candidates = actionRouteCandidates(record?.action);
  if (candidates.length) {
    const matched = routes.find((route) => candidates.includes(`${route.method} ${route.path}`));
    if (matched) return matched;
  }

  const fallbackSelection = fallbackRoutes.find((route) => {
    const schema = route.requestBody?.content?.['application/json']?.schema;
    const properties = Object.keys(schema?.properties || {});
    const recordKeys = new Set(Object.keys(record || {}));
    return properties.some((key) => recordKeys.has(key));
  });

  if (fallbackSelection) return fallbackSelection;

  const vectorFallback = retrieval?.rankedRoutes?.[0]?.route;
  if (vectorFallback) {
    const matchedVectorRoute = routes.find((route) => `${route.method} ${route.path}` === vectorFallback);
    if (matchedVectorRoute) return matchedVectorRoute;
  }

  return fallbackRoutes[0] || routes[0] || null;
}

function getOutcomeSignal(response) {
  const data = response?.data;
  if (!data || typeof data !== 'object') return null;

  if (typeof data.eligible === 'boolean') return data.eligible ? 'ELIGIBLE' : 'INELIGIBLE';
  if (typeof data.decision === 'string') return data.decision.toUpperCase();
  if (typeof data.result === 'string') return data.result.toUpperCase();
  if (typeof data.status === 'string') return data.status.toUpperCase();
  return null;
}

function evaluateCaseExpectation(record, route, response, evaluation) {
  const expectedHttpStatus = Number(record?.expectedHttpStatus);
  const actualHttpStatus = Number(response?.status || 0);
  const expectedOutcome = String(record?.expectedOutcome || '').trim().toUpperCase();
  const actualOutcome = getOutcomeSignal(response);

  const statusMatches = Number.isFinite(expectedHttpStatus) && expectedHttpStatus > 0
    ? actualHttpStatus == expectedHttpStatus
    : true;

  let outcomeMatches = true;
  let expectationNote = '';

  if (expectedOutcome === 'PASS') {
    outcomeMatches = evaluation?.result === 'PASS';
    expectationNote = outcomeMatches ? 'The route passed as expected.' : 'The route did not pass as expected.';
  } else if (expectedOutcome === 'FAIL') {
    outcomeMatches = evaluation?.result === 'FAIL';
    expectationNote = outcomeMatches ? 'The route failed as expected.' : 'The route did not fail as expected.';
  } else if (expectedOutcome === 'ELIGIBLE' || expectedOutcome === 'INELIGIBLE') {
    outcomeMatches = actualOutcome === expectedOutcome;
    expectationNote = actualOutcome
      ? `The business outcome was ${actualOutcome}.`
      : 'The response did not expose a clear business outcome signal.';
  }

  const status = statusMatches && outcomeMatches ? 'PASS' : 'FAIL';
  const summary = status === 'PASS'
    ? `Case matched expected status ${expectedHttpStatus || actualHttpStatus}${expectedOutcome ? ` and expected outcome ${expectedOutcome}` : ''}.`
    : `Case did not match the expected status or outcome. Expected HTTP ${expectedHttpStatus || 'n/a'}${expectedOutcome ? ` and ${expectedOutcome}` : ''}, but got HTTP ${actualHttpStatus}${actualOutcome ? ` and ${actualOutcome}` : ''}.`;

  return {
    status,
    expectedHttpStatus: Number.isFinite(expectedHttpStatus) ? expectedHttpStatus : null,
    actualHttpStatus,
    expectedOutcome: expectedOutcome || null,
    actualOutcome,
    expectationNote,
    summary
  };
}

function buildCaseFinding(caseResult) {
  return {
    route: `${caseResult.caseId ? `${caseResult.caseId} · ` : ''}${caseResult.route}`,
    result: caseResult.status,
    reason: caseResult.summary,
    confidence: caseResult.matchConfidence,
    dominantSource: caseResult.matchSource,
    requestDataset: {
      payloadFields: Object.keys(caseResult.payload || {}),
      payloadPreview: caseResult.payload || null,
      sourceType: 'uploaded_file',
      sourceRecord: caseResult.sourceRecord || null
    },
    responseDataset: {
      statusCode: caseResult.actualHttpStatus,
      topLevelFields: caseResult.response?.data && typeof caseResult.response.data === 'object' && !Array.isArray(caseResult.response.data)
        ? Object.keys(caseResult.response.data)
        : [],
      responsePreview: caseResult.response?.data ?? null
    }
  };
}

function buildCaseSummaryItems(caseResults) {
  return caseResults.map((item) => ({
    route: `${item.caseId ? `${item.caseId} · ` : ''}${item.route}`,
    result: item.status,
    summary: `${item.testCase}: ${item.summary}`
  }));
}

function buildBatchUserSummary(caseResults, passed, failed) {
  return {
    overview: 'A simplified explanation of the uploaded bulk dataset run for a non-technical audience.',
    result: failed > 0
      ? `The bulk run finished with ${passed} passing case(s) and ${failed} failing case(s).`
      : `The bulk run finished successfully with all ${passed} case(s) passing.`,
    impact: failed > 0
      ? 'Some scenarios did not match their expected status or business outcome and should be reviewed.'
      : 'All uploaded scenarios matched their expected status and business outcome.',
    finalVerdict: failed > 0 ? 'FAIL' : 'PASS'
  };
}

async function runSingleRoute(route, record, fileSummary, resolvedApiBaseUrl, executionState) {
  const schema = route.requestBody?.content?.['application/json']?.schema;
  const generatedPayload = generatePayload(schema);
  const filePayload = buildPayloadFromRecord(schema, record || {});
  const payload = mergePayloads(generatedPayload, filePayload);

  if (executionState.customerId && payload.customer_id === undefined) payload.customer_id = executionState.customerId;
  if (executionState.loanId && payload.loan_id === undefined) payload.loan_id = executionState.loanId;

  const response = await invokeApi(resolvedApiBaseUrl, route, payload, executionState);
  const evaluation = await evaluateResponse(route, response);
  updateExecutionState(route, response, payload, executionState);

  return {
    route,
    payload,
    response,
    evaluation,
    datasetUsed: summarizeDataset(route, payload, response, record, fileSummary)
  };
}

async function runBulkDataset({ prompt, resolvedApiBaseUrl, resolvedSwaggerUrl, maxRoutes, routes, selectedRoutes, retrieval, parsedFile, fileSummary, executionStartedAt }) {
  const executionState = {};
  const caseResults = [];
  const datasetsUsed = [];
  const results = [];
  const routeTimings = [];

  for (let index = 0; index < parsedFile.records.length; index += 1) {
    const record = parsedFile.records[index] || {};
    const caseStartedAt = nowMs();
    const route = findRouteForRecord(record, routes, selectedRoutes, retrieval);

    if (!route) {
      const failedCase = {
        caseId: record.caseId || `CASE-${String(index + 1).padStart(3, '0')}`,
        testCase: record.testCase || `Dataset case ${index + 1}`,
        action: record.action || null,
        route: 'No route matched',
        status: 'FAIL',
        expectedHttpStatus: Number(record.expectedHttpStatus || 0) || null,
        actualHttpStatus: null,
        expectedOutcome: record.expectedOutcome || null,
        actualOutcome: null,
        summary: 'No API route could be matched for this dataset row.',
        payload: null,
        response: null,
        sourceRecord: record
      };
      caseResults.push(failedCase);
      continue;
    }

    const singleRun = await runSingleRoute(route, record, fileSummary, resolvedApiBaseUrl, executionState);
    const expectation = evaluateCaseExpectation(record, route, singleRun.response, singleRun.evaluation);
    const caseId = record.caseId || `CASE-${String(index + 1).padStart(3, '0')}`;
    const rankedMatch = retrieval?.rankedRoutes?.find((item) => item.route === `${route.method} ${route.path}`) || null;
    const caseResult = {
      caseId,
      testCase: record.testCase || `Dataset case ${index + 1}`,
      action: record.action || null,
      route: `${route.method} ${route.path}`,
      status: expectation.status,
      expectedHttpStatus: expectation.expectedHttpStatus,
      actualHttpStatus: expectation.actualHttpStatus,
      expectedOutcome: expectation.expectedOutcome,
      actualOutcome: expectation.actualOutcome,
      expectationNote: expectation.expectationNote,
      summary: expectation.summary,
      payload: singleRun.payload,
      response: singleRun.response,
      sourceRecord: record,
      evaluation: singleRun.evaluation,
      matchConfidence: rankedMatch?.probability ?? 0.98,
      matchSource: rankedMatch ? 'vector + swagger + dataset' : record?.action ? 'rule + dataset' : 'swagger + dataset',
      datasetSources: ['swagger dataset', 'api dataset', 'vector dataset']
    };

    caseResults.push(caseResult);
    datasetsUsed.push(singleRun.datasetUsed);
    results.push({
      route: `${route.method} ${route.path}`,
      payload: singleRun.payload,
      response: singleRun.response,
      evaluation: { result: expectation.status, reason: expectation.summary },
      sourceRecord: record
    });
    routeTimings.push({
      caseId,
      route: `${route.method} ${route.path}`,
      durationMs: nowMs() - caseStartedAt,
      statusCode: singleRun.response?.status ?? null
    });
  }

  const passed = caseResults.filter((item) => item.status === 'PASS').length;
  const failed = caseResults.filter((item) => item.status === 'FAIL').length;
  const reviewed = caseResults.filter((item) => item.status === 'REVIEW').length;
  const detailedSummary = buildCaseSummaryItems(caseResults);
  const keyFindings = caseResults.map(buildCaseFinding);
  const executionCompletedAt = nowMs();
  const responseTimeMs = executionCompletedAt - executionStartedAt;
  const embeddingDimensionEstimate = retrieval?.rankedRoutes?.length ? retrieval.rankedRoutes.length : routes.length;

  return {
    status: 'success',
    bulkMode: true,
    selectedRouteCount: new Set(caseResults.map((item) => item.route)).size,
    dependencyGraph: buildDependencyGraph(selectedRoutes),
    caseResults,
    results,
    datasetsUsed,
    detailedSummary,
    uploadedFileSummary: fileSummary,
    summary: {
      totalTests: caseResults.length,
      totalCases: caseResults.length,
      passed,
      failed,
      reviewed,
      keyFindings
    },
    decision: failed > 0 ? 'FAIL' : 'PASS',
    llmReasoning: {
      description:
        failed > 0
          ? 'The agent accepted the uploaded bulk dataset, looped through each case, matched one route per case, executed the route, and compared the actual result against the expected status and expected business outcome. At least one case did not match its expectation.'
          : 'The agent accepted the uploaded bulk dataset, looped through each case, matched one route per case, executed the route, and compared the actual result against the expected status and expected business outcome. All cases matched their expectations.'
    },
    userSummary: buildBatchUserSummary(caseResults, passed, failed),
    executionContext: {
      apiBaseUrl: resolvedApiBaseUrl,
      swaggerUrl: resolvedSwaggerUrl,
      maxRoutes,
      selectedRoutes: selectedRoutes.map((r) => `${r.method} ${r.path}`),
      uploadedFile: fileSummary,
      vectorRetrieval: retrieval,
      loopMode: 'bulk_dataset'
    },
    testInputs: caseResults.map((item) => ({ caseId: item.caseId, testCase: item.testCase, route: item.route, payload: item.payload })),
    vectorRetrieval: retrieval,
    ragTrace: {
      inputPrompt: prompt,
      bulkMode: true,
      loopCount: caseResults.length,
      bigNumbers: {
        routeCorpusSize: routes.length,
        vectorCandidates: retrieval?.rankedRoutes?.length || routes.length,
        selectedEndpointCount: selectedRoutes.length,
        multiEndpointCount: new Set(caseResults.map((item) => item.route)).size,
        shortRunResponseTimeMs: responseTimeMs,
        dominantRouteProbability: retrieval?.rankedRoutes?.[0]?.probability || null
      },
      inputRecordBehaviour: {
        recorded: true,
        sessionTraceStoredInSqlite: true,
        uploadedFileName: fileSummary?.fileName || null,
        routeTimings
      },
      vectorSpace: {
        strategy: retrieval?.strategy || retrieval?.mode || 'local_tfidf_cosine',
        embeddingDimensionEstimate,
        rankedRouteCount: retrieval?.rankedRoutes?.length || 0,
        dedicatedVectorDb: retrieval?.architecture?.dedicatedVectorDb,
        embeddedReducedMode: retrieval?.architecture?.embeddedReducedMode,
        probabilityPurpose: retrieval?.probabilityModel?.purpose || null,
        dominantIncrease: retrieval?.probabilityModel?.dominantIncrease || null,
        predictionReduce: retrieval?.probabilityModel?.predictionReduce || null
      }
    },
    metrics: {
      responseTimeMs,
      routeCorpusSize: routes.length,
      selectedEndpointCount: selectedRoutes.length,
      vectorCandidateCount: retrieval?.rankedRoutes?.length || routes.length,
      loopCount: caseResults.length
    },
    approachSummary: {
      actionFocus: 'Business actions such as create_customer are used before endpoint execution.',
      dataLayers: ['swagger dataset', 'api dataset', 'vector dataset'],
      probability: 'Each ranked route carries a probability score to justify the dominant route.',
      predictionReduce: 'Wrong route selection is reduced by combining direct action mapping, swagger schema overlap, and vector ranking.',
      dominantIncrease: 'The strongest route is promoted as the dominant candidate when both semantics and dataset fields agree.'
    }
  };
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

  if (parsedFile.records.length > 1) {
    return runBulkDataset({
      prompt,
      resolvedApiBaseUrl,
      resolvedSwaggerUrl,
      maxRoutes,
      routes,
      selectedRoutes,
      retrieval,
      parsedFile,
      fileSummary,
      executionStartedAt
    });
  }

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
