import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ emailReminders: true, reminderDays: 30 });

  useEffect(() => {
    if (user) {
      setForm({
        emailReminders: user.emailReminders ?? true,
        reminderDays: user.reminderDays ?? 30,
      });
    }
  }, [user]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/auth/preferences', form);
      await refresh();
      setSaved(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-grid gap-4">
      <div className="card-surface">
        <h5 className="section-title mb-3">User profile</h5>
        <div className="row g-4">
          <div className="col-md-6">
            <p className="detail-label">Full name</p>
            <p className="detail-value">{user?.name}</p>
          </div>
          <div className="col-md-6">
            <p className="detail-label">Email</p>
            <p className="detail-value">{user?.email}</p>
          </div>
          <div className="col-md-6">
            <p className="detail-label">Role</p>
            <p className="detail-value">{user?.role || 'user'}</p>
          </div>
          <div className="col-md-6">
            <p className="detail-label">Account created</p>
            <p className="detail-value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      </div>

      <div className="card-surface">
        <h5 className="section-title mb-3">Account settings</h5>
        <form onSubmit={save} className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Reminder email alerts</label>
            <select className="form-select" value={form.emailReminders ? 'true' : 'false'} onChange={(e) => setForm({ ...form, emailReminders: e.target.value === 'true' })}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Reminder window (days)</label>
            <input type="number" min="1" max="90" className="form-control" value={form.reminderDays} onChange={(e) => setForm({ ...form, reminderDays: Number(e.target.value) })} />
          </div>
          <div className="col-12 d-flex justify-content-end">
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save preferences'}</button>
          </div>
          {saved && <div className="col-12"><div className="alert alert-success py-2 mb-0">Preferences updated.</div></div>}
        </form>
      </div>
    </div>
  );
}
