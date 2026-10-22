import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import StatusBadge from '../components/StatusBadge';
import { catIcon, date, daysLabel, warrantyProgress, photoUrl, reportUrl } from '../utils/format';

const CATEGORIES = ['Mobile', 'Laptop', 'TV', 'Home Appliance', 'Camera', 'Other'];

export default function Products() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [params, setParams] = useSearchParams();
  const wantsNew = params.get('new');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { search, category, status } });
      setItems(data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (wantsNew) {
      setEditing(null);
      setModalOpen(true);
      params.delete('new');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsNew]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p) => { setEditing(p); setModalOpen(true); };

  const save = async (form) => {
    setSaving(true);
    try {
      if (editing?._id) await api.put(`/products/${editing._id}`, form);
      else await api.post('/products', form);
      setModalOpen(false);
      setEditing(null);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? Its service records and documents will also be removed.`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not delete product');
    }
  };

  return (
    <div className="d-grid gap-4">
      <div className="toolbar">
        <div className="input-icon">
          <i className="bi bi-search" />
          <input className="form-control" placeholder="Search by name, brand or serial…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select toolbar-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select toolbar-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring soon</option>
          <option value="expired">Expired</option>
        </select>
        <a className="btn btn-soft ms-auto" href={reportUrl('products.pdf')} download>
          <i className="bi bi-file-earmark-pdf me-1" />Export PDF
        </a>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1" />Add Product
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="app-loader"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="card-surface empty-state">
          <i className="bi bi-box-seam" />
          <h5>No products found</h5>
          <p className="text-muted">Add your first product to start tracking its warranty.</p>
          <button className="btn btn-primary" onClick={openCreate}>Add Product</button>
        </div>
      ) : (
        <div className="product-grid">
          {items.map((p) => (
            <div className="product-card" key={p._id}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                {p.photo ? (
                  <img className="product-photo" src={photoUrl(p._id)} alt={p.name} />
                ) : (
                  <span className="product-avatar"><i className={`bi ${catIcon(p.category)}`} /></span>
                )}
                <StatusBadge status={p.warrantyStatus} />
              </div>
              <h6 className="mt-3 mb-1 text-truncate">{p.name}</h6>
              <p className="text-muted small mb-3">{p.brand || 'No brand'} · {p.category}</p>
              <div className="warranty-bar">
                <span className={`fill ${p.warrantyStatus}`} style={{ width: `${warrantyProgress(p)}%` }} />
              </div>
              <div className="d-flex justify-content-between small mt-2 mb-3">
                <span className="text-muted">Expires {date(p.warrantyEnd)}</span>
                <strong>{daysLabel(p.daysRemaining)}</strong>
              </div>
              <div className="d-flex gap-2">
                <Link to={`/products/${p._id}`} className="btn btn-sm btn-soft flex-fill">View</Link>
                <button className="btn btn-sm btn-soft" onClick={() => openEdit(p)} title="Edit">
                  <i className="bi bi-pencil" />
                </button>
                <button className="btn btn-sm btn-soft danger" onClick={() => remove(p)} title="Delete">
                  <i className="bi bi-trash3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit product' : 'Add new product'}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        wide
      >
        <ProductForm
          initial={editing}
          onSubmit={save}
          submitting={saving}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>
    </div>
  );
}