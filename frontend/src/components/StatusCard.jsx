export default function StatusCard({ title, url, status, details }) {
  const tone = status === 'online'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'offline'
      ? 'bg-rose-100 text-rose-700'
      : 'bg-amber-100 text-amber-700';

  return (
    <div className='card'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h3 className='text-lg font-semibold text-slate-900'>{title}</h3>
          <p className='mt-1 break-all text-sm text-slate-500'>{url}</p>
        </div>
        <span className={`badge ${tone}`}>{status}</span>
      </div>
      <p className='mt-4 text-sm text-slate-600'>{details}</p>
    </div>
  );
}
