import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { date, daysLabel } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => {
        const reminderDays = user?.reminderDays ?? 30;
        setProducts(data.filter((p) => p.daysRemaining <= reminderDays && p.daysRemaining >= -30));
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load warranty alerts'))
      .finally(() => setLoading(false));
  }, [user?.reminderDays]);

  if (loading) return <div className="app-loader"><div className="spinner" /></div>;

  return (
    <div className="d-grid gap-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="section-title mb-1">Warranty alerts</h5>
          <p className="text-muted small mb-0">Upcoming expirations and recently expired coverage, all in one place.</p>
        </div>
        <Link to="/settings" className="btn btn-soft btn-sm"><i className="bi bi-sliders me-1" />Manage reminders</Link>
      </div>

      {error && <div className="alert alert-danger mb-0" role="alert">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card-surface h-100">
            <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
              <h5 className="section-title mb-0">Products to keep an eye on</h5>
              <span className="pill muted">Next {user?.reminderDays ?? 30} days</span>
            </div>
            {products.length === 0 ? (
              <div className="empty-state small">
                <i className="bi bi-shield-check" />
                <p className="mb-0">{error ? 'Alerts could not be loaded.' : 'You’re all caught up. No warranties need attention right now.'}</p>
              </div>
            ) : (
              <div className="d-grid gap-3">
                {products.map((product) => (
                  <Link key={product._id} to={`/products/${product._id}`} className="expiring-row text-decoration-none">
                    <div className="min-w-0">
                      <strong className="d-block text-truncate">{product.name}</strong>
                      <small className="text-muted">{product.brand || 'No brand'} · expires {date(product.warrantyEnd)}</small>
                    </div>
                    <span className={`pill ${product.daysRemaining < 0 ? 'bad' : 'warn'}`}>{daysLabel(product.daysRemaining)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Your reminder setup</h5>
            <div className="d-grid gap-3">
              <div className="note-box">
                <strong><i className={`bi ${user?.emailReminders === false ? 'bi-envelope-slash' : 'bi-envelope-check'} me-2`} />Email reminders</strong>
                <p className="mb-0 small text-muted">
                  {user?.emailReminders === false
                    ? 'Email reminders are turned off.'
                    : `Email reminders are on for warranties expiring within ${user?.reminderDays ?? 30} days.`}
                </p>
              </div>
              <div className="note-box">
                <strong><i className="bi bi-calendar-check me-2" />A useful heads-up</strong>
                <p className="mb-0 small text-muted">We send one reminder per product and expiry date, not the same email every day.</p>
              </div>
              <div className="note-box">
                <Link to="/settings" className="small fw-semibold text-decoration-none">Choose when you hear from us <i className="bi bi-arrow-right ms-1" /></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
