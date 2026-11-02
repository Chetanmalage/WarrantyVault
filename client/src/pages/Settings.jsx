import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, refresh } = useAuth();

  const [enabled, setEnabled] = useState(user?.emailReminders ?? true);
  const [days, setDays] = useState(user?.reminderDays ?? 30);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');
  const [flashType, setFlashType] = useState('success');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFlash('');
    try {
      await api.put('/auth/preferences', { emailReminders: enabled, reminderDays: Number(days) });
      await refresh();
      setFlashType('success');
      setFlash('Preferences saved.');
    } catch (err) {
      setFlashType('danger');
      setFlash(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-grid gap-4" style={{ maxWidth: 720 }}>
      <div>
        <span className="public-eyebrow">YOUR ACCOUNT</span>
        <h5 className="section-title mt-2 mb-1">Email reminders</h5>
        <p className="text-muted small mb-0">
          Get a thoughtful heads-up before a warranty expires. Choose the timing that works for you.
        </p>
      </div>

      <div className="card-surface">
        <div className="d-flex align-items-start gap-3 mb-4">
          <span className="settings-mail-icon"><i className="bi bi-envelope-paper" /></span>
          <div>
            <h6 className="section-title mb-1">Stay ahead of expiry dates</h6>
            <p className="small text-muted mb-0">We send one reminder when a product enters your chosen window—not a daily repeat for the same expiry.</p>
          </div>
        </div>
        {flash && <div className={`alert alert-${flashType} py-2 small`} role="status">{flash}</div>}
        <form onSubmit={save} className="d-grid gap-3">
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" id="emailReminders"
              checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <label className="form-check-label fw-semibold" htmlFor="emailReminders">Email me warranty reminders</label>
            <div className="small text-muted ms-5">You can turn email reminders on or off whenever you like.</div>
          </div>

          <div>
            <label className="form-label" htmlFor="reminderDays">Remind me before expiry</label>
            <select className="form-select" style={{ maxWidth: 220 }} value={days}
              id="reminderDays"
              disabled={!enabled} onChange={(e) => setDays(e.target.value)}>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          <div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
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
