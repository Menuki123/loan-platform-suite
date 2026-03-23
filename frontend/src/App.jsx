import { useEffect, useState } from 'react';

const agentBaseDefault = import.meta.env.VITE_AGENT_BASE_URL || 'http://localhost:4000';

function HumanFriendlyResult({ result }) {
  const findings = result.summary?.keyFindings || [];

  return (
    <div className='max-w-[90%] rounded-2xl bg-white p-5 text-gray-900 shadow-xl'>
      <div className='flex items-center justify-between gap-3'>
        <h3 className='text-xl font-bold'>Execution Summary</h3>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            result.decision === 'PASS'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {result.decision}
        </span>
      </div>

      <p className='mt-3 text-sm text-gray-600'>{result.userSummary?.overview}</p>
      <p className='mt-2 text-sm text-gray-700'>{result.userSummary?.result}</p>
      <p className='mt-2 text-sm text-gray-500'>{result.userSummary?.impact}</p>

      <div className='mt-5 grid gap-3 md:grid-cols-3'>
        <div className='rounded-xl bg-gray-50 p-4'>
          <div className='text-xs text-gray-500'>Total Tests</div>
          <div className='text-2xl font-bold'>{result.summary?.totalTests ?? 0}</div>
        </div>
        <div className='rounded-xl bg-green-50 p-4'>
          <div className='text-xs text-green-700'>Passed</div>
          <div className='text-2xl font-bold text-green-800'>{result.summary?.passed ?? 0}</div>
        </div>
        <div className='rounded-xl bg-red-50 p-4'>
          <div className='text-xs text-red-700'>Failed</div>
          <div className='text-2xl font-bold text-red-800'>{result.summary?.failed ?? 0}</div>
        </div>
      </div>

      <div className='mt-5'>
        <h4 className='font-semibold'>Key Findings</h4>
        <div className='mt-3 space-y-3'>
          {findings.map((item, idx) => (
            <div key={idx} className='rounded-xl border p-3'>
              <div className='flex items-center justify-between gap-3'>
                <div className='font-medium'>{item.route}</div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    item.result === 'PASS'
                      ? 'bg-green-100 text-green-700'
                      : item.result === 'FAIL'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {item.result}
                </span>
              </div>
              <div className='mt-2 text-sm text-gray-600'>{item.reason}</div>
            </div>
          ))}
        </div>
      </div>

      <details className='mt-5'>
        <summary className='cursor-pointer font-medium'>Technical details</summary>
        <pre className='mt-3 max-h-80 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-white'>
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [stage, setStage] = useState('loading');
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState({
    apiBaseUrl: '',
    swaggerUrl: '',
    maxRoutes: 4
  });

  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    loadBootstrap();
  }, []);

  async function loadBootstrap() {
    try {
      const res = await fetch(`${agentBaseDefault}/qa/bootstrap`);
      const data = await res.json();

      setStage('collect_meta');
      setMessages([
        {
          role: 'assistant',
          type: 'text',
          text: 'Please provide the Swagger URL and config metadata to begin.'
        },
        {
          role: 'assistant',
          type: 'config_form',
          component: data.component
        }
      ]);
    } catch (err) {
      setStage('error');
      setMessages([
        {
          role: 'assistant',
          type: 'text',
          text: 'Failed to load the agent configuration form. Please make sure the agent server is running.'
        }
      ]);
    }
  }

  function submitConfig() {
    if (!config.apiBaseUrl || !config.swaggerUrl || !config.maxRoutes) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        type: 'config_summary',
        text: `API Base URL: ${config.apiBaseUrl}\nSwagger URL: ${config.swaggerUrl}\nMax Routes: ${config.maxRoutes}`
      },
      {
        role: 'assistant',
        type: 'text',
        text: 'Great. Now send me the testing prompt you want to run.'
      }
    ]);

    setStage('collect_prompt');
  }

  async function submitPrompt() {
    if (!prompt.trim()) {
      return;
    }

    const userPrompt = prompt.trim();
    setPrompt('');
    setLoading(true);
    setStage('running');

    setMessages((prev) => [
      ...prev,
      { role: 'user', type: 'text', text: userPrompt },
      { role: 'assistant', type: 'text', text: 'Running the agent now...' }
    ]);

    try {
      const res = await fetch(`${agentBaseDefault}/qa/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userPrompt,
          apiBaseUrl: config.apiBaseUrl,
          swaggerUrl: config.swaggerUrl,
          maxRoutes: Number(config.maxRoutes)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Agent run failed');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          type: 'result_card',
          result: data
        }
      ]);
      setStage('show_results');
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          type: 'text',
          text: err.message || 'Something went wrong while running the agent.'
        }
      ]);
      setStage('collect_prompt');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black px-4 py-8 text-white'>
      <div className='mx-auto max-w-5xl'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold'>System Functional Evaluation Agent</h1>
          <p className='mt-2 max-w-3xl text-gray-400'>
            Configure the Swagger source and runtime metadata, then ask the agent to
            evaluate the API. Results are presented in a human-friendly format.
          </p>
        </div>

        <div className='rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur'>
          <div className='mb-4 h-[620px] space-y-4 overflow-y-auto rounded-2xl bg-black/10 p-2'>
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.type === 'text' && (
                  <div
                    className={`max-w-[80%] whitespace-pre-line rounded-2xl p-3 ${
                      msg.role === 'user'
                        ? 'ml-auto bg-blue-600 text-white'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    {msg.text}
                  </div>
                )}

                {msg.type === 'config_summary' && (
                  <div className='ml-auto max-w-[80%] whitespace-pre-line rounded-2xl bg-blue-600 p-3 text-white'>
                    {msg.text}
                  </div>
                )}

                {msg.type === 'config_form' && (
                  <div className='max-w-[85%] rounded-2xl bg-white p-5 text-gray-900'>
                    <div className='mb-4'>
                      <div className='flex items-center justify-between text-sm text-gray-500'>
                        <span>Agent Setup Wizard</span>
                        <span>Step 1 of 2</span>
                      </div>
                      <div className='mt-2 h-2 rounded-full bg-gray-200'>
                        <div className='h-2 w-1/2 rounded-full bg-indigo-500'></div>
                      </div>
                    </div>

                    <h3 className='text-xl font-bold'>{msg.component.title}</h3>
                    <p className='mt-1 text-sm text-gray-500'>{msg.component.description}</p>

                    <div className='mt-4 space-y-4'>
                      <div>
                        <label className='block text-sm font-medium'>API Base URL</label>
                        <input
                          className='mt-1 w-full rounded-xl border p-3'
                          value={config.apiBaseUrl}
                          onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value })}
                          placeholder='https://your-api-host.com'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium'>Swagger URL</label>
                        <input
                          className='mt-1 w-full rounded-xl border p-3'
                          value={config.swaggerUrl}
                          onChange={(e) => setConfig({ ...config, swaggerUrl: e.target.value })}
                          placeholder='https://your-api-host.com/openapi.yaml'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium'>Max Routes</label>
                        <input
                          type='number'
                          min='1'
                          max='12'
                          className='mt-1 w-full rounded-xl border p-3'
                          value={config.maxRoutes}
                          onChange={(e) => setConfig({ ...config, maxRoutes: e.target.value })}
                        />
                      </div>

                      <button
                        onClick={submitConfig}
                        className='w-full rounded-xl bg-indigo-500 py-3 font-semibold text-white'
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {msg.type === 'result_card' && <HumanFriendlyResult result={msg.result} />}
              </div>
            ))}
          </div>

          {(stage === 'collect_prompt' || stage === 'show_results' || stage === 'running') && (
            <div className='flex'>
              <input
                className='flex-1 rounded-l-xl bg-gray-800 p-3 text-white outline-none'
                placeholder='Ask the agent what to evaluate...'
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
              />
              <button
                onClick={submitPrompt}
                disabled={loading}
                className='rounded-r-xl bg-blue-600 px-4 text-white disabled:bg-blue-300'
              >
                {loading ? 'Running...' : 'Send'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
