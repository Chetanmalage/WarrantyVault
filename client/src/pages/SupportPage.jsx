import { useState } from 'react';

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const send = (event) => {
    event.preventDefault();
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
  };

  const faqs = [
    { q: 'How do I track a warranty?', a: 'Add the product to your inventory, enter purchase and warranty end dates, then monitor expiry status on the dashboard and calendar pages.' },
    { q: 'Can I upload invoices and certificates?', a: 'Yes. Open a product detail page and upload PDFs or images under the Documents section.' },
    { q: 'How are expiring warranties highlighted?', a: 'Products with a remaining warranty window within 30 days are marked as “Expiring Soon” and listed in the notifications panel.' },
    { q: 'Can admins manage users?', a: 'Admin users can access the Admin Panel to review stats, change roles and remove inactive accounts.' },
  ];

  return (
    <div className="d-grid gap-4">
      <div>
        <h5 className="section-title mb-1">Help & support</h5>
        <p className="text-muted small mb-0">Find answers or contact the WarrantyVault team.</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Frequently asked questions</h5>
            <div className="d-grid gap-3">
              {faqs.map((item) => (
                <div key={item.q} className="note-box">
                  <strong>{item.q}</strong>
                  <p className="mb-0 small text-muted mt-2">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Contact support</h5>
            <form onSubmit={send} className="row g-3">
              <div className="col-12">
                <label className="form-label">Name</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="col-12">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="col-12">
                <label className="form-label">Message</label>
                <textarea rows="4" className="form-control" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required placeholder="Tell us about your issue or question." />
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-primary" type="submit">Send message</button>
              </div>
              {submitted && <div className="col-12"><div className="alert alert-success py-2 mb-0">Your support request has been queued successfully.</div></div>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
