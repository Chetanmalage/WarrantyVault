import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import { date, money } from '../utils/format';
import { downloadAuthenticatedFile } from '../utils/download';

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, prod] = await Promise.all([
        api.get('/dashboard'),
        api.get('/products'),
      ]);
      setDashboard(dash.data);
      setProducts(prod.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const downloadPdf = async () => {
    setDownloadError('');
    try {
      await downloadAuthenticatedFile('/reports/products.pdf', 'warrantyvault-analytics.pdf');
    } catch (err) {
      setDownloadError(err.response?.data?.message || 'Unable to download analytics. Please try again.');
    }
  };

  if (loading) return <div className="app-loader"><div className="spinner" /></div>;
  if (error || !dashboard) {
    return (
      <div className="alert alert-danger" role="alert">
        <p className="mb-2">{error || 'Analytics could not be loaded.'}</p>
        <button className="btn btn-sm btn-soft" onClick={load}>Try again</button>
      </div>
    );
  }

  const { totals, totalProductSpend, totalServiceSpend, categoryBreakdown } = dashboard;

  return (
    <div className="d-grid gap-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="section-title mb-1">Reports & analytics</h5>
          <p className="text-muted small mb-0">Operational insight into product health, spending and warranty status.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={downloadPdf}>
          <i className="bi bi-file-earmark-pdf me-1" />Download PDF
        </button>
      </div>
      {downloadError && <div className="alert alert-danger py-2 small mb-0" role="alert">{downloadError}</div>}

      <div className="stat-grid">
        <div className="stat-card tone-primary">
          <div className="stat-icon"><i className="bi bi-box-seam" /></div>
          <div><p className="stat-label">Total products</p><h3 className="stat-value">{totals.products}</h3></div>
        </div>
        <div className="stat-card tone-success">
          <div className="stat-icon"><i className="bi bi-shield-check" /></div>
          <div><p className="stat-label">Active</p><h3 className="stat-value">{totals.active}</h3></div>
        </div>
        <div className="stat-card tone-warning">
          <div className="stat-icon"><i className="bi bi-exclamation-triangle" /></div>
          <div><p className="stat-label">Expiring soon</p><h3 className="stat-value">{totals.expiring}</h3></div>
        </div>
        <div className="stat-card tone-danger">
          <div className="stat-icon"><i className="bi bi-shield-x" /></div>
          <div><p className="stat-label">Expired</p><h3 className="stat-value">{totals.expired}</h3></div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Spending overview</h5>
            <div className="d-grid gap-3">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Purchase spend</span>
                <strong>{money(totalProductSpend)}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Service spend</span>
                <strong>{money(totalServiceSpend)}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Documents stored</span>
                <strong>{totals.documents}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Category mix</h5>
            {categoryBreakdown.length === 0 ? (
              <div className="empty-state small"><i className="bi bi-pie-chart" /><p className="mb-0">No category data yet.</p></div>
            ) : (
              <div className="d-grid gap-3">
                {categoryBreakdown.map((entry) => (
                  <div key={entry.category}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>{entry.category}</span>
                      <strong>{entry.count}</strong>
                    </div>
                    <div className="track"><span style={{ width: `${(entry.count / Math.max(...categoryBreakdown.map((item) => item.count), 1)) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-surface">
        <h5 className="section-title mb-3">Product health snapshot</h5>
        <div className="table-responsive">
          <table className="table wv-table align-middle mb-0">
            <thead>
              <tr><th>Name</th><th>Category</th><th>Expires</th><th>Status</th></tr>
            </thead>
            <tbody>
              {products.slice(0, 8).map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{date(product.warrantyEnd)}</td>
                  <td><span className={`pill ${product.warrantyStatus === 'expired' ? 'bad' : product.warrantyStatus === 'expiring' ? 'warn' : 'ok'}`}>{product.warrantyStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
