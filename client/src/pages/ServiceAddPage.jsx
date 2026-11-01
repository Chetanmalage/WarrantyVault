import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const empty = {
  product: '',
  serviceType: 'Repair',
  serviceDate: new Date().toISOString().slice(0, 10),
  description: '',
  serviceCenter: '',
  cost: '',
};

export default function ServiceAddPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/products').then(({ data }) => setProducts(data)).catch(() => setProducts([]));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/services', { ...form, product: form.product });
      navigate('/services');
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to save service record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-surface">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="section-title mb-1">Add service record</h5>
          <p className="text-muted small mb-0">Log maintenance, repairs or inspection work against a product.</p>
        </div>
      </div>

      <form onSubmit={submit} className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Product *</label>
          <select className="form-select" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required>
            <option value="">Choose a product</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>{product.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Service type</label>
          <select className="form-select" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
            <option>Repair</option>
            <option>Maintenance</option>
            <option>Replacement</option>
            <option>Inspection</option>
            <option>Other</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Service date *</label>
          <input type="date" className="form-control" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Cost</label>
          <input type="number" min="0" className="form-control" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        </div>
        <div className="col-12">
          <label className="form-label">Description *</label>
          <textarea className="form-control" rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Describe the repair, maintenance task or inspection performed." />
        </div>
        <div className="col-12">
          <label className="form-label">Service center</label>
          <input className="form-control" value={form.serviceCenter} onChange={(e) => setForm({ ...form, serviceCenter: e.target.value })} placeholder="Authorized service center or workshop" />
        </div>

        <div className="col-12 d-flex justify-content-end gap-2 pt-2">
          <button type="button" className="btn btn-soft" onClick={() => navigate('/services')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Record'}</button>
        </div>
      </form>
    </div>
  );
}
