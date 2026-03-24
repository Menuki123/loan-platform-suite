export async function fetchBootstrap(agentBaseUrl) {
  const response = await fetch(`${agentBaseUrl}/qa/bootstrap`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to load bootstrap');
  return data;
}

export async function fetchToolRegistry(agentBaseUrl) {
  const response = await fetch(`${agentBaseUrl}/mcp/tools`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to load tools');
  return data;
}

export async function runAgent(agentBaseUrl, payload) {
  const response = await fetch(`${agentBaseUrl}/qa/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Agent run failed');
  return data;
}

export async function checkHealth(apiBaseUrl, agentBaseUrl) {
  const [apiResult, agentResult] = await Promise.allSettled([
    fetch(`${apiBaseUrl}/health`),
    fetch(`${agentBaseUrl}/health`)
  ]);

  return {
    api: apiResult.status === 'fulfilled' && apiResult.value.ok ? 'online' : 'offline',
    agent: agentResult.status === 'fulfilled' && agentResult.value.ok ? 'online' : 'offline'
  };
}
