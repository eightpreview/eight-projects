# Espace client – Eight Projects (Cloudflare Pages + D1 + R2)

## Local
```bash
npm install
npm run db:init     # crée les tables dans la D1 locale
npm run db:seed     # données de démo (seed.local.sql, jamais en prod)
npm run dev         # http://localhost:8788  (espace client : /espace-client/)
```
Comptes de démo : `claire@maisonlumen.be` (client) et `sarah@eightprojects.be` (équipe). Le mot de passe est `DEMO_PASSWORD` dans `scripts/seed.mjs` (défaut défini dans le script).
En local : e-mails et liens de connexion sont **affichés dans la console** de wrangler, le paiement est **simulé** (`SIMULATE_PAYMENTS=1` dans `.dev.vars`).

## Production (à faire, rien n'est déployé)
1. `npx wrangler d1 create eightprojects-db` → coller le `database_id` dans `wrangler.toml`, puis `npm run db:init:remote`.
2. `npx wrangler r2 bucket create eightprojects-files`.
3. Créer le premier compte équipe (INSERT dans `users` avec `role='admin'`, puis « Recevoir un lien de connexion »).
4. Variables / secrets du projet Pages : `RESEND_API_KEY`, `MAIL_FROM`, `TEAM_EMAIL`, `CONTACT_TO`, `BANK_IBAN`, `BANK_BIC`, `BANK_NAME`, `MOLLIE_API_KEY` (ne pas définir `SIMULATE_PAYMENTS`).
5. Resend : vérifier eightprojects.be (enregistrements DNS dans Cloudflare, sans toucher au MX Hostinger).
6. Mollie : activer Bancontact + carte ; le webhook `/api/portal/mollie-webhook` est envoyé automatiquement en https.

## Sécurité en place
Sessions en cookie HttpOnly/SameSite=Lax (token haché en base), mots de passe PBKDF2, lien magique à usage unique (page intermédiaire anti-scanner), limitation à 8 tentatives / 15 min, contrôle d'origine sur les écritures, cloisonnement par client sur chaque route, fichiers servis en `attachment` + `nosniff`, paiement confirmé uniquement par re-lecture de l'API Mollie.

## Pas encore fait
- Aucun écran équipe pour créer projets, étapes ou livrables (à faire en SQL pour l'instant).
- Les « PDF » (reçu, devis signé, facture) sont des pages imprimables, pas de vrais PDF.
- Pas de réinitialisation de mot de passe dédiée (le lien magique en tient lieu) ni de page « définir mon mot de passe ».
- Fichiers limités à 100 Mo (limite Cloudflare), pas 200 Mo.
- `legal.html` : champs `[…]` à compléter, clauses RGPD de l'espace client à ajouter.
