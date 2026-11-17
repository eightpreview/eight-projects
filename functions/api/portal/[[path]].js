// API de l'espace client : /api/portal/*
// Bindings : DB (D1), BUCKET (R2).  Variables : voir README-espace-client.md
import {
  json, esc, today, uid, randomToken, sha256hex, hashPassword, verifyPassword, getUser, startSession, clearCookie,
  sendMail, mailLayout, origin, eur, frDate, ogm, slug,
} from '../../_lib/util.js';
import { buildData } from '../../_lib/data.js';

const MAX_FILE = 100 * 1024 * 1024; // limite de requête Cloudflare (plans Free/Pro)
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const err = (message, status = 400) => json({ error: message }, status);
const teamMail = (env) => env.TEAM_EMAIL || 'contact@eightprojects.be';
const log = (env, clientId, html) =>
  env.DB.prepare('INSERT INTO activity (client_id, date, text) VALUES (?,?,?)').bind(clientId, today(), html).run();

// ——— accès ———
async function projectOf(env, user, id) {
  const p = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(String(id || '')).first();
  if (!p) return null;
  return user.role === 'admin' || p.client_id === user.clientId ? p : null;
}
async function invoiceOf(env, user, id) {
  const i = await env.DB.prepare(
    'SELECT i.*, p.client_id, p.name AS project_name FROM invoices i JOIN projects p ON p.id = i.project_id WHERE i.id = ?'
  ).bind(id).first();
  return i && (user.role === 'admin' || i.client_id === user.clientId) ? i : null;
}
async function quoteOf(env, user, id) {
  const q = await env.DB.prepare(
    'SELECT q.*, p.client_id, p.name AS project_name FROM quotes q JOIN projects p ON p.id = q.project_id WHERE q.id = ?'
  ).bind(id).first();
  return q && (user.role === 'admin' || q.client_id === user.clientId) ? q : null;
}
async function delivOf(env, user, id) {
  const d = await env.DB.prepare(
    'SELECT d.*, p.client_id, p.name AS project_name FROM deliverables d JOIN projects p ON p.id = d.project_id WHERE d.id = ?'
  ).bind(id).first();
  return d && (user.role === 'admin' || d.client_id === user.clientId) ? d : null;
}
const clientEmail = async (env, cid) => (await env.DB.prepare('SELECT email, contact FROM clients WHERE id = ?').bind(cid).first()) || null;

// ——— throttle de connexion ———
async function tooMany(env, email) {
  const r = await env.DB.prepare('SELECT COUNT(*) n FROM auth_attempts WHERE email = ? AND at > ?').bind(email, Date.now() - 15 * 60e3).first();
  return r.n >= 8;
}
const note = (env, email) =>
  env.DB.batch([
    env.DB.prepare('DELETE FROM auth_attempts WHERE at < ?').bind(Date.now() - 3600e3),
    env.DB.prepare('INSERT INTO auth_attempts (email, at) VALUES (?,?)').bind(email, Date.now()),
  ]);

// ——— paiement ———
async function markPaid(env, inv, ref) {
  const r = await env.DB.prepare(
    `UPDATE invoices SET status='payée', paid_at=?, payment_ref=? WHERE id=? AND status<>'payée'`
  ).bind(today(), ref, inv.id).run();
  if (!r.meta.changes) return;
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO documents (id, project_id, name, type, size_bytes, date, uploaded_by, kind, ref_id) VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(uid(), inv.project_id, `Reçu — facture ${inv.id}`, 'PDF', 0, today(), 'studio', 'receipt', inv.id),
    env.DB.prepare('INSERT INTO activity (client_id, date, text) VALUES (?,?,?)').bind(
      inv.client_id, today(), `Facture <b>${esc(inv.id)}</b> réglée (${esc(eur(inv.amount_cents))})`
    ),
  ]);
  await sendMail(env, {
    to: teamMail(env), subject: `Facture ${inv.id} réglée`,
    html: mailLayout('Paiement reçu', `<p>La facture <b>${esc(inv.id)}</b> (${esc(eur(inv.amount_cents))}) vient d’être réglée.</p>`),
  });
}

