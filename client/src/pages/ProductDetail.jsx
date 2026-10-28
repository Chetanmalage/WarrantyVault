import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import StatusBadge from '../components/StatusBadge';
import { date, daysLabel, money, warrantyProgress } from '../utils/format';
import { downloadAuthenticatedFile } from '../utils/download';

const emptyService = {
  serviceType: 'Repair',
  serviceDate: new Date().toISOString().slice(0, 10),
  description: '',
  serviceCenter: '',
  cost: '',
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [serviceBusy, setServiceBusy] = useState(false);

  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('Invoice');
  const [docFile, setDocFile] = useState(null);
  const [docBusy, setDocBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setData(data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load product');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="card-surface empty-state">
        <i className="bi bi-exclamation-triangle" />
        <h5>{error}</h5>
        <Link to="/products" className="btn btn-primary mt-2">Back to products</Link>
      </div>
    );
  }

  if (!data) return <div className="app-loader"><div className="spinner" /></div>;

  const { product, services, documents } = data;

  const saveProduct = async (form) => {
    setSaving(true);
    try {
      await api.put(`/products/${product._id}`, form);
      setEditOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not update product');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!window.confirm(`Delete "${product.name}" and all its records?`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      navigate('/products');
    } catch (e) {
      alert(e.response?.data?.message || 'Could not delete product');
    }
  };

  const addService = async (e) => {
    e.preventDefault();
    setServiceBusy(true);
    try {
      await api.post('/services', { ...serviceForm, product: product._id });
      setServiceOpen(false);
      setServiceForm(emptyService);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save service record');
    } finally {
      setServiceBusy(false);
    }
  };

  const deleteService = async (sid) => {
    if (!window.confirm('Delete this service record?')) return;
    try {
      await api.delete(`/services/${sid}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not delete record');
    }
  };

  const uploadDoc = async (e) => {
    e.preventDefault();
    if (!docFile) return alert('Please choose a file');
    const fd = new FormData();
    fd.append('file', docFile);
    fd.append('product', product._id);
    fd.append('title', docTitle || docFile.name);
    fd.append('docType', docType);

    setDocBusy(true);
    try {
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDocTitle('');
      setDocFile(null);
      e.target.reset();
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setDocBusy(false);
    }
  };

  const deleteDoc = async (did) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${did}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not delete document');
    }
  };

  const downloadDoc = async (doc) => {
    try { await downloadAuthenticatedFile(`/documents/${doc._id}/file`, doc.fileName || doc.title); }
    catch (e) { alert(e.response?.data?.message || 'Could not download document'); }
  };

  return (
    <div className="d-grid gap-4">
      <Link to="/products" className="small text-decoration-none fw-semibold">
        <i className="bi bi-arrow-left me-1" />Back to products
      </Link>

      {/* Header card */}
      <div className="card-surface">
        <div className="d-flex flex-wrap justify-content-between gap-3">
          <div className="min-w-0">
            <div className="d-flex align-items-center gap-2 mb-2">
              <h3 className="mb-0 text-truncate">{product.name}</h3>
              <StatusBadge status={product.warrantyStatus} />
            </div>
            <p className="text-muted mb-0">
              {product.brand || 'No brand'} · {product.category}
              {product.serialNumber ? ` · SN ${product.serialNumber}` : ''}
            </p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-soft btn-sm" onClick={() => setEditOpen(true)}>
              <i className="bi bi-pencil me-1" />Edit
            </button>
            <button className="btn btn-soft btn-sm danger" onClick={deleteProduct}>
              <i className="bi bi-trash3 me-1" />Delete
            </button>
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className="col-sm-6 col-lg-3">
            <p className="detail-label">Purchase date</p>
            <p className="detail-value">{date(product.purchaseDate)}</p>
          </div>
          <div className="col-sm-6 col-lg-3">
            <p className="detail-label">Purchase price</p>
            <p className="detail-value">{money(product.purchasePrice)}</p>
          </div>
          <div className="col-sm-6 col-lg-3">
            <p className="detail-label">Warranty period</p>
            <p className="detail-value">{date(product.warrantyStart)} → {date(product.warrantyEnd)}</p>
          </div>
          <div className="col-sm-6 col-lg-3">
            <p className="detail-label">Remaining</p>
            <p className="detail-value">{daysLabel(product.daysRemaining)}</p>
          </div>
        </div>

        <div className="warranty-bar mt-3">
          <span className={`fill ${product.warrantyStatus}`} style={{ width: `${warrantyProgress(product)}%` }} />
        </div>

        {(product.warrantyProvider || product.coverageDetails) && (
          <div className="note-box mt-3">
            {product.warrantyProvider && <p className="mb-1 small"><strong>Provider:</strong> {product.warrantyProvider}</p>}
            {product.coverageDetails && <p className="mb-0 small"><strong>Coverage:</strong> {product.coverageDetails}</p>}
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* Service records */}
        <div className="col-lg-7">
          <div className="card-surface h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="section-title mb-0">Service & repair records</h5>
              <button className="btn btn-primary btn-sm" onClick={() => setServiceOpen(true)}>
                <i className="bi bi-plus-lg me-1" />Add record
              </button>
            </div>

            {services.length === 0 ? (
              <div className="empty-state small"><i className="bi bi-tools" /><p className="mb-0">No service records yet.</p></div>
            ) : (
              <div className="timeline">
                {services.map((s) => (
                  <div className="timeline-item" key={s._id}>
                    <span className="dot" />
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between gap-2">
                        <strong className="small">{s.serviceType} · {date(s.serviceDate)}</strong>
                        <span className="pill muted">{money(s.cost)}</span>
                      </div>
                      <p className="small text-muted mb-1">{s.description}</p>
                      {s.serviceCenter && <small className="text-muted"><i className="bi bi-geo-alt me-1" />{s.serviceCenter}</small>}
                    </div>
                    <button className="icon-btn danger" onClick={() => deleteService(s._id)} title="Delete">
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="col-lg-5">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Documents</h5>

            <form onSubmit={uploadDoc} className="d-grid gap-2 mb-3">
              <input className="form-control form-control-sm" placeholder="Document title (optional)"
                value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
              <div className="d-flex gap-2">
                <select className="form-select form-select-sm" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option>Invoice</option>
                  <option>Warranty Card</option>
                  <option>Receipt</option>
                  <option>Other</option>
                </select>
                <input type="file" className="form-control form-control-sm" accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setDocFile(e.target.files[0])} />
              </div>
              <button className="btn btn-primary btn-sm" disabled={docBusy}>
                {docBusy ? 'Uploading...' : 'Upload document'}
              </button>
            </form>

            {documents.length === 0 ? (
              <div className="empty-state small"><i className="bi bi-folder2-open" /><p className="mb-0">No documents uploaded.</p></div>
            ) : (
              <div className="d-grid gap-2">
                {documents.map((d) => (
                  <div className="doc-row" key={d._id}>
                    <span className="doc-icon">
                      <i className={`bi ${d.mimeType === 'application/pdf' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-image'}`} />
                    </span>
                    <div className="flex-grow-1 min-w-0">
                      <strong className="small d-block text-truncate">{d.title}</strong>
                      <small className="text-muted">{d.docType} · {(d.size / 1024).toFixed(0)} KB</small>
                    </div>
                    <button type="button" className="icon-btn" title="Download" onClick={() => downloadDoc(d)}>
                      <i className="bi bi-download" />
                    </button>
                    <button className="icon-btn danger" title="Delete" onClick={() => deleteDoc(d._id)}>
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit product modal */}
      <Modal open={editOpen} title="Edit product" onClose={() => setEditOpen(false)} wide>
        <ProductForm initial={product} onSubmit={saveProduct} submitting={saving} onCancel={() => setEditOpen(false)} />
      </Modal>

      {/* Add service modal */}
      <Modal open={serviceOpen} title="Add service record" onClose={() => setServiceOpen(false)}>
        <form onSubmit={addService} className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Service type</label>
            <select className="form-select" value={serviceForm.serviceType}
              onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value })}>
              <option>Repair</option><option>Maintenance</option><option>Replacement</option>
              <option>Inspection</option><option>Other</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Service date *</label>
            <input type="date" className="form-control" required value={serviceForm.serviceDate}
              onChange={(e) => setServiceForm({ ...serviceForm, serviceDate: e.target.value })} />
          </div>
          <div className="col-12">
            <label className="form-label">Description *</label>
            <textarea className="form-control" rows="2" required value={serviceForm.description}
              placeholder="Screen replaced under warranty"
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Service center</label>
            <input className="form-control" value={serviceForm.serviceCenter}
              onChange={(e) => setServiceForm({ ...serviceForm, serviceCenter: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Cost</label>
            <input type="number" min="0" className="form-control" value={serviceForm.cost}
              onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })} />
          </div>
          <div className="col-12 d-flex justify-content-end gap-2 pt-2">
            <button type="button" className="btn btn-light" onClick={() => setServiceOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={serviceBusy}>
              {serviceBusy ? 'Saving...' : 'Save record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
