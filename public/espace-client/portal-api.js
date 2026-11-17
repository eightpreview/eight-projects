// Actions qui ne dépendent pas d'une modale : connexion, déconnexion, relance, téléchargements.
(() => {
const { ACT, FORM, toast, render } = window.EP;
const D = window.EP_DATA;
const showErr = (m) => { const n = document.getElementById('lg-err'); if (n) { n.textContent = m; n.hidden = false; } };

FORM.login = async (f) => {
  const btn = f.querySelector('.btn-p'); btn.disabled = true;
  try {
    await EP_API.post('login', { email: f.querySelector('#em').value, password: f.querySelector('#pw').value });
    location.hash = ''; location.search = '';
  } catch (e) { btn.disabled = false; showErr(e.message); }
};

ACT.magic = async () => {
  const em = document.getElementById('em');
  if (!em || !em.value.trim()) { showErr('Indiquez d’abord votre adresse e-mail.'); em && em.focus(); return; }
  try { await EP_API.post('magic', { email: em.value.trim() }); toast('Si un compte existe pour cette adresse, un lien de connexion vient d’être envoyé.'); }
  catch (e) { showErr(e.message); }
};

ACT.logout = async () => { try { await EP_API.post('logout', {}); } catch {} location.hash = ''; location.search = ''; };

ACT.remind = async (t) => {
  try { await EP_API.post(`invoices/${t.dataset.id}/remind`, {}); toast(`Relance envoyée pour la facture ${t.dataset.id}`); }
  catch (e) { toast(e.message); }
};

ACT.dl = (t) => {
  const k = t.dataset.k, v = t.dataset.v, id = encodeURIComponent(v), open = (u) => window.open(u, '_blank', 'noopener');
  if (k === 'doc') open(`/api/portal/docs/${id}`);
  else if (k === 'inv') open(`/api/portal/print/invoice/${id}`);
  else if (k === 'q') open(`/api/portal/print/quote/${id}`);
  else if (k === 'deliv') {
    const d = D.projects.flatMap((p) => p.deliverables).find((x) => x.id === v);
    if (d && d.url && /^https?:\/\//i.test(d.url)) open(d.url);
    else if (d && d.file) open(`/api/portal/deliverables/${id}/file`);
    else toast('Aucun fichier n’est associé à ce livrable.');
  }
};
})();
