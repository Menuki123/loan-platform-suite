function JsonBlock({ data }) {
  return (
    <pre className='max-h-80 overflow-auto rounded-2xl bg-slate-900 p-4 text-xs text-slate-100'>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ResultTable({ items = [] }) {
  return (
    <div className='overflow-hidden rounded-2xl border border-slate-200'>
      <table className='min-w-full divide-y divide-slate-200 text-sm'>
        <thead className='bg-slate-50'>
          <tr>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Route</th>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Result</th>
            <th className='px-4 py-3 text-left font-semibold text-slate-700'>Reason</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-slate-100 bg-white'>
          {items.map((item, idx) => (
            <tr key={`${item.route}-${idx}`}>
              <td className='px-4 py-3 text-slate-900'>{item.route}</td>
              <td className='px-4 py-3'>
                <span className={`badge ${item.result === 'PASS' ? 'bg-emerald-100 text-emerald-700' : item.result === 'FAIL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
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

function VisualSummary({ result }) {
  const summary = result.summary || {};
  const total = Math.max(summary.totalTests || 0, 1);
  const passPct = Math.round(((summary.passed || 0) / total) * 100);
  const failPct = Math.round(((summary.failed || 0) / total) * 100);

  return (
    <div className='grid gap-4 lg:grid-cols-3'>
      <div className='card'>
        <div className='text-sm text-slate-500'>Overall decision</div>
        <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${result.decision === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {result.decision}
        </div>
        <p className='mt-4 text-sm text-slate-600'>{result.userSummary?.result}</p>
      </div>
      <div className='card'>
        <div className='text-sm text-slate-500'>Pass rate</div>
        <div className='mt-2 text-3xl font-bold text-emerald-700'>{passPct}%</div>
        <div className='mt-4 h-3 overflow-hidden rounded-full bg-slate-100'>
          <div className='h-full rounded-full bg-emerald-500' style={{ width: `${passPct}%` }} />
        </div>
      </div>
      <div className='card'>
        <div className='text-sm text-slate-500'>Fail rate</div>
        <div className='mt-2 text-3xl font-bold text-rose-700'>{failPct}%</div>
        <div className='mt-4 h-3 overflow-hidden rounded-full bg-slate-100'>
          <div className='h-full rounded-full bg-rose-500' style={{ width: `${failPct}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function ResultPanel({ result, viewMode = 'table' }) {
  if (!result) {
    return (
      <div className='card'>
        <h3 className='text-lg font-semibold'>Agent response</h3>
        <p className='mt-2 text-sm text-slate-600'>Send a prompt to see a business-friendly summary, route-level results, and the exact input values used by the agent during evaluation.</p>
      </div>
    );
  }

  const keyFindings = result.summary?.keyFindings || [];

  return (
    <div className='space-y-6'>
      <div className='card'>
        <div className='flex items-center justify-between gap-3'>
          <h3 className='text-lg font-semibold'>User summary</h3>
          <span className={`badge ${result.decision === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {result.decision}
          </span>
        </div>
        <p className='mt-3 text-sm text-slate-700'>{result.userSummary?.overview}</p>
        <p className='mt-2 text-sm text-slate-600'>{result.userSummary?.result}</p>
        <p className='mt-2 text-sm text-slate-500'>{result.userSummary?.impact}</p>
      </div>

      {viewMode === 'visual' ? (
        <VisualSummary result={result} />
      ) : viewMode === 'list' ? (
        <div className='space-y-6'>
          <div className='card'>
            <h3 className='text-lg font-semibold'>Evaluation list</h3>
            <ul className='mt-4 space-y-3 text-sm text-slate-600'>
              {keyFindings.map((item, idx) => (
                <li key={idx} className='rounded-2xl bg-slate-50 px-4 py-3'>
                  <div className='flex items-center justify-between gap-3'>
                    <div className='font-medium text-slate-900'>{item.route}</div>
                    <span className={`badge ${item.result === 'PASS' ? 'bg-emerald-100 text-emerald-700' : item.result === 'FAIL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.result}
                    </span>
                  </div>
                  <div className='mt-2 text-slate-500'>{item.reason}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className='card'>
          <h3 className='text-lg font-semibold'>Evaluation table</h3>
          <div className='mt-4'>
            <ResultTable items={keyFindings} />
          </div>
        </div>
      )}

      <div className='grid gap-6 lg:grid-cols-2'>
        <div className='card'>
          <h3 className='text-lg font-semibold'>Summary</h3>
          <div className='mt-4 grid grid-cols-2 gap-4 text-sm'>
            <div className='rounded-2xl bg-slate-50 p-4'><div className='text-slate-500'>Total tests</div><div className='mt-1 text-2xl font-semibold'>{result.summary?.totalTests ?? '-'}</div></div>
            <div className='rounded-2xl bg-slate-50 p-4'><div className='text-slate-500'>Selected routes</div><div className='mt-1 text-2xl font-semibold'>{result.selectedRouteCount ?? '-'}</div></div>
            <div className='rounded-2xl bg-emerald-50 p-4'><div className='text-emerald-700'>Passed</div><div className='mt-1 text-2xl font-semibold text-emerald-800'>{result.summary?.passed ?? 0}</div></div>
            <div className='rounded-2xl bg-rose-50 p-4'><div className='text-rose-700'>Failed</div><div className='mt-1 text-2xl font-semibold text-rose-800'>{result.summary?.failed ?? 0}</div></div>
          </div>
        </div>

        <div className='card'>
          <h3 className='text-lg font-semibold'>Decision reasoning</h3>
          <p className='mt-3 text-sm text-slate-600'>{result.llmReasoning?.description}</p>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <div className='card'>
          <h3 className='text-lg font-semibold'>Input parameters used by the agent</h3>
          <JsonBlock data={result.testInputs} />
        </div>
        <div className='card'>
          <h3 className='text-lg font-semibold'>Execution context</h3>
          <JsonBlock data={result.executionContext} />
        </div>
      </div>

      <div className='card'>
        <h3 className='text-lg font-semibold'>Detailed execution results</h3>
        <JsonBlock data={result.results} />
      </div>
    </div>
  );
}
