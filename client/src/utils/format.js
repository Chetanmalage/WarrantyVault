export const money = (n, currency = '₹') =>
  `${currency}${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const parseDateOnly = (value) => {
  if (!value) return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const dateInputValue = (value) => {
  if (!value) return '';
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = parseDateOnly(value);
  if (!parsed) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
};

export const date = (value) => {
  const parsed = parseDateOnly(value);
  return parsed ? parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
};

export const statusMeta = (status) =>
  ({
    active: { label: 'Active', cls: 'ok', icon: 'bi-shield-check' },
    expiring: { label: 'Expiring Soon', cls: 'warn', icon: 'bi-exclamation-triangle-fill' },
    expired: { label: 'Expired', cls: 'bad', icon: 'bi-shield-x' },
  }[status] || { label: 'Unknown', cls: 'muted', icon: 'bi-question-circle' });

export const warrantyProgress = (p) => {
  if (!p?.warrantyStart || !p?.warrantyEnd) return 0;
  const startDate = parseDateOnly(p.warrantyStart);
  const endDate = parseDateOnly(p.warrantyEnd);
  if (!startDate || !endDate) return 0;
  const start = startDate.getTime();
  const end = endDate.getTime();
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

const csvCell = (value) => {
  let text = String(value ?? '');
  if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const exportProductsCsv = (products) => {
  const columns = [
    ['Product', 'name'], ['Brand', 'brand'], ['Category', 'category'],
    ['Purchase date', 'purchaseDate'], ['Purchase price', 'purchasePrice'],
    ['Invoice number', 'invoiceNumber'], ['Store', 'store'], ['Serial number', 'serialNumber'],
    ['Warranty start', 'warrantyStart'], ['Warranty expiry', 'warrantyEnd'],
    ['Warranty provider', 'warrantyProvider'], ['Status', 'warrantyStatus'],
    ['Days remaining', 'daysRemaining'], ['Coverage details', 'coverageDetails'],
  ];
  const rows = [columns.map(([label]) => csvCell(label)).join(',')];
  for (const product of products) {
    rows.push(columns.map(([, key]) => {
      const value = ['purchaseDate', 'warrantyStart', 'warrantyEnd'].includes(key)
        ? dateInputValue(product[key])
        : product[key];
      return csvCell(value);
    }).join(','));
  }
  const blob = new Blob([`\uFEFF${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `warrantyvault-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
