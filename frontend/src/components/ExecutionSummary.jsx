function Badge({ value }) {
  const tone = value === 'PASS'
    ? 'bg-emerald-100 text-emerald-700'
    : value === 'FAIL'
      ? 'bg-rose-100 text-rose-700'
      : 'bg-amber-100 text-amber-700';

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}

export default function ExecutionSummary({ result }) {
  const summary = result.summary || {};
  const findings = summary.keyFindings || [];

  return (
    <div className='max-w-4xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Execution summary</div>
          <h3 className='mt-1 text-xl font-semibold text-slate-900'>Human-friendly result</h3>
        </div>
        <Badge value={result.decision} />
      </div>

      <p className='mt-4 text-sm text-slate-700'>{result.userSummary?.overview}</p>
      <p className='mt-2 text-sm text-slate-600'>{result.userSummary?.result}</p>
      <p className='mt-2 text-sm text-slate-500'>{result.userSummary?.impact}</p>

      <div className='mt-5 grid gap-3 md:grid-cols-4'>
        <Stat title='Total Tests' value={summary.totalTests ?? 0} />
        <Stat title='Passed' value={summary.passed ?? 0} tone='green' />
        <Stat title='Failed' value={summary.failed ?? 0} tone='red' />
        <Stat title='Reviewed' value={summary.reviewed ?? 0} tone='amber' />
      </div>

      <div className='mt-6 space-y-3'>
        {findings.map((item, index) => (
          <div key={`${item.route}-${index}`} className='rounded-2xl border border-slate-200 p-4'>
            <div className='flex items-center justify-between gap-3'>
              <div className='font-medium text-slate-900'>{item.route}</div>
              <Badge value={item.result} />
            </div>
            <p className='mt-2 text-sm text-slate-600'>{item.reason}</p>
          </div>
        ))}
      </div>

      <details className='mt-6 rounded-2xl bg-slate-950 p-4 text-slate-100'>
        <summary className='cursor-pointer text-sm font-semibold'>Technical details</summary>
        <pre className='mt-3 overflow-auto text-xs'>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}

function Stat({ title, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-900',
    green: 'bg-emerald-50 text-emerald-800',
    red: 'bg-rose-50 text-rose-800',
    amber: 'bg-amber-50 text-amber-800'
  };

  return (
    <div className={`rounded-2xl p-4 ${tones[tone]}`}>
      <div className='text-xs uppercase tracking-wide opacity-70'>{title}</div>
      <div className='mt-2 text-2xl font-bold'>{value}</div>
    </div>
  );
}
