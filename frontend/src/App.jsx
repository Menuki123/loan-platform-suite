import { useEffect, useMemo, useRef, useState } from 'react';

const agentBase = import.meta.env.VITE_AGENT_BASE_URL || 'http://localhost:4000';
const apiBaseDefault = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const initialConfig = {
  apiBaseUrl: apiBaseDefault,
  swaggerUrl: `${apiBaseDefault}/openapi.yaml`,
  maxRoutes: 4,
  environment: 'local',
  responseMode: 'cards'
};

function SparkIcon() {
  return (
    <div className='flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-lg shadow-sm'>
      ✧
    </div>
  );
}

function AssistantBubble({ children }) {
  return <div className='max-w-[980px] rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm'>{children}</div>;
}

function UserBubble({ text }) {
  return <div className='max-w-[70%] rounded-[24px] bg-black px-5 py-4 text-[15px] text-white shadow-sm'>{text}</div>;
}

function CapabilityCard() {
  return (
    <div className='mx-auto mb-8 max-w-[1100px] rounded-[32px] border border-slate-200 bg-white/90 px-8 py-8 text-slate-700 shadow-sm'>
      <div className='mb-4 text-center text-2xl'>💬</div>
      <h1 className='text-center text-[34px] font-semibold tracking-tight text-slate-900'>System Functional Evaluation Agent</h1>
      <p className='mx-auto mt-3 max-w-[860px] text-center text-[16px] leading-7 text-slate-600'>
        A conversation-first QA agent that captures Swagger and runtime metadata through frontend tools, asks for the evaluation prompt, executes the process, and returns human-friendly results.
      </p>
      <div className='mt-6 grid gap-3 md:grid-cols-4'>
        {[
          ['Conversation mode', 'Chat-style experience with tool components inside the thread.'],
          ['Config capture tool', 'Collect API Base URL, Swagger URL, route budget, and response mode.'],
          ['Execution summary', 'Show cards, list, or table output instead of raw JSON by default.'],
          ['Postman ready', 'Use the collection endpoint for backend testing and team demos.']
        ].map(([title, body]) => (
          <div key={title} className='rounded-[24px] bg-slate-50 px-4 py-4'>
            <div className='font-semibold text-slate-900'>{title}</div>
            <div className='mt-2 text-sm leading-6 text-slate-500'>{body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuggestionPill({ text, onClick }) {
  return (
    <button onClick={() => onClick(text)} className='rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-left text-[15px] text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50'>
      {text}
    </button>
  );
}

function ConfigToolCard({ config, setConfig, onSubmit }) {
  return (
    <AssistantBubble>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <div className='text-[18px] font-semibold text-slate-900'>System Evaluation Configuration</div>
          <div className='mt-1 text-sm text-slate-500'>Capture Swagger URL and runtime metadata before the QA agent starts evaluating.</div>
        </div>
        <div className='text-sm text-slate-400'>Step 1 of 2</div>
      </div>
      <div className='mt-4 h-2 rounded-full bg-slate-100'>
        <div className='h-2 w-1/2 rounded-full bg-violet-500'></div>
      </div>
      <div className='mt-6 grid gap-4 md:grid-cols-2'>
        <label className='text-sm text-slate-700'>
          API Base URL
          <input className='mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400' value={config.apiBaseUrl} onChange={e => setConfig(prev => ({ ...prev, apiBaseUrl: e.target.value }))} />
        </label>
        <label className='text-sm text-slate-700'>
          Swagger URL
          <input className='mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400' value={config.swaggerUrl} onChange={e => setConfig(prev => ({ ...prev, swaggerUrl: e.target.value }))} />
        </label>
        <label className='text-sm text-slate-700'>
          Max Routes
          <input type='number' min='1' max='12' className='mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400' value={config.maxRoutes} onChange={e => setConfig(prev => ({ ...prev, maxRoutes: e.target.value }))} />
        </label>
        <label className='text-sm text-slate-700'>
          Environment
          <select className='mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400' value={config.environment} onChange={e => setConfig(prev => ({ ...prev, environment: e.target.value }))}>
            {['local', 'uat', 'qa', 'prod-safe'].map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className='text-sm text-slate-700 md:col-span-2'>
          Response Format
          <div className='mt-2 grid gap-3 md:grid-cols-3'>
            {['cards', 'list', 'table'].map(option => (
              <button
                type='button'
                key={option}
                onClick={() => setConfig(prev => ({ ...prev, responseMode: option }))}
                className={`rounded-[18px] border px-4 py-3 text-sm font-medium capitalize transition ${config.responseMode === option ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </label>
      </div>
      <div className='mt-6 flex items-center justify-between gap-4'>
        <div className='text-sm text-slate-500'>Postman collection: <span className='font-mono text-slate-700'>{agentBase}/qa/postman-collection</span></div>
        <button onClick={onSubmit} className='rounded-[18px] bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-600'>Continue</button>
      </div>
    </AssistantBubble>
  );
}

function SummaryCards({ result }) {
  return (
    <div className='space-y-4'>
      <div className='grid gap-3 md:grid-cols-3'>
        <Metric title='Total Tests' value={result.summary?.totalTests ?? 0} />
        <Metric title='Passed' value={result.summary?.passed ?? 0} tone='green' />
        <Metric title='Failed' value={result.summary?.failed ?? 0} tone='red' />
      </div>
      <div className='space-y-3'>
        {(result.summary?.keyFindings || []).map((finding, index) => (
          <div key={`${finding.route}-${index}`} className='rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='font-medium text-slate-900'>{finding.route}</div>
              <Badge result={finding.result} />
            </div>
            <div className='mt-2 text-sm leading-6 text-slate-500'>{finding.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FindingsList({ result }) {
  return (
    <ul className='space-y-3'>
      {(result.summary?.keyFindings || []).map((finding, index) => (
        <li key={`${finding.route}-${index}`} className='rounded-[18px] border border-slate-200 px-4 py-3'>
          <div className='flex items-center justify-between gap-3'>
            <span className='font-medium text-slate-900'>{finding.route}</span>
            <Badge result={finding.result} />
          </div>
          <p className='mt-2 text-sm text-slate-500'>{finding.reason}</p>
        </li>
      ))}
    </ul>
  );
}

function FindingsTable({ result }) {
  return (
    <div className='overflow-hidden rounded-[20px] border border-slate-200'>
      <table className='min-w-full divide-y divide-slate-200 text-sm'>
        <thead className='bg-slate-50'>
          <tr>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Route</th>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Status</th>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Reason</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-slate-200 bg-white'>
          {(result.summary?.keyFindings || []).map((finding, index) => (
            <tr key={`${finding.route}-${index}`}>
              <td className='px-4 py-3 text-slate-900'>{finding.route}</td>
              <td className='px-4 py-3'><Badge result={finding.result} /></td>
              <td className='px-4 py-3 text-slate-500'>{finding.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Metric({ title, value, tone = 'default' }) {
  const toneClasses = tone === 'green'
    ? 'bg-emerald-50 text-emerald-800'
    : tone === 'red'
      ? 'bg-rose-50 text-rose-800'
      : 'bg-slate-50 text-slate-900';

  return (
    <div className={`rounded-[20px] px-4 py-4 ${toneClasses}`}>
      <div className='text-xs font-medium uppercase tracking-wide opacity-70'>{title}</div>
      <div className='mt-2 text-3xl font-semibold'>{value}</div>
    </div>
  );
}

function Badge({ result }) {
  const map = {
    PASS: 'bg-emerald-100 text-emerald-700',
    FAIL: 'bg-rose-100 text-rose-700',
    REVIEW: 'bg-amber-100 text-amber-700'
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${map[result] || 'bg-slate-100 text-slate-700'}`}>{result}</span>;
}

function ResultToolCard({ result, responseMode }) {
  return (
    <AssistantBubble>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <div className='text-[18px] font-semibold text-slate-900'>Execution Summary</div>
          <div className='mt-1 text-sm text-slate-500'>{result.userSummary?.overview}</div>
        </div>
        <div className='flex items-center gap-2'>
          <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600'>{responseMode}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.decision === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{result.decision}</span>
        </div>
      </div>
      <p className='mt-4 text-sm leading-6 text-slate-600'>{result.userSummary?.result}</p>
      <p className='mt-2 text-sm leading-6 text-slate-500'>{result.userSummary?.impact}</p>
      <div className='mt-5'>
        {responseMode === 'table' ? <FindingsTable result={result} /> : responseMode === 'list' ? <FindingsList result={result} /> : <SummaryCards result={result} />}
      </div>
      <details className='mt-5 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3'>
        <summary className='cursor-pointer text-sm font-semibold text-slate-700'>Technical details</summary>
        <pre className='mt-3 overflow-auto rounded-[14px] bg-slate-900 p-4 text-xs text-slate-100'>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </AssistantBubble>
  );
}

function AssistantText({ text }) {
  return (
    <AssistantBubble>
      <div className='text-[16px] leading-8 text-slate-700 whitespace-pre-line'>{text}</div>
    </AssistantBubble>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [config, setConfig] = useState(initialConfig);
  const [configReady, setConfigReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promptTemplates, setPromptTemplates] = useState([]);
  const [showStarterPrompts, setShowStarterPrompts] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [bootstrapRes, promptsRes] = await Promise.all([
          fetch(`${agentBase}/qa/bootstrap`),
          fetch(`${agentBase}/prompts/templates`)
        ]);
        const bootstrapData = await bootstrapRes.json();
        const promptsData = await promptsRes.json();

        setPromptTemplates(promptsData.prompts || []);
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            type: 'text',
            text: 'Welcome. I can help evaluate your API through a guided conversation. First, please complete the configuration tool so I can understand your Swagger definition and runtime metadata.'
          },
          {
            id: 'config-tool',
            role: 'assistant',
            type: 'config_form',
            component: bootstrapData.component
          }
        ]);
      } catch (error) {
        setMessages([
          { id: 'welcome-fallback', role: 'assistant', type: 'text', text: 'Welcome. Please configure the API details below, then send the evaluation prompt.' },
          { id: 'config-tool-fallback', role: 'assistant', type: 'config_form' }
        ]);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, loading]);

  const suggestionTexts = useMemo(() => {
    const fromTemplates = promptTemplates.slice(0, 2).map(item => item.prompt);
    return fromTemplates.length ? fromTemplates : [
      'Run a smoke test on the most important LOS routes and tell me whether the environment is safe for a demo.',
      'Validate the LOS application form and explain failures clearly.'
    ];
  }, [promptTemplates]);

  const submitConfig = () => {
    setConfigReady(true);
    setMessages(prev => [
      ...prev,
      {
        id: `config-summary-${Date.now()}`,
        role: 'user',
        type: 'text',
        text: `API Base URL: ${config.apiBaseUrl}\nSwagger URL: ${config.swaggerUrl}\nMax Routes: ${config.maxRoutes}\nEnvironment: ${config.environment}\nResponse Format: ${config.responseMode}`
      },
      {
        id: `assistant-ready-${Date.now()}`,
        role: 'assistant',
        type: 'text',
        text: 'Great. Configuration is captured. Now tell me what you want me to evaluate.'
      }
    ]);
  };

  const handleSuggestion = text => {
    setInput(text);
    setShowStarterPrompts(false);
  };

  const ensureConfigReminder = () => {
    setMessages(prev => {
      if (prev.some(item => item.id === 'config-reminder')) return prev;
      return [
        ...prev,
        { id: 'config-reminder', role: 'assistant', type: 'text', text: 'Before I run the evaluation, please complete the configuration tool in the conversation so I know which API and Swagger file to use.' }
      ];
    });
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setShowStarterPrompts(false);

    if (!configReady) {
      setInput('');
      ensureConfigReminder();
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      type: 'text',
      text: trimmed
    };

    setMessages(prev => [
      ...prev,
      userMessage,
      {
        id: `assistant-processing-${Date.now()}`,
        role: 'assistant',
        type: 'text',
        text: 'Understood. I am analyzing the Swagger definition, selecting relevant routes, and running the evaluation now.'
      }
    ]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${agentBase}/qa/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          apiBaseUrl: config.apiBaseUrl,
          swaggerUrl: config.swaggerUrl,
          maxRoutes: Number(config.maxRoutes),
          environment: config.environment,
          responseMode: config.responseMode
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Agent execution failed');

      setMessages(prev => [
        ...prev,
        {
          id: `assistant-result-${Date.now()}`,
          role: 'assistant',
          type: 'result',
          result: data
        }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          type: 'text',
          text: error.message || 'Something went wrong while running the evaluation.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onComposerKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className='min-h-screen bg-[#f5f5f7] text-slate-900'>
      <div className='mx-auto flex min-h-screen max-w-[1500px] flex-col px-6 py-7'>
        <CapabilityCard />

        <div ref={scrollRef} className='flex-1 overflow-y-auto rounded-[32px] px-2 pb-6'>
          <div className='mx-auto max-w-[1480px] space-y-6'>
            {messages.map(message => (
              <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && <SparkIcon />}
                <div className={`${message.role === 'assistant' ? 'max-w-[1120px]' : 'max-w-[70%]'}`}>
                  {message.type === 'config_form' ? (
                    <ConfigToolCard config={config} setConfig={setConfig} onSubmit={submitConfig} />
                  ) : message.type === 'result' ? (
                    <ResultToolCard result={message.result} responseMode={config.responseMode} />
                  ) : message.role === 'user' ? (
                    <UserBubble text={message.text} />
                  ) : (
                    <AssistantText text={message.text} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className='flex justify-start gap-4'>
                <SparkIcon />
                <AssistantBubble>
                  <div className='flex items-center gap-2 text-slate-500'>
                    <span className='h-2.5 w-2.5 animate-pulse rounded-full bg-violet-400'></span>
                    <span className='h-2.5 w-2.5 animate-pulse rounded-full bg-violet-400 [animation-delay:120ms]'></span>
                    <span className='h-2.5 w-2.5 animate-pulse rounded-full bg-violet-400 [animation-delay:240ms]'></span>
                    <span className='ml-2 text-sm'>Running evaluation...</span>
                  </div>
                </AssistantBubble>
              </div>
            )}
          </div>
        </div>

        {showStarterPrompts && (
          <div className='mt-4 grid gap-3 md:grid-cols-2'>
            {suggestionTexts.map(text => <SuggestionPill key={text} text={text} onClick={handleSuggestion} />)}
          </div>
        )}

        <div className='mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='min-h-[120px] rounded-[22px] bg-slate-50 px-4 py-4'>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder='Send a message...'
              className='h-[92px] w-full resize-none bg-transparent text-[16px] text-slate-700 outline-none placeholder:text-slate-400'
            />
          </div>
          <div className='mt-3 flex items-center justify-between gap-3'>
            <div className='text-sm text-slate-400'>Tip: complete the configuration tool first, then send your QA prompt.</div>
            <div className='flex items-center gap-3'>
              <button className='flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50'>⌘</button>
              <button onClick={sendMessage} className='flex h-10 w-10 items-center justify-center rounded-full bg-violet-300 text-xl text-white transition hover:bg-violet-400'>↑</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
