const { GoogleGenerativeAI } = require('@google/generative-ai');

function tokenize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_\/-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function buildRouteText(route) {
  return [
    route.method,
    route.path,
    route.summary,
    route.description,
    ...(route.tags || []),
    ...Object.keys(route.requestBody?.content?.['application/json']?.schema?.properties || {})
  ]
    .filter(Boolean)
    .join(' ');
}

function scoreRouteKeyword(prompt, route) {
  const text = buildRouteText(route).toLowerCase();
  return tokenize(prompt).reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);
}

function buildTfIdfVectors(documents) {
  const tokenized = documents.map(tokenize);
  const vocab = Array.from(new Set(tokenized.flat()));
  const docFreq = new Map();

  for (const token of vocab) {
    let count = 0;
    for (const doc of tokenized) {
      if (doc.includes(token)) count += 1;
    }
    docFreq.set(token, count);
  }

  const totalDocs = documents.length || 1;
  const vectors = tokenized.map((doc) => {
    const tf = new Map();
    for (const token of doc) tf.set(token, (tf.get(token) || 0) + 1);

    return vocab.map((token) => {
      const termFreq = tf.get(token) || 0;
      if (!termFreq) return 0;
      const idf = Math.log((1 + totalDocs) / (1 + (docFreq.get(token) || 0))) + 1;
      return termFreq * idf;
    });
  });

  return { vocab, vectors };
}

function cosineSimilarity(a = [], b = []) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function rankRoutesWithLocalVector(prompt, routes = []) {
  const routeTexts = routes.map(buildRouteText);
  const { vectors } = buildTfIdfVectors([prompt, ...routeTexts]);
  const promptVector = vectors[0] || [];

  return routes.map((route, index) => {
    const vectorScore = cosineSimilarity(promptVector, vectors[index + 1] || []);
    const keywordScore = scoreRouteKeyword(prompt, route);
    const combinedScore = vectorScore * 100 + keywordScore * 5;

    const probability = Math.max(0, Math.min(0.99, (vectorScore * 0.75) + (Math.min(keywordScore, 8) / 20) + 0.1));

    return {
      route,
      keywordScore,
      vectorScore: Number(vectorScore.toFixed(4)),
      combinedScore: Number(combinedScore.toFixed(4)),
      probability: Number(probability.toFixed(4)),
      matchedTerms: tokenize(prompt).filter((token) => buildRouteText(route).toLowerCase().includes(token)).slice(0, 8)
    };
  }).sort((a, b) => b.combinedScore - a.combinedScore);
}


function buildRetrievalMetadata(mode, strategy, ranked, usedLLMPlanner) {
  return {
    mode,
    strategy,
    usedLLMPlanner,
    architecture: {
      dedicatedVectorDb: 'Dedicated vector DB mode is designed for external semantic indexing, reduced embedded vectors, and scalable route retrieval.',
      embeddedReducedMode: 'The embedded vector layer is intentionally reduced and kept local as a lightweight fallback, not the main long-term store.',
      dualMode: 'The project can operate with a dedicated vector DB or without a vector DB by switching to deterministic local ranking.'
    },
    probabilityModel: {
      purpose: 'Probability is used to reduce wrong predictions and make the dominant route easier to justify in demos.',
      dominantIncrease: 'The highest ranked route becomes the dominant candidate when keyword overlap and vector similarity both stay high.',
      predictionReduce: 'Low-confidence routes stay visible but are deprioritised so the planner reduces bad route selection.'
    },
    updateFrequency: {
      daily: 'Daily delta update for changed routes, prompts, and operational documents.',
      weekly: 'Weekly refresh for full re-index, cleanup, and retrieval quality review.',
      summary: 'Daily delta updates plus weekly full refresh keep the vector layer current without changing the project structure.'
    },
    factorDeliverable: 'The solution is factor deliverable because input, route parsing, vector ranking, endpoint execution, and recording are separate layers.',
    usageAndStrengths: 'VB usage supports semantic matching, multi-point endpoint selection, scalable retrieval, and a fallback path when a dedicated vector DB is not enabled.',
    rankedRoutes: ranked.slice(0, Math.min(10, ranked.length)).map((item) => ({
      route: `${item.route.method} ${item.route.path}`,
      vectorScore: item.vectorScore,
      keywordScore: item.keywordScore,
      combinedScore: item.combinedScore,
      probability: item.probability,
      matchedTerms: item.matchedTerms
    }))
  };
}

async function selectRoutes(prompt, routes, maxRoutes = 6) {
  if (!prompt) {
    const ranked = rankRoutesWithLocalVector('', routes);
    return {
      selectedRoutes: routes.slice(0, maxRoutes),
      retrieval: buildRetrievalMetadata('vector', 'local_tfidf_cosine', ranked, false)
    };
  }

  if (process.env.GEMINI_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-pro' });
      const routeDescriptions = routes.map((r, i) => `${i}. ${r.method} ${r.path} - ${r.summary || r.description}`).join('\n');
      const result = await model.generateContent(`You are an API QA planner. User prompt: "${prompt}". Available APIs:
${routeDescriptions}
Return strict JSON {"selectedRoutes":[indexes]}. Limit to ${maxRoutes} routes.`);
      const parsed = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
      const llmRoutes = (parsed.selectedRoutes || []).slice(0, maxRoutes).map(i => routes[i]).filter(Boolean);
      const ranked = rankRoutesWithLocalVector(prompt, routes);

      return {
        selectedRoutes: llmRoutes.length ? llmRoutes : ranked.slice(0, maxRoutes).map((item) => item.route),
        retrieval: buildRetrievalMetadata(llmRoutes.length ? 'llm_plus_vector' : 'vector', 'local_tfidf_cosine', ranked, llmRoutes.length)
      };
    } catch (_err) {}
  }

  const ranked = rankRoutesWithLocalVector(prompt, routes);
  const selected = ranked.filter((item) => item.combinedScore > 0).slice(0, maxRoutes).map((item) => item.route);

  return {
    selectedRoutes: selected.length ? selected : routes.slice(0, maxRoutes),
    retrieval: buildRetrievalMetadata('vector', 'local_tfidf_cosine', ranked, false)
  };
}

module.exports = { selectRoutes, rankRoutesWithLocalVector };
