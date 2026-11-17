(() => {
const { S, D, I, ACT, FORM, render, toast, eur, dt, esc, ini, P, C, projs, qTotal, bd, isClient, today } = window.EP;
const ov = document.getElementById('ov');
let M = null;
const fail = e => { toast(e.message || 'Une erreur est survenue.'); if (M && M.busy) { M.busy = false; paint(); } };
const me = () => window.EP_ME.name;
const log = (cid, t) => D.activity.unshift({ client: cid, d: today, t });
function open(m) { M = m; paint(); }
function close() { M = null; ov.innerHTML = ''; document.body.style.overflow = ''; render(); }
function paint() {
  if (!M) return;
  const first = !M._shown; M._shown = true;
  ov.innerHTML = `<div class="ov ${M.drawer ? 'dr' : ''} ${first ? 'anim' : ''}" data-act="ovbg"><div class="md" role="dialog" aria-modal="true">${V[M.type]()}</div></div>`;
  document.body.style.overflow = 'hidden';
}
const hd = (k, t, s = '') => `<div class="md-h"><div><p class="kicker">${k}</p><h2>${t}</h2>${s ? `<p class="mu">${s}</p>` : ''}</div><button class="ib" data-act="close" aria-label="Fermer">${I.x}</button></div>`;
const done = (t, s) => `<div class="md-ok"><span class="okc">${I.chk}</span><h2>${t}</h2><p class="mu">${s}</p><button class="btn btn-p" data-act="close">Fermer</button></div>`;
const fld = (n, l, type, ph = '', val = '') => `<div class="fl"><label for="f-${n}">${l}</label><input id="f-${n}" name="${n}" class="in" type="${type}" placeholder="${ph}" value="${val}" required ${type === 'number' ? 'min="0" step="0.01"' : ''}></div>`;
const projSel = cid => `<div class="fl"><label for="f-proj">Projet</label><select id="f-proj" name="proj" class="in" data-inp="proj">${projs(cid).map(p => `<option value="${p.id}" ${M.proj === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>`;
const frm = (k, t, body, cta) => hd(k, t) + `<form data-form="mf"><div class="md-b">${body}</div><div class="md-f"><button type="button" class="btn" data-act="close">Annuler</button><button class="btn btn-p">${cta}</button></div></form>`;
const size = b => b > 1e6 ? (b / 1e6).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round(b / 1e3)) + ' Ko';
const extOf = n => (n.includes('.') ? n.split('.').pop() : 'fichier').toUpperCase().slice(0, 4);
const nextId = (arr, pre) => `${pre}-2026-0${Math.max(...arr.map(x => +x.id.split('-')[2])) + 1}`;

const V = {
  pay() {
    const i = D.invoices.find(x => x.id === M.id);
    if (M.ok) return done('Paiement reçu', `Merci ! Le reçu de la facture ${i.id} est disponible dans vos documents.`);
    const m = M.pm || (D.online ? 'bc' : 'tr');
    const body = m === 'card' ? `<p class="note">Vous serez redirigé vers une page de paiement sécurisée pour saisir votre carte.</p>`
      : m === 'bc' ? `<p class="note">Vous serez redirigé vers l’app Bancontact ou votre banque pour confirmer le paiement.</p>`
      : `<dl class="kv"><div><dt>Bénéficiaire</dt><dd>${esc(D.bank.beneficiary)}</dd></div><div><dt>IBAN</dt><dd>${esc(D.bank.iban)}</dd></div><div><dt>BIC</dt><dd>${esc(D.bank.bic)}</dd></div><div><dt>Communication</dt><dd>${esc(i.comm)}</dd></div></dl>`;
    return hd('Facture ' + i.id, 'Régler la facture', esc(i.label)) +
      `<div class="md-b"><div class="amt"><span class="kicker">Montant TTC</span><b>${eur(i.amount)}</b><small>Échéance ${dt(i.due)}</small></div><div class="seg s3">${[['bc', 'Bancontact'], ['card', 'Carte'], ['tr', 'Virement']].map(([k, l]) => `<button type="button" class="${m === k ? 'on' : ''}" data-act="pm" data-v="${k}">${l}</button>`).join('')}</div>${body}</div>` +
      `<div class="md-f"><button class="btn" data-act="close">Annuler</button>${m === 'tr' ? `<button class="btn btn-p" data-act="trdone">J’ai effectué le virement</button>` : `<button class="btn btn-o" data-act="paygo" ${M.busy ? 'disabled' : ''}>${M.busy ? 'Paiement en cours…' : 'Payer ' + eur(i.amount)}</button>`}</div>`;
  },
  sign() {
    const q = D.quotes.find(x => x.id === M.id), ht = q.lines.reduce((s, l) => s + l.q * l.p, 0), c = C(P(q.project).client);
    if (M.ok) return M.ok === 'ref' ? done('Devis refusé', 'Nous avons prévenu l’équipe. N’hésitez pas à nous écrire pour en discuter.') : done('Devis signé', `Merci ! La copie signée de ${q.id} est disponible dans vos documents.`);
    const can = isClient() && q.status === 'à signer';
    if (M.name == null) M.name = c.contact;
    const lines = `<div class="tw"><table class="tb tq"><thead><tr><th>Désignation</th><th class="r">Qté</th><th class="r">Montant HT</th></tr></thead><tbody>${q.lines.map(l => `<tr><td>${esc(l.l)}</td><td class="r">${l.q}</td><td class="r num">${eur(l.q * l.p)}</td></tr>`).join('')}</tbody></table></div><dl class="tot"><div><dt>Total HT</dt><dd>${eur(ht)}</dd></div><div><dt>TVA 21 %</dt><dd>${eur(ht * .21)}</dd></div><div class="g"><dt>Total TTC</dt><dd>${eur(ht * 1.21)}</dd></div></dl>`;
    const extra = can ? `<div class="fl"><label for="sgn">Nom du signataire</label><input id="sgn" class="in" value="${esc(M.name)}" data-inp="name"></div><div class="sig"><span>${esc(M.name)}</span><small>Signature électronique · ${dt(today)}</small></div><label class="cb"><input type="checkbox" data-inp="agree" ${M.agree ? 'checked' : ''}><span>J’ai lu et j’accepte le devis et les conditions générales de vente.</span></label>`
      : q.status === 'signé' ? `<p class="note ok">Signé par ${esc(q.signedBy)} le ${dt(q.signed)}.</p>` : q.status === 'refusé' ? `<p class="note">Ce devis a été refusé.</p>` : `<p class="note">En attente de signature du client.</p>`;
    const foot = can ? `<button class="btn" data-act="signno">Refuser</button><button class="btn btn-o" data-act="signgo" ${M.agree && M.name.trim() ? '' : 'disabled'}>${I.pen}Signer le devis</button>` : `<button class="btn" data-act="dl" data-k="q" data-v="${q.id}">${I.dl}Télécharger le PDF</button><button class="btn btn-p" data-act="close">Fermer</button>`;
    return hd(`Devis ${q.id} · ${esc(P(q.project).name)}`, esc(q.label), `Émis le ${dt(q.date)} · valable jusqu’au ${dt(q.valid)}`) + `<div class="md-b">${lines}${extra}</div><div class="md-f">${foot}</div>`;
  },
  deliv() {
    const p = P(M.id), d = p.deliverables.find(x => x.id === M.v), open = d.status !== 'validé';
    return hd(esc(p.name), esc(d.name), `${d.type} · ajouté le ${dt(d.date)}`) +
      `<div class="md-b"><div class="pv"><span>${esc(d.name)}</span><small>Aperçu · ${d.type}</small></div><div class="dv-st">${bd(d.status)}<button class="btn btn-s" data-act="dl" data-k="deliv" data-v="${d.id}">${d.type === 'Lien' ? I.eye + 'Ouvrir le lien' : I.dl + 'Télécharger'}</button></div>` +
      `<div><p class="kicker">Commentaires</p><ul class="cm">${d.comments.map(c => `<li class="${c.c ? 'cl' : ''}"><span class="av">${ini(c.a)}</span><div><b>${esc(c.a)}</b> <small>${dt(c.d)}</small><p>${esc(c.t)}</p></div></li>`).join('') || '<li class="mu">Aucun commentaire.</li>'}</ul></div>` +
      `<div class="fl"><label for="cmt">Ajouter un commentaire</label><textarea id="cmt" class="in" placeholder="Vos retours, précisions…" data-inp="cmt">${esc(M.cmt || '')}</textarea></div><div class="cmt-a"><button class="btn btn-s" data-act="dcmt">Envoyer le commentaire</button></div></div>` +
      `<div class="md-f">${open ? `<button class="btn" data-act="dmod">Demander des modifications</button><button class="btn btn-o" data-act="dok">${I.chk}Valider le livrable</button>` : `<button class="btn btn-p" data-act="close">Fermer</button>`}</div>`;
  },
  upload() {
    const cid = M.admin ? S.adminClient : S.client, n = M.files.length;
    if (!projs(cid).length) return hd('Documents', 'Déposer un fichier') + `<div class="md-b"><p class="note">Ce client n’a pas encore de projet.</p></div>`;
    return hd(M.admin ? esc(C(cid).name) : 'Documents', M.admin ? 'Déposer un document' : 'Déposer un fichier', M.admin ? 'Le client sera prévenu par e-mail.' : 'Vos fichiers seront visibles par l’équipe Eight Projects.') +
      `<div class="md-b">${projSel(cid)}<label class="dz" data-dz><input type="file" multiple hidden data-file>${I.up}<b>Glissez vos fichiers ici</b><small>ou cliquez pour parcourir · 100 Mo max.</small></label>${n ? `<ul class="fls">${M.files.map((f, i) => `<li><span class="fi">${extOf(f.name)}</span><span>${esc(f.name)}</span><small>${size(f.size)}</small><button class="ib" data-act="rmf" data-v="${i}" aria-label="Retirer">${I.x}</button></li>`).join('')}</ul>` : ''}</div>` +
      `<div class="md-f"><button class="btn" data-act="close">Annuler</button><button class="btn btn-p" data-act="upgo" ${n ? '' : 'disabled'}>${I.up}Déposer${n ? ` ${n} fichier${n > 1 ? 's' : ''}` : ''}</button></div>`;
  },
  newinv: () => frm(esc(C(S.adminClient).name), 'Nouvelle facture', projSel(S.adminClient) + fld('label', 'Libellé', 'text', 'Ex. Refonte site — solde') + `<div class="row2">${fld('amount', 'Montant TTC (€)', 'number', '0,00')}${fld('due', 'Échéance', 'date', '', '2026-12-17')}</div>`, 'Envoyer la facture'),
  newq: () => frm(esc(C(S.adminClient).name), 'Nouveau devis', projSel(S.adminClient) + fld('label', 'Objet', 'text', 'Ex. Module newsletter') + `<div class="row2">${fld('amount', 'Montant HT (€)', 'number', '0,00')}${fld('valid', 'Valable jusqu’au', 'date', '', '2026-12-17')}</div>`, 'Envoyer le devis'),
  invite: () => frm('Eight Projects', 'Inviter un client', fld('name', 'Société', 'text', 'Ex. Atelier Nord') + fld('contact', 'Contact', 'text', 'Prénom Nom') + fld('email', 'E-mail', 'email', 'nom@societe.be'), 'Envoyer l’invitation')
};

Object.assign(ACT, {
  pay: t => open({ type: 'pay', id: t.dataset.id }),
  sign: t => open({ type: 'sign', id: t.dataset.id }),
  deliv: t => open({ type: 'deliv', id: t.dataset.id, v: t.dataset.v, drawer: true }),
  upload: t => open({ type: 'upload', proj: t.dataset.id || projs(S.client)[0]?.id, files: [] }),
  newdoc: () => open({ type: 'upload', admin: true, proj: projs(S.adminClient)[0]?.id, files: [] }),
  newinv: () => open({ type: 'newinv', proj: projs(S.adminClient)[0]?.id }),
  newq: () => open({ type: 'newq', proj: projs(S.adminClient)[0]?.id }),
  invite: () => open({ type: 'invite' }),
  close: () => close(),
  ovbg: (t, e) => { if (e.target === t) close(); },
  pm: t => { M.pm = t.dataset.v; paint(); },
  trdone: async () => {
    try { await EP_API.post(`invoices/${M.id}/transfer`, {}); toast('Merci ! Nous confirmerons la réception du virement.'); close(); } catch (e) { fail(e); }
  },
  paygo: async () => {
    const id = M.id; M.busy = true; paint();
    try {
      const r = await EP_API.post(`invoices/${id}/pay`, { method: M.pm || 'bc' });
      if (r.url) { location.href = r.url; return; }
      await EP_API.refresh();
      if (M) { M.busy = false; M.ok = true; paint(); }
    } catch (e) { fail(e); }
  },
  signgo: async () => {
    try {
      await EP_API.post(`quotes/${M.id}/sign`, { name: M.name.trim(), agree: !!M.agree });
      await EP_API.refresh(); M.ok = 'yes'; paint();
    } catch (e) { fail(e); }
  },
  signno: async () => {
    try { await EP_API.post(`quotes/${M.id}/refuse`, {}); await EP_API.refresh(); M.ok = 'ref'; paint(); } catch (e) { fail(e); }
  },
  dcmt: async () => {
    const t = (M.cmt || '').trim();
    if (!t) { toast('Écrivez d’abord votre commentaire.'); ov.querySelector('#cmt')?.focus(); return; }
    try { await EP_API.post(`deliverables/${M.v}/comment`, { text: t }); M.cmt = ''; await EP_API.refresh(); paint(); } catch (e) { fail(e); }
  },
  dmod: async () => {
    const t = (M.cmt || '').trim();
    if (!t) { toast('Précisez les modifications souhaitées en commentaire.'); ov.querySelector('#cmt')?.focus(); return; }
    try { await EP_API.post(`deliverables/${M.v}/review`, { action: 'changes', text: t }); await EP_API.refresh(); toast('Demande envoyée à l’équipe.'); close(); } catch (e) { fail(e); }
  },
  dok: async () => {
    try { await EP_API.post(`deliverables/${M.v}/review`, { action: 'validate', text: (M.cmt || '').trim() }); await EP_API.refresh(); toast('Livrable validé. Merci !'); close(); } catch (e) { fail(e); }
  },
  rmf: t => { M.files.splice(+t.dataset.v, 1); paint(); },
  upgo: async () => {
    const p = P(M.proj); if (!p || !M.files.length || M.busy) return;
    const fd = new FormData(); fd.append('project', p.id); M.files.forEach(f => fd.append('files', f));
    const n = M.files.length; M.busy = true;
    const b = ov.querySelector('[data-act="upgo"]'); if (b) { b.disabled = true; b.textContent = 'Envoi en cours…'; }
    try { await EP_API.post('docs', fd); await EP_API.refresh(); toast(`${n} fichier${n > 1 ? 's' : ''} déposé${n > 1 ? 's' : ''} dans ${p.name}.`); close(); } catch (e) { fail(e); paint(); }
  }
});

FORM.mf = async f => {
  const v = Object.fromEntries(new FormData(f)), btn = f.querySelector('.btn-p'); btn.disabled = true;
  try {
    if (M.type === 'newinv') { const r = await EP_API.post('admin/invoices', { project: v.proj, label: v.label, amount: v.amount, due: v.due }); toast(`Facture ${r.id} envoyée.`); }
    else if (M.type === 'newq') { const r = await EP_API.post('admin/quotes', { project: v.proj, label: v.label, amount: v.amount, valid: v.valid }); toast(`Devis ${r.id} envoyé.`); }
    else if (M.type === 'invite') { await EP_API.post('admin/clients', { name: v.name, contact: v.contact, email: v.email }); toast(`Invitation envoyée à ${v.email}.`); }
    await EP_API.refresh(); close();
  } catch (e) { btn.disabled = false; toast(e.message || 'Une erreur est survenue.'); }
};

ov.addEventListener('input', e => {
  const k = e.target.dataset.inp; if (!k || !M) return;
  if (k === 'cmt') M.cmt = e.target.value;
  if (k === 'proj') M.proj = e.target.value;
  if (k === 'name' || k === 'agree') {
    if (k === 'name') { M.name = e.target.value; ov.querySelector('.sig span').textContent = M.name; } else M.agree = e.target.checked;
    const b = ov.querySelector('[data-act="signgo"]'); if (b) b.disabled = !(M.agree && M.name.trim());
  }
});
const addFiles = fl => { M.files.push(...fl); paint(); };
ov.addEventListener('change', e => { if (e.target.matches('[data-file]') && M) addFiles(e.target.files); });
ov.addEventListener('dragover', e => { const z = e.target.closest('[data-dz]'); if (z) { e.preventDefault(); z.classList.add('over'); } });
ov.addEventListener('dragleave', e => { e.target.closest('[data-dz]')?.classList.remove('over'); });
ov.addEventListener('drop', e => { const z = e.target.closest('[data-dz]'); if (z && M) { e.preventDefault(); addFiles(e.dataTransfer.files); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && M) close(); });

render();
})();
