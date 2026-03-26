import { useEffect, useState } from 'react';

const agentBaseDefault = import.meta.env.VITE_AGENT_BASE_URL || 'http://localhost:4000';
const hardcodedUsername = 'demo.user';
const hardcodedPassword = 'Xgen@123';

const starterPrompts = [
  'Evaluate the loan application workflow and explain the results in simple language.',
  'Check the main onboarding and payment endpoints and summarize any failures clearly.',
  'Run a general functional review of the system and list the key findings.'
];

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (onLogin(username, password)) return;
    setError('Invalid username or password.');
  };

  return (
    <div className='min-h-screen bg-[#f6f1e7] p-6'>
      <div className='mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl'>
        <div className='hidden w-1/2 bg-gradient-to-br from-slate-50 to-slate-100 p-10 lg:flex lg:flex-col lg:justify-center'>
          <div className='rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm'>
            <div className='inline-flex rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white'>
              System Functional Evaluation Agent
            </div>
            <p className='mt-5 text-sm leading-7 text-slate-600'>
              A conversation-first QA agent that captures Swagger through frontend tools, asks for the evaluation prompt,
              executes the process, and returns human-friendly results.
            </p>
            <div className='mt-8 grid gap-4 md:grid-cols-2'>
              {[
                ['Conversation mode', 'Chat-style experience with tool components inside the thread.'],
                ['Config capture tool', 'Collect a single Swagger URL and use sensible defaults internally.'],
                ['Execution summary', 'Show pass, fail, and review findings in a clear business-friendly format.'],
                ['Postman ready', 'Use the collection endpoint for backend testing and demo screenshots.']
              ].map(([title, text]) => (
                <div key={title} className='rounded-2xl bg-slate-50 p-4'>
                  <h3 className='text-sm font-semibold text-slate-900'>{title}</h3>
                  <p className='mt-2 text-sm text-slate-500'>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-10'>
          <form onSubmit={submit} className='w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm'>
            <h1 className='text-3xl font-bold tracking-tight text-slate-900'>Login</h1>
            <p className='mt-2 text-sm text-slate-500'>Sign in to continue to the conversational QA view.</p>

            <label className='mt-8 block text-sm font-medium text-slate-700'>Username</label>
            <input
              className='mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-blue-500'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder='Enter username'
            />

            <label className='mt-5 block text-sm font-medium text-slate-700'>Password</label>
            <input
              type='password'
              className='mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-blue-500'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter password'
            />

            {error && <div className='mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600'>{error}</div>}

            <button type='submit' className='mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white'>
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SummaryCards({ result }) {
  const summary = result.summary || {};
  return (
    <div className='grid gap-4 md:grid-cols-3'>
      <div className='rounded-3xl border border-slate-200 bg-white p-5'>
        <div className='text-sm text-slate-500'>Decision</div>
        <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${result.decision === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {result.decision}
        </div>
      </div>
      <div className='rounded-3xl border border-slate-200 bg-white p-5'>
        <div className='text-sm text-slate-500'>Total tests</div>
        <div className='mt-3 text-3xl font-bold text-slate-900'>{summary.totalTests ?? 0}</div>
      </div>
      <div className='rounded-3xl border border-slate-200 bg-white p-5'>
        <div className='text-sm text-slate-500'>Passed / Failed</div>
        <div className='mt-3 text-3xl font-bold text-slate-900'>{summary.passed ?? 0} / {summary.failed ?? 0}</div>
      </div>
    </div>
  );
}

function FindingsTable({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className='overflow-hidden rounded-3xl border border-slate-200 bg-white'>
      <table className='min-w-full divide-y divide-slate-200 text-sm'>
        <thead className='bg-slate-50'>
          <tr>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Route</th>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Result</th>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Reason</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-slate-100'>
          {items.map((item, idx) => (
            <tr key={`${item.route}-${idx}`}>
              <td className='px-4 py-3 text-slate-900'>{item.route}</td>
              <td className='px-4 py-3'>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.result === 'PASS' ? 'bg-emerald-100 text-emerald-700' : item.result === 'FAIL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  {item.result}
                </span>
              </td>
              <td className='px-4 py-3 text-slate-600'>{item.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConversationScreen({ onLogout }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [swaggerUrl, setSwaggerUrl] = useState('http://localhost:3000/openapi.yaml');
  const [configReady, setConfigReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await fetch(`${agentBaseDefault}/qa/bootstrap`);
        const data = await response.json();
        const defaultValue = data?.defaults?.swaggerUrl || 'http://localhost:3000/openapi.yaml';
        setSwaggerUrl(defaultValue);
      } catch (_err) {}

      setMessages([
        {
          role: 'assistant',
          type: 'text',
          text: 'Welcome. Please provide the Swagger URL first so I can prepare the evaluation.'
        },
        {
          role: 'assistant',
          type: 'config'
        }
      ]);
    };

    bootstrap();
  }, []);

  const submitConfig = () => {
    if (!swaggerUrl.trim()) return;
    setConfigReady(true);
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        type: 'text',
        text: swaggerUrl
      },
      {
        role: 'assistant',
        type: 'text',
        text: 'Configuration captured. Now send the evaluation prompt.'
      }
    ]);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const prompt = input.trim();
    setInput('');
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: 'user', type: 'text', text: prompt },
      { role: 'assistant', type: 'text', text: 'Running the evaluation now...' }
    ]);

    try {
      const response = await fetch(`${agentBaseDefault}/qa/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          swaggerUrl,
          maxRoutes: 6
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Agent run failed');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          type: 'result',
          result: data
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          type: 'text',
          text: error.message || 'Something went wrong while running the evaluation.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-[#f6f1e7] p-4 md:p-6'>
      <div className='mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col rounded-[32px] border border-slate-200 bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-slate-200 px-6 py-4'>
          <div className='text-sm text-slate-500'>Conversation mode</div>
          <button onClick={onLogout} className='rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700'>Logout</button>
        </div>

        <div className='flex-1 space-y-4 overflow-y-auto bg-[#f9f7f2] p-4 md:p-6'>
          {messages.map((msg, idx) => {
            if (msg.type === 'config') {
              return (
                <div key={idx} className='max-w-3xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm'>
                  <div className='text-sm font-semibold text-slate-900'>Swagger configuration</div>
                  <p className='mt-2 text-sm text-slate-500'>Just put only the Swagger URL field for now.</p>
                  <input
                    className='mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500'
                    value={swaggerUrl}
                    onChange={(e) => setSwaggerUrl(e.target.value)}
                    placeholder='http://localhost:3000/openapi.yaml'
                  />
                  <button onClick={submitConfig} className='mt-4 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white'>
                    Continue
                  </button>
                </div>
              );
            }

            if (msg.type === 'result') {
              return (
                <div key={idx} className='max-w-4xl space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm'>
                  <div>
                    <div className='text-lg font-semibold text-slate-900'>Execution summary</div>
                    <p className='mt-2 text-sm text-slate-500'>{msg.result.userSummary?.result}</p>
                  </div>
                  <SummaryCards result={msg.result} />
                  <FindingsTable items={msg.result.summary?.keyFindings || []} />
                </div>
              );
            }

            return (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl rounded-[24px] px-5 py-4 text-sm shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        <div className='border-t border-slate-200 bg-white p-4'>
          <div className='mx-auto max-w-5xl'>
            {!configReady && (
              <div className='mb-3 flex flex-wrap gap-2'>
                <div className='rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-500'>Complete the Swagger field to continue</div>
              </div>
            )}
            {configReady && (
              <div className='mb-3 flex flex-wrap gap-2'>
                {starterPrompts.map((item) => (
                  <button key={item} onClick={() => setInput(item)} className='rounded-full border border-slate-300 bg-white px-4 py-2 text-left text-xs text-slate-600'>
                    {item}
                  </button>
                ))}
              </div>
            )}
            <div className='flex items-end gap-3'>
              <textarea
                className='min-h-[90px] flex-1 resize-none rounded-[24px] border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100'
                placeholder={configReady ? 'Send the evaluation prompt...' : 'Complete the Swagger URL field first...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!configReady}
              />
              <button onClick={sendMessage} disabled={!configReady || loading} className='rounded-full bg-blue-600 px-5 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300'>
                {loading ? 'Running...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');

  const handleLogin = (username, password) => {
    const ok = username === hardcodedUsername && password === hardcodedPassword;
    if (ok) {
      localStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
    }
    return ok;
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  return isLoggedIn ? <ConversationScreen onLogout={handleLogout} /> : <LoginScreen onLogin={handleLogin} />;
}
