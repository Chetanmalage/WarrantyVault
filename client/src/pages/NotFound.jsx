import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page not found | WarrantyVault';
  }, []);

  return (
    <main className="not-found-page">
      <Link className="public-brand" to="/" aria-label="WarrantyVault home">
        <span className="public-brand-mark" aria-hidden="true">
          <i className="bi bi-shield-check" />
        </span>
        <span>Warranty<span>Vault</span></span>
      </Link>
      <div className="not-found-content">
        <span className="not-found-code">404</span>
        <h1>That page isn’t in the vault.</h1>
        <p>The link may be out of date, or the page may have moved.</p>
        <div className="not-found-actions">
          <Link className="btn btn-primary" to="/">Go to WarrantyVault</Link>
          <Link className="not-found-login" to="/login">Log in</Link>
        </div>
      </div>
    </main>
  );
}
