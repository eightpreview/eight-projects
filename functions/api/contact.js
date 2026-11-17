// Cloudflare Pages Function : POST /api/contact
// Variables d'environnement (Cloudflare > Pages > Settings > Variables, ou .dev.vars en local) :
//   RESEND_API_KEY  clé API Resend (secret). Absente en local => le message est seulement loggé.
//   CONTACT_TO      destinataire (défaut : contact@eightprojects.be)
//   CONTACT_FROM    expéditeur vérifié dans Resend (ex. "Eight Projects <no-reply@eightprojects.be>")

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const NEEDS = ['Site web', 'Contenu', 'Identité', 'Réseaux sociaux'];

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'Requête invalide.' }, 400);
  }

  // Honeypot : un bot remplit ce champ caché, on fait semblant de réussir.
  if (data.website) return json({ ok: true });

  const email = String(data.email || '').trim();
  const message = String(data.message || '').trim();
  const needs = (Array.isArray(data.needs) ? data.needs : []).filter((n) => NEEDS.includes(n));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200)
    return json({ error: 'Adresse e-mail invalide.' }, 400);
  if (message.length < 3 || message.length > 5000) return json({ error: 'Message invalide.' }, 400);

  const to = env.CONTACT_TO || 'contact@eightprojects.be';
  const from = env.CONTACT_FROM || 'Eight Projects <no-reply@eightprojects.be>';
  const subject = `Nouveau projet${needs.length ? ' – ' + needs.join(', ') : ''}`;
  const html =
    `<p><b>De :</b> ${esc(email)}</p>` +
    `<p><b>Besoin :</b> ${needs.length ? esc(needs.join(', ')) : 'non précisé'}</p>` +
    `<p style="white-space:pre-wrap">${esc(message)}</p>`;

  if (!env.RESEND_API_KEY) {
    console.log('[contact] RESEND_API_KEY absente, e-mail non envoyé :', { to, subject, email, needs, message });
    return json({ ok: true, dev: true });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [to], reply_to: email, subject, html }),
  });
  if (!res.ok) {
    console.error('[contact] Resend', res.status, await res.text());
    return json({ error: 'Envoi impossible, réessayez ou écrivez-nous directement.' }, 502);
  }
  return json({ ok: true });
}

export const onRequest = () => json({ error: 'Méthode non autorisée.' }, 405);
