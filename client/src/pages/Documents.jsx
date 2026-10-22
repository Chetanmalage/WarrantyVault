import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_ORIGIN } from '../api/axios';
import { date } from '../utils/format';

export default function Documents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('wv_token');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents');
      setItems(data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try { await api.delete(`/documents/${id}`); load(); }
    catch (e) { alert(e.response?.data?.message || 'Could not delete document'); }
  };

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (loading) return <div className="app-loader"><div className="spinner" /></div>;

  return (
    <div className="d-grid gap-4">
      <div>
        <h5 className="section-title mb-1">Document vault</h5>
        <p className="text-muted small mb-0">{items.length} files stored · invoices, warranty cards and receipts</p>
      </div>

      {items.length === 0 ? (
        <div className="card-surface empty-state">
          <i className="bi bi-folder2-open" />
          <h5>No documents yet</h5>
          <p className="text-muted">Upload invoices or warranty cards from a product's detail page.</p>
          <Link to="/products" className="btn btn-primary">Go to products</Link>
        </div>
      ) : (
        <div className="doc-grid">
          {items.map((d) => (
            <div className="product-card" key={d._id}>
              <div className="d-flex justify-content-between align-items-start">
                <span className="product-avatar">
                  <i className={`bi ${d.mimeType === 'application/pdf' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-image'}`} />
                </span>
                <span className="pill muted">{d.docType}</span>
              </div>
              <h6 className="mt-3 mb-1 text-truncate">{d.title}</h6>
              <p className="small text-muted mb-3">
                {d.product?.name || 'Deleted product'} · {(d.size / 1024).toFixed(0)} KB · {date(d.createdAt)}
              </p>
              <div className="d-flex gap-2">
                <a className="btn btn-sm btn-soft flex-fill"
                  href={`${API_ORIGIN}/api/documents/${d._id}/file?token=${token}`}
                  target="_blank" rel="noreferrer">
                  <i className="bi bi-download me-1" />Open
                </a>
                <button className="btn btn-sm btn-soft danger" onClick={() => remove(d._id)}>
                  <i className="bi bi-trash3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}