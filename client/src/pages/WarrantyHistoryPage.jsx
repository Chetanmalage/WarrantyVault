import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { date, daysLabel } from '../utils/format';

export default function WarrantyHistoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data.filter((p) => p.daysRemaining < 0)))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load warranty history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="app-loader"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="d-grid gap-4">
      <div>
        <h5 className="section-title mb-1">Warranty history</h5>
        <p className="text-muted small mb-0">Archived expiry timelines for products that have already reached warranty end.</p>
      </div>

      {products.length === 0 ? (
        <div className="card-surface empty-state">
          <i className="bi bi-clock-history" />
          <h5>No expired warranty records</h5>
          <p className="text-muted">Your warranty history will appear here as products complete their coverage term.</p>
        </div>
      ) : (
        <div className="card-surface p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table wv-table align-middle mb-0">
              <thead>
                <tr><th>Product</th><th>Category</th><th>Warranty ended</th><th>Duration</th><th>Status</th></tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <strong>{product.name}</strong><br />
                      <small className="text-muted">{product.brand || 'No brand'}</small>
                    </td>
                    <td>{product.category}</td>
                    <td>{date(product.warrantyEnd)}</td>
                    <td>{daysLabel(product.daysRemaining)}</td>
                    <td><span className="pill bad">Expired</span></td>
                    <td className="text-end"><Link to={`/warranties/${product._id}`} className="btn btn-sm btn-soft">Open</Link></td>
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
