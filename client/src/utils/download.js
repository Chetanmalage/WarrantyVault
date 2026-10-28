import api from '../api/axios';

export async function downloadAuthenticatedFile(path, filename) {
  const { data, headers } = await api.get(path, { responseType: 'blob' });
  const blob = new Blob([data], { type: headers['content-type'] || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
