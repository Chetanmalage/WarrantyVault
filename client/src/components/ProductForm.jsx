import { useState } from 'react';
import { dateInputValue } from '../utils/format';

const CATEGORIES = ['Mobile', 'Laptop', 'TV', 'Home Appliance', 'Camera', 'Other'];

const empty = {
  name: '', brand: '', category: 'Mobile', purchaseDate: '', purchasePrice: '',
  invoiceNumber: '', store: '', serialNumber: '', warrantyStart: '', warrantyEnd: '',
  warrantyProvider: '', coverageDetails: '',
};

const addYear = (d) => {
  if (!d) return '';
  const [year, month, day] = d.split('-').map(Number);
  const dt = new Date(year, month - 1, day, 12);
  dt.setFullYear(dt.getFullYear() + 1);
  return dateInputValue(dt);
};

export default function ProductForm({ initial, onSubmit, submitting, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...empty,
    ...initial,
    purchaseDate: dateInputValue(initial?.purchaseDate),
    warrantyStart: dateInputValue(initial?.warrantyStart),
    warrantyEnd: dateInputValue(initial?.warrantyEnd),
  }));

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [k]: value };
      if (k === 'purchaseDate') {
        if (!prev.warrantyStart) next.warrantyStart = value;
        if (!prev.warrantyEnd) next.warrantyEnd = addYear(value);
      }
      return next;
    });
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="row g-3">
      <div className="col-md-6">
        <label className="form-label">Product name *</label>
        <input className="form-control" value={form.name} onChange={set('name')} required placeholder="e.g. iPhone 14" />
      </div>
      <div className="col-md-6">
        <label className="form-label">Brand</label>
        <input className="form-control" value={form.brand} onChange={set('brand')} placeholder="e.g. Apple" />
      </div>
      <div className="col-md-6">
        <label className="form-label">Category</label>
        <select className="form-select" value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Serial number</label>
        <input className="form-control" value={form.serialNumber} onChange={set('serialNumber')} />
      </div>
      <div className="col-md-4">
        <label className="form-label">Purchase date *</label>
        <input type="date" className="form-control" value={form.purchaseDate} onChange={set('purchaseDate')} required />
      </div>
      <div className="col-md-4">
        <label className="form-label">Purchase price</label>
        <input type="number" min="0" className="form-control" value={form.purchasePrice} onChange={set('purchasePrice')} />
      </div>
      <div className="col-md-4">
        <label className="form-label">Invoice number</label>
        <input className="form-control" value={form.invoiceNumber} onChange={set('invoiceNumber')} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Store / seller</label>
        <input className="form-control" value={form.store} onChange={set('store')} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Warranty provider</label>
        <input className="form-control" value={form.warrantyProvider} onChange={set('warrantyProvider')} placeholder="e.g. Apple India" />
      </div>
      <div className="col-md-6">
        <label className="form-label">Warranty start</label>
        <input type="date" className="form-control" value={form.warrantyStart} onChange={set('warrantyStart')} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Warranty expiry *</label>
        <input type="date" className="form-control" value={form.warrantyEnd}
          min={form.warrantyStart || form.purchaseDate || undefined} onChange={set('warrantyEnd')} required />
      </div>
      <div className="col-12">
        <label className="form-label">Coverage details</label>
        <textarea className="form-control" rows="2" value={form.coverageDetails} onChange={set('coverageDetails')} placeholder="Parts & labour covered, accidental damage not covered..." />
      </div>
      <div className="col-12 d-flex justify-content-end gap-2 pt-2">
        <button type="button" className="btn btn-light" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : (initial?._id ? 'Update Product' : 'Save Product')}
        </button>
      </div>
    </form>
  );
}
