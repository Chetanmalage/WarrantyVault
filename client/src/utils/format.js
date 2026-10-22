import { API_ORIGIN } from '../api/axios';

export const photoUrl = (productId) => {
  const token = localStorage.getItem('wv_token');
  return `${API_ORIGIN}/api/products/${productId}/photo?token=${token}`;
};

export const reportUrl = (path = 'products.pdf') => {
  const token = localStorage.getItem('wv_token');
  return `${API_ORIGIN}/api/reports/${path}?token=${token}`;
};

export const money = (n, currency = '₹') =>
  `${currency}${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const date = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const statusMeta = (status) =>
  ({
    active: { label: 'Active', cls: 'ok', icon: 'bi-shield-check' },
    expiring: { label: 'Expiring Soon', cls: 'warn', icon: 'bi-exclamation-triangle-fill' },
    expired: { label: 'Expired', cls: 'bad', icon: 'bi-shield-x' },
  }[status] || { label: 'Unknown', cls: 'muted', icon: 'bi-question-circle' });

export const warrantyProgress = (p) => {
  if (!p?.warrantyStart || !p?.warrantyEnd) return 0;
  const start = new Date(p.warrantyStart).getTime();
  const end = new Date(p.warrantyEnd).getTime();
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)));
};

export const daysLabel = (d) => {
  if (d === null || d === undefined) return '—';
  if (d < 0) return `${Math.abs(d)} days ago`;
  if (d === 0) return 'Expires today';
  return `${d} days left`;
};

export const catIcon = (cat) =>
  ({
    Mobile: 'bi-phone', Laptop: 'bi-laptop', TV: 'bi-tv',
    'Home Appliance': 'bi-plug', Camera: 'bi-camera', Other: 'bi-box',
  }[cat] || 'bi-box');