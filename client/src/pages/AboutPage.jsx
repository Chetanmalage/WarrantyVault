export default function AboutPage() {
  return (
    <div className="d-grid gap-4">
      <div className="card-surface">
        <h5 className="section-title mb-3">About WarrantyVault</h5>
        <p className="text-muted mb-3">
          WarrantyVault is a digital warranty manager built for households, small businesses and service teams who want to keep every product, repair record and warranty deadline in one organized place.
        </p>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="note-box h-100">
              <strong>Mission</strong>
              <p className="small text-muted mb-0 mt-2">Reduce missed warranty deadlines and simplify service record management.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="note-box h-100">
              <strong>Coverage</strong>
              <p className="small text-muted mb-0 mt-2">Track electronics, home appliances, vehicles and other insured or supported purchases.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="note-box h-100">
              <strong>Built for clarity</strong>
              <p className="small text-muted mb-0 mt-2">A central vault for product details, service logs, invoices and notifications.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Why it matters</h5>
            <ul className="text-muted mb-0 ps-3">
              <li>Never miss expiry windows.</li>
              <li>Store purchase, invoice and coverage information.</li>
              <li>Review service history by product.</li>
              <li>Get analytics for spending and high-risk items.</li>
            </ul>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card-surface h-100">
            <h5 className="section-title mb-3">Core platform features</h5>
            <ul className="text-muted mb-0 ps-3">
              <li>Product management & search</li>
              <li>Document upload & storage</li>
              <li>Warranty calendar and reminder logic</li>
              <li>Reports, admin controls and secure access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
