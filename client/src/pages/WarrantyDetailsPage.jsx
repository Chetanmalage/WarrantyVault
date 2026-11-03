import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { date, daysLabel, money } from '../utils/format';

export default function WarrantyDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data.product || data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load warranty details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="app-loader"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!product) return <div className="alert alert-warning">Warranty not found.</div>;

  return (
    <div className="d-grid gap-4">
      <Link to="/warranties/expiring" className="small text-decoration-none fw-semibold">
        <i className="bi bi-arrow-left me-1" />Back to warranty views
      </Link>

      <div className="card-surface">
        <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <div>
            <h5 className="section-title mb-1">Warranty details</h5>
            <p className="text-muted small mb-0">Coverage summary for {product.name}</p>
          </div>
          <StatusBadge status={product.warrantyStatus} />
        </div>

        <div className="row g-4 mt-1">
          <div className="col-md-3"><p className="detail-label">Product</p><p className="detail-value">{product.name}</p></div>
          <div className="col-md-3"><p className="detail-label">Brand</p><p className="detail-value">{product.brand || '—'}</p></div>
          <div className="col-md-3"><p className="detail-label">Category</p><p className="detail-value">{product.category}</p></div>
          <div className="col-md-3"><p className="detail-label">Serial</p><p className="detail-value">{product.serialNumber || '—'}</p></div>
          <div className="col-md-3"><p className="detail-label">Purchase date</p><p className="detail-value">{date(product.purchaseDate)}</p></div>
          <div className="col-md-3"><p className="detail-label">Purchase price</p><p className="detail-value">{money(product.purchasePrice)}</p></div>
          <div className="col-md-3"><p className="detail-label">Warranty start</p><p className="detail-value">{date(product.warrantyStart)}</p></div>
          <div className="col-md-3"><p className="detail-label">Warranty end</p><p className="detail-value">{date(product.warrantyEnd)}</p></div>
        </div>

        <div className="note-box mt-3">
          <p className="mb-1"><strong>Coverage status:</strong> {daysLabel(product.daysRemaining)}</p>
          <p className="mb-0"><strong>Provider:</strong> {product.warrantyProvider || 'Not specified'}</p>
        </div>
      </div>

      <div className="card-surface">
        <h5 className="section-title mb-3">Coverage notes</h5>
        <p className="mb-0 text-muted">{product.coverageDetails || 'No additional warranty coverage details were provided for this product.'}</p>
      </div>
    </div>
  );
}