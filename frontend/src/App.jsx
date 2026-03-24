import { useEffect, useMemo, useState } from 'react';

const agentBaseDefault = import.meta.env.VITE_AGENT_BASE_URL || 'http://localhost:4000';
const apiBaseDefault = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const defaultInstructions = `You are an AI Agent Orchestrator for LOS and enterprise workflows.

MAIN CONCEPT:
- AI agents are the primary experience.
- Every agent must work in conversation mode.
- Before execution, the agent should capture configuration through a predefined UI component.
- The agent should discover powerful tools through an MCP-ready registry.
- The agent should recommend prompt templates and then execute the selected scenario.
- The final response must be shown with a human-friendly result component.

CONVERSATION FLOW:
1. Show configuration tool automatically or after first message.
2. Capture Swagger URL, API Base URL, environment, and max route depth.
3. Ask the user for the prompt.
4. Run the selected routes.
5. Present route-level findings, business explanation, and technical details.
`;

function IconCircle({ label }) {
  return <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white'>{label}</div>;
}

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className='text-lg font-semibold text-slate-900'>{title}</h2>
      {subtitle && <p className='mt-1 text-sm text-slate-500'>{subtitle}</p>}
    </div>
  );
}

function AgentCard({ agent, onOpen }) {
  if (agent.type === 'create') {
    return (
      <button onClick={() => onOpen('builder')} className='agent-card flex min-h-[168px] flex-col items-center justify-center gap-4 text-center hover:border-slate-400'>
        <div className='text-5xl text-slate-500'>＋</div>
        <div>
          <div className='text-xl font-semibold text-slate-700'>Create New Agent</div>
          <div className='mt-1 text-sm text-slate-500'>{agent.summary}</div>
        </div>
      </button>
    );
  }

  return (
    <button onClick={() => onOpen('builder', agent)} className='agent-card flex min-h-[168px] flex-col justify-between text-left hover:border-slate-400'>
      <div className='flex items-start gap-4'>
        <IconCircle label={agent.name.charAt(0)} />
        <div>
          <div className='text-[15px] font-semibold text-slate-900'>{agent.name}</div>
          <div className='mt-2 text-sm leading-6 text-slate-600'>{agent.summary}</div>
          <div className='mt-4 text-xs text-slate-400'>Created: {agent.createdAt}</div>
        </div>
      </div>
      <div className='mt-6 flex items-center gap-2 border-t border-slate-200 pt-3 text-xs font-medium text-slate-500'>
        <span className='text-base'>🔧</span> {agent.toolCount} tools
      </div>
    </button>
  );
}

function ToolRow({ tool }) {
  return (
    <div className='flex items-start gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4'>
      <div className='mt-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-white'>🔧</div>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='font-medium text-slate-900'>{tool.name}</div>
          {tool.mcpReady && <span className='rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700'>MCP-ready</span>}
          <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600'>{tool.category}</span>
        </div>
        <div className='mt-1 text-sm text-slate-500'>{tool.description}</div>
      </div>
      <button className='text-slate-400 transition hover:text-slate-700'>🗑</button>
    </div>
  );
}

function PromptPill({ prompt, onSelect }) {
  return (
    <button onClick={() => onSelect(prompt.prompt)} className='rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-slate-400 hover:text-slate-900'>
      {prompt.name}
    </button>
  );
}

function ResultCard({ result }) {
  if (!result) {
    return (
      <div className='rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500'>
        Run the conversation to show the human-friendly execution summary here.
      </div>
    );
  }

  return (
    <div className='space-y-4 rounded-3xl border border-slate-200 bg-white p-5'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <div className='text-lg font-semibold text-slate-900'>{result.humanFriendlyComponent?.title || 'Execution Summary'}</div>
          <div className='mt-1 text-sm text-slate-500'>{result.humanFriendlyComponent?.subtitle}</div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.decision === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {result.decision}
        </span>
      </div>
      <div className='grid gap-3 md:grid-cols-3'>
        <div className='rounded-2xl bg-slate-50 p-4'>
          <div className='text-xs text-slate-500'>Total tests</div>
          <div className='mt-2 text-2xl font-semibold text-slate-900'>{result.summary?.totalTests ?? 0}</div>
        </div>
        <div className='rounded-2xl bg-emerald-50 p-4'>
          <div className='text-xs text-emerald-700'>Passed</div>
          <div className='mt-2 text-2xl font-semibold text-emerald-800'>{result.summary?.passed ?? 0}</div>
        </div>
        <div className='rounded-2xl bg-rose-50 p-4'>
          <div className='text-xs text-rose-700'>Failed</div>
          <div className='mt-2 text-2xl font-semibold text-rose-800'>{result.summary?.failed ?? 0}</div>
        </div>
      </div>
      <div className='space-y-3'>
        {(result.summary?.keyFindings || []).map((item, idx) => (
          <div key={`${item.route}-${idx}`} className='rounded-2xl border border-slate-200 p-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='font-medium text-slate-900'>{item.route}</div>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.result === 'PASS' ? 'bg-emerald-100 text-emerald-700' : item.result === 'FAIL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{item.result}</span>
            </div>
            <div className='mt-2 text-sm text-slate-500'>{item.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('agents');
  const [agentCatalog, setAgentCatalog] = useState([]);
  const [tools, setTools] = useState([]);
  const [promptTemplates, setPromptTemplates] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [search, setSearch] = useState('');
  const [config, setConfig] = useState({
    name: 'Application Form Validation Agent - LOS',
    description: 'Conversation-first AI agent that captures Swagger metadata, recommends prompts, runs API validations, and summarizes the outcome in a human-friendly way.',
    instructions: defaultInstructions,
    conversationStarter: 'Help me validate a LOS workflow',
    authUrl: '',
    embedAgent: false,
    apiBaseUrl: apiBaseDefault,
    swaggerUrl: `${apiBaseDefault}/openapi.yaml`,
    maxRoutes: 4,
    environment: 'local'
  });
  const [prompt, setPrompt] = useState('Validate the LOS application form and explain failures clearly.');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [catalogRes, toolsRes, promptsRes] = await Promise.all([
          fetch(`${agentBaseDefault}/agents/catalog`),
          fetch(`${agentBaseDefault}/mcp/tools`),
          fetch(`${agentBaseDefault}/prompts/templates`)
        ]);

        const catalogData = await catalogRes.json();
        const toolsData = await toolsRes.json();
        const promptsData = await promptsRes.json();

        setAgentCatalog(catalogData.agents || []);
        setTools(toolsData.tools || []);
        setPromptTemplates(promptsData.prompts || []);
      } catch (error) {
        console.error('Failed to load agent metadata', error);
      }
    }

    loadData();
  }, []);

  const visibleAgents = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return agentCatalog;
    return agentCatalog.filter(agent => `${agent.name} ${agent.summary}`.toLowerCase().includes(text));
  }, [agentCatalog, search]);

  const openPage = (nextPage, agent = null) => {
    setPage(nextPage);
    if (agent) {
      setSelectedAgent(agent);
      setConfig(prev => ({
        ...prev,
        name: agent.name,
        description: agent.summary
      }));
    }
  };

  const runConversation = async () => {
    setLoading(true);
    setMessage('');
    setResult(null);

    try {
      const response = await fetch(`${agentBaseDefault}/qa/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          apiBaseUrl: config.apiBaseUrl,
          swaggerUrl: config.swaggerUrl,
          maxRoutes: Number(config.maxRoutes)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Agent execution failed');

      setResult(data);
      setMessage('Conversation executed successfully. Human-friendly summary is ready.');
    } catch (error) {
      setMessage(error.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-[#f4f5f7] text-slate-900'>
      <header className='border-b border-slate-200 bg-white'>
        <div className='mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-8 py-7'>
          <div>
            <div className='text-[34px] font-bold tracking-tight'>AI AGENTS</div>
            <div className='mt-1 text-sm text-slate-400'>Discover, configure, and run conversation-first AI agents with MCP-ready tools.</div>
          </div>
          <div className='flex items-center gap-4'>
            <div className='hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:flex lg:min-w-[320px] lg:items-center'>
              <span className='mr-3 text-slate-400'>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} className='w-full bg-transparent text-sm outline-none' placeholder='Search Agents' />
            </div>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-indigo-500 text-white'>✦</div>
          </div>
        </div>
        <div className='mx-auto flex max-w-[1500px] gap-3 px-8 pb-5'>
          <button onClick={() => setPage('agents')} className={`rounded-full px-4 py-2 text-sm font-medium ${page === 'agents' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Agents</button>
          <button onClick={() => setPage('builder')} className={`rounded-full px-4 py-2 text-sm font-medium ${page === 'builder' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Builder</button>
          <button onClick={() => setPage('conversation')} className={`rounded-full px-4 py-2 text-sm font-medium ${page === 'conversation' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Conversation Mode</button>
        </div>
      </header>

      <main className='mx-auto max-w-[1500px] px-8 py-8'>
        {page === 'agents' && (
          <section>
            <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
              {visibleAgents.map(agent => <AgentCard key={agent.id} agent={agent} onOpen={openPage} />)}
            </div>
            <div className='mt-8 rounded-3xl border border-slate-200 bg-white p-6'>
              <SectionTitle title='AI agents as the main concept' subtitle='This layout keeps agents, tools, prompts, MCP discovery, and conversation mode at the center of the experience.' />
              <div className='mt-5 grid gap-4 lg:grid-cols-4'>
                {[
                  ['Conversation-first', 'Every agent should start by collecting metadata and then continue with prompts.'],
                  ['Powerful tools', 'Tools are treated as reusable resources that agents can discover, invoke, and present in UI components.'],
                  ['MCP-ready', 'Tool registry is exposed in an MCP-inspired format so the system can scale toward formal tool orchestration.'],
                  ['Postman-compatible', 'The same flows can be exported for Postman and QA verification outside the UI.']
                ].map(([title, text]) => (
                  <div key={title} className='rounded-3xl bg-slate-50 p-5'>
                    <div className='font-semibold text-slate-900'>{title}</div>
                    <div className='mt-2 text-sm leading-6 text-slate-500'>{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {page === 'builder' && (
          <section className='grid gap-6 xl:grid-cols-[1.02fr,0.98fr]'>
            <div className='rounded-3xl border border-slate-200 bg-white p-6'>
              <div className='mb-6 flex items-center justify-between gap-4'>
                <div className='flex items-center gap-3'>
                  <button onClick={() => setPage('agents')} className='text-2xl text-slate-500'>‹</button>
                  <div className='text-[30px] font-semibold text-slate-900'>{selectedAgent?.name || config.name}</div>
                </div>
                <div className='flex items-center gap-3'>
                  <button className='rounded-full bg-slate-700 px-5 py-3 text-sm font-semibold text-white'>Save as Template</button>
                  <button className='rounded-full bg-slate-700 px-5 py-3 text-sm font-semibold text-white'>Update</button>
                </div>
              </div>

              <div className='space-y-4'>
                <label className='block text-sm text-slate-700'>
                  Name
                  <input className='form-input' value={config.name} onChange={e => setConfig(prev => ({ ...prev, name: e.target.value }))} />
                </label>
                <label className='block text-sm text-slate-700'>
                  Description
                  <input className='form-input' value={config.description} onChange={e => setConfig(prev => ({ ...prev, description: e.target.value }))} />
                </label>
                <label className='block text-sm text-slate-700'>
                  Instructions
                  <textarea className='form-input min-h-[220px]' value={config.instructions} onChange={e => setConfig(prev => ({ ...prev, instructions: e.target.value }))} />
                </label>
                <label className='block text-sm text-slate-700'>
                  Conversation starters
                  <input className='form-input' placeholder='Enter a conversation starter and press Enter' value={config.conversationStarter} onChange={e => setConfig(prev => ({ ...prev, conversationStarter: e.target.value }))} />
                </label>
                <label className='block text-sm text-slate-700'>
                  Authentication URL
                  <input className='form-input' placeholder='If your agent requires authentication, provide the URL here' value={config.authUrl} onChange={e => setConfig(prev => ({ ...prev, authUrl: e.target.value }))} />
                </label>
                <label className='mt-2 flex items-center gap-3 text-sm text-slate-700'>
                  <input type='checkbox' checked={config.embedAgent} onChange={e => setConfig(prev => ({ ...prev, embedAgent: e.target.checked }))} />
                  Embed agent
                </label>
              </div>
            </div>

            <div className='space-y-6'>
              <div className='rounded-3xl border border-slate-200 bg-white p-6'>
                <div className='mb-4 flex items-center justify-between'>
                  <SectionTitle title='Resources' subtitle='Resources for your AGENT' />
                  <button className='rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600'>Add tool</button>
                </div>
                <div className='rounded-3xl border border-slate-200 bg-slate-50 p-4'>
                  <div className='mb-4'>
                    <div className='text-lg font-semibold text-slate-900'>Tools</div>
                    <div className='text-sm text-slate-500'>Provide the agent with tools it can use to help users.</div>
                  </div>
                  <div className='space-y-4'>
                    {tools.map(tool => <ToolRow key={tool.id} tool={tool} />)}
                  </div>
                </div>
              </div>

              <div className='rounded-3xl border border-slate-200 bg-white p-6'>
                <SectionTitle title='Prompt packs' subtitle='Reusable prompt templates for AI agents' />
                <div className='mt-4 flex flex-wrap gap-2'>
                  {promptTemplates.map(template => <PromptPill key={template.id} prompt={template} onSelect={setPrompt} />)}
                </div>
              </div>
            </div>
          </section>
        )}

        {page === 'conversation' && (
          <section className='grid gap-6 xl:grid-cols-[0.9fr,1.1fr]'>
            <div className='space-y-6'>
              <div className='rounded-3xl border border-slate-200 bg-white p-6'>
                <SectionTitle title='Conversation-first setup' subtitle='The agent collects metadata first, then asks for the prompt, then executes with powerful tools.' />
                <div className='mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5'>
                  <div className='mb-4 flex items-center justify-between text-sm text-slate-500'>
                    <span>AI Agent Configuration Wizard</span>
                    <span>Step 1 of 3</span>
                  </div>
                  <div className='mb-5 h-2 rounded-full bg-slate-200'>
                    <div className='h-2 w-1/3 rounded-full bg-indigo-500'></div>
                  </div>
                  <div className='space-y-4'>
                    <label className='block text-sm text-slate-700'>
                      API Base URL
                      <input className='form-input' value={config.apiBaseUrl} onChange={e => setConfig(prev => ({ ...prev, apiBaseUrl: e.target.value }))} />
                    </label>
                    <label className='block text-sm text-slate-700'>
                      Swagger URL
                      <input className='form-input' value={config.swaggerUrl} onChange={e => setConfig(prev => ({ ...prev, swaggerUrl: e.target.value }))} />
                    </label>
                    <div className='grid gap-4 md:grid-cols-2'>
                      <label className='block text-sm text-slate-700'>
                        Max Routes
                        <input type='number' min='1' max='12' className='form-input' value={config.maxRoutes} onChange={e => setConfig(prev => ({ ...prev, maxRoutes: e.target.value }))} />
                      </label>
                      <label className='block text-sm text-slate-700'>
                        Environment
                        <select className='form-input' value={config.environment} onChange={e => setConfig(prev => ({ ...prev, environment: e.target.value }))}>
                          <option value='local'>local</option>
                          <option value='uat'>uat</option>
                          <option value='qa'>qa</option>
                          <option value='prod-safe'>prod-safe</option>
                        </select>
                      </label>
                    </div>
                    <button className='w-full rounded-2xl bg-indigo-500 px-4 py-3 font-semibold text-white'>Metadata captured</button>
                  </div>
                </div>
                <div className='mt-6'>
                  <div className='text-sm font-semibold text-slate-800'>Prompt suggestions</div>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {promptTemplates.map(template => <PromptPill key={template.id} prompt={template} onSelect={setPrompt} />)}
                  </div>
                  <textarea className='form-input mt-4 min-h-[140px]' value={prompt} onChange={e => setPrompt(e.target.value)} />
                  <button onClick={runConversation} disabled={loading} className='mt-4 w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50'>
                    {loading ? 'Running AI agent…' : 'Run AI agent'}
                  </button>
                  {message && <div className='mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600'>{message}</div>}
                </div>
              </div>

              <div className='rounded-3xl border border-slate-200 bg-white p-6'>
                <SectionTitle title='Powerful tools and MCP' subtitle='These tools are the main engine behind the AI agent experience.' />
                <div className='mt-4 grid gap-3'>
                  {tools.slice(0, 5).map(tool => (
                    <div key={tool.id} className='rounded-2xl bg-slate-50 p-4'>
                      <div className='flex items-center justify-between gap-3'>
                        <div className='font-medium text-slate-900'>{tool.name}</div>
                        <span className='rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700'>{tool.power}</span>
                      </div>
                      <div className='mt-2 text-sm text-slate-500'>{tool.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className='space-y-6'>
              <ResultCard result={result} />
              <div className='rounded-3xl border border-slate-200 bg-white p-6'>
                <SectionTitle title='Technical companion view' subtitle='Keeps prompts, MCP info, and interoperability visible for engineering and QA teams.' />
                <div className='mt-4 grid gap-4 lg:grid-cols-2'>
                  <div className='rounded-3xl bg-slate-50 p-5'>
                    <div className='text-sm font-semibold text-slate-800'>MCP discovery</div>
                    <div className='mt-2 text-sm text-slate-500'>Registry endpoint: <span className='font-mono text-slate-700'>{agentBaseDefault}/mcp/tools</span></div>
                    <div className='mt-3 text-sm text-slate-500'>Tool count: {tools.length}</div>
                  </div>
                  <div className='rounded-3xl bg-slate-50 p-5'>
                    <div className='text-sm font-semibold text-slate-800'>Postman export</div>
                    <div className='mt-2 text-sm text-slate-500'>Collection endpoint: <span className='font-mono text-slate-700'>{agentBaseDefault}/qa/postman-collection</span></div>
                    <div className='mt-3 text-sm text-slate-500'>Useful for QA, regression review, and stakeholder demos.</div>
                  </div>
                </div>
                <details className='mt-5 rounded-3xl border border-slate-200 p-4'>
                  <summary className='cursor-pointer text-sm font-semibold text-slate-800'>Show execution JSON</summary>
                  <pre className='mt-4 max-h-[360px] overflow-auto rounded-2xl bg-slate-900 p-4 text-xs text-slate-100'>{JSON.stringify(result, null, 2)}</pre>
                </details>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
