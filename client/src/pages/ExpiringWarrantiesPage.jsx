import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { date, daysLabel, money } from '../utils/format';

export default function ExpiringWarrantiesPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data.filter((p) => p.daysRemaining <= 30 && p.daysRemaining >= -365)))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load expiring warranties'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="app-loader"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="d-grid gap-4">
      <div>
        <h5 className="section-title mb-1">Expiring warranties</h5>
        <p className="text-muted small mb-0">Products with upcoming or recently expired warranty coverage.</p>
      </div>

      {products.length === 0 ? (
        <div className="card-surface empty-state">
          <i className="bi bi-hourglass-split" />
          <h5>No expiring warranties</h5>
          <p className="text-muted">Everything is comfortably covered for now.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.sort((a, b) => new Date(a.warrantyEnd) - new Date(b.warrantyEnd)).map((product) => (
            <div key={product._id} className="product-card">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="product-avatar"><i className="bi bi-shield-check" /></span>
                <span className={`pill ${product.daysRemaining < 0 ? 'bad' : product.daysRemaining <= 30 ? 'warn' : 'ok'}`}>
                  {product.daysRemaining < 0 ? 'Expired' : product.daysRemaining <= 30 ? 'Expiring' : 'Active'}
                </span>
              </div>
              <h6 className="mt-3 mb-1 text-truncate">{product.name}</h6>
              <p className="text-muted small mb-2">{product.brand || 'No brand'} · {product.category}</p>
              <p className="small mb-2"><strong>Expires:</strong> {date(product.warrantyEnd)}</p>
              <p className="small mb-3"><strong>Status:</strong> {daysLabel(product.daysRemaining)}</p>
              <div className="d-flex gap-2">
                <Link to={`/warranties/${product._id}`} className="btn btn-soft flex-fill btn-sm">View details</Link>
                <Link to={`/products/${product._id}`} className="btn btn-soft btn-sm">Open</Link>
              </div>
              <div className="mt-3 small text-muted">Purchase value: {money(product.purchasePrice)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
