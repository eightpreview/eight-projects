// Helpers partagés de l'API espace client (Cloudflare Pages Functions + D1 + R2)

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const today = () => new Date().toISOString().slice(0, 10);

const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');

export const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));
export const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);
export const sha256hex = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

// ——— Mots de passe (PBKDF2-SHA256, 100 000 itérations = maximum autorisé par Workers) ———
async function pbkdf2(pw, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256);
}
export async function hashPassword(pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$100000$${b64(salt)}$${b64(await pbkdf2(pw, salt, 100000))}`;
}
export async function verifyPassword(pw, stored) {
  if (!stored) return false;
  const [, it, s, h] = stored.split('$');
  const got = new Uint8Array(await pbkdf2(pw, unb64(s), +it));
  const want = unb64(h);
  if (got.length !== want.length) return false;
  let d = 0;
  for (let i = 0; i < got.length; i++) d |= got[i] ^ want[i];
  return d === 0;
}

// ——— Sessions ———
const COOKIE = 'ep_session';
const SESSION_DAYS = 14;
const cookie = (value, maxAge, secure) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
const isHttps = (request) => new URL(request.url).protocol === 'https:';

export async function getUser(request, env) {
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})`).exec(request.headers.get('cookie') || '');
  if (!m) return null;
  return env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.client_id AS clientId
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`
  )
    .bind(await sha256hex(m[1]), Date.now())
    .first();
}

export async function startSession(env, request, userId) {
  const token = randomToken();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()),
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)').bind(
      await sha256hex(token),
      userId,
      Date.now() + SESSION_DAYS * 864e5
    ),
    env.DB.prepare(
      `UPDATE clients SET last_login = ? WHERE id = (SELECT client_id FROM users WHERE id = ?)`
    ).bind(today(), userId),
  ]);
  return cookie(token, SESSION_DAYS * 86400, isHttps(request));
}

export const clearCookie = (request) => cookie('', 0, isHttps(request));

// ——— E-mails (Resend) ———
export async function sendMail(env, { to, subject, html, replyTo }) {
  if (!env.RESEND_API_KEY) {
    console.log('[mail] RESEND_API_KEY absente, e-mail non envoyé :', JSON.stringify({ to, subject, html }));
    return true;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM || 'Eight Projects <no-reply@eightprojects.be>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) console.error('[mail] Resend', res.status, await res.text());
  return res.ok;
}

export const mailLayout = (title, body, cta) =>
  `<div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#0a0f2c">` +
  `<p style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6e6e69">Eight Projects</p>` +
  `<h1 style="font-weight:300;font-size:26px;margin:0 0 16px">${esc(title)}</h1>` +
  `<div style="font-size:15px;line-height:1.55">${body}</div>` +
  (cta
    ? `<p style="margin:28px 0"><a href="${esc(cta.href)}" style="background:#ff6a1a;color:#0a0f2c;padding:13px 22px;border-radius:12px;text-decoration:none;font-weight:500">${esc(cta.label)}</a></p>`
    : '') +
  `<p style="font-size:12px;color:#6e6e69;margin-top:32px">Eight Projects · contact@eightprojects.be</p></div>`;

export const origin = (request) => new URL(request.url).origin;

// ——— Formats / calculs ———
export const fmtSize = (b) =>
  b > 1e6 ? (b / 1e6).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round(b / 1e3)) + ' Ko';

export const eur = (cents) =>
  (cents / 100).toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' });

export const frDate = (s) =>
  s ? new Date(s + 'T12:00:00Z').toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';

// Communication structurée belge (+++xxx/xxxx/xxxxx+++) dérivée du n° de facture
export function ogm(invoiceId) {
  const base = invoiceId.replace(/\D/g, '').padStart(10, '0').slice(-10);
  let chk = Number(BigInt(base) % 97n);
  if (chk === 0) chk = 97;
  const d = base + String(chk).padStart(2, '0');
  return `+++${d.slice(0, 3)}/${d.slice(3, 7)}/${d.slice(7)}+++`;
}

export const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
