import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { date, money } from '../utils/format';

export default function Services() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/services');
      setItems(data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load service records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this service record?')) return;
    try { await api.delete(`/services/${id}`); load(); }
    catch (e) { alert(e.response?.data?.message || 'Could not delete record'); }
  };

  const total = items.reduce((s, r) => s + (r.cost || 0), 0);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (loading) return <div className="app-loader"><div className="spinner" /></div>;

  return (
    <div className="d-grid gap-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <h5 className="section-title mb-1">All service records</h5>
          <p className="text-muted small mb-0">{items.length} records · total spend {money(total)}</p>
        </div>
        <Link to="/products" className="btn btn-soft btn-sm">
          <i className="bi bi-plus-lg me-1" />Add via product page
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card-surface empty-state">
          <i className="bi bi-tools" />
          <h5>No service records yet</h5>
          <p className="text-muted">Open a product and add its first repair or maintenance record.</p>
          <Link to="/products" className="btn btn-primary">Go to products</Link>
        </div>
      ) : (
        <div className="card-surface p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table wv-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Product</th><th>Type</th><th>Date</th><th>Description</th>
                  <th className="text-end">Cost</th><th />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <Link to={`/products/${r.product?._id}`} className="fw-semibold text-decoration-none">
                        {r.product?.name || 'Deleted product'}
                      </Link>
                      <div className="small text-muted">{r.product?.brand || '—'}</div>
                    </td>
                    <td><span className="pill muted">{r.serviceType}</span></td>
                    <td className="small">{date(r.serviceDate)}</td>
                    <td className="small text-muted" style={{ maxWidth: 260 }}>{r.description}</td>
                    <td className="text-end fw-semibold">{money(r.cost)}</td>
                    <td className="text-end">
                      <button className="icon-btn danger" onClick={() => remove(r._id)} title="Delete">
                        <i className="bi bi-trash3" />
                      </button>
                    </td>
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