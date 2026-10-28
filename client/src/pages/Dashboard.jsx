import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { date, daysLabel, money } from '../utils/format';
import { downloadAuthenticatedFile } from '../utils/download';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const downloadReport = async () => {
    try { await downloadAuthenticatedFile('/reports/products.pdf', 'warrantyvault-report.pdf'); }
    catch (e) { alert(e.response?.data?.message || 'Could not download report'); }
  };

  useEffect(() => {
    api.get('/dashboard')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="app-loader"><div className="spinner" /></div>;

  const { totals, expiringSoon, recentProducts, categoryBreakdown, monthlyServiceSpend } = data;
  const maxSpend = Math.max(...monthlyServiceSpend.map((m) => m.total), 1);
  const maxCat = Math.max(...categoryBreakdown.map((c) => c.count), 1);

  return (
    <div className="d-grid gap-4">
      <div className="stat-grid">
        <StatCard icon="bi-box-seam" label="Total products" value={totals.products} tone="primary"
          hint={`${money(data.totalProductSpend)} purchase value`} />
        <StatCard icon="bi-shield-check" label="Active warranties" value={totals.active} tone="success" />
        <StatCard icon="bi-exclamation-triangle" label="Expiring soon" value={totals.expiring} tone="warning"
          hint="Within the next 30 days" />
        <StatCard icon="bi-shield-x" label="Expired" value={totals.expired} tone="danger"
          hint={`${money(data.totalServiceSpend)} spent on service`} />
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card-surface h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="section-title mb-0">Warranties expiring soon</h5>
              <Link to="/products" className="small text-decoration-none fw-semibold">View all</Link>
            </div>
            {expiringSoon.length === 0 ? (
              <div className="empty-state small">
                <i className="bi bi-emoji-smile" />
                <p className="mb-0">Nothing expiring in the next 30 days. You're all set!</p>
              </div>
            ) : (
              <div className="d-grid gap-3">
                {expiringSoon.map((p) => (
                  <Link to={`/products/${p._id}`} key={p._id} className="expiring-row text-decoration-none">
                    <div className="min-w-0">
                      <strong className="d-block text-truncate">{p.name}</strong>
                      <small className="text-muted">{p.brand || 'No brand'} · expires {date(p.warrantyEnd)}</small>
                    </div>
                    <span className="pill warn">{daysLabel(p.daysRemaining)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Products by category</h5>
            {categoryBreakdown.length === 0 ? (
              <div className="empty-state small"><i className="bi bi-pie-chart" /><p className="mb-0">No products yet.</p></div>
            ) : (
              <div className="d-grid gap-3">
                {categoryBreakdown.map((c) => (
                  <div key={c.category}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>{c.category}</span>
                      <strong>{c.count}</strong>
                    </div>
                    <div className="track"><span style={{ width: `${(c.count / maxCat) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Recent products</h5>
            {recentProducts.length === 0 ? (
              <div className="empty-state small">
                <i className="bi bi-box" />
                <p className="mb-2">You haven't added any products yet.</p>
                <Link to="/products?new=1" className="btn btn-primary btn-sm">Add your first product</Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle wv-table mb-0">
                  <thead>
                    <tr><th>Product</th><th>Expiry</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {recentProducts.map((p) => (
                      <tr key={p._id}>
                        <td>
                          <Link to={`/products/${p._id}`} className="fw-semibold text-decoration-none">{p.name}</Link>
                          <div className="small text-muted">{p.category}</div>
                        </td>
                        <td className="small">{date(p.warrantyEnd)}</td>
                        <td><StatusBadge status={p.warrantyStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card-surface h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="section-title mb-0">Service spend</h5>
              <span className="pill ok">{money(data.totalServiceSpend)}</span>
            </div>
            {monthlyServiceSpend.length === 0 ? (
              <div className="empty-state small"><i className="bi bi-cash-coin" /><p className="mb-0">No service records yet.</p></div>
            ) : (
              <div className="bar-chart">
                {monthlyServiceSpend.map((m) => (
                  <div className="bar-col" key={m.month}>
                    <span className="bar" style={{ height: `${Math.max(8, (m.total / maxSpend) * 100)}%` }} title={money(m.total)} />
                    <small>{m.month.slice(5)}</small>
                  </div>
                ))}
              </div>
            )}
            <p className="small text-muted mt-3 mb-0">
              {totals.serviceRecords} service records · {totals.documents} documents stored
            </p>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end">
        <button className="btn btn-soft btn-sm" onClick={downloadReport}>
          <i className="bi bi-file-earmark-pdf me-1" />Download full report (PDF)
        </button>
      </div>
    </div>
  );
}
