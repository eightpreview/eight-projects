// Construit le jeu de données (même forme que le prototype EP_DATA), filtré selon le rôle.
import { today, fmtSize, ogm } from './util.js';

export async function buildData(env, user) {
  const cid = user.role === 'client' ? user.clientId : null;
  const where = (col) => (cid ? `WHERE ${col} = ?` : '');
  const bind = (stmt) => (cid ? stmt.bind(cid) : stmt);
  const all = async (sql, col) => (await bind(env.DB.prepare(sql.replace('/*W*/', where(col)))).all()).results;
  const t = today();

  const [clients, projects, steps, delivs, comments, docs, invoices, quotes, lines, activity] = await Promise.all([
    all('SELECT id, name, contact, email, last_login FROM clients /*W*/', 'id'),
    all('SELECT * FROM projects /*W*/ ORDER BY start DESC', 'client_id'),
    all('SELECT s.* FROM project_steps s JOIN projects p ON p.id = s.project_id /*W*/ ORDER BY s.project_id, s.pos', 'p.client_id'),
    all('SELECT d.* FROM deliverables d JOIN projects p ON p.id = d.project_id /*W*/ ORDER BY d.date', 'p.client_id'),
    all('SELECT c.* FROM comments c JOIN deliverables d ON d.id = c.deliverable_id JOIN projects p ON p.id = d.project_id /*W*/ ORDER BY c.id', 'p.client_id'),
    all('SELECT d.* FROM documents d JOIN projects p ON p.id = d.project_id /*W*/ ORDER BY d.date DESC, d.rowid DESC', 'p.client_id'),
    all('SELECT i.* FROM invoices i JOIN projects p ON p.id = i.project_id /*W*/ ORDER BY i.date DESC, i.id DESC', 'p.client_id'),
    all('SELECT q.* FROM quotes q JOIN projects p ON p.id = q.project_id /*W*/ ORDER BY q.date DESC, q.id DESC', 'p.client_id'),
    all('SELECT l.* FROM quote_lines l JOIN quotes q ON q.id = l.quote_id JOIN projects p ON p.id = q.project_id /*W*/ ORDER BY l.quote_id, l.pos', 'p.client_id'),
    all('SELECT * FROM activity /*W*/ ORDER BY date DESC, id DESC LIMIT 200', 'client_id'),
  ]);

  const group = (rows, key) => rows.reduce((m, r) => ((m[r[key]] ||= []).push(r), m), {});
  const stepsBy = group(steps, 'project_id');
  const delivsBy = group(delivs, 'project_id');
  const commentsBy = group(comments, 'deliverable_id');
  const linesBy = group(lines, 'quote_id');

  return {
    clients: clients.map((c) => ({ id: c.id, name: c.name, contact: c.contact, email: c.email, last: c.last_login })),
    projects: projects.map((p) => ({
      id: p.id, client: p.client_id, name: p.name, service: p.service, status: p.status, progress: p.progress,
      start: p.start, due: p.due, lead: p.lead, leadMail: p.lead_email,
      steps: (stepsBy[p.id] || []).map((s) => ({ t: s.title, d: s.date, s: s.state })),
      deliverables: (delivsBy[p.id] || []).map((d) => ({
        id: d.id, name: d.name, type: d.type, date: d.date, status: d.status,
        url: d.url || null, file: !!d.storage_key,
        comments: (commentsBy[d.id] || []).map((c) => ({ a: c.author, c: c.is_client, d: c.date, t: c.text })),
      })),
    })),
    docs: docs.map((d) => ({
      id: d.id, project: d.project_id, name: d.name, type: d.type, size: d.kind === 'file' ? fmtSize(d.size_bytes) : 'PDF',
      date: d.date, by: d.uploaded_by,
    })),
    invoices: invoices.map((i) => ({
      id: i.id, project: i.project_id, label: i.label, amount: i.amount_cents / 100, date: i.date, due: i.due,
      status: i.status === 'payée' ? 'payée' : i.due < t ? 'en retard' : 'à payer', comm: ogm(i.id),
    })),
    quotes: quotes.map((q) => ({
      id: q.id, project: q.project_id, label: q.label, date: q.date, valid: q.valid_until, status: q.status,
      signed: q.signed_at ? q.signed_at.slice(0, 10) : null, signedBy: q.signed_by,
      lines: (linesBy[q.id] || []).map((l) => ({ l: l.label, q: l.qty, p: l.unit_price_cents / 100 })),
    })),
    activity: activity.map((a) => ({ client: a.client_id, d: a.date, t: a.text })),
    bank: {
      beneficiary: env.BANK_NAME || 'Eight Projects',
      iban: env.BANK_IBAN || '— IBAN à renseigner (variable BANK_IBAN) —',
      bic: env.BANK_BIC || '—',
    },
    online: !!env.MOLLIE_API_KEY || env.SIMULATE_PAYMENTS === '1',
  };
}
