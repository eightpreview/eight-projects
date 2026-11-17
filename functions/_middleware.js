// Page d'accès protégée par mot de passe (temporaire, pendant la construction du site).
// Actif uniquement si la variable secrète SITE_PASSWORD est définie. Pour ouvrir le site au public : supprimer cette variable
// (Cloudflare > Workers & Pages > eight-projects > Settings > Variables and Secrets) puis redéployer.
import { esc } from './_lib/util.js';

const COOKIE = 'ep_gate';
const DAYS = 30;
const enc = new TextEncoder();
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
// Comparaison en temps constant via comparaison de condensats.
async function same(a, b) {
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}

async function hasAccess(request, pw) {
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d+)\\.([a-f0-9]{64})`).exec(request.headers.get('cookie') || '');
  if (!m || Number(m[1]) < Date.now()) return false;
  return same(m[2], await hmac(pw, 'gate-v1:' + m[1]));
}

const page = (error, next) =>
  new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<meta name="robots" content="noindex,nofollow"><title>Accès privé — Eight Projects</title>` +
      `<link href="https://fonts.googleapis.com/css2?family=Geist:wght@200;300;400&display=swap" rel="stylesheet">` +
      `<style>*{box-sizing:border-box}html,body{height:100%;margin:0}` +
      `body{font-family:Geist,Helvetica,Arial,sans-serif;font-weight:300;color:#fff;-webkit-font-smoothing:antialiased;` +
      `background:linear-gradient(180deg,#3f5a82 0%,#0f2257 12%,#050a24 36%,#050a24 44%,#3a0d22 50%,#c2321f 57%,#ff6a1a 62%,#ffa25a 65%,#ff6a1a 69%,#ff2a12 80%,#ff3d6b 100%);` +
      `display:grid;place-items:center;padding:24px}` +
      `main{width:100%;max-width:400px}img{height:34px;display:block;margin:0 auto 40px;filter:brightness(0) invert(1)}` +
      `h1{font-weight:200;font-size:44px;letter-spacing:-.04em;line-height:1;text-align:center;margin:0 0 10px}` +
      `p.s{text-align:center;margin:0 0 28px;color:rgba(255,255,255,.75)}` +
      `form{background:rgba(5,10,36,.55);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.18);border-radius:20px;padding:22px}` +
      `label{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;color:rgba(255,255,255,.7)}` +
      `input{width:100%;font:inherit;font-weight:300;font-size:16px;color:#0a0f2c;background:#fff;border:0;border-radius:10px;padding:13px 14px;outline:2px solid transparent}` +
      `input:focus{outline-color:#ff6a1a}` +
      `button{width:100%;margin-top:14px;font:inherit;font-weight:400;font-size:16px;color:#0a0f2c;background:#ff6a1a;border:0;border-radius:12px;padding:14px;cursor:pointer}` +
      `button:hover{background:#ffa25a}.e{margin:0 0 14px;padding:10px 12px;border-radius:10px;background:#ffe0e7;color:#a8102f;font-size:14px}</style></head>` +
      `<body><main><img src="/assets/logo-eight.svg" alt="eight projects"><h1>Accès privé</h1><p class="s">Le site est en cours de construction.</p>` +
      `<form method="post" action="/__access">${error ? `<p class="e" role="alert">${esc(error)}</p>` : ''}` +
      `<input type="hidden" name="next" value="${esc(next)}"><label for="pw">Mot de passe</label>` +
      `<input id="pw" name="pw" type="password" autocomplete="current-password" autofocus required><button>Entrer</button></form></main></body></html>`,
    {
      status: error === 'Trop de tentatives. Réessayez dans quelques minutes.' ? 429 : 401,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' },
    }
  );

export async function onRequest({ request, env, next }) {
  const pw = env.SITE_PASSWORD;
  if (!pw) return next(); // protection désactivée

  const url = new URL(request.url);
  // Le webhook de paiement et le logo de la page d'accès doivent rester joignables.
  if (url.pathname === '/api/portal/mollie-webhook' || url.pathname === '/assets/logo-eight.svg') return next();

  if (url.pathname === '/__access' && request.method === 'POST') {
    const form = await request.formData().catch(() => null);
    const given = String(form?.get('pw') || '');
    let nxt = String(form?.get('next') || '/');
    if (!/^\/(?!\/)[^\s\\]*$/.test(nxt)) nxt = '/'; // redirection interne uniquement
    const key = 'gate:' + (request.headers.get('cf-connecting-ip') || 'local');
    // La limitation de tentatives ne doit jamais empêcher l'accès si la base est indisponible.
    const db = async (sql, ...args) => { try { return await env.DB?.prepare(sql).bind(...args).first(); } catch { return null; } };
    const tries = await db('SELECT COUNT(*) n FROM auth_attempts WHERE email = ? AND at > ?', key, Date.now() - 15 * 60e3);
    if (tries && tries.n >= 10) return page('Trop de tentatives. Réessayez dans quelques minutes.', nxt);
    if (!(await same(given, pw))) {
      await db('INSERT INTO auth_attempts (email, at) VALUES (?,?) RETURNING 1', key, Date.now());
      return page('Mot de passe incorrect.', nxt);
    }
    const exp = String(Date.now() + DAYS * 864e5);
    const secure = url.protocol === 'https:' ? '; Secure' : '';
    return new Response(null, {
      status: 303,
      headers: {
        location: nxt,
        'cache-control': 'no-store',
        'set-cookie': `${COOKIE}=${exp}.${await hmac(pw, 'gate-v1:' + exp)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DAYS * 86400}${secure}`,
      },
    });
  }

  if (await hasAccess(request, pw)) {
    const res = await next();
    const out = new Response(res.body, res);
    out.headers.set('x-robots-tag', 'noindex, nofollow');
    return out;
  }
  return page('', url.pathname + url.search);
}
