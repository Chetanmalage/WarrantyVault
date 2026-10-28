import { useEffect, useState } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { date } from '../utils/format';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState('users');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');

  const load = async () => {
    const [s, u, p] = await Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/products'),
    ]);
    setStats(s.data);
    setUsers(u.data);
    setProducts(p.data);
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (u) => {
    const role = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change role of ${u.email} to "${role}"?`)) return;
    try { await api.patch(`/admin/users/${u._id}/role`, { role }); await load(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to update role'); }
  };

  const removeUser = async (u) => {
    if (!window.confirm(`Delete ${u.email} and ALL their products, services and documents?`)) return;
    try { await api.delete(`/admin/users/${u._id}`); await load(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to delete user'); }
  };

  const triggerReminders = async () => {
    setBusy(true); setFlash('');
    try {
      const { data } = await api.post('/admin/send-reminders');
      const smtpNote = data.emailConfigured ? '' : ' SMTP is not configured; previewed emails were not delivered.';
      setFlash(`Reminder run finished — ${data.emailsSent} sent, ${data.emailsPreviewed} previewed, ${data.skipped} skipped, ${data.failed} failed.${smtpNote}`);
    } catch (e) {
      setFlash(e.response?.data?.message || 'Failed to send reminders');
    } finally { setBusy(false); }
  };

  return (
    <div className="d-grid gap-4">
      <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center">
        <div>
          <h5 className="section-title mb-1">Platform overview</h5>
          <p className="text-muted small mb-0">Global stats and user management</p>
          {stats && (
            <p className="small mb-0 mt-1">
              Email delivery: <span className={`pill ${stats.emailDelivery?.configured ? 'ok' : 'warn'}`}>
                {stats.emailDelivery?.configured ? 'SMTP configured' : 'SMTP not configured'}
              </span>
            </p>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={triggerReminders} disabled={busy}>
          <i className="bi bi-send me-1" />{busy ? 'Sending…' : 'Send reminders now'}
        </button>
      </div>

      {flash && <div className="alert alert-info py-2 small mb-0">{flash}</div>}

      {stats && (
        <div className="stat-grid">
          <StatCard icon="bi-people" label="Users" value={stats.users} tone="primary" />
          <StatCard icon="bi-box-seam" label="Products" value={stats.products} tone="success" />
          <StatCard icon="bi-tools" label="Service records" value={stats.services} tone="warning" />
          <StatCard icon="bi-folder2-open" label="Documents" value={stats.documents} tone="danger" />
        </div>
      )}

      <div className="toolbar">
        <button className={`btn btn-sm ${tab === 'users' ? 'btn-primary' : 'btn-soft'}`}
          onClick={() => setTab('users')}>
          <i className="bi bi-people me-1" />Users ({users.length})
        </button>
        <button className={`btn btn-sm ${tab === 'products' ? 'btn-primary' : 'btn-soft'}`}
          onClick={() => setTab('products')}>
          <i className="bi bi-box-seam me-1" />All products ({products.length})
        </button>
      </div>

      {tab === 'users' ? (
        <div className="card-surface p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table wv-table align-middle mb-0">
              <thead>
                <tr><th>User</th><th>Role</th><th>Products</th><th>Joined</th><th /></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <strong className="d-block">{u.name}</strong>
                      <small className="text-muted">{u.email}</small>
                    </td>
                    <td>
                      <span className={`pill ${u.role === 'admin' ? 'ok' : 'muted'}`}>{u.role}</span>
                    </td>
                    <td>{u.productCount}</td>
                    <td className="small">{date(u.createdAt)}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-soft me-1" onClick={() => toggleRole(u)}>
                        {u.role === 'admin' ? 'Make user' : 'Make admin'}
                      </button>
                      <button className="btn btn-sm btn-soft danger" onClick={() => removeUser(u)}>
                        <i className="bi bi-trash3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card-surface p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table wv-table align-middle mb-0">
              <thead>
                <tr><th>Product</th><th>Owner</th><th>Category</th><th>Warranty ends</th><th>Status</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <strong className="d-block">{p.name}</strong>
                      <small className="text-muted">{p.brand || '—'}</small>
                    </td>
                    <td className="small">
                      {p.user?.name}<br />
                      <span className="text-muted">{p.user?.email}</span>
                    </td>
                    <td className="small">{p.category}</td>
                    <td className="small">{date(p.warrantyEnd)}</td>
                    <td><StatusBadge status={p.warrantyStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
