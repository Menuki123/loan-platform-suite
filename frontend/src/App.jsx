import { useEffect, useMemo, useState } from 'react';

const hardcodedUsername = 'admin';
const hardcodedPassword = 'password123';
const agentBaseDefault = import.meta.env.VITE_AGENT_BASE_URL || 'http://localhost:4000';

const starterPrompts = [
  'Create a customer and apply for a loan',
  'Check underwriting rules for PRODUCT_A',
  'Run a payment summary and explain the result'
];

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
    <div className='min-h-screen bg-[#f6f1e7] p-4'>
      <div className='mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center rounded-[32px] bg-white shadow-2xl'>
        <div className='grid w-full max-w-5xl gap-0 md:grid-cols-2'>
          <div className='hidden rounded-l-[32px] bg-slate-900 p-12 text-white md:block'>
            <div className='max-w-sm'>
              <div className='text-sm uppercase tracking-[0.3em] text-slate-300'>Loan platform suite</div>
              <h1 className='mt-6 text-4xl font-bold leading-tight'>Conversational QA agent with file-driven execution.</h1>
              <p className='mt-6 text-slate-300'>Sign in to test APIs, upload CSV or JSON data, and save conversation history in SQLite.</p>
            </div>
          </div>

          <form onSubmit={submit} className='p-8 md:p-12'>
            <div className='max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm'>
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

function UploadedFileSummary({ fileSummary }) {
  if (!fileSummary) return null;

  return (
    <div className='rounded-3xl border border-slate-200 bg-white p-5'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h3 className='text-base font-semibold text-slate-900'>Uploaded dataset used by the agent</h3>
          <p className='mt-1 text-sm text-slate-500'>The agent read this file and mapped the data into endpoint payloads.</p>
        </div>
        <div className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600'>{fileSummary.fileType}</div>
      </div>
      <div className='mt-4 grid gap-3 md:grid-cols-3'>
        <div className='rounded-2xl bg-slate-50 p-4'>
          <div className='text-xs uppercase tracking-wide text-slate-500'>File</div>
          <div className='mt-2 text-sm font-semibold text-slate-900'>{fileSummary.fileName}</div>
        </div>
        <div className='rounded-2xl bg-slate-50 p-4'>
          <div className='text-xs uppercase tracking-wide text-slate-500'>Records</div>
          <div className='mt-2 text-sm font-semibold text-slate-900'>{fileSummary.totalRecords ?? 0}</div>
        </div>
        <div className='rounded-2xl bg-slate-50 p-4'>
          <div className='text-xs uppercase tracking-wide text-slate-500'>Columns</div>
          <div className='mt-2 text-sm font-semibold text-slate-900'>{fileSummary.columns?.length ? fileSummary.columns.join(', ') : 'None detected'}</div>
        </div>
      </div>
    </div>
  );
}

