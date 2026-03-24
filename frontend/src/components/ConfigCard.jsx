export default function ConfigCard({ component, config, setConfig, onSubmit }) {
  return (
    <div className='max-w-3xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm'>
      <div className='mb-4'>
        <div className='flex items-center justify-between text-sm text-slate-500'>
          <span>Conversation setup wizard</span>
          <span>Step 1 of 2</span>
        </div>
        <div className='mt-2 h-2 overflow-hidden rounded-full bg-slate-100'>
          <div className='h-full w-1/2 rounded-full bg-violet-500' />
        </div>
      </div>

      <h3 className='text-xl font-semibold text-slate-900'>{component?.title || 'Agent setup'}</h3>
      <p className='mt-2 text-sm text-slate-600'>{component?.description}</p>

      <div className='mt-5 space-y-4'>
        <label className='block text-sm font-medium text-slate-700'>
          API Base URL
          <input
            className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500'
            value={config.apiBaseUrl}
            onChange={event => setConfig(prev => ({ ...prev, apiBaseUrl: event.target.value }))}
          />
        </label>

        <label className='block text-sm font-medium text-slate-700'>
          Swagger URL
          <input
            className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500'
            value={config.swaggerUrl}
            onChange={event => setConfig(prev => ({ ...prev, swaggerUrl: event.target.value }))}
          />
        </label>

        <label className='block text-sm font-medium text-slate-700'>
          Max Routes
          <input
            type='number'
            min='1'
            max='12'
            className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500'
            value={config.maxRoutes}
            onChange={event => setConfig(prev => ({ ...prev, maxRoutes: event.target.value }))}
          />
        </label>

        <button
          type='button'
          onClick={onSubmit}
          className='w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white'
        >
          Continue to prompt step
        </button>
      </div>
    </div>
  );
}
