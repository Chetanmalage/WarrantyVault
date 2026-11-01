import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { date, daysLabel } from '../utils/format';

export default function CalendarPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load warranty calendar'))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = useMemo(
    () => [...products].filter((p) => p.warrantyEnd).sort((a, b) => new Date(a.warrantyEnd) - new Date(b.warrantyEnd)),
    [products]
  );

  if (loading) return <div className="app-loader"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="d-grid gap-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="section-title mb-1">Warranty calendar</h5>
          <p className="text-muted small mb-0">Upcoming expiries and warranty milestones.</p>
        </div>
        <Link to="/warranties/expiring" className="btn btn-soft btn-sm">View expiring list</Link>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Upcoming warranty events</h5>
            {upcoming.length === 0 ? (
              <div className="empty-state small"><i className="bi bi-calendar3" /><p className="mb-0">No warranty dates available.</p></div>
            ) : (
              <div className="d-grid gap-3">
                {upcoming.map((product) => (
                  <Link key={product._id} to={`/warranties/${product._id}`} className="expiring-row text-decoration-none">
                    <div className="min-w-0">
                      <strong className="d-block text-truncate">{product.name}</strong>
                      <small className="text-muted">{product.brand || 'No brand'} · Expires {date(product.warrantyEnd)}</small>
                    </div>
                    <span className="pill muted">{daysLabel(product.daysRemaining)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Calendar summary</h5>
            <div className="d-grid gap-3">
              <div className="stat-card tone-primary">
                <div className="stat-icon"><i className="bi bi-calendar-range" /></div>
                <div className="min-w-0">
                  <p className="stat-label">Tracked products</p>
                  <h3 className="stat-value">{products.length}</h3>
                </div>
              </div>
              <div className="stat-card tone-warning">
                <div className="stat-icon"><i className="bi bi-hourglass-split" /></div>
                <div className="min-w-0">
                  <p className="stat-label">Upcoming in 30 days</p>
                  <h3 className="stat-value">{products.filter((p) => p.daysRemaining <= 30 && p.daysRemaining >= 0).length}</h3>
                </div>
              </div>
              <div className="stat-card tone-danger">
                <div className="stat-icon"><i className="bi bi-shield-x" /></div>
                <div className="min-w-0">
                  <p className="stat-label">Expired</p>
                  <h3 className="stat-value">{products.filter((p) => p.daysRemaining < 0).length}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
