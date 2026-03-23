import { useEffect, useMemo, useState } from 'react';
import StatusCard from './components/StatusCard';
import ResultPanel from './components/ResultPanel';

const apiBaseDefault = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const agentBaseDefault = import.meta.env.VITE_AGENT_BASE_URL || 'http://localhost:4000';

const workflowSteps = ['PENDING', 'SUBMITTED', 'APPROVED', 'DISBURSED'];

const starterPrompts = [
  'Check how many required fields are needed to start a new loan and explain any validation failures in simple language.',
  'Test the full loan application workflow and explain which stage passes or fails in a user-friendly way.',
  'Test whether the application form accepts large JSON sections and summarize the outcome for a non-technical audience.'
];

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(apiBaseDefault);
  const [agentBaseUrl, setAgentBaseUrl] = useState(agentBaseDefault);
  const [prompt, setPrompt] = useState(starterPrompts[0]);
  const [maxRoutes, setMaxRoutes] = useState(6);
  const [health, setHealth] = useState({ api: 'checking', agent: 'checking' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const apiRes = await fetch(`${apiBaseUrl}/health`);
        setHealth(prev => ({ ...prev, api: apiRes.ok ? 'online' : 'offline' }));
      } catch {
        setHealth(prev => ({ ...prev, api: 'offline' }));
      }

      try {
        const agentRes = await fetch(`${agentBaseUrl}/health`);
        setHealth(prev => ({ ...prev, agent: agentRes.ok ? 'online' : 'offline' }));
      } catch {
        setHealth(prev => ({ ...prev, agent: 'offline' }));
      }
    };

    checkHealth();
  }, [apiBaseUrl, agentBaseUrl]);

  const capabilityCards = useMemo(() => ([
    {
      title: 'Finds the right APIs',
      text: 'The agent reads the API specification and picks the most relevant endpoints for the scenario you type.'
    },
    {
      title: 'Creates test data automatically',
      text: 'It prepares dummy input values so the system can be checked without you manually building every payload.'
    },
    {
      title: 'Explains pass or fail clearly',
      text: 'It does not only run tests. It also explains the outcome in simple language for technical and non-technical audiences.'
    }
  ]), []);

  const runAgent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${agentBaseUrl}/qa/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          apiBaseUrl,
          swaggerPath: '../api-server/openapi.yaml',
          maxRoutes: Number(maxRoutes)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Agent run failed');
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100'>
      <header className='border-b border-slate-200 bg-white/85 backdrop-blur'>
        <div className='mx-auto max-w-7xl px-6 py-8'>
          <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
            <div>
              <p className='badge bg-blue-100 text-blue-700'>Three-project business demo</p>
              <h1 className='mt-3 text-4xl font-bold tracking-tight text-slate-900'>System Functional Evaluation Agent</h1>
              <p className='mt-3 max-w-3xl text-slate-600'>A user-friendly interface to demonstrate how the platform checks system behavior, runs guided evaluations, and explains outcomes in simple language.</p>
            </div>
            <div className='flex flex-wrap gap-3'>
              <a className='badge bg-slate-900 text-white' href={`${apiBaseUrl}/api-docs`} target='_blank' rel='noreferrer'>Open API docs</a>
              <a className='badge bg-slate-100 text-slate-700' href={`${agentBaseUrl}/`} target='_blank' rel='noreferrer'>Open agent server</a>
            </div>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-7xl space-y-10 px-6 py-10'>
        <section className='grid gap-6 lg:grid-cols-3'>
          <StatusCard title='API server' url={`${apiBaseUrl}/health`} status={health.api} details='Handles customers, loans, underwriting, workflow validation, payments, and application forms.' />
          <StatusCard title='Agent server' url={`${agentBaseUrl}/health`} status={health.agent} details='Chooses the right endpoints, prepares dummy input data, runs checks, and explains the outcome.' />
          <div className='card'>
            <h3 className='text-lg font-semibold'>Workflow visibility</h3>
            <div className='mt-4 flex flex-wrap gap-2'>
              {workflowSteps.map(step => (
                <span key={step} className='badge bg-slate-100 text-slate-700'>{step}</span>
              ))}
            </div>
            <p className='mt-4 text-sm text-slate-600'>These stages help business users understand where a loan sits in the application journey.</p>
          </div>
        </section>

        <section className='grid gap-6 lg:grid-cols-3'>
          {capabilityCards.map(card => (
            <div key={card.title} className='card'>
              <h3 className='text-lg font-semibold'>{card.title}</h3>
              <p className='mt-3 text-sm text-slate-600'>{card.text}</p>
            </div>
          ))}
        </section>

        <section className='grid gap-6 lg:grid-cols-[1.15fr,0.85fr]'>
          <form onSubmit={runAgent} className='card space-y-5'>
            <div>
              <h2 className='text-2xl font-semibold'>Ask the evaluation agent</h2>
              <p className='mt-2 text-sm text-slate-600'>Type a question or test scenario just like a chat prompt. The agent will choose the most relevant API route, send dummy input data, and explain whether the system passes or fails.</p>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <label className='block text-sm font-medium text-slate-700'>
                API server URL
                <input className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500' value={apiBaseUrl} onChange={e => setApiBaseUrl(e.target.value)} />
              </label>
              <label className='block text-sm font-medium text-slate-700'>
                Agent server URL
                <input className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500' value={agentBaseUrl} onChange={e => setAgentBaseUrl(e.target.value)} />
              </label>
            </div>

            <div className='rounded-[28px] border border-slate-200 bg-slate-50 p-3 shadow-inner'>
              <textarea
                className='min-h-36 w-full resize-none rounded-[22px] bg-white px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-200'
                placeholder='Example: Check whether the system rejects a loan request when a required field is missing, and explain the reason simply.'
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
              <div className='mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <label className='block text-sm font-medium text-slate-700'>
                  Max routes
                  <input type='number' min='1' max='12' className='ml-3 w-24 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500' value={maxRoutes} onChange={e => setMaxRoutes(e.target.value)} />
                </label>
                <button type='submit' className='rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300' disabled={loading}>
                  {loading ? 'Evaluating…' : 'Send prompt'}
                </button>
              </div>
            </div>

            <div>
              <h3 className='text-sm font-semibold text-slate-800'>Suggested prompts</h3>
              <div className='mt-3 flex flex-wrap gap-2'>
                {starterPrompts.map(item => (
                  <button key={item} type='button' className='rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:border-blue-400 hover:text-blue-700' onClick={() => setPrompt(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className='rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700'>{error}</div>}
          </form>

          <div className='card'>
            <div className='flex items-center justify-between gap-3'>
              <h2 className='text-2xl font-semibold'>Response view</h2>
              <div className='inline-flex rounded-full bg-slate-100 p-1'>
                {['table', 'list', 'visual'].map(mode => (
                  <button
                    key={mode}
                    type='button'
                    onClick={() => setViewMode(mode)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${viewMode === mode ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <p className='mt-3 text-sm text-slate-600'>Change how the results are presented. This helps switch between business-friendly explanation, detailed list view, or a quick visual summary for presentations.</p>
            <ul className='mt-5 space-y-3 text-sm text-slate-600'>
              <li>Use <span className='font-medium text-slate-900'>table</span> for structured review and evidence.</li>
              <li>Use <span className='font-medium text-slate-900'>list</span> for quick reading and live demos.</li>
              <li>Use <span className='font-medium text-slate-900'>visual</span> for a presentation-style summary.</li>
            </ul>
          </div>
        </section>

        <ResultPanel result={result} viewMode={viewMode} />
      </main>
    </div>
  );
}
