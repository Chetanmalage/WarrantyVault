import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { date, daysLabel } from '../utils/format';

export default function NotificationsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data.filter((p) => p.daysRemaining <= 30 && p.daysRemaining >= -30)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="app-loader"><div className="spinner" /></div>;

  return (
    <div className="d-grid gap-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="section-title mb-1">Notifications center</h5>
          <p className="text-muted small mb-0">Expiry reminders, alert summaries and policy updates.</p>
        </div>
        <Link to="/profile" className="btn btn-soft btn-sm">Manage preferences</Link>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Recent reminders</h5>
            {products.length === 0 ? (
              <div className="empty-state small"><i className="bi bi-bell" /><p className="mb-0">No warning notifications at the moment.</p></div>
            ) : (
              <div className="d-grid gap-3">
                {products.map((product) => (
                  <div key={product._id} className="expiring-row">
                    <div className="min-w-0">
                      <strong className="d-block text-truncate">{product.name}</strong>
                      <small className="text-muted">{product.brand || 'No brand'} · expires {date(product.warrantyEnd)}</small>
                    </div>
                    <span className={`pill ${product.daysRemaining < 0 ? 'bad' : 'warn'}`}>{daysLabel(product.daysRemaining)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Alert channels</h5>
            <div className="d-grid gap-3">
              <div className="note-box">
                <strong>Email reminders</strong>
                <p className="mb-0 small text-muted">Enabled for products expiring in the next 30 days.</p>
              </div>
              <div className="note-box">
                <strong>Reminder cadence</strong>
                <p className="mb-0 small text-muted">Daily digest sent for active warranty coverage windows.</p>
              </div>
              <div className="note-box">
                <strong>Duplicate protection</strong>
                <p className="mb-0 small text-muted">The system avoids repeated reminders for the same product window.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
