import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="brand brand-light">
          <span className="brand-mark"><i className="bi bi-shield-check" /></span>
          <div>
            <strong>WarrantyVault</strong>
            <small>Digital warranty manager</small>
          </div>
        </div>

        <div className="auth-hero">
          <h2>Every warranty.<br />Every invoice.<br />One vault.</h2>
          <p>Track product warranties, store invoices and keep your repair history in a single secure place.</p>
          <ul className="auth-features">
            <li><i className="bi bi-shield-check" /> Warranty expiry tracking</li>
            <li><i className="bi bi-receipt" /> Invoice & certificate storage</li>
            <li><i className="bi bi-tools" /> Service and repair history</li>
            <li><i className="bi bi-graph-up-arrow" /> Expense summaries</li>
          </ul>
        </div>

        <small className="auth-copy">© {new Date().getFullYear()} WarrantyVault. Built with the MERN stack.</small>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <h3>{isLogin ? 'Welcome back' : 'Create your account'}</h3>
          <p className="text-muted mb-4">
            {isLogin ? 'Log in to access your warranty vault.' : 'Start organizing your warranties in seconds.'}
          </p>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={submit} className="d-grid gap-3">
            {!isLogin && (
              <div>
                <label className="form-label">Full name</label>
                <input className="form-control" value={form.name} onChange={set('name')} required placeholder="Your name" />
              </div>
            )}
            <div>
              <label className="form-label">Email address</label>
              <input type="email" className="form-control" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={form.password} onChange={set('password')} required minLength={6} placeholder="At least 6 characters" />
            </div>
            <button className="btn btn-primary w-100 py-2 mt-1" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-muted small mt-4 mb-0">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin ? '/register' : '/login'} className="fw-semibold text-decoration-none">
              {isLogin ? 'Sign up' : 'Log in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}