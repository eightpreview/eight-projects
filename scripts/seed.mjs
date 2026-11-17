// Génère seed.local.sql : données de DÉMO (issues du prototype) pour tester en local. Ne jamais l'exécuter en production.
//   npm run db:seed
import { readFileSync, writeFileSync } from 'node:fs';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import vm from 'node:vm';

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo-local-2026';
const sandbox = { window: {} };
vm.runInNewContext(readFileSync(new URL('./demo-data.js', import.meta.url), 'utf8'), sandbox);
const D = sandbox.window.EP_DATA;

const q = (v) => (v == null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const cents = (n) => Math.round(n * 100);
const hash = () => {
  const salt = randomBytes(16);
  return `pbkdf2$100000$${salt.toString('base64')}$${pbkdf2Sync(DEMO_PASSWORD, salt, 100000, 32, 'sha256').toString('base64')}`;
};

const out = [
  'DELETE FROM activity; DELETE FROM quote_lines; DELETE FROM quotes; DELETE FROM invoices; DELETE FROM documents;',
  'DELETE FROM comments; DELETE FROM deliverables; DELETE FROM project_steps; DELETE FROM projects;',
  'DELETE FROM sessions; DELETE FROM login_tokens; DELETE FROM auth_attempts; DELETE FROM users; DELETE FROM clients;',
];
const ins = (t, o) => out.push(`INSERT INTO ${t} (${Object.keys(o).join(',')}) VALUES (${Object.values(o).map(q).join(',')});`);

for (const c of D.clients) {
  ins('clients', { id: c.id, name: c.name, contact: c.contact, email: c.email, last_login: c.last });
  ins('users', { id: 'u-' + c.id, email: c.email, name: c.contact, role: 'client', client_id: c.id, password_hash: hash() });
}
ins('users', { id: 'u-admin', email: 'sarah@eightprojects.be', name: 'Sarah Lambert', role: 'admin', client_id: null, password_hash: hash() });

for (const p of D.projects) {
  ins('projects', { id: p.id, client_id: p.client, name: p.name, service: p.service, status: p.status, progress: p.progress, start: p.start, due: p.due, lead: p.lead, lead_email: p.leadMail });
  p.steps.forEach((s, i) => ins('project_steps', { project_id: p.id, pos: i, title: s.t, date: s.d, state: s.s }));
  for (const d of p.deliverables) {
    ins('deliverables', { id: d.id, project_id: p.id, name: d.name, type: d.type, date: d.date, status: d.status, url: d.type === 'Lien' ? 'https://example.com/preprod' : null, storage_key: null });
    for (const c of d.comments) ins('comments', { deliverable_id: d.id, author: c.a, is_client: c.c ? 1 : 0, date: c.d, text: c.t });
  }
}
// Documents de démo : pas de fichier R2 associé (le téléchargement répondra « fichier introuvable »).
for (const d of D.docs) ins('documents', { id: d.id, project_id: d.project, name: d.name, type: d.type, size_bytes: 100000, date: d.date, uploaded_by: d.by, storage_key: null, kind: 'file' });
for (const i of D.invoices)
  ins('invoices', { id: i.id, project_id: i.project, label: i.label, amount_cents: cents(i.amount), date: i.date, due: i.due, status: i.status === 'payée' ? 'payée' : 'à payer', paid_at: i.status === 'payée' ? i.due : null });
for (const qu of D.quotes) {
  ins('quotes', { id: qu.id, project_id: qu.project, label: qu.label, date: qu.date, valid_until: qu.valid, status: qu.status, signed_at: qu.signed || null, signed_by: qu.signedBy || null });
  qu.lines.forEach((l, i) => ins('quote_lines', { quote_id: qu.id, pos: i, label: l.l, qty: l.q, unit_price_cents: cents(l.p) }));
}
for (const a of D.activity) ins('activity', { client_id: a.client, date: a.d, text: a.t });

writeFileSync(new URL('../seed.local.sql', import.meta.url), out.join('\n') + '\n');
console.log(`seed.local.sql généré (${D.clients.length} clients, ${D.projects.length} projets, 1 admin).`);