// ——— pages imprimables (facture / devis / reçu) ———
const PRINT_CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:";
const printPage = (title, inner) =>
  new Response(
    `<!doctype html><html lang="fr"><meta charset="utf-8"><title>${esc(title)}</title><meta name="robots" content="noindex">` +
      `<style>body{font:14px/1.5 Helvetica,Arial,sans-serif;color:#0a0f2c;max-width:760px;margin:40px auto;padding:0 24px}h1{font-weight:300;font-size:34px;margin:0}small,.mu{color:#6e6e69}` +
      `table{width:100%;border-collapse:collapse;margin:24px 0}th,td{padding:10px 8px;border-bottom:1px solid #ddd;text-align:left}th:last-child,td:last-child,.r{text-align:right}` +
      `.tot{margin-left:auto;width:260px}.tot div{display:flex;justify-content:space-between;padding:4px 0}.tot .g{font-weight:600;border-top:2px solid #0a0f2c;margin-top:6px;padding-top:8px}` +
      `.stamp{display:inline-block;border:2px solid #2c5a3a;color:#2c5a3a;padding:4px 12px;border-radius:8px;font-weight:600;transform:rotate(-4deg)}` +
      `.btn{background:#ff6a1a;border:0;border-radius:12px;padding:10px 18px;font:inherit;cursor:pointer}@media print{.btn{display:none}}</style>` +
      `<p><b>Eight Projects</b><br><small>Belgique · contact@eightprojects.be</small></p>${inner}` +
      `<p><button class="btn" onclick="print()">Imprimer / enregistrer en PDF</button></p></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': PRINT_CSP, 'cache-control': 'no-store' } }
  );

async function printInvoice(env, inv) {
  const c = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(inv.client_id).first();
  const paid = inv.status === 'payée';
  return printPage(`Facture ${inv.id}`,
    `<h1>Facture ${esc(inv.id)}</h1><p class="mu">Émise le ${frDate(inv.date)} · échéance ${frDate(inv.due)}</p>` +
    `<p><b>${esc(c.name)}</b><br>${esc(c.contact)} · ${esc(c.email)}</p>` +
    `<table><tr><th>Désignation</th><th>Projet</th><th class="r">Montant TTC</th></tr><tr><td>${esc(inv.label)}</td><td>${esc(inv.project_name)}</td><td class="r">${esc(eur(inv.amount_cents))}</td></tr></table>` +
    (paid
      ? `<p><span class="stamp">ACQUITTÉE</span> <span class="mu">le ${frDate(inv.paid_at)}</span></p>`
      : `<p class="mu">Communication structurée : <b>${esc(ogm(inv.id))}</b></p>`));
}
async function printQuote(env, q) {
  const c = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(q.client_id).first();
  const lines = (await env.DB.prepare('SELECT * FROM quote_lines WHERE quote_id = ? ORDER BY pos').bind(q.id).all()).results;
  const ht = lines.reduce((s, l) => s + Math.round(l.qty * l.unit_price_cents), 0);
  const tva = Math.round(ht * 0.21);
  return printPage(`Devis ${q.id}`,
    `<h1>Devis ${esc(q.id)}</h1><p class="mu">Émis le ${frDate(q.date)} · valable jusqu’au ${frDate(q.valid_until)}</p>` +
    `<p><b>${esc(c.name)}</b><br>${esc(c.contact)} · ${esc(c.email)}</p><p>${esc(q.label)} <small>· ${esc(q.project_name)}</small></p>` +
    `<table><tr><th>Désignation</th><th class="r">Qté</th><th class="r">Montant HT</th></tr>${lines.map((l) => `<tr><td>${esc(l.label)}</td><td class="r">${l.qty}</td><td class="r">${esc(eur(Math.round(l.qty * l.unit_price_cents)))}</td></tr>`).join('')}</table>` +
    `<div class="tot"><div><span>Total HT</span><span>${esc(eur(ht))}</span></div><div><span>TVA 21 %</span><span>${esc(eur(tva))}</span></div><div class="g"><span>Total TTC</span><span>${esc(eur(ht + tva))}</span></div></div>` +
    (q.status === 'signé'
      ? `<p><span class="stamp">SIGNÉ</span> <span class="mu">par ${esc(q.signed_by)} le ${esc(q.signed_at.replace('T', ' ').slice(0, 16))} UTC · IP ${esc(q.signed_ip || 'n/c')}</span></p>`
      : ''));
}

// ——— routeur ———
export async function onRequest({ request, env, params }) {
  const path = (params.path || []).join('/');
  const method = request.method;
  const url = new URL(request.url);

  if (!env.DB) return err('Base de données non configurée.', 500);

  // Protection CSRF : les écritures doivent venir du même site.
  if (method !== 'GET' && method !== 'HEAD') {
    const o = request.headers.get('origin');
    if (o && new URL(o).host !== url.host) return err('Origine refusée.', 403);
  }

  // ——— routes publiques ———
  if (path === 'login' && method === 'POST') {
    const b = await request.json().catch(() => ({}));
    const email = String(b.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || !b.password) return err('Identifiants invalides.', 401);
    if (await tooMany(env, email)) return err('Trop de tentatives. Réessayez dans quelques minutes.', 429);
    const u = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    const ok = await verifyPassword(String(b.password), u?.password_hash);
    if (!u || !ok) { await note(env, email); return err('Identifiants invalides.', 401); }
    return json({ ok: true, role: u.role }, 200, { 'set-cookie': await startSession(env, request, u.id) });
  }

  if (path === 'magic' && method === 'POST') {
    const b = await request.json().catch(() => ({}));
    const email = String(b.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return err('Adresse e-mail invalide.');
    if (await tooMany(env, email)) return err('Trop de tentatives. Réessayez dans quelques minutes.', 429);
    await note(env, email);
    const u = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (u) await sendLoginLink(env, request, u.id, email, 30 * 60e3, 'Votre lien de connexion', 'Cliquez ci-dessous pour accéder à votre espace client. Ce lien est valable 30 minutes et ne fonctionne qu’une fois.');
    return json({ ok: true }); // réponse identique que le compte existe ou non
  }

  if (path === 'verify') {
    const t = url.searchParams.get('t') || '';
    if (method === 'GET') {
      // Page intermédiaire : évite qu'un scanner d'e-mails consomme le lien.
      return new Response(
        `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Connexion</title>` +
          `<form id="f" method="post" action="/api/portal/verify"><input type="hidden" name="t" value="${esc(t)}">` +
          `<p style="font:16px Helvetica,Arial,sans-serif;text-align:center;margin-top:20vh"><button style="font:inherit;padding:12px 22px;border-radius:12px;border:0;background:#ff6a1a;cursor:pointer">Accéder à mon espace client</button></p></form>` +
          `<script>document.getElementById('f').submit()</script>`,
        { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; form-action 'self'" } }
      );
    }
    if (method === 'POST') {
      const form = await request.formData().catch(() => null);
      const token = String(form?.get('t') || '');
      if (!/^[a-f0-9]{64}$/.test(token)) return Response.redirect(url.origin + '/espace-client/?err=link', 303);
      const th = await sha256hex(token);
      const row = await env.DB.prepare('SELECT user_id FROM login_tokens WHERE token_hash = ? AND expires_at > ?').bind(th, Date.now()).first();
      await env.DB.prepare('DELETE FROM login_tokens WHERE token_hash = ?').bind(th).run();
      if (!row) return Response.redirect(url.origin + '/espace-client/?err=link', 303);
      return new Response(null, { status: 303, headers: { location: '/espace-client/', 'set-cookie': await startSession(env, request, row.user_id) } });
    }
  }

  // Webhook Mollie : l'identifiant est revérifié auprès de l'API Mollie (rien n'est cru sur parole).
  if (path === 'mollie-webhook' && method === 'POST') {
    const form = await request.formData().catch(() => null);
    const id = String(form?.get('id') || '');
    if (!/^tr_\w+$/.test(id) || !env.MOLLIE_API_KEY) return new Response('ok');
    const r = await fetch(`https://api.mollie.com/v2/payments/${id}`, { headers: { Authorization: `Bearer ${env.MOLLIE_API_KEY}` } });
    if (!r.ok) return new Response('error', { status: 502 });
    const p = await r.json();
    const invId = p.metadata?.invoice;
    if (p.status === 'paid' && invId) {
      const inv = await env.DB.prepare('SELECT i.*, p.client_id FROM invoices i JOIN projects p ON p.id = i.project_id WHERE i.id = ? AND i.payment_id = ?').bind(invId, id).first();
      if (inv) await markPaid(env, inv, id);
    }
    return new Response('ok');
  }

  // ——— routes authentifiées ———
  const user = await getUser(request, env);
  if (path === 'me' && method === 'GET') {
    if (!user) return err('Non connecté.', 401);
    return json({ role: user.role, name: user.name, email: user.email, clientId: user.clientId });
  }
  if (!user) return err('Non connecté.', 401);
  const isAdmin = user.role === 'admin';
  const seg = path.split('/');

  if (path === 'logout' && method === 'POST') {
    const m = /ep_session=([a-f0-9]{64})/.exec(request.headers.get('cookie') || '');
    if (m) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256hex(m[1])).run();
    return json({ ok: true }, 200, { 'set-cookie': clearCookie(request) });
  }

  if (path === 'data' && method === 'GET') return json(await buildData(env, user));

  // Téléchargement d'un document
  if (seg[0] === 'docs' && seg[1] && method === 'GET') {
    const d = await env.DB.prepare('SELECT d.*, p.client_id FROM documents d JOIN projects p ON p.id = d.project_id WHERE d.id = ?').bind(seg[1]).first();
    if (!d || !(isAdmin || d.client_id === user.clientId)) return err('Introuvable.', 404);
    if (d.kind === 'receipt') return Response.redirect(`${url.origin}/api/portal/print/invoice/${encodeURIComponent(d.ref_id)}`, 302);
    if (d.kind === 'signed_quote') return Response.redirect(`${url.origin}/api/portal/print/quote/${encodeURIComponent(d.ref_id)}`, 302);
    const obj = await env.BUCKET?.get(d.storage_key);
    if (!obj) return err('Fichier introuvable.', 404);
    return new Response(obj.body, { headers: fileHeaders(d.name, d.type, obj.httpMetadata?.contentType) });
  }
  if (seg[0] === 'deliverables' && seg[1] && seg[2] === 'file' && method === 'GET') {
    const d = await delivOf(env, user, seg[1]);
    if (!d?.storage_key) return err('Introuvable.', 404);
    const obj = await env.BUCKET?.get(d.storage_key);
    if (!obj) return err('Fichier introuvable.', 404);
    return new Response(obj.body, { headers: fileHeaders(d.name, d.type, obj.httpMetadata?.contentType) });
  }

  // Pages imprimables
  if (seg[0] === 'print' && seg[2] && method === 'GET') {
    if (seg[1] === 'invoice') { const i = await invoiceOf(env, user, seg[2]); return i ? printInvoice(env, i) : err('Introuvable.', 404); }
    if (seg[1] === 'quote') { const q = await quoteOf(env, user, seg[2]); return q ? printQuote(env, q) : err('Introuvable.', 404); }
  }

  if (method !== 'POST') return err('Introuvable.', 404);

  // ——— Dépôt de fichiers ———
  if (path === 'docs') {
    const form = await request.formData().catch(() => null);
    if (!form) return err('Requête invalide.');
    const p = await projectOf(env, user, form.get('project'));
    if (!p) return err('Projet introuvable.', 404);
    const files = form.getAll('files').filter((f) => typeof f === 'object' && f.name);
    if (!files.length) return err('Aucun fichier.');
    if (!env.BUCKET) return err('Stockage de fichiers non configuré.', 500);
    const by = isAdmin ? 'studio' : 'client';
    for (const f of files) {
      if (f.size > MAX_FILE) return err(`« ${f.name} » dépasse 100 Mo.`, 413);
    }
    for (const f of files) {
      const id = uid();
      const safe = f.name.replace(/[^\w.\- ()àâäéèêëîïôöùûüç]+/gi, '_').slice(0, 120) || 'fichier';
      const key = `${p.client_id}/${p.id}/${id}/${safe}`;
      await env.BUCKET.put(key, f.stream(), { httpMetadata: { contentType: f.type || 'application/octet-stream' } });
      const ext = (safe.includes('.') ? safe.split('.').pop() : 'fichier').toUpperCase().slice(0, 4);
      await env.DB.prepare(
        `INSERT INTO documents (id, project_id, name, type, size_bytes, date, uploaded_by, storage_key, kind) VALUES (?,?,?,?,?,?,?,?, 'file')`
      ).bind(id, p.id, safe.replace(/\.[^.]+$/, ''), ext, f.size, today(), by, key).run();
    }
    const n = files.length;
    await log(env, p.client_id, `${isAdmin ? 'Document ajouté' : 'Vous avez déposé'} : <b>${n > 1 ? n + ' fichiers' : esc(files[0].name)}</b>`);
    const c = await clientEmail(env, p.client_id);
    await sendMail(env, isAdmin
      ? { to: c.email, subject: `Nouveau document — ${p.name}`, html: mailLayout('Nouveau document', `<p>${n} document${n > 1 ? 's ont été ajoutés' : ' a été ajouté'} à votre projet <b>${esc(p.name)}</b>.</p>`, { href: origin(request) + '/espace-client/#documents', label: 'Voir mes documents' }) }
      : { to: teamMail(env), subject: `Fichiers déposés — ${c.contact}`, html: mailLayout('Fichiers déposés', `<p>${esc(c.contact)} a déposé ${n} fichier${n > 1 ? 's' : ''} dans <b>${esc(p.name)}</b>.</p>`) });
    return json({ ok: true, count: n });
  }

  const b = await request.json().catch(() => ({}));

  // ——— Paiement ———
  if (seg[0] === 'invoices' && seg[2] === 'pay') {
    const inv = await invoiceOf(env, user, seg[1]);
    if (!inv || isAdmin) return err('Facture introuvable.', 404);
    if (inv.status === 'payée') return err('Cette facture est déjà réglée.', 409);
    if (env.MOLLIE_API_KEY) {
      const o = origin(request);
      const r = await fetch('https://api.mollie.com/v2/payments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.MOLLIE_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: { currency: 'EUR', value: (inv.amount_cents / 100).toFixed(2) },
          description: `Facture ${inv.id}`,
          redirectUrl: `${o}/espace-client/#factures`,
          ...(o.startsWith('https://') ? { webhookUrl: `${o}/api/portal/mollie-webhook` } : {}),
          method: b.method === 'card' ? 'creditcard' : 'bancontact',
          locale: 'fr_BE',
          metadata: { invoice: inv.id },
        }),
      });
      if (!r.ok) { console.error('[mollie]', r.status, await r.text()); return err('Le paiement en ligne est momentanément indisponible.', 502); }
      const p = await r.json();
      await env.DB.prepare('UPDATE invoices SET payment_id = ? WHERE id = ?').bind(p.id, inv.id).run();
      return json({ url: p._links.checkout.href });
    }
    if (env.SIMULATE_PAYMENTS === '1') { await markPaid(env, inv, 'simulation'); return json({ ok: true, simulated: true }); }
    return err('Le paiement en ligne n’est pas encore activé. Utilisez le virement.', 501);
  }
  if (seg[0] === 'invoices' && seg[2] === 'transfer') {
    const inv = await invoiceOf(env, user, seg[1]);
    if (!inv || isAdmin) return err('Facture introuvable.', 404);
    await sendMail(env, { to: teamMail(env), subject: `Virement annoncé — ${inv.id}`, html: mailLayout('Virement annoncé', `<p>Le client indique avoir viré <b>${esc(eur(inv.amount_cents))}</b> pour la facture <b>${esc(inv.id)}</b>. À vérifier sur le compte.</p>`) });
    return json({ ok: true });
  }
  if (seg[0] === 'invoices' && seg[2] === 'remind') {
    if (!isAdmin) return err('Accès refusé.', 403);
    const inv = await invoiceOf(env, user, seg[1]);
    if (!inv || inv.status === 'payée') return err('Facture introuvable.', 404);
    const c = await clientEmail(env, inv.client_id);
    await sendMail(env, { to: c.email, subject: `Rappel — facture ${inv.id}`, html: mailLayout('Rappel de paiement', `<p>Bonjour ${esc(c.contact.split(' ')[0])},</p><p>Sauf erreur de notre part, la facture <b>${esc(inv.id)}</b> (${esc(eur(inv.amount_cents))}, échéance ${frDate(inv.due)}) n’est pas encore réglée.</p>`, { href: origin(request) + '/espace-client/#factures', label: 'Régler la facture' }) });
    return json({ ok: true });
  }

  // ——— Devis ———
  if (seg[0] === 'quotes' && (seg[2] === 'sign' || seg[2] === 'refuse')) {
    const q = await quoteOf(env, user, seg[1]);
    if (!q || isAdmin) return err('Devis introuvable.', 404);
    if (q.status !== 'à signer') return err('Ce devis n’est plus à signer.', 409);
    if (seg[2] === 'refuse') {
      await env.DB.prepare(`UPDATE quotes SET status='refusé' WHERE id=?`).bind(q.id).run();
      await log(env, q.client_id, `Devis <b>${esc(q.id)}</b> refusé`);
      await sendMail(env, { to: teamMail(env), subject: `Devis ${q.id} refusé`, html: mailLayout('Devis refusé', `<p>Le devis <b>${esc(q.id)}</b> (${esc(q.label)}) a été refusé.</p>`) });
      return json({ ok: true });
    }
    const name = String(b.name || '').trim().slice(0, 120);
    if (!name || b.agree !== true) return err('Nom et acceptation des conditions requis.');
    if (q.valid_until < today()) return err('Ce devis a expiré. Contactez-nous pour en obtenir un nouveau.', 410);
    await env.DB.batch([
      env.DB.prepare(`UPDATE quotes SET status='signé', signed_at=?, signed_by=?, signed_ip=? WHERE id=?`).bind(
        new Date().toISOString(), name, request.headers.get('cf-connecting-ip') || null, q.id),
      env.DB.prepare(`INSERT INTO documents (id, project_id, name, type, size_bytes, date, uploaded_by, kind, ref_id) VALUES (?,?,?,?,?,?,?,?,?)`).bind(
        uid(), q.project_id, `Devis signé — ${q.id}`, 'PDF', 0, today(), 'client', 'signed_quote', q.id),
      env.DB.prepare('INSERT INTO activity (client_id, date, text) VALUES (?,?,?)').bind(
        q.client_id, today(), `Devis <b>${esc(q.id)}</b> signé par ${esc(name)}`),
    ]);
    await sendMail(env, { to: teamMail(env), subject: `Devis ${q.id} signé`, html: mailLayout('Devis signé', `<p>Le devis <b>${esc(q.id)}</b> (${esc(q.label)}) a été signé par ${esc(name)}.</p>`) });
    return json({ ok: true });
  }

  // ——— Livrables ———
  if (seg[0] === 'deliverables' && seg[2] === 'comment') {
    const d = await delivOf(env, user, seg[1]);
    const text = String(b.text || '').trim().slice(0, 3000);
    if (!d || !text) return err('Commentaire invalide.');
    await env.DB.prepare('INSERT INTO comments (deliverable_id, author, is_client, date, text) VALUES (?,?,?,?,?)').bind(d.id, user.name, isAdmin ? 0 : 1, today(), text).run();
    if (isAdmin) {
      const c = await clientEmail(env, d.client_id);
      await sendMail(env, { to: c.email, subject: `Nouveau commentaire — ${d.name}`, html: mailLayout('Nouveau commentaire', `<p>L’équipe a commenté <b>${esc(d.name)}</b> :</p><p style="white-space:pre-wrap">${esc(text)}</p>`, { href: origin(request) + '/espace-client/', label: 'Ouvrir mon espace' }) });
    }
    return json({ ok: true });
  }
  if (seg[0] === 'deliverables' && seg[2] === 'review') {
    const d = await delivOf(env, user, seg[1]);
    if (!d || isAdmin) return err('Livrable introuvable.', 404);
    const text = String(b.text || '').trim().slice(0, 3000);
    if (b.action === 'changes') {
      if (!text) return err('Précisez les modifications souhaitées.');
      await env.DB.prepare('INSERT INTO comments (deliverable_id, author, is_client, date, text) VALUES (?,?,?,?,?)').bind(d.id, user.name, 1, today(), text).run();
      await env.DB.prepare(`UPDATE deliverables SET status='modifs demandées' WHERE id=?`).bind(d.id).run();
      await log(env, d.client_id, `Modifications demandées sur <b>${esc(d.name)}</b>`);
      await sendMail(env, { to: teamMail(env), subject: `Modifications demandées — ${d.name}`, html: mailLayout('Modifications demandées', `<p>${esc(user.name)} demande des modifications sur <b>${esc(d.name)}</b> (${esc(d.project_name)}) :</p><p style="white-space:pre-wrap">${esc(text)}</p>`) });
    } else if (b.action === 'validate') {
      if (text) await env.DB.prepare('INSERT INTO comments (deliverable_id, author, is_client, date, text) VALUES (?,?,?,?,?)').bind(d.id, user.name, 1, today(), text).run();
      await env.DB.prepare(`UPDATE deliverables SET status='validé' WHERE id=?`).bind(d.id).run();
      await log(env, d.client_id, `Livrable validé : <b>${esc(d.name)}</b>`);
      await sendMail(env, { to: teamMail(env), subject: `Livrable validé — ${d.name}`, html: mailLayout('Livrable validé', `<p>${esc(user.name)} a validé <b>${esc(d.name)}</b> (${esc(d.project_name)}).</p>`) });
    } else return err('Action invalide.');
    return json({ ok: true });
  }

  // ——— Équipe ———
  if (!isAdmin) return err('Accès refusé.', 403);

  if (path === 'admin/invoices') {
    const p = await projectOf(env, user, b.project);
    const cents = Math.round(Number(b.amount) * 100);
    const label = String(b.label || '').trim().slice(0, 200);
    if (!p || !label || !(cents > 0) || !DATE_RE.test(String(b.due))) return err('Données invalides.');
    const id = await nextNumber(env, 'invoices', 'F');
    await env.DB.prepare('INSERT INTO invoices (id, project_id, label, amount_cents, date, due) VALUES (?,?,?,?,?,?)').bind(id, p.id, label, cents, today(), b.due).run();
    await log(env, p.client_id, `Nouvelle facture : <b>${esc(id)}</b>`);
    const c = await clientEmail(env, p.client_id);
    await sendMail(env, { to: c.email, subject: `Nouvelle facture ${id}`, html: mailLayout('Nouvelle facture', `<p>Bonjour ${esc(c.contact.split(' ')[0])},</p><p>La facture <b>${esc(id)}</b> (${esc(label)}) de <b>${esc(eur(cents))}</b> est disponible, échéance le ${frDate(b.due)}.</p>`, { href: origin(request) + '/espace-client/#factures', label: 'Voir la facture' }) });
    return json({ ok: true, id });
  }
  if (path === 'admin/quotes') {
    const p = await projectOf(env, user, b.project);
    const cents = Math.round(Number(b.amount) * 100);
    const label = String(b.label || '').trim().slice(0, 200);
    if (!p || !label || !(cents > 0) || !DATE_RE.test(String(b.valid))) return err('Données invalides.');
    const id = await nextNumber(env, 'quotes', 'D');
    await env.DB.batch([
      env.DB.prepare('INSERT INTO quotes (id, project_id, label, date, valid_until) VALUES (?,?,?,?,?)').bind(id, p.id, label, today(), b.valid),
      env.DB.prepare('INSERT INTO quote_lines (quote_id, pos, label, qty, unit_price_cents) VALUES (?,?,?,?,?)').bind(id, 0, label, 1, cents),
    ]);
    await log(env, p.client_id, `Nouveau devis : <b>${esc(id)}</b> — ${esc(label)}`);
    const c = await clientEmail(env, p.client_id);
    await sendMail(env, { to: c.email, subject: `Nouveau devis ${id}`, html: mailLayout('Nouveau devis à signer', `<p>Bonjour ${esc(c.contact.split(' ')[0])},</p><p>Le devis <b>${esc(id)}</b> (${esc(label)}) est prêt à être signé, valable jusqu’au ${frDate(b.valid)}.</p>`, { href: origin(request) + '/espace-client/#devis', label: 'Consulter le devis' }) });
    return json({ ok: true, id });
  }
  if (path === 'admin/clients') {
    const name = String(b.name || '').trim().slice(0, 120), contact = String(b.contact || '').trim().slice(0, 120);
    const email = String(b.email || '').trim().toLowerCase();
    if (!name || !contact || !EMAIL_RE.test(email)) return err('Données invalides.');
    if (await env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first()) return err('Un compte existe déjà avec cet e-mail.', 409);
    let id = slug(name) || 'client';
    if (await env.DB.prepare('SELECT 1 FROM clients WHERE id = ?').bind(id).first()) id += '-' + uid().slice(0, 4);
    const userId = uid();
    await env.DB.batch([
      env.DB.prepare('INSERT INTO clients (id, name, contact, email) VALUES (?,?,?,?)').bind(id, name, contact, email),
      env.DB.prepare(`INSERT INTO users (id, email, name, role, client_id) VALUES (?,?,?, 'client', ?)`).bind(userId, email, contact, id),
    ]);
    await sendLoginLink(env, request, userId, email, 7 * 864e5, 'Bienvenue sur votre espace client',
      `Bonjour ${esc(contact.split(' ')[0])}, Eight Projects vous a ouvert un espace client : documents, factures, devis et livrables de vos projets au même endroit. Ce lien est valable 7 jours.`);
    return json({ ok: true, id });
  }

  return err('Introuvable.', 404);
}

