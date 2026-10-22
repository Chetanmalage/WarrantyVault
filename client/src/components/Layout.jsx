import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TITLES = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/services': 'Service Records',
  '/documents': 'Documents',
  '/settings': 'Settings',
  '/admin': 'Admin Panel',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const baseNav = [
    { to: '/', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
    { to: '/products', label: 'Products', icon: 'bi-box-seam' },
    { to: '/services', label: 'Service Records', icon: 'bi-tools' },
    { to: '/documents', label: 'Documents', icon: 'bi-folder2-open' },
    { to: '/settings', label: 'Settings', icon: 'bi-gear' },
  ];
  const nav = user?.role === 'admin'
    ? [...baseNav, { to: '/admin', label: 'Admin Panel', icon: 'bi-shield-lock' }]
    : baseNav;

  const title = pathname.startsWith('/products/') ? 'Product Details' : TITLES[pathname] || 'WarrantyVault';
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="app-shell">
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark"><i className="bi bi-shield-check" /></span>
          <div>
            <strong>WarrantyVault</strong>
            <small>Digital warranty manager</small>
          </div>
        </div>

        <nav className="nav-list">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
            <div className="min-w-0">
              <strong className="text-truncate d-block">
                {user?.name}
                {user?.role === 'admin' && <span className="pill ok ms-2">Admin</span>}
              </strong>
              <small className="text-truncate d-block">{user?.email}</small>
            </div>
          </div>
          <button className="btn btn-outline-light btn-sm w-100 mt-3" onClick={logout}>
            <i className="bi bi-box-arrow-right me-2" />Logout
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn d-lg-none" onClick={() => setOpen(true)} aria-label="Menu">
            <i className="bi bi-list" />
          </button>
          <div className="flex-grow-1 min-w-0">
            <h1 className="page-title text-truncate">{title}</h1>
            <p className="page-sub d-none d-sm-block">{today}</p>
          </div>
          <button
            className="theme-toggle"
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}`} />
          </button>
          <Link to="/products?new=1" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg me-1" />Add Product
          </Link>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}