import { Link } from 'react-router-dom';

const samples = [
  {
    name: 'iPhone 14 Pro',
    brand: 'Apple',
    category: 'Mobile',
    icon: 'bi-phone',
    status: 'Active',
    statusClass: 'active',
    time: '45 days left',
    date: 'Ends in 45 days',
  },
  {
    name: 'Dell XPS 13',
    brand: 'Dell',
    category: 'Laptop',
    icon: 'bi-laptop',
    status: 'Expired',
    statusClass: 'expired',
    time: 'Expired 10 days ago',
    date: 'Ended 10 days ago',
  },
  {
    name: 'Samsung 4K Smart TV',
    brand: 'Samsung',
    category: 'TV & home',
    icon: 'bi-tv',
    status: 'Active',
    statusClass: 'active',
    time: '90 days left',
    date: 'Ends in 90 days',
  },
];

function Brand() {
  return (
    <Link className="public-brand" to="/" aria-label="WarrantyVault home">
      <span className="public-brand-mark"><i className="bi bi-shield-check" /></span>
      <span>Warranty<span>Vault</span></span>
    </Link>
  );
}

export default function PublicHome() {
  return (
    <div className="public-page">
      <header className="public-header">
        <nav className="public-nav" aria-label="Main navigation">
          <Brand />
          <div className="public-nav-links">
            <a href="#samples">Sample vault</a>
            <a href="#how-it-works">How it works</a>
          </div>
          <div className="public-nav-actions">
            <Link className="public-login" to="/login">Log in</Link>
            <Link className="btn btn-primary public-nav-cta" to="/register">Create your vault <i className="bi bi-arrow-up-right" /></Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="public-hero">
          <div className="public-hero-inner">
            <div className="public-hero-copy">
              <span className="public-eyebrow"><i className="bi bi-stars" /> LESS SEARCHING. MORE PEACE OF MIND.</span>
              <h1>Keep every warranty <span>within reach.</span></h1>
              <p className="public-hero-description">
                Receipts, coverage dates, and repair history—together in one simple place.
                Take a look around first. No account needed.
              </p>
              <div className="public-hero-actions">
                <a className="btn btn-primary public-primary-cta" href="#samples">
                  Explore sample warranties <i className="bi bi-arrow-down" />
                </a>
                <Link className="public-secondary-cta" to="/register">
                  Start my own vault <i className="bi bi-arrow-right" />
                </Link>
              </div>
              <div className="public-reassurance">
                <span><i className="bi bi-eye" /> Browse samples freely</span>
                <span><i className="bi bi-person-lock" /> Sign in to add your own</span>
              </div>
            </div>

            <div className="public-preview-wrap" aria-label="Preview of a sample warranty dashboard">
              <div className="public-preview-glow" />
              <div className="public-preview-card">
                <div className="public-preview-heading">
                  <div>
                    <span className="public-preview-kicker">SAMPLE VAULT</span>
                    <h2>Your warranty overview</h2>
                  </div>
                  <span className="public-preview-menu"><i className="bi bi-three-dots" /></span>
                </div>
                <div className="public-preview-stats">
                  <div className="public-preview-stat">
                    <span className="public-preview-stat-icon purple"><i className="bi bi-box-seam" /></span>
                    <span><strong>3</strong><small>products</small></span>
                  </div>
                  <div className="public-preview-stat">
                    <span className="public-preview-stat-icon green"><i className="bi bi-shield-check" /></span>
                    <span><strong>2</strong><small>covered</small></span>
                  </div>
                  <div className="public-preview-stat">
                    <span className="public-preview-stat-icon rose"><i className="bi bi-shield-x" /></span>
                    <span><strong>1</strong><small>expired</small></span>
                  </div>
                </div>
                <div className="public-preview-list-heading">
                  <strong>Recently tracked</strong>
                  <a href="#samples">View examples</a>
                </div>
                {samples.slice(0, 2).map((sample) => (
                  <div className="public-preview-product" key={sample.name}>
                    <span className="public-preview-product-icon"><i className={`bi ${sample.icon}`} /></span>
                    <span className="public-preview-product-name">
                      <strong>{sample.name}</strong>
                      <small>{sample.brand} · {sample.category}</small>
                    </span>
                    <span className={`public-mini-status ${sample.statusClass}`}>
                      <i className="bi bi-circle-fill" />{sample.status}
                    </span>
                  </div>
                ))}
                <div className="public-preview-note">
                  <i className="bi bi-bell" />
                  <span><strong>Stay one step ahead</strong><small>See what's coming up before coverage ends.</small></span>
                </div>
              </div>
              <div className="public-float-note"><span><i className="bi bi-check-lg" /></span> Nothing gets lost in a drawer.</div>
            </div>
          </div>
          <a className="public-scroll-cue" href="#samples" aria-label="Scroll to sample warranties"><i className="bi bi-arrow-down" /></a>
        </section>

        <section className="public-samples" id="samples">
          <div className="public-section-inner">
            <div className="public-section-heading">
              <div>
                <span className="public-eyebrow">A QUICK LOOK INSIDE</span>
                <h2>Meet your sample vault.</h2>
                <p>These example products show how your own warranties can stay organized.</p>
              </div>
              <span className="public-sample-label"><i className="bi bi-eye" /> Sample data · no sign-in</span>
            </div>
            <div className="public-sample-grid">
              {samples.map((sample) => (
                <article className="public-sample-card" key={sample.name}>
                  <div className="public-sample-card-top">
                    <span className={`public-sample-icon ${sample.statusClass}`}><i className={`bi ${sample.icon}`} /></span>
                    <span className={`public-sample-status ${sample.statusClass}`}>
                      <i className="bi bi-circle-fill" /> {sample.status}
                    </span>
                  </div>
                  <span className="public-sample-category">{sample.category}</span>
                  <h3>{sample.name}</h3>
                  <p className="public-sample-brand">{sample.brand}</p>
                  <div className="public-sample-date">
                    <i className="bi bi-calendar-check" />
                    <span><small>Warranty</small><strong>{sample.date}</strong></span>
                  </div>
                  <div className={`public-sample-countdown ${sample.statusClass}`}>
                    <i className={`bi ${sample.statusClass === 'expired' ? 'bi-exclamation-circle' : 'bi-clock'}`} />
                    {sample.time}
                  </div>
                </article>
              ))}
            </div>
            <div className="public-sample-foot">
              <span><i className="bi bi-info-circle" /> Sample products are for preview only. Your own vault starts with your account.</span>
              <Link to="/register">Add my first product <i className="bi bi-arrow-right" /></Link>
            </div>
          </div>
        </section>

        <section className="public-how" id="how-it-works">
          <div className="public-section-inner">
            <div className="public-how-intro">
              <span className="public-eyebrow">SIMPLE FROM DAY ONE</span>
              <h2>Your important details,<br />right where you need them.</h2>
              <p>Preview the experience, then make it yours whenever you're ready.</p>
            </div>
            <div className="public-how-steps">
              <article>
                <span className="public-step-icon"><i className="bi bi-person-plus" /></span>
                <span className="public-step-number">01</span>
                <h3>Create your account</h3>
                <p>Sign in to start a private vault for the things you own.</p>
              </article>
              <article>
                <span className="public-step-icon"><i className="bi bi-receipt" /></span>
                <span className="public-step-number">02</span>
                <h3>Add the details</h3>
                <p>Keep product info, purchase dates, and warranty coverage together.</p>
              </article>
              <article>
                <span className="public-step-icon"><i className="bi bi-bell" /></span>
                <span className="public-step-number">03</span>
                <h3>Know what's next</h3>
                <p>Check upcoming expirations and find your service history when needed.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="public-bottom-cta">
          <div className="public-bottom-cta-inner">
            <span className="public-bottom-icon"><i className="bi bi-shield-check" /></span>
            <div>
              <h2>Ready to make it yours?</h2>
              <p>Create an account to add and manage your own warranties.</p>
            </div>
            <Link className="btn btn-primary public-primary-cta" to="/register">Create your free vault <i className="bi bi-arrow-right" /></Link>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <div className="public-footer-inner">
          <Brand />
          <span>Keep the important stuff close.</span>
          <Link to="/login">Already have an account? Log in <i className="bi bi-arrow-right" /></Link>
        </div>
      </footer>
    </div>
  );
}
