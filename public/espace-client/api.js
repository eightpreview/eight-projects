// Couche réseau de l'espace client + démarrage de l'application.
window.EP_DATA = { clients: [], projects: [], docs: [], invoices: [], quotes: [], activity: [], bank: {}, online: false };
window.EP_ME = null;

window.EP_API = {
  async call(method, path, body) {
    const opts = { method, credentials: 'same-origin', headers: {} };
    if (body instanceof FormData) opts.body = body;
    else if (body !== undefined) { opts.headers['content-type'] = 'application/json'; opts.body = JSON.stringify(body); }
    let r;
    try { r = await fetch('/api/portal/' + path, opts); }
    catch { throw new Error('Connexion impossible, réessayez.'); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(d.error || 'Une erreur est survenue.'); e.status = r.status; throw e; }
    return d;
  },
  post(path, body) { return this.call('POST', path, body); },
  async refresh() {
    const d = await this.call('GET', 'data');
    Object.assign(window.EP_DATA, d); // même objet : les vues gardent leur référence
  },
};

(async () => {
  try { window.EP_ME = await EP_API.call('GET', 'me'); await EP_API.refresh(); } catch { window.EP_ME = null; }
  for (const src of ['portal.js', 'modals.js', 'portal-api.js'])
    await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
})();
