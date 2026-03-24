export default function ToolDrawer({ health, tools, agentBaseUrl, setAgentBaseUrl, postmanUrl }) {
  return (
    <aside className='rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm'>
      <h2 className='text-lg font-bold text-slate-900'>Tooling and runtime</h2>
      <p className='mt-2 text-sm text-slate-600'>This refactor keeps the same idea, but structures it like an agent platform: conversation mode, tool registry, config capture, and Postman support.</p>

      <div className='mt-5 space-y-3'>
        <StatusRow name='API Server' value={health.api} />
        <StatusRow name='Agent Server' value={health.agent} />
      </div>

      <label className='mt-5 block text-sm font-medium text-slate-700'>
        Agent Server URL
        <input
          className='mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 outline-none focus:border-blue-500'
          value={agentBaseUrl}
          onChange={event => setAgentBaseUrl(event.target.value)}
        />
      </label>

      <div className='mt-5 rounded-3xl bg-slate-50 p-4'>
        <div className='text-sm font-semibold text-slate-800'>MCP-inspired registry</div>
        <p className='mt-2 text-xs text-slate-600'>This project now exposes a tool registry endpoint so the frontend can discover which components and backend capabilities the agent supports.</p>
      </div>

      <div className='mt-5'>
        <div className='text-sm font-semibold text-slate-800'>Available tools</div>
        <div className='mt-3 space-y-3'>
          {tools.map(tool => (
            <div key={tool.id} className='rounded-2xl border border-slate-200 p-3'>
              <div className='text-sm font-medium text-slate-900'>{tool.title}</div>
              <div className='mt-1 text-xs uppercase tracking-wide text-slate-400'>{tool.type}</div>
              <div className='mt-2 text-xs text-slate-600'>{tool.description}</div>
            </div>
          ))}
        </div>
      </div>

      <a
        className='mt-5 block rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white'
        href={postmanUrl}
        target='_blank'
        rel='noreferrer'
      >
        Open Postman Collection
      </a>
    </aside>
  );
}

function StatusRow({ name, value }) {
  const tone = value === 'online'
    ? 'bg-emerald-100 text-emerald-700'
    : value === 'offline'
      ? 'bg-rose-100 text-rose-700'
      : 'bg-amber-100 text-amber-700';

  return (
    <div className='flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-3'>
      <span className='text-sm font-medium text-slate-800'>{name}</span>
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{value}</span>
    </div>
  );
}