function EndpointCards({ items = [] }) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const visibleItems = showAll ? items : items.slice(0, 3);

  if (!items.length) return null;

  return (
    <div className='rounded-3xl border border-slate-200 bg-white p-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h3 className='text-base font-semibold text-slate-900'>API endpoints used by the agent</h3>
          <p className='mt-1 text-sm text-slate-500'>Route result, reason, request dataset, and response dataset are grouped together for each endpoint.</p>
        </div>
        <button onClick={() => setExpanded((value) => !value)} className='rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700'>
          {expanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {expanded && (
        <div className='mt-4 space-y-3'>
          {visibleItems.map((item, idx) => (
            <div key={`${item.route}-${idx}`} className='rounded-2xl bg-slate-50 p-4'>
              <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
                <div className='text-sm font-semibold text-slate-900'>{item.route}</div>
                <div className='flex items-center gap-2'>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.result === 'PASS' ? 'bg-emerald-100 text-emerald-700' : item.result === 'FAIL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.result}
                  </span>
                  <span className='rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500'>Status {item.responseDataset?.statusCode ?? 'N/A'}</span>
                </div>
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
                    <div><span className='font-medium'>Status:</span> {item.responseDataset?.statusCode ?? 'N/A'}</div>
                    <div className='mt-2'><span className='font-medium'>Fields:</span> {item.responseDataset?.topLevelFields?.length ? item.responseDataset.topLevelFields.join(', ') : 'No response fields'}</div>
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
      )}
    </div>
  );
}


function VectorRetrievalPanel({ retrieval }) {
  const [expanded, setExpanded] = useState(false);

  if (!retrieval || !retrieval.rankedRoutes?.length) return null;

  const visibleRoutes = expanded ? retrieval.rankedRoutes : retrieval.rankedRoutes.slice(0, 5);

  return (
    <div className='rounded-3xl border border-slate-200 bg-white p-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h3 className='text-base font-semibold text-slate-900'>Vector route retrieval</h3>
          <p className='mt-1 text-sm text-slate-500'>The project keeps the same structure and can run with a dedicated vector DB or without a vector DB, while still supporting multi-point route selection and recorded execution.</p>
        </div>
        <div className='rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase text-indigo-700'>
          {retrieval.strategy || retrieval.mode || 'vector'}
        </div>
      </div>

      <div className='mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
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
        <div className='rounded-2xl bg-slate-50 p-4'>
          <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Daily to weekly update frequency</div>
          <div className='mt-2 text-sm text-slate-700'>{retrieval.updateFrequency?.summary || 'Daily delta updates for changed routes and weekly full refresh for quality and cleanup.'}</div>
        </div>
        <div className='rounded-2xl bg-slate-50 p-4'>
          <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Factor deliverable</div>
          <div className='mt-2 text-sm text-slate-700'>{retrieval.factorDeliverable || 'Input, chunking, ranking, endpoint execution, and recording stay separate so each factor can be delivered and tested independently.'}</div>
        </div>
        <div className='rounded-2xl bg-slate-50 p-4'>
          <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>VB usage and strengths</div>
          <div className='mt-2 text-sm text-slate-700'>{retrieval.usageAndStrengths || 'Vector usage supports semantic route ranking, multi-endpoint planning, and faster decision support with recorded behaviour.'}</div>
        </div>
      </div>

      <div className='mt-4 space-y-3'>
        {visibleRoutes.map((item, index) => (
          <div key={`${item.route}-${index}`} className='rounded-2xl bg-slate-50 p-4'>
            <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
              <div className='text-sm font-semibold text-slate-900'>{item.route}</div>
              <div className='text-xs text-slate-500'>
                Vector {item.vectorScore} · Keyword {item.keywordScore} · Combined {item.combinedScore}
              </div>
            </div>
            <div className='mt-2 text-sm text-slate-600'>
              Matched terms: {item.matchedTerms?.length ? item.matchedTerms.join(', ') : 'No direct term matches'}
            </div>
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
      <div>
        <h3 className='text-base font-semibold text-slate-900'>Detailed summary</h3>
        <p className='mt-1 text-sm text-slate-500'>A route-by-route explanation of what the agent checked and what happened.</p>
      </div>

      <div className='space-y-3'>
        {items.map((item, index) => (
          <div key={`${item.route}-${index}`} className='rounded-2xl bg-slate-50 p-4'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div className='text-sm font-semibold text-slate-900'>{item.route}</div>
              <div className='text-xs text-slate-500'>Status code: {item.datasetTaken?.statusCode ?? 'N/A'}</div>
            </div>
            <p className='mt-3 text-sm leading-6 text-slate-700'>{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


function EvaluationResultTool({ result }) {
  return (
    <div className='max-w-5xl space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='text-lg font-semibold text-slate-900'>Evaluation tool</div>
          <p className='mt-2 text-sm text-slate-500'>Styled frontend insight generated from the evaluation result.</p>
        </div>
        <div className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${result.decision === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {result.decision}
        </div>
      </div>
      <div className='rounded-3xl bg-slate-50 p-4 text-sm text-slate-700'>
        {result.userSummary?.result || 'The agent completed the evaluation and returned the summarized result.'}
      </div>
      <SummaryCards result={result} />
      <UploadedFileSummary fileSummary={result.uploadedFileSummary} />
      <VectorRetrievalPanel retrieval={result.vectorRetrieval} />
      <EndpointCards items={result.summary?.keyFindings || []} />
      <DetailedSummaryPanel items={result.detailedSummary || []} />
    </div>
  );
}

function formatTime(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
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
      base.push({
        role: 'assistant',
        type: 'text',
        text: 'Swagger configuration captured through the frontend tool. Now send the evaluation prompt.',
        createdAt: msg.created_at
      });
      continue;
    }

    if (msg.message_type === 'result_tool') {
      base.push({ role: 'assistant', type: 'result_tool', result: msg.metadata, createdAt: msg.created_at });
      continue;
    }

    base.push({
      role: msg.role === 'tool' ? 'assistant' : msg.role,
      type: 'text',
      text: msg.content,
      createdAt: msg.created_at
    });
  }

  return base;
}

function MessageBubble({ msg }) {
  if (msg.type === 'result_tool') {
    return <EvaluationResultTool result={msg.result} />;
  }

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

  const textMessages = useMemo(() => messages.filter((msg) => msg.type === 'text'), [messages]);

  const loadConversation = async (activeSessionId) => {
    if (!activeSessionId) return;

    const response = await fetch(`${agentBaseDefault}/qa/conversations/${activeSessionId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load conversation');

    const isConfigured = Boolean(data.sessionConfig?.swaggerUrl);
    setConfigReady(isConfigured);
    if (data.sessionConfig?.swaggerUrl) {
      setSwaggerUrl(data.sessionConfig.swaggerUrl.replace('openapi.yaml', 'openapi.json'));
    }
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
        body: JSON.stringify({
          sessionId,
          prompt,
          maxRoutes: 6,
          uploadedFile
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Agent run failed');

      if (data.ragTrace) {
        console.log(`📥 User Input: ${data.ragTrace.inputPrompt}`);
        console.log(`📦 Route Corpus Size: ${data.ragTrace.bigNumbers?.routeCorpusSize ?? 0}`);
        console.log(`🧠 Vector Candidates: ${data.ragTrace.bigNumbers?.vectorCandidates ?? 0}`);
        console.log(`🔗 Selected Endpoints: ${data.ragTrace.bigNumbers?.selectedEndpointCount ?? 0}`);
        console.log(`✅ Multi-endpoint Count: ${data.ragTrace.bigNumbers?.multiEndpointCount ?? 0}`);
        console.log(`⏱ Short-run Response Time: ${data.ragTrace.bigNumbers?.shortRunResponseTimeMs ?? 0} ms`);
        console.log('🧭 Vector architecture:', data.ragTrace.vectorSpace);
        console.log('🔄 Update frequency:', data.ragTrace.updateFrequency);
        console.log('🧩 Project mode:', data.ragTrace.projectMode);
        console.log('💪 VB usage and strengths:', data.ragTrace.usageAndStrengths);
        console.log('🧾 Agent capability:', data.ragTrace.agentCapability);
        console.log('💾 Input record behaviour:', data.ragTrace.inputRecordBehaviour);
      }

      if (data.sessionId) setSessionId(data.sessionId);
      await loadConversation(data.sessionId || sessionId);
      if (uploadedFile) {
        setUploadNotice(`${uploadedFile.fileName} was used for this run.`);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', type: 'text', text: error.message || 'Something went wrong while running the evaluation.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-[#f6f1e7] p-4 md:p-6'>
      <div className='mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col rounded-[32px] border border-slate-200 bg-white shadow-2xl'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4'>
          <div>
            <div className='text-sm text-slate-500'>Conversation mode</div>
            <div className='mt-1 text-xs text-slate-400'>Session ID: {sessionId || 'Creating...'}</div>
          </div>
          <div className='flex items-center gap-3'>
            <button onClick={() => loadConversation(sessionId)} className='rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700'>Refresh history</button>
            <button onClick={onLogout} className='rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700'>Logout</button>
          </div>
        </div>

        <div className='grid flex-1 gap-0 lg:grid-cols-[1fr_320px]'>
          <div className='flex flex-col'>
            <div className='flex-1 space-y-4 overflow-y-auto bg-[#f9f7f2] p-4 md:p-6'>
              {!configReady && <SwaggerConfigTool swaggerUrl={swaggerUrl} setSwaggerUrl={setSwaggerUrl} onContinue={submitConfig} disabled={loading} />}
              {messages.map((msg, idx) => (
                <MessageBubble key={`${msg.type}-${idx}-${msg.createdAt || 'na'}`} msg={msg} />
              ))}
            </div>

            <div className='border-t border-slate-200 bg-white p-4'>
              <div className='mx-auto max-w-5xl'>
                {!configReady && <div className='mb-3 rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-500 w-fit'>Complete the frontend config tool to continue</div>}
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
                  <div className='text-sm font-semibold text-slate-900'>Optional data upload</div>
                  <p className='mt-1 text-sm text-slate-500'>Upload a CSV or JSON file. The agent will read the file and use it during execution instead of relying only on mock data.</p>
                  <div className='mt-3 flex flex-col gap-3 md:flex-row md:items-center'>
                    <input type='file' accept='.csv,.json,application/json,text/csv' onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className='block w-full text-sm text-slate-600 file:mr-4 file:rounded-2xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white' />
                    {selectedFile && <div className='rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-600'>{selectedFile.name}</div>}
                  </div>
                  {uploadNotice && <div className='mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>{uploadNotice}</div>}
                </div>

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

          <div className='border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0'>
            <div className='space-y-4'>
              <div className='rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm'>
                <div className='text-sm font-semibold text-slate-900'>History panel</div>
                <p className='mt-1 text-sm text-slate-500'>This frontend reads the saved SQLite conversation and shows the same history for the active session.</p>
                <div className='mt-4 space-y-3'>
                  {textMessages.slice(-6).map((msg, index) => (
                    <div key={`${msg.text}-${index}`} className='rounded-2xl bg-slate-50 p-3'>
                      <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{msg.role}</div>
                      <div className='mt-1 text-sm text-slate-700'>{msg.text}</div>
                    </div>
                  ))}
                  {!textMessages.length && <div className='rounded-2xl bg-slate-50 p-3 text-sm text-slate-500'>No saved messages yet.</div>}
                </div>
              </div>
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