async function sendLoginLink(env, request, userId, email, ttl, title, text) {
  const token = randomToken();
  await env.DB.prepare('INSERT INTO login_tokens (token_hash, user_id, expires_at) VALUES (?,?,?)').bind(await sha256hex(token), userId, Date.now() + ttl).run();
  const href = `${origin(request)}/api/portal/verify?t=${token}`;
  if (!env.RESEND_API_KEY) console.log('[magic-link]', href);
  await sendMail(env, { to: email, subject: title, html: mailLayout(title, `<p>${text}</p>`, { href, label: 'Accéder à mon espace' }) });
}

async function nextNumber(env, table, prefix) {
  const y = new Date().getUTCFullYear();
  const rows = (await env.DB.prepare(`SELECT id FROM ${table} WHERE id LIKE ?`).bind(`${prefix}-${y}-%`).all()).results;
  const max = rows.reduce((m, r) => Math.max(m, parseInt(r.id.split('-')[2], 10) || 0), 0);
  return `${prefix}-${y}-${String(max + 1).padStart(3, '0')}`;
}

function fileHeaders(name, ext, contentType) {
  const fn = encodeURIComponent(ext && !name.toLowerCase().endsWith('.' + ext.toLowerCase()) ? `${name}.${ext.toLowerCase()}` : name);
  return {
    'content-type': contentType || 'application/octet-stream',
    'content-disposition': `attachment; filename*=UTF-8''${fn}`,
    'x-content-type-options': 'nosniff',
    'cache-control': 'private, no-store',
  };
}
