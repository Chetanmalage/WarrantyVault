import api from '../api/axios';

async function readErrorBlob(err) {
  const data = err?.response?.data;
  if (!data || typeof Blob === 'undefined' || !(data instanceof Blob)) return;
  try {
    const text = await data.text();
    if (!text) return;
    try {
      err.response.data = JSON.parse(text);
    } catch {
      err.response.data = { message: text.slice(0, 300) };
    }
  } catch {
    /* ignore parse failures */
  }
}

export async function downloadAuthenticatedFile(path, filename) {
  try {
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
  } catch (err) {
    await readErrorBlob(err);
    throw err;
  }
}