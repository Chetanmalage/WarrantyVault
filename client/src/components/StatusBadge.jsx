import { statusMeta } from '../utils/format';

export default function StatusBadge({ status }) {
  const m = statusMeta(status);
  return (
    <span className={`pill ${m.cls}`}>
      <i className={`bi ${m.icon}`} />
      {m.label}
    </span>
  );
}