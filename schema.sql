-- Schéma D1 de l'espace client Eight Projects
-- Local :  npm run db:init        Production : npx wrangler d1 execute eightprojects-db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL,
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client','admin')),
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS login_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_attempts (
  email TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempts ON auth_attempts(email, at);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service TEXT NOT NULL CHECK (service IN ('Web','Branding','Contenu')),
  status TEXT NOT NULL CHECK (status IN ('En cours','Livré','En pause')),
  progress INTEGER NOT NULL DEFAULT 0,
  start TEXT NOT NULL,
  due TEXT NOT NULL,
  lead TEXT NOT NULL,
  lead_email TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);

CREATE TABLE IF NOT EXISTS project_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pos INTEGER NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('done','current','todo'))
);

CREATE TABLE IF NOT EXISTS deliverables (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('à valider','validé','modifs demandées')),
  url TEXT,
  storage_key TEXT
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deliverable_id TEXT NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  is_client INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  uploaded_by TEXT NOT NULL CHECK (uploaded_by IN ('client','studio')),
  storage_key TEXT,            -- clé R2 (NULL pour les documents générés)
  kind TEXT NOT NULL DEFAULT 'file' CHECK (kind IN ('file','receipt','signed_quote')),
  ref_id TEXT                  -- n° de facture / devis pour les documents générés
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,         -- F-2026-044
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  date TEXT NOT NULL,
  due TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'à payer' CHECK (status IN ('à payer','payée')),  -- « en retard » est calculé
  paid_at TEXT,
  payment_ref TEXT,
  payment_id TEXT
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,         -- D-2026-022
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  date TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'à signer' CHECK (status IN ('à signer','signé','refusé')),
  signed_at TEXT,
  signed_by TEXT,
  signed_ip TEXT
);

CREATE TABLE IF NOT EXISTS quote_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  pos INTEGER NOT NULL,
  label TEXT NOT NULL,
  qty REAL NOT NULL,
  unit_price_cents INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  text TEXT NOT NULL           -- HTML généré côté serveur, contenu échappé
);
