(() => {
const D = window.EP_DATA;
const ME = window.EP_ME;
const S = { role: ME ? ME.role : null, client: ME ? (ME.clientId || (D.clients[0] && D.clients[0].id) || '') : '', asClient: false, filter: 'all', last: null, adminClient: null };
const save = () => {};
const $ = s => document.querySelector(s);
const today = new Date().toISOString().slice(0, 10);
const sv = p => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I = {
  grid: sv('<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/>'),
  folder: sv('<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>'),
  file: sv('<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5"/>'),
  inv: sv('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
  pen: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>'),
  users: sv('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.5 3.5 5.2"/>'),
  dl: sv('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  up: sv('<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>'),
  chk: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  arr: sv('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  x: sv('<path d="M6 6l12 12M18 6L6 18"/>'),
  out: sv('<path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 8l-4 4 4 4M6 12h10"/>'),
  eye: sv('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>')
};
const eur = n => n.toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' });
const dt = s => new Date(s + 'T12:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ini = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const P = id => D.projects.find(p => p.id === id);
const C = id => D.clients.find(c => c.id === id);
const projs = cid => D.projects.filter(p => p.client === cid);
const of = (arr, cid) => arr.filter(x => P(x.project).client === cid);
const qTotal = q => q.lines.reduce((s, l) => s + l.q * l.p, 0) * 1.21;
const sum = l => l.reduce((s, i) => s + i.amount, 0);
const due = i => i.status !== 'payée';
const byDate = (a, b) => b.date.localeCompare(a.date);
const BD = { 'payée': 'ok', 'à payer': 'todo', 'en retard': 'late', 'signé': 'ok', 'à signer': 'todo', 'refusé': 'mute', 'validé': 'ok', 'à valider': 'todo', 'modifs demandées': 'cur', 'En cours': 'cur', 'Livré': 'ok', 'En pause': 'mute' };
const bd = s => `<span class="bd bd-${BD[s] || 'mute'}">${s}</span>`;
const isClient = () => S.role === 'client' || S.asClient;
const by = d => d.by === 'client' ? (isClient() ? 'Vous' : esc(C(P(d.project).client).contact)) : 'Eight Projects';
const empty = t => `<p class="empty">${t}</p>`;
const flt = arr => S.filter === 'all' ? arr : arr.filter(x => x.project === S.filter);
const go = h => { location.hash = h; };
const projCell = x => isClient() ? esc(P(x.project).name) : `${esc(C(P(x.project).client).name)}<small>${esc(P(x.project).name)}</small>`;

const head = (title, sub, right = '') => `<header class="ph"><div class="ph-t">${sub ? `<p class="kicker">${sub}</p>` : ''}<h1 class="pg">${title}</h1></div>${right ? `<div class="ph-a">${right}</div>` : ''}</header>`;
const chips = cid => { const ps = projs(cid); return ps.length > 1 ? `<div class="chips"><button class="chip ${S.filter === 'all' ? 'on' : ''}" data-act="filter" data-v="all">Tous les projets</button>${ps.map(p => `<button class="chip ${S.filter === p.id ? 'on' : ''}" data-act="filter" data-v="${p.id}">${esc(p.name)}</button>`).join('')}</div>` : ''; };
const dlBtn = (n, k = 'doc') => `<button class="ib" data-act="dl" data-k="${k}" data-v="${esc(n)}" aria-label="Télécharger">${I.dl}</button>`;

function docTable(list, proj = true) {
  if (!list.length) return empty('Aucun document pour l’instant.');
  return `<div class="tw"><table class="tb"><thead><tr><th>Nom</th>${proj ? `<th>${isClient() ? 'Projet' : 'Client'}</th>` : ''}<th>Ajouté par</th><th>Date</th><th class="r"></th></tr></thead><tbody>${list.slice().sort(byDate).map(d => `<tr><td><div class="nm"><span class="fi">${esc(d.type)}</span><div><b>${esc(d.name)}</b><small>${esc(d.type)} · ${esc(d.size)}</small></div></div></td>${proj ? `<td class="mu">${projCell(d)}</td>` : ''}<td class="mu nw">${by(d)}</td><td class="mu nw">${dt(d.date)}</td><td class="r">${dlBtn(d.id, 'doc')}</td></tr>`).join('')}</tbody></table></div>`;
}
function invTable(list, proj = true) {
  if (!list.length) return empty('Aucune facture.');
  const act = i => isClient() ? (due(i) ? `<button class="btn btn-o btn-s" data-act="pay" data-id="${i.id}">Payer</button>` : dlBtn(i.id, 'inv')) : (due(i) ? `<button class="btn btn-s" data-act="remind" data-id="${i.id}">Relancer</button>` : dlBtn(i.id, 'inv'));
  return `<div class="tw"><table class="tb"><thead><tr><th>N°</th><th>Libellé</th>${proj ? `<th>${isClient() ? 'Projet' : 'Client'}</th>` : ''}<th>Échéance</th><th class="r">Montant</th><th>Statut</th><th class="r"></th></tr></thead><tbody>${list.slice().sort(byDate).map(i => `<tr><td class="nw">${i.id}</td><td>${esc(i.label)}</td>${proj ? `<td class="mu">${projCell(i)}</td>` : ''}<td class="mu nw">${dt(i.due)}</td><td class="r num">${eur(i.amount)}</td><td>${bd(i.status)}</td><td class="r">${act(i)}</td></tr>`).join('')}</tbody></table></div>`;
}
function quoteTable(list, proj = true) {
  if (!list.length) return empty('Aucun devis.');
  const act = q => isClient() && q.status === 'à signer' ? `<button class="btn btn-o btn-s" data-act="sign" data-id="${q.id}">Signer</button>` : `<button class="btn btn-s" data-act="sign" data-id="${q.id}">Voir</button>`;
  return `<div class="tw"><table class="tb"><thead><tr><th>N°</th><th>Objet</th>${proj ? `<th>${isClient() ? 'Projet' : 'Client'}</th>` : ''}<th>Valable jusqu’au</th><th class="r">Montant TTC</th><th>Statut</th><th class="r"></th></tr></thead><tbody>${list.slice().sort(byDate).map(q => `<tr><td class="nw">${q.id}</td><td>${esc(q.label)}</td>${proj ? `<td class="mu">${projCell(q)}</td>` : ''}<td class="mu nw">${dt(q.valid)}</td><td class="r num">${eur(qTotal(q))}</td><td>${bd(q.status)}</td><td class="r">${act(q)}</td></tr>`).join('')}</tbody></table></div>`;
}
function pCard(p, link = true) {
  const cur = p.steps.find(s => s.s === 'current'), tag = link ? 'a' : 'div';
  return `<${tag} class="pc" data-s="${p.service}" ${link ? `href="#projet/${p.id}"` : ''}><div class="pc-t"><span class="kicker">${p.service}</span>${bd(p.status)}</div><h3>${esc(p.name)}</h3><div class="pc-p"><div class="bar"><i style="width:${p.progress}%"></i></div><span>${p.progress} %</span></div><dl class="pc-m"><div><dt>Étape</dt><dd>${cur ? esc(cur.t) : 'Terminé'}</dd></div><div><dt>${p.status === 'Livré' ? 'Livré le' : 'Livraison prévue'}</dt><dd>${dt(p.due)}</dd></div></dl></${tag}>`;
}
function actList(cid) {
  const a = D.activity.filter(x => !cid || x.client === cid).slice().sort((x, y) => y.d.localeCompare(x.d)).slice(0, 6);
  return a.length ? `<ul class="act">${a.map(x => `<li><span class="dot"></span><div><p>${x.t}</p><small>${cid ? '' : esc(C(x.client).name) + ' · '}${dt(x.d)}</small></div></li>`).join('')}</ul>` : empty('Pas encore d’activité.');
}
function delivList(p) {
  return p.deliverables.length ? p.deliverables.map(d => `<button class="dv" data-act="deliv" data-id="${p.id}" data-v="${d.id}"><span class="dv-th">${d.type}</span><div><b>${esc(d.name)}</b><small>${dt(d.date)} · ${d.comments.length} commentaire${d.comments.length > 1 ? 's' : ''}</small></div>${bd(d.status)}<span class="mu">${I.arr}</span></button>`).join('') : empty('Aucun livrable pour l’instant.');
}

/* ——— client views ——— */
function vDash() {
  const c = C(S.client), ps = projs(S.client);
  const todo = [
    ...of(D.quotes, S.client).filter(q => q.status === 'à signer').map(q => ({ ic: I.pen, t: `Devis ${q.id} à signer`, s: `${esc(q.label)} · ${eur(qTotal(q))}`, a: `<button class="btn btn-o btn-s" data-act="sign" data-id="${q.id}">Signer</button>` })),
    ...of(D.invoices, S.client).filter(due).map(i => ({ ic: I.inv, late: i.status === 'en retard', t: `Facture ${i.id} ${i.status === 'en retard' ? 'en retard' : 'à régler'}`, s: `${eur(i.amount)} · échéance ${dt(i.due)}`, a: `<button class="btn btn-o btn-s" data-act="pay" data-id="${i.id}">Payer</button>` })),
    ...ps.flatMap(p => p.deliverables.filter(d => d.status === 'à valider').map(d => ({ ic: I.eye, cl: 'dl', t: esc(d.name), s: `Livrable à valider · ${esc(p.name)}`, a: `<button class="btn btn-s" data-act="deliv" data-id="${p.id}" data-v="${d.id}">Voir</button>` })))
  ];
  return `<header class="ph ph-dash"><div class="ph-t"><p class="kicker">${esc(c.name)}</p><h1 class="pg">Bonjour ${esc(c.contact.split(' ')[0])}</h1><p class="ph-s">${todo.length ? `${todo.length} élément${todo.length > 1 ? 's' : ''} vous attend${todo.length > 1 ? 'ent' : ''}.` : 'Tout est à jour.'}</p></div><div class="ph-a"><button class="btn" data-act="upload">${I.up}Déposer un fichier</button></div></header>` +
    `<section class="panel"><div class="panel-h"><h2>À faire ${todo.length ? `<span class="ct">${todo.length}</span>` : ''}</h2></div>${todo.length ? todo.map(x => `<div class="todo"><span class="ic ${x.late ? 'late' : x.cl || ''}">${x.ic}</span><div><b>${x.t}</b><small>${x.s}</small></div>${x.a}</div>`).join('') : empty('Rien à faire pour le moment.')}</section>` +
    `<div class="sec-h"><h2>Projets</h2><a class="lnk" href="#projets">Tout voir ${I.arr}</a></div><div class="g3">${ps.map(p => pCard(p)).join('') || empty('Aucun projet pour le moment.')}</div>` +
    `<div class="g2" style="margin-top:44px"><section class="panel"><div class="panel-h"><h2>Derniers documents</h2><a class="lnk" href="#documents">Tout voir ${I.arr}</a></div>${docTable(of(D.docs, S.client).sort(byDate).slice(0, 5))}</section><section class="panel"><div class="panel-h"><h2>Activité</h2></div>${actList(S.client)}</section></div>`;
}
const vProjets = () => head('Projets', esc(C(S.client).name)) + `<div class="g3">${projs(S.client).map(p => pCard(p)).join('') || empty('Aucun projet pour le moment.')}</div>`;
function vProjet(id, tab = 'suivi') {
  const p = P(id); if (!p || p.client !== S.client) return vProjets();
  const docs = D.docs.filter(d => d.project === id), inv = D.invoices.filter(i => i.project === id), qs = D.quotes.filter(q => q.project === id);
  const T = [['suivi', 'Suivi'], ['livrables', 'Livrables', p.deliverables.length], ['documents', 'Documents', docs.length], ['factures', 'Factures', inv.length], ['devis', 'Devis', qs.length]];
  let body;
  if (tab === 'livrables') body = `<section class="panel">${delivList(p)}</section>`;
  else if (tab === 'documents') body = `<div class="bar-a"><span class="mu">${docs.length} fichier${docs.length > 1 ? 's' : ''}</span><button class="btn btn-s" data-act="upload" data-id="${id}">${I.up}Déposer un fichier</button></div><section class="panel">${docTable(docs, false)}</section>`;
  else if (tab === 'factures') body = `<section class="panel">${invTable(inv, false)}</section>`;
  else if (tab === 'devis') body = `<section class="panel">${quoteTable(qs, false)}</section>`;
  else {
    const pend = p.deliverables.filter(d => d.status === 'à valider');
    body = `<div class="g2"><section class="panel"><div class="panel-h"><h2>Étapes</h2><span class="mu">${p.steps.filter(s => s.s === 'done').length} / ${p.steps.length}</span></div><ol class="tl">${p.steps.map(s => `<li class="st-${s.s}"><span class="dot"></span><div><b>${esc(s.t)}</b>${s.s === 'current' ? '<small>En cours</small>' : ''}</div><span class="mu nw">${s.d}</span></li>`).join('')}</ol></section><div class="stack">${pend.length ? `<section class="panel"><div class="panel-h"><h2>À valider <span class="ct">${pend.length}</span></h2></div>${delivList({ ...p, deliverables: pend })}</section>` : ''}<section class="panel pad"><p class="kicker">Votre contact</p><p class="big">${esc(p.lead)}</p><a class="lnk" href="mailto:${p.leadMail}">${p.leadMail}</a></section></div></div>`;
  }
  return `<nav class="crumb"><a href="#projets">Projets</a><span>/</span><span>${esc(p.name)}</span></nav>` + head(esc(p.name), p.service, bd(p.status)) +
    `<dl class="meta"><div><dt>Chef de projet</dt><dd>${esc(p.lead)}</dd></div><div><dt>Début</dt><dd>${dt(p.start)}</dd></div><div><dt>${p.status === 'Livré' ? 'Livré le' : 'Livraison prévue'}</dt><dd>${dt(p.due)}</dd></div><div><dt>Avancement</dt><dd><span class="bar"><i style="width:${p.progress}%"></i></span>${p.progress} %</dd></div></dl>` +
    `<nav class="tabs">${T.map(([k, l, n]) => `<a href="#projet/${id}/${k}" class="${tab === k ? 'on' : ''}">${l}${n != null ? `<sup>${n}</sup>` : ''}</a>`).join('')}</nav>` + body;
}
const vDocs = () => head('Documents', esc(C(S.client).name), `<button class="btn btn-p" data-act="upload">${I.up}Déposer un fichier</button>`) + chips(S.client) + `<section class="panel mt-s">${docTable(flt(of(D.docs, S.client)))}</section>`;
function vInv() {
  const all = of(D.invoices, S.client), open = all.filter(due), nxt = open.slice().sort((a, b) => a.due.localeCompare(b.due))[0];
  return head('Factures', esc(C(S.client).name)) + `<div class="sum"><div><span class="kicker">À régler</span><b>${eur(sum(open))}</b><small>${open.length} facture${open.length > 1 ? 's' : ''}</small></div><div><span class="kicker">Réglé en 2026</span><b>${eur(sum(all.filter(i => !due(i))))}</b></div><div><span class="kicker">Prochaine échéance</span><b>${nxt ? dt(nxt.due) : '—'}</b></div></div>` + chips(S.client) + `<section class="panel mt-s">${invTable(flt(all))}</section>`;
}
function vQuotes() {
  const all = of(D.quotes, S.client), pend = all.filter(q => q.status === 'à signer'), ok = all.filter(q => q.status === 'signé');
  return head('Devis', esc(C(S.client).name)) + `<div class="sum"><div><span class="kicker">À signer</span><b>${pend.length}</b><small>${eur(pend.reduce((s, q) => s + qTotal(q), 0))} TTC</small></div><div><span class="kicker">Signés</span><b>${ok.length}</b><small>${eur(ok.reduce((s, q) => s + qTotal(q), 0))} TTC</small></div></div>` + chips(S.client) + `<section class="panel mt-s">${quoteTable(flt(all))}</section>`;
}

/* ——— admin views ——— */
function vAdminHome() {
  const open = D.invoices.filter(due), qs = D.quotes.filter(q => q.status === 'à signer'), dl = D.projects.flatMap(p => p.deliverables.filter(d => d.status === 'à valider'));
  return head('Vue d’ensemble', 'Eight Projects · équipe', `<button class="btn btn-p" data-act="invite">${I.plus}Inviter un client</button>`) +
    `<div class="sum"><div><span class="kicker">Clients</span><b>${D.clients.length}</b><small>${D.projects.filter(p => p.status === 'En cours').length} projets en cours</small></div><div><span class="kicker">À encaisser</span><b>${eur(sum(open))}</b><small>${open.length} factures · ${open.filter(i => i.status === 'en retard').length} en retard</small></div><div><span class="kicker">Devis en attente</span><b>${qs.length}</b><small>${eur(qs.reduce((s, q) => s + qTotal(q), 0))} TTC</small></div><div><span class="kicker">Livrables chez le client</span><b>${dl.length}</b><small>en attente de retour</small></div></div>` +
    `<div class="g2"><section class="panel"><div class="panel-h"><h2>Factures ouvertes</h2></div>${invTable(open)}</section><section class="panel"><div class="panel-h"><h2>Activité clients</h2></div>${actList()}</section></div>`;
}
function vClients() {
  return head('Clients', 'Eight Projects · équipe', `<button class="btn btn-p" data-act="invite">${I.plus}Inviter un client</button>`) +
    `<section class="panel"><div class="tw"><table class="tb"><thead><tr><th>Client</th><th>Projets en cours</th><th class="r">À encaisser</th><th>Dernière connexion</th><th class="r"></th></tr></thead><tbody>${D.clients.map(c => { const o = of(D.invoices, c.id).filter(due); return `<tr class="clk" data-act="goto" data-v="clients/${c.id}"><td><div class="nm"><span class="av">${ini(c.name)}</span><div><b>${esc(c.name)}</b><small>${esc(c.contact)} · ${esc(c.email)}</small></div></div></td><td class="mu">${projs(c.id).filter(p => p.status === 'En cours').length}</td><td class="r num">${o.length ? eur(sum(o)) : '—'}</td><td class="mu nw">${c.last ? dt(c.last) : 'Invitation envoyée'}</td><td class="r mu">${I.arr}</td></tr>`; }).join('')}</tbody></table></div></section>`;
}
function vAdminClient(id, tab = 'projets') {
  const c = C(id); if (!c) return vClients();
  const ps = projs(id), docs = of(D.docs, id), inv = of(D.invoices, id), qs = of(D.quotes, id);
  const T = [['projets', 'Projets', ps.length], ['documents', 'Documents', docs.length], ['factures', 'Factures', inv.length], ['devis', 'Devis', qs.length]];
  const body = tab === 'documents' ? `<section class="panel">${docTable(docs)}</section>` : tab === 'factures' ? `<section class="panel">${invTable(inv)}</section>` : tab === 'devis' ? `<section class="panel">${quoteTable(qs)}</section>` : `<div class="g3">${ps.map(p => pCard(p, false)).join('') || empty('Aucun projet pour ce client.')}</div>`;
  return `<nav class="crumb"><a href="#clients">Clients</a><span>/</span><span>${esc(c.name)}</span></nav>` +
    head(esc(c.name), `${esc(c.contact)} · ${esc(c.email)}`, `<button class="btn" data-act="ascl" data-id="${id}">${I.eye}Voir comme le client</button>`) +
    `<div class="ph-a"><button class="btn btn-p btn-s" data-act="newdoc">${I.up}Déposer un document</button><button class="btn btn-s" data-act="newinv">${I.plus}Nouvelle facture</button><button class="btn btn-s" data-act="newq">${I.plus}Nouveau devis</button></div>` +
    `<nav class="tabs">${T.map(([k, l, n]) => `<a href="#clients/${id}/${k}" class="${tab === k ? 'on' : ''}">${l}<sup>${n}</sup></a>`).join('')}</nav>` + body;
}

/* ——— login ——— */
function vLogin() {
  const linkErr = new URLSearchParams(location.search).get('err') === 'link';
  return `<div class="lg"><aside class="lg-art"><div class="lg-top"><img class="lg-logo" src="/assets/logo-eight.svg" alt="eight projects"><b>Eight Projects</b><a href="/" class="lnk">Retour au site ${I.arr}</a></div><h1>Espace<br>client</h1><p class="lg-ft">Documents, factures, devis et livrables de vos projets, au même endroit.</p></aside>` +
    `<div class="lg-f"><form data-form="login"><div><p class="kicker">Connexion</p><h2>Bienvenue</h2></div>` +
    `<p class="note" id="lg-err" role="alert" ${linkErr ? '' : 'hidden'}>${linkErr ? 'Ce lien n’est plus valable. Demandez-en un nouveau ci-dessous.' : ''}</p>` +
    `<div class="fl"><label for="em">E-mail</label><input id="em" class="in" type="email" autocomplete="email" required></div>` +
    `<div class="fl"><label for="pw"><span>Mot de passe</span><a class="lnk" data-act="magic">Oublié ?</a></label><input id="pw" class="in" type="password" autocomplete="current-password"></div>` +
    `<button class="btn btn-p btn-l">Se connecter ${I.arr}</button><div class="or">ou</div><button type="button" class="btn btn-l" data-act="magic">Recevoir un lien de connexion</button></form></div></div>`;
}

function sidebar(nav, admin) {
  const n = k => k === 'factures' ? of(D.invoices, S.client).filter(due).length : k === 'devis' ? of(D.quotes, S.client).filter(q => q.status === 'à signer').length : 0;
  const items = admin ? [['admin', 'Vue d’ensemble', I.grid], ['clients', 'Clients', I.users]] : [['dash', 'Tableau de bord', I.grid], ['projets', 'Projets', I.folder], ['documents', 'Documents', I.file], ['factures', 'Factures', I.inv], ['devis', 'Devis', I.pen]];
  const u = isClient() ? { n: C(S.client).contact, e: C(S.client).email } : { n: ME.name, e: ME.email };
  return `<aside class="sb"><a class="sb-brand" href="#${admin ? 'admin' : 'dash'}"><img class="sb-logo" src="/assets/logo-eight.svg" alt="eight projects"><b>Eight Projects</b><span>${admin ? 'Équipe' : 'Espace client'}</span></a><nav>${items.map(([k, l, ic], i) => { const c = admin ? 0 : n(k); return `<a href="#${k}" data-i="${i}" class="${nav === k ? 'on' : ''}">${ic}<span>${l}</span>${c ? `<i class="n">${c}</i>` : ''}</a>`; }).join('')}</nav><div class="sb-ft"><div class="me"><span class="av">${ini(u.n)}</span><div><b>${esc(u.n)}</b><small>${esc(u.e)}</small></div></div><button class="lnk" data-act="logout">${I.out}Déconnexion</button></div></aside>`;
}

function render() {
  const r = (location.hash.slice(1) || '').split('/').filter(Boolean);
  if (!S.role || r[0] === 'login') { $('#app').innerHTML = vLogin(); S.last = 'login'; return; }
  const key = r.slice(0, 2).join('/');
  if (key !== S.last) { if (r[0] !== (S.last || '').split('/')[0]) S.filter = 'all'; window.scrollTo(0, 0); S.last = key; }
  const admin = S.role === 'admin' && !S.asClient;
  let body, nav = r[0];
  if (admin) {
    if (r[0] === 'clients' && r[1]) { S.adminClient = r[1]; body = vAdminClient(r[1], r[2]); }
    else if (r[0] === 'clients') body = vClients();
    else { nav = 'admin'; body = vAdminHome(); }
  } else {
    const V = { projets: vProjets, projet: () => vProjet(r[1], r[2]), documents: vDocs, factures: vInv, devis: vQuotes };
    if (V[r[0]]) body = V[r[0]](); else { nav = 'dash'; body = vDash(); }
    if (r[0] === 'projet') nav = 'projets';
  }
  $('#app').innerHTML = `<div class="app">${sidebar(nav, admin)}<main class="main">${S.asClient ? `<div class="as"><span>Aperçu de l’espace de <b>${esc(C(S.client).name)}</b></span><button class="btn btn-s btn-w" data-act="exitas">Revenir à l’admin</button></div>` : ''}${body}</main></div>`;
}

function toast(m) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = m; document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3000);
}

const ACT = {
  filter: t => { S.filter = t.dataset.v; render(); },
  goto: t => go(t.dataset.v),
  lrole: t => { S.loginRole = t.dataset.v; render(); },
  toast: t => toast(t.dataset.v),
  dl: t => toast(`Téléchargement : ${t.dataset.v}`),
  remind: t => toast(`Relance envoyée pour la facture ${t.dataset.id}`),
  logout: () => { S.role = null; S.asClient = false; save(); go('login'); render(); },
  ascl: t => { S.asClient = true; S.client = t.dataset.id; save(); go('dash'); },
  exitas: () => { const id = S.client; S.asClient = false; S.client = 'lumen'; save(); go('clients/' + id); }
};
const FORM = {
  login: () => { S.role = S.loginRole; S.asClient = false; S.client = 'lumen'; save(); const h = S.role === 'admin' ? 'admin' : 'dash'; if (location.hash.slice(1) === h) render(); else go(h); }
};
document.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (t && ACT[t.dataset.act]) ACT[t.dataset.act](t, e); });
document.addEventListener('submit', e => { const f = FORM[e.target.dataset.form]; if (f) { e.preventDefault(); f(e.target); } });
window.addEventListener('hashchange', render);
window.EP = { S, D, I, ACT, FORM, render, toast, go, eur, dt, esc, ini, P, C, projs, of, qTotal, bd, due, isClient, today };
})();
