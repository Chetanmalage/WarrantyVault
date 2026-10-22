import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, refresh } = useAuth();

  const [enabled, setEnabled] = useState(user?.emailReminders ?? true);
  const [days, setDays] = useState(user?.reminderDays ?? 30);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFlash('');
    try {
      await api.put('/auth/preferences', { emailReminders: enabled, reminderDays: Number(days) });
      await refresh();
      setFlash('Preferences saved.');
    } catch (err) {
      setFlash(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-grid gap-4" style={{ maxWidth: 720 }}>
      <div>
        <h5 className="section-title mb-1">Email reminders</h5>
        <p className="text-muted small mb-0">
          We'll email you a summary when any of your product warranties are about to expire.
        </p>
      </div>

      <div className="card-surface">
        {flash && <div className="alert alert-info py-2 small">{flash}</div>}
        <form onSubmit={save} className="d-grid gap-3">
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" id="emailReminders"
              checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <label className="form-check-label" htmlFor="emailReminders">
              Send me daily warranty reminders
            </label>
          </div>

          <div>
            <label className="form-label">Notify me when warranty expires within…</label>
            <select className="form-select" style={{ maxWidth: 220 }} value={days}
              disabled={!enabled} onChange={(e) => setDays(e.target.value)}>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          <div>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save preferences'}
            </button>
          </div>
        </form>
      </div>

      <div className="card-surface">
        <h5 className="section-title mb-2">Account</h5>
        <p className="small text-muted mb-1"><strong>Name:</strong> {user?.name}</p>
        <p className="small text-muted mb-1"><strong>Email:</strong> {user?.email}</p>
        <p className="small text-muted mb-0">
          <strong>Role:</strong> <span className="pill muted">{user?.role}</span>
        </p>
      </div>
    </div>
  );
}