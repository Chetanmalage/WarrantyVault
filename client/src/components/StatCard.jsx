export default function StatCard({ icon, label, value, tone = 'primary', hint }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-icon"><i className={`bi ${icon}`} /></div>
      <div className="min-w-0">
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{value}</h3>
        {hint && <small className="stat-hint">{hint}</small>}
      </div>
    </div>
  );
}