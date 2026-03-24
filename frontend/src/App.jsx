import { useEffect, useMemo, useState } from 'react';

const agentBaseDefault = import.meta.env.VITE_AGENT_BASE_URL || 'http://localhost:4000';
const apiBaseDefault = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function App() {
  const [catalog, setCatalog] = useState([]);
  const [tools, setTools] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [bootstrap, setBootstrap] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState([]);
  const [config, setConfig] = useState({
    apiBaseUrl: apiBaseDefault,
    swaggerUrl: `${apiBaseDefault}/openapi.yaml`,
    maxRoutes: 4,
    responseMode: 'table'
  });
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    try {
      const [catalogRes, toolsRes, promptsRes, bootRes] = await Promise.all([
        fetch(`${agentBaseDefault}/agents/catalog`),
        fetch(`${agentBaseDefault}/mcp/tools`),
        fetch(`${agentBaseDefault}/prompts/templates`),
        fetch(`${agentBaseDefault}/qa/bootstrap`)
      ]);

      const catalogData = await catalogRes.json();
      const toolsData = await toolsRes.json();
      const promptsData = await promptsRes.json();
      const bootData = await bootRes.json();

      setCatalog(catalogData.items || []);
      setTools(toolsData.tools || []);
      setPrompts(promptsData.items || []);
      setBootstrap(bootData);
      setSelectedAgent(catalogData.items?.[0] || bootData.agent || null);
      setMessages([
        {
          role: 'assistant',
          type: 'intro',
          text: 'I am the System Functional Evaluation Agent. I can capture Swagger metadata, plan route execution with MCP-style tools, and present the outcome in a human-friendly way.'
        },
        {
          role: 'assistant',
          type: 'config_form',
          component: bootData.component,
          capabilities: bootData.capabilities || []
        }
      ]);
    } catch (err) {
      setError('Failed to load the agent catalog and conversation bootstrap.');
    }
  }

  const filteredCatalog = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return catalog;
    return catalog.filter(item => `${item.title} ${item.description}`.toLowerCase().includes(term));
  }, [catalog, search]);

  function openAgent(agent) {
    setSelectedAgent(agent);
    setResult(null);
    setMessages(prev => {
      const intro = {
        role: 'assistant',
        type: 'intro',
        text: `${agent.title} is open in conversation mode. Configure the metadata first, then send your prompt.`
      };
      return [intro, {
        role: 'assistant',
        type: 'config_form',
        component: bootstrap?.component,
        capabilities: bootstrap?.capabilities || []
      }];
    });
  }

  function submitConfig() {
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        type: 'summary',
        text: `API Base URL: ${config.apiBaseUrl}\nSwagger URL: ${config.swaggerUrl}\nMax Routes: ${config.maxRoutes}\nResponse Mode: ${config.responseMode}`
      },
      {
        role: 'assistant',
        type: 'text',
        text: 'Configuration captured. Now send the evaluation prompt in the chat box below.'
      }
    ]);
  }

  async function sendPrompt() {
    if (!prompt.trim()) return;

    const currentPrompt = prompt.trim();
    setPrompt('');
    setLoading(true);
    setError('');
    setMessages(prev => [...prev, { role: 'user', type: 'text', text: currentPrompt }]);

    try {
      const res = await fetch(`${agentBaseDefault}/qa/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          apiBaseUrl: config.apiBaseUrl,
          swaggerUrl: config.swaggerUrl,
          maxRoutes: Number(config.maxRoutes),
          responseMode: config.responseMode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Agent execution failed.');

      setResult(data);
      setMessages(prev => [...prev, { role: 'assistant', type: 'result', data }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { role: 'assistant', type: 'text', text: `Execution failed: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen bg-[#f4f6f8] text-slate-900'>
      <header className='border-b border-slate-200 bg-white'>
        <div className='mx-auto max-w-[1500px] px-6 py-5'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h1 className='text-[38px] font-bold tracking-tight'>AI AGENTS</h1>
              <p className='text-sm text-slate-500'>Discover and create custom versions of agents. The main concept is AI agents with MCP-style tools, prompts, and conversation mode.</p>
            </div>
            <div className='flex items-center gap-3'>
              <input
                className='w-[280px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none'
                placeholder='Search Agents'
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className='h-10 w-10 rounded-full bg-gradient-to-br from-lime-300 to-sky-500 border border-slate-200' />
            </div>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-[1500px] px-6 py-6'>
        <section className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
          <button
            type='button'
            onClick={() => openAgent(catalog[0] || selectedAgent)}
            className='min-h-[190px] rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm hover:border-slate-300'
          >
            <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-5xl text-slate-500'>+</div>
            <div className='mt-5 text-2xl font-semibold text-slate-700'>Create New Agent</div>
          </button>

          {filteredCatalog.map(agent => (
            <button
              key={agent.id}
              type='button'
              onClick={() => openAgent(agent)}
              className={`min-h-[190px] rounded-3xl border bg-white p-7 text-left shadow-sm ${selectedAgent?.id === agent.id ? 'border-sky-400 ring-2 ring-sky-100' : 'border-slate-200'}`}
            >
              <div className='flex items-start gap-4'>
                <div className='flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-lg font-semibold text-white'>{agent.shortCode || 'A'}</div>
                <div className='min-w-0 flex-1'>
                  <div className='text-[32px] leading-none font-semibold text-slate-900 lg:text-[30px]'>{agent.title}</div>
                  <p className='mt-3 text-lg text-slate-600'>{agent.description}</p>
                  <p className='mt-4 text-sm text-slate-500'>Created: {agent.createdAt}</p>
                </div>
              </div>
              <div className='mt-6 flex items-center gap-2 border-t border-slate-200 pt-4 text-sm text-slate-500'>
                <span className='text-lg'>🔧</span>
                <span>{agent.toolCount || 0}</span>
              </div>
            </button>
          ))}
        </section>

        <section className='mt-8 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]'>
          <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <h2 className='text-3xl font-semibold'>{selectedAgent?.title || 'System Functional Evaluation Agent'}</h2>
                <p className='mt-2 max-w-3xl text-slate-600'>{selectedAgent?.longDescription || selectedAgent?.description}</p>
              </div>
              <div className='flex gap-3'>
                <button className='rounded-full bg-slate-600 px-5 py-3 text-sm font-semibold text-white'>Save as Template</button>
                <button className='rounded-full bg-slate-700 px-5 py-3 text-sm font-semibold text-white'>Update</button>
              </div>
            </div>

            <div className='mt-6 grid gap-4 md:grid-cols-2'>
              <InfoCard title='Description' value={selectedAgent?.description || 'Conversational QA agent with MCP-powered tools.'} />
              <InfoCard title='Resources' value='Swagger/OpenAPI, prompt templates, Postman collection, MCP tool registry.' />
            </div>

            <div className='mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4'>
              <div className='text-sm font-semibold text-slate-700'>Conversation mode</div>
              <div className='mt-2 text-sm text-slate-600'>Start with metadata capture. The agent will show a predefined component, then ask for the prompt, then execute and render the result with the chosen visualization mode.</div>
            </div>

            <div className='mt-6 h-[520px] space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-950 p-5'>
              {messages.map((msg, index) => (
                <MessageBubble
                  key={index}
                  msg={msg}
                  config={config}
                  setConfig={setConfig}
                  submitConfig={submitConfig}
                />
              ))}
              {loading && <div className='max-w-[80%] rounded-3xl bg-slate-800 px-4 py-3 text-white'>Running the agent and MCP tools...</div>}
            </div>

            <div className='mt-4 rounded-[28px] border border-slate-200 bg-slate-50 p-3'>
              <textarea
                className='min-h-[110px] w-full resize-none rounded-[22px] bg-white px-4 py-4 text-sm outline-none'
                placeholder='Send a prompt like ChatGPT. Example: Validate the loan application workflow and explain failures simply.'
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
              <div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
                <div className='flex flex-wrap gap-2'>
                  {prompts.map(item => (
                    <button
                      key={item.id}
                      type='button'
                      className='rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700'
                      onClick={() => setPrompt(item.prompt)}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
                <button
                  type='button'
                  onClick={sendPrompt}
                  disabled={loading}
                  className='rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-sky-300'
                >
                  {loading ? 'Running...' : 'Send prompt'}
                </button>
              </div>
              {error && <div className='mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700'>{error}</div>}
            </div>
          </div>

          <div className='space-y-6'>
            <Panel title='Tools'>
              <p className='mb-3 text-sm text-slate-500'>Provide the agent with tools it can use to help users. MCP is the main backbone here.</p>
              <div className='space-y-3'>
                {tools.map(tool => (
                  <div key={tool.id} className='rounded-2xl border border-slate-200 p-4'>
                    <div className='flex items-start gap-3'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-white'>🔧</div>
                      <div className='min-w-0 flex-1'>
                        <div className='text-lg font-semibold text-slate-900'>{tool.name}</div>
                        <div className='text-sm text-slate-500'>{tool.description}</div>
                        <div className='mt-2 flex flex-wrap gap-2'>
                          {(tool.capabilities || []).map(item => (
                            <span key={item} className='rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600'>{item}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title='Resources'>
              <ul className='space-y-3 text-sm text-slate-600'>
                <li>Swagger URL and API base URL capture</li>
                <li>Prompt templates for faster conversation start</li>
                <li>Postman collection for manual verification</li>
                <li>Visualization mode switching: table, list, visual</li>
              </ul>
              <div className='mt-4 flex flex-wrap gap-3'>
                <a href={`${agentBaseDefault}/qa/postman-collection`} target='_blank' rel='noreferrer' className='rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white'>Open Postman Collection</a>
                <a href={`${agentBaseDefault}/mcp/tools`} target='_blank' rel='noreferrer' className='rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700'>View MCP Registry</a>
              </div>
            </Panel>

            {result && (
              <Panel title='Result View'>
                <ResultView data={result} mode={config.responseMode} />
              </Panel>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoCard({ title, value }) {
  return (
    <div className='rounded-2xl border border-slate-200 p-4'>
      <div className='text-sm font-semibold text-slate-500'>{title}</div>
      <div className='mt-2 text-base text-slate-900'>{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
      <h3 className='text-2xl font-semibold text-slate-900'>{title}</h3>
      <div className='mt-4'>{children}</div>
    </div>
  );
}

function MessageBubble({ msg, config, setConfig, submitConfig }) {
  if (msg.type === 'config_form') {
    return (
      <div className='max-w-[90%] rounded-3xl bg-white p-5 text-slate-900'>
        <div className='flex items-center justify-between text-sm text-slate-500'>
          <span>{msg.component?.title || 'Execution Configuration'}</span>
          <span>Step 1 of 2</span>
        </div>
        <div className='mt-2 h-2 rounded-full bg-slate-200'>
          <div className='h-2 w-1/2 rounded-full bg-sky-500' />
        </div>
        <p className='mt-3 text-sm text-slate-600'>{msg.component?.description}</p>
        <div className='mt-4 grid gap-4'>
          <Input label='API Base URL' value={config.apiBaseUrl} onChange={value => setConfig(prev => ({ ...prev, apiBaseUrl: value }))} />
          <Input label='Swagger URL' value={config.swaggerUrl} onChange={value => setConfig(prev => ({ ...prev, swaggerUrl: value }))} />
          <div className='grid gap-4 md:grid-cols-2'>
            <Input label='Max Routes' value={config.maxRoutes} onChange={value => setConfig(prev => ({ ...prev, maxRoutes: value }))} type='number' />
            <label className='text-sm font-medium text-slate-700'>
              Response Mode
              <select className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none' value={config.responseMode} onChange={e => setConfig(prev => ({ ...prev, responseMode: e.target.value }))}>
                <option value='table'>table</option>
                <option value='list'>list</option>
                <option value='visual'>visual</option>
              </select>
            </label>
          </div>
          <div>
            <div className='mb-2 text-sm font-semibold text-slate-700'>Capabilities</div>
            <div className='flex flex-wrap gap-2'>
              {(msg.capabilities || []).map(item => (
                <span key={item} className='rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700'>{item}</span>
              ))}
            </div>
          </div>
          <button type='button' onClick={submitConfig} className='rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white'>Continue</button>
        </div>
      </div>
    );
  }

  if (msg.type === 'result') {
    return (
      <div className='max-w-[90%] rounded-3xl bg-white p-5 text-slate-900'>
        <div className='flex items-center justify-between gap-3'>
          <h4 className='text-xl font-semibold'>Execution finished</h4>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${msg.data.decision === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{msg.data.decision}</span>
        </div>
        <p className='mt-3 text-sm text-slate-600'>{msg.data.userSummary?.result}</p>
        <div className='mt-4 grid grid-cols-3 gap-3'>
          <SummaryStat label='Total' value={msg.data.summary?.totalTests || 0} />
          <SummaryStat label='Passed' value={msg.data.summary?.passed || 0} />
          <SummaryStat label='Failed' value={msg.data.summary?.failed || 0} />
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-[80%] rounded-3xl px-4 py-3 ${msg.role === 'user' ? 'ml-auto bg-sky-600 text-white' : 'bg-slate-800 text-white'}`}>
      <div className='whitespace-pre-line text-sm'>{msg.text}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className='text-sm font-medium text-slate-700'>
      {label}
      <input type={type} className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none' value={value} onChange={e => onChange(e.target.value)} />
    </label>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className='rounded-2xl bg-slate-50 p-4 text-center'>
      <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{label}</div>
      <div className='mt-2 text-2xl font-bold'>{value}</div>
    </div>
  );
}

function ResultView({ data, mode }) {
  const findings = data.summary?.keyFindings || [];

  if (mode === 'list') {
    return (
      <div className='space-y-3'>
        {findings.map(item => (
          <div key={item.route} className='rounded-2xl border border-slate-200 p-4'>
            <div className='font-semibold'>{item.route}</div>
            <div className='mt-1 text-sm text-slate-600'>{item.reason}</div>
            <div className='mt-2 text-sm'>Result: <span className='font-semibold'>{item.result}</span> · Status: {item.statusCode}</div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === 'visual') {
    return (
      <div>
        <div className='grid grid-cols-3 gap-3'>
          <SummaryStat label='Total tests' value={data.summary?.totalTests || 0} />
          <SummaryStat label='Passed' value={data.summary?.passed || 0} />
          <SummaryStat label='Failed' value={data.summary?.failed || 0} />
        </div>
        <div className='mt-4 space-y-3'>
          {findings.map(item => (
            <div key={item.route} className='rounded-2xl border border-slate-200 p-4'>
              <div className='flex items-center justify-between gap-3'>
                <div className='font-semibold'>{item.route}</div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.result === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{item.result}</span>
              </div>
              <div className='mt-2 text-sm text-slate-600'>{item.reason}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='overflow-hidden rounded-2xl border border-slate-200'>
      <table className='min-w-full divide-y divide-slate-200 text-sm'>
        <thead className='bg-slate-50'>
          <tr>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Route</th>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Result</th>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Status</th>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Reason</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-slate-200 bg-white'>
          {findings.map(item => (
            <tr key={item.route}>
              <td className='px-4 py-3'>{item.route}</td>
              <td className='px-4 py-3 font-semibold'>{item.result}</td>
              <td className='px-4 py-3'>{item.statusCode}</td>
              <td className='px-4 py-3 text-slate-600'>{item.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
