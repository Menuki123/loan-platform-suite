export default function ChatShell({
  title,
  subtitle,
  messages,
  composerValue,
  onComposerChange,
  onSend,
  loading,
  canSend,
  suggestions,
  onPickSuggestion,
  renderMessage
}) {
  return (
    <main className='flex min-h-[85vh] flex-col rounded-[32px] border border-slate-200 bg-white shadow-sm'>
      <header className='border-b border-slate-200 px-6 py-5'>
        <h1 className='text-2xl font-bold'>{title}</h1>
        <p className='mt-2 max-w-4xl text-sm text-slate-600'>{subtitle}</p>
      </header>

      <section className='flex-1 space-y-4 overflow-y-auto px-6 py-6'>
        {messages.map(message => (
          <div key={message.id}>{renderMessage(message)}</div>
        ))}
      </section>

      <footer className='border-t border-slate-200 px-6 py-5'>
        <div className='mb-3 flex flex-wrap gap-2'>
          {suggestions.map(item => (
            <button
              key={item}
              type='button'
              onClick={() => onPickSuggestion(item)}
              className='rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-blue-400 hover:text-blue-700'
            >
              {item}
            </button>
          ))}
        </div>

        <div className='flex items-end gap-3'>
          <textarea
            className='min-h-24 flex-1 resize-none rounded-[28px] border border-slate-200 px-4 py-4 text-sm outline-none focus:border-blue-500'
            placeholder={canSend ? 'Type the testing prompt for the agent...' : 'Complete the configuration step first...'}
            value={composerValue}
            onChange={(event) => onComposerChange(event.target.value)}
            disabled={!canSend || loading}
          />
          <button
            type='button'
            onClick={onSend}
            disabled={!canSend || loading}
            className='rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300'
          >
            {loading ? 'Running...' : 'Send'}
          </button>
        </div>
      </footer>
    </main>
  );
}
