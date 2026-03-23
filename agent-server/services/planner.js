const { GoogleGenerativeAI } = require('@google/generative-ai');

function scoreRoute(prompt, route) {
  const text = `${route.method} ${route.path} ${route.summary} ${route.description} ${(route.tags || []).join(' ')}`.toLowerCase();
  return prompt.toLowerCase().split(/\W+/).filter(Boolean).reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);
}

async function selectRoutes(prompt, routes, maxRoutes = 6) {
  if (!prompt) return routes.slice(0, maxRoutes);
  if (process.env.GEMINI_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-pro' });
      const routeDescriptions = routes.map((r, i) => `${i}. ${r.method} ${r.path} - ${r.summary || r.description}`).join('\n');
      const result = await model.generateContent(`You are an API QA planner. User prompt: "${prompt}". Available APIs:\n${routeDescriptions}\nReturn strict JSON {"selectedRoutes":[indexes]}. Limit to ${maxRoutes} routes.`);
      const parsed = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
      return (parsed.selectedRoutes || []).slice(0, maxRoutes).map(i => routes[i]).filter(Boolean);
    } catch (_err) {}
  }
  return routes
    .map(route => ({ route, score: scoreRoute(prompt, route) }))
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0)
    .slice(0, maxRoutes)
    .map(item => item.route);
}

module.exports = { selectRoutes };
