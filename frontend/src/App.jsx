import { useEffect, useMemo, useState } from 'react';

const hardcodedUsername = 'admin';
const hardcodedPassword = 'password123';
const agentBaseDefault = import.meta.env.VITE_AGENT_BASE_URL || 'http://localhost:4000';

const starterPrompts = [
  'Create a customer and apply for a loan',
  'Check underwriting rules for PRODUCT_A',
  'Run a payment summary and explain the result'
];

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    </svg>
  );
}

function IconExpand({ open = false }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      {open ? (
        <>
          <path d="M9 15H5v4" />
          <path d="M15 9h4V5" />
          <path d="M5 19l5-5" />
          <path d="M19 5l-5 5" />
        </>
      ) : (
        <>
          <path d="M9 5H5v4" />
          <path d="M15 19h4v-4" />
          <path d="M5 5l5 5" />
          <path d="M19 19l-5-5" />
        </>
      )}
    </svg>
  );
}

function IconChevron({ left = false }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d={left ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  );
}

function Modal({ title, children, onClose }) {
  if (!children) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          <button onClick={onClose} aria-label='Close' className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700"><svg viewBox='0 0 24 24' className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='2.5'><path d='M6 6l12 12' /><path d='M18 6L6 18' /></svg></button>
        </div>
        <div className="max-h-[calc(90vh-72px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const ok = onLogin(username, password);
    if (!ok) setError('Invalid username or password');
  };

  return (
    <div className='flex min-h-screen bg-white'>
      <div className='flex min-h-screen w-full items-center justify-center bg-white'>
        <div className='grid h-full w-full max-w-none gap-0 md:grid-cols-2'>
          <div className='hidden min-h-screen bg-slate-900 p-12 text-white md:block'>
            <div className='max-w-sm'>
              <div className='text-sm uppercase tracking-[0.3em] text-slate-300'>Loan platform suite</div>
              <h1 className='mt-6 text-4xl font-bold leading-tight'>Conversational QA agent with file-driven execution.</h1>
              <p className='mt-6 text-slate-300'>Sign in to test APIs, upload CSV or JSON data, and save conversation history in SQLite.</p>
            </div>
          </div>

          <form onSubmit={submit} className='flex items-center justify-center p-8 md:p-12'>
            <div className='w-full max-w-md bg-white p-8'>
              <h1 className='text-3xl font-bold tracking-tight text-slate-900'>Login</h1>
              <p className='mt-2 text-sm text-slate-500'>Sign in to continue to the conversational QA view.</p>

              <label className='mt-8 block text-sm font-medium text-slate-700'>Username</label>
              <input className='mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-blue-500' value={username} onChange={(e) => setUsername(e.target.value)} placeholder='Enter username' />

              <label className='mt-5 block text-sm font-medium text-slate-700'>Password</label>
              <input type='password' className='mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-blue-500' value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Enter password' />

              {error && <div className='mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600'>{error}</div>}

              <button type='submit' className='mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white'>
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SwaggerConfigTool({ swaggerUrl, setSwaggerUrl, onContinue, disabled }) {
  return (
    <div className='max-w-3xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm'>
      <div className='text-sm font-semibold text-slate-900'>Swagger configuration</div>
      <p className='mt-2 text-sm text-slate-500'>Capture the Swagger URL once through the frontend tool, then proceed directly to evaluation.</p>
      <input className='mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500' value={swaggerUrl} onChange={(e) => setSwaggerUrl(e.target.value)} placeholder='http://localhost:3000/openapi.json' disabled={disabled} />
      <button onClick={onContinue} disabled={disabled || !swaggerUrl.trim()} className='mt-4 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300'>
        Continue
      </button>
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
        <div className='text-sm text-slate-500'>{result.bulkMode ? 'Total cases' : 'Total tests'}</div>
        <div className='mt-3 text-3xl font-bold text-slate-900'>{summary.totalTests ?? 0}</div>
      </div>
      <div className='rounded-3xl border border-slate-200 bg-white p-5'>
        <div className='text-sm text-slate-500'>Passed / Failed</div>
        <div className='mt-3 text-3xl font-bold text-slate-900'>{summary.passed ?? 0} / {summary.failed ?? 0}</div>
      </div>
    </div>
  );
}

function UploadedFileSummary({ fileSummary }) {
  if (!fileSummary) return null;

  return (
    <div className='rounded-3xl border border-slate-200 bg-white p-5'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h3 className='text-lg font-semibold text-slate-900'>Dataset used by the agent</h3>
          <p className='mt-1 text-sm leading-6 text-slate-600'>This run used the uploaded dataset to build payloads, trace fields clearly, and improve the final explanation shown in the UI.</p>
        </div>
        <div className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600'>{fileSummary.fileType}</div>
      </div>
      <div className='mt-5 grid gap-4 md:grid-cols-3'>
        <div className='rounded-3xl bg-slate-50 p-5'>
          <div className='text-xs uppercase tracking-wide text-slate-500'>File</div>
          <div className='mt-2 text-sm font-semibold text-slate-900'>{fileSummary.fileName}</div>
        </div>
        <div className='rounded-3xl bg-slate-50 p-5'>
          <div className='text-xs uppercase tracking-wide text-slate-500'>Records</div>
          <div className='mt-2 text-sm font-semibold text-slate-900'>{fileSummary.totalRecords ?? 0}</div>
        </div>
        <div className='rounded-3xl bg-slate-50 p-5'>
          <div className='text-xs uppercase tracking-wide text-slate-500'>Columns</div>
          <div className='mt-2 text-sm font-semibold text-slate-900'>{fileSummary.columns?.length ? fileSummary.columns.join(', ') : 'None detected'}</div>
        </div>
      </div>
    </div>
  );
}

function EndpointCards({ items = [] }) {
  const [showAll, setShowAll] = useState(false);
  if (!items.length) return null;
  const visibleItems = showAll ? items : items.slice(0, 3);
  return (
    <div className='space-y-3'>
      {visibleItems.map((item, idx) => (
        <div key={`${item.route}-${idx}`} className='rounded-2xl bg-slate-50 p-4'>
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <div className='text-sm font-semibold text-slate-900'>{item.route} {item.result ? `- ${item.result}` : ''}</div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.result === 'PASS' ? 'bg-emerald-100 text-emerald-700' : item.result === 'FAIL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
              {item.result}
            </span>
          </div>
          <div className='mt-3 text-sm leading-6 text-slate-700'>{item.reason}</div>
          <div className='mt-4 grid gap-3 md:grid-cols-2'>
            <div className='rounded-2xl bg-white p-4'>
              <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Request dataset</div>
              <div className='mt-2 text-sm text-slate-700'>
                <div><span className='font-medium'>Fields:</span> {item.requestDataset?.payloadFields?.length ? item.requestDataset.payloadFields.join(', ') : 'No payload fields'}</div>
                <div className='mt-2'><span className='font-medium'>Source:</span> {item.requestDataset?.sourceType === 'uploaded_file' ? 'Uploaded file' : 'Generated mock data'}</div>
                {item.requestDataset?.sourceRecord && (
                  <pre className='mt-3 overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700'>{JSON.stringify(item.requestDataset.sourceRecord, null, 2)}</pre>
                )}
              </div>
            </div>
            <div className='rounded-2xl bg-white p-4'>
              <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Response dataset</div>
              <div className='mt-2 text-sm text-slate-700'>
                <div><span className='font-medium'>Fields:</span> {item.responseDataset?.topLevelFields?.length ? item.responseDataset.topLevelFields.join(', ') : 'No response fields'}</div>
                {item.responseDataset?.responsePreview && (
                  <pre className='mt-3 overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700'>{JSON.stringify(item.responseDataset.responsePreview, null, 2)}</pre>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {items.length > 3 && (
        <button onClick={() => setShowAll((value) => !value)} className='rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700'>
          {showAll ? 'Show less' : 'More'}
        </button>
      )}
    </div>
  );
}

function VectorRetrievalPanel({ retrieval }) {
  const [expanded, setExpanded] = useState(false);
  if (!retrieval || !retrieval.rankedRoutes?.length) return null;
  const visibleRoutes = expanded ? retrieval.rankedRoutes : retrieval.rankedRoutes.slice(0, 5);
  return (
    <div>
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
        <div className='rounded-2xl bg-slate-50 p-4'>
          <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Dedicated vector DB solution</div>
          <div className='mt-2 text-sm text-slate-700'>{retrieval.architecture?.dedicatedVectorDb || 'Dedicated vector DB ready for semantic ranking, reduced embedded vectors, and frequent updates.'}</div>
        </div>
        <div className='rounded-2xl bg-slate-50 p-4'>
          <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Embedded vector reduced mode</div>
          <div className='mt-2 text-sm text-slate-700'>{retrieval.architecture?.embeddedReducedMode || 'Embedded local vectors are kept lightweight and reduced for fallback ranking only.'}</div>
        </div>
        <div className='rounded-2xl bg-slate-50 p-4'>
          <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>With or without vector DB</div>
          <div className='mt-2 text-sm text-slate-700'>{retrieval.architecture?.dualMode || 'The same project works with a dedicated vector DB and without one by falling back to deterministic ranking.'}</div>
        </div>
      </div>
      <div className='mt-4 space-y-3'>
        {visibleRoutes.map((item, index) => (
          <div key={`${item.route}-${index}`} className='rounded-2xl bg-slate-50 p-4'>
            <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
              <div className='text-sm font-semibold text-slate-900'>{item.route}</div>
              <div className='text-xs text-slate-500'>Vector {item.vectorScore} · Keyword {item.keywordScore} · Combined {item.combinedScore}</div>
            </div>
            <div className='mt-2 text-sm text-slate-600'>Matched terms: {item.matchedTerms?.length ? item.matchedTerms.join(', ') : 'No direct term matches'}</div>
          </div>
        ))}
      </div>
      {retrieval.rankedRoutes.length > 5 && (
        <button onClick={() => setExpanded((value) => !value)} className='mt-4 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700'>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

function DetailedSummaryPanel({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className='space-y-3 rounded-3xl border border-slate-200 bg-white p-5'>
      <div className='text-sm text-slate-500'>Looped bulk display</div>
      <div className='space-y-3'>
        {items.map((item, index) => (
          <div key={`${item.route}-${index}`} className={`rounded-2xl p-4 ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white border border-slate-200'}`}>
            <div className='flex items-center justify-between gap-3'>
              <div className='text-sm font-semibold text-slate-900'>{item.route}</div>
              {item.result ? (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.result === 'PASS' ? 'bg-emerald-100 text-emerald-700' : item.result === 'FAIL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  {item.result}
                </span>
              ) : null}
            </div>
            <p className='mt-3 text-sm leading-7 text-slate-700'>{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvaluationResultTool({ result }) {
  const [fullScreen, setFullScreen] = useState(false);
  const [openModal, setOpenModal] = useState(null);

  const panel = (
    <div className={`${fullScreen ? 'max-w-none' : 'w-full'} space-y-4 bg-white p-0`}>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white'><IconSpark /></div>
          <div>
            <p className='mt-1 text-sm text-slate-500'>Styled frontend insight generated from the evaluation result.</p>
          </div>
        </div>
        <div className='flex flex-wrap items-center justify-end gap-3'>
          {result.vectorRetrieval?.rankedRoutes?.length ? (
            <button onClick={() => setOpenModal('vector')} className='rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700'>
              Symatics
            </button>
          ) : null}
          {result.summary?.keyFindings?.length ? (
            <button onClick={() => setOpenModal('endpoints')} className='rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700'>
              Case equate by agent
            </button>
          ) : null}
          <button onClick={() => setFullScreen((value) => !value)} className='rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm'>
            <IconExpand open={fullScreen} />
          </button>
          <div className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${result.decision === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {result.decision}
          </div>
        </div>
      </div>
      <div className='rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700'>
        {result.userSummary?.result || 'The agent completed the evaluation and returned the summarized result.'}
      </div>
      <SummaryCards result={result} />
      <UploadedFileSummary fileSummary={result.uploadedFileSummary} />
      <DetailedSummaryPanel items={result.detailedSummary || []} />

      <Modal title='Symatics' onClose={() => setOpenModal(null)}>
        {openModal === 'vector' ? <VectorRetrievalPanel retrieval={result.vectorRetrieval} /> : null}
      </Modal>
      <Modal title='Case equate by agent' onClose={() => setOpenModal(null)}>
        {openModal === 'endpoints' ? <EndpointCards items={result.summary?.keyFindings || []} /> : null}
      </Modal>
    </div>
  );

  if (fullScreen) {
    return (
      <div className='fixed inset-0 z-40 overflow-y-auto bg-white p-6'>
        <div className='mx-auto max-w-7xl'>{panel}</div>
      </div>
    );
  }

  return panel;
}

function formatTime(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
}

function buildUiMessages(apiMessages = [], configReady) {
  const base = [];
  if (!configReady && apiMessages.length === 0) {
    base.push({ role: 'assistant', type: 'text', text: 'Welcome. Please provide the Swagger URL first so I can prepare the evaluation.' });
    base.push({ role: 'assistant', type: 'config' });
    return base;
  }
  for (const msg of apiMessages) {
    if (msg.message_type === 'config_tool') {
      base.push({ role: 'assistant', type: 'text', text: 'Swagger configuration captured through the frontend tool. Now send the evaluation prompt.', createdAt: msg.created_at });
      continue;
    }
    if (msg.message_type === 'result_tool') {
      base.push({ role: 'assistant', type: 'result_tool', result: msg.metadata, createdAt: msg.created_at });
      continue;
    }
    base.push({ role: msg.role === 'tool' ? 'assistant' : msg.role, type: 'text', text: msg.content, createdAt: msg.created_at });
  }
  return base;
}

function MessageBubble({ msg }) {
  if (msg.type === 'result_tool') return <EvaluationResultTool result={msg.result} />;
  if (msg.type === 'config') return null;
  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl rounded-[24px] px-5 py-4 text-sm shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
        <div>{msg.text}</div>
        {msg.createdAt && <div className={`mt-2 text-[11px] ${msg.role === 'user' ? 'text-slate-300' : 'text-slate-400'}`}>{formatTime(msg.createdAt)}</div>}
      </div>
    </div>
  );
}

async function readUploadedFile(file) {
  if (!file) return null;
  const content = await file.text();
  const fileType = file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv';
  return { fileName: file.name, fileType, content };
}

function ConversationScreen({ onLogout }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [swaggerUrl, setSwaggerUrl] = useState('http://localhost:3000/openapi.json');
  const [configReady, setConfigReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadNotice, setUploadNotice] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const textMessages = useMemo(() => messages.filter((msg) => msg.type === 'text'), [messages]);

  const loadConversation = async (activeSessionId) => {
    if (!activeSessionId) return;
    const response = await fetch(`${agentBaseDefault}/qa/conversations/${activeSessionId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load conversation');
    const isConfigured = Boolean(data.sessionConfig?.swaggerUrl);
    setConfigReady(isConfigured);
    if (data.sessionConfig?.swaggerUrl) setSwaggerUrl(data.sessionConfig.swaggerUrl.replace('openapi.yaml', 'openapi.json'));
    setMessages(buildUiMessages(data.messages || [], isConfigured));
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await fetch(`${agentBaseDefault}/qa/bootstrap`);
        const data = await response.json();
        const defaultValue = data?.defaults?.swaggerUrl || 'http://localhost:3000/openapi.json';
        setSwaggerUrl(defaultValue.replace('openapi.yaml', 'openapi.json'));
        if (data?.sessionId) {
          setSessionId(data.sessionId);
          await loadConversation(data.sessionId);
        }
      } catch (_err) {
        setMessages(buildUiMessages([], false));
      }
    };
    bootstrap();
  }, []);

  const submitConfig = async () => {
    if (!swaggerUrl.trim() || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`${agentBaseDefault}/qa/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, swaggerUrl, maxRoutes: 6 })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to capture configuration');
      if (data.sessionId) setSessionId(data.sessionId);
      await loadConversation(data.sessionId || sessionId);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', type: 'text', text: error.message || 'Failed to save configuration.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const prompt = input.trim();
    setInput('');
    setLoading(true);
    setUploadNotice('');
    try {
      const uploadedFile = await readUploadedFile(selectedFile);
      const response = await fetch(`${agentBaseDefault}/qa/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, prompt, maxRoutes: 6, uploadedFile })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Agent run failed');
      if (data.sessionId) setSessionId(data.sessionId);
      await loadConversation(data.sessionId || sessionId);
      if (uploadedFile) setUploadNotice(`${uploadedFile.fileName} was used for this run.`);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', type: 'text', text: error.message || 'Something went wrong while running the evaluation.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-white'>
      <div className='flex min-h-screen w-full flex-col bg-white'>
        <div className='flex items-center justify-end border-b border-slate-200 px-6 py-4'>
          <button onClick={onLogout} className='rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700'>Logout</button>
        </div>

        <div className='relative flex flex-1 overflow-hidden'>
          <div className='flex min-w-0 flex-1 flex-col'>
            <div className='flex-1 space-y-4 overflow-y-auto bg-white p-4 md:p-6'>
              {!configReady && <SwaggerConfigTool swaggerUrl={swaggerUrl} setSwaggerUrl={setSwaggerUrl} onContinue={submitConfig} disabled={loading} />}
              {messages.map((msg, idx) => (
                <MessageBubble key={`${msg.type}-${idx}-${msg.createdAt || 'na'}`} msg={msg} />
              ))}
            </div>

            <div className='border-t border-slate-200 bg-white p-4'>
              <div className='w-full'>
                {!configReady && <div className='mb-3 w-fit rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-500'>Complete the frontend config tool to continue</div>}
                {configReady && (
                  <div className='mb-3 flex flex-wrap gap-2'>
                    {starterPrompts.map((item) => (
                      <button key={item} onClick={() => setInput(item)} className='rounded-full border border-slate-300 bg-white px-4 py-2 text-left text-xs text-slate-600'>
                        {item}
                      </button>
                    ))}
                  </div>
                )}

                <div className='mb-3 rounded-3xl border border-slate-200 bg-slate-50 p-4'>
                  <div className='text-base font-semibold text-slate-900'>Optional data upload</div>
                  <p className='mt-1 text-sm leading-6 text-slate-600'>Upload a CSV or JSON file to give the agent clearer dataset inputs. This improves traceability, route matching, and explanation quality in the result.</p>
                  <div className='mt-3 flex flex-col gap-3 md:flex-row md:items-center'>
                    <input type='file' accept='.csv,.json,application/json,text/csv' onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className='block w-full text-sm text-slate-600 file:mr-4 file:rounded-2xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white' />
                    {selectedFile && <div className='rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-600'>{selectedFile.name}</div>}
                  </div>
                  {uploadNotice && <div className='mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>{uploadNotice}</div>}
                  {selectedFile && <div className='mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700'>For bulk mode, upload a JSON or CSV file with multiple rows. The agent will loop through each case and display the results one by one.</div>}
                </div>

                <div className='flex items-end gap-3'>
                  <textarea className='min-h-[90px] flex-1 resize-none rounded-[24px] border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100' placeholder={configReady ? 'Send the evaluation prompt...' : 'Complete the Swagger URL field first...'} value={input} onChange={(e) => setInput(e.target.value)} disabled={!configReady} />
                  <button onClick={sendMessage} disabled={!configReady || loading} className='rounded-full bg-blue-600 px-5 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300'>
                    {loading ? 'Running...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`relative border-l border-slate-200 bg-white transition-all duration-300 ${drawerOpen ? 'w-[340px]' : 'w-[76px]'}`}>
            <button onClick={() => setDrawerOpen((value) => !value)} className='absolute left-1/2 top-6 z-10 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow'>
              <IconChevron left={drawerOpen} />
            </button>
            {drawerOpen ? (
              <div className='h-full overflow-y-auto px-4 pb-4 pt-24'>
                <div className='text-sm font-semibold text-slate-900'>History</div>
                <div className='mt-4 space-y-3'>
                  {textMessages.slice(-8).map((msg, index) => (
                    <div key={`${msg.text}-${index}`} className='rounded-2xl bg-slate-50 p-3'>
                      <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{msg.role}</div>
                      <div className='mt-1 text-sm text-slate-700'>{msg.text}</div>
                    </div>
                  ))}
                  {!textMessages.length && <div className='rounded-2xl bg-slate-50 p-3 text-sm text-slate-500'>No saved messages yet.</div>}
                </div>
              </div>
            ) : (
              <div className='h-full' />
            )}
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
