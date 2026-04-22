-- Banco MASTER (plataforma SaaS)

CREATE TABLE IF NOT EXISTS tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  status        TEXT DEFAULT 'provisioning',  -- provisioning|active|suspended
  plan          TEXT DEFAULT 'starter',       -- starter|pro|enterprise
  supabase_project_id TEXT,
  r2_bucket     TEXT,
  pinecone_prefix TEXT,
  onboarding_data JSONB,   -- snapshot do formulário completo
  provisioned_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_integrations (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  channel   TEXT NOT NULL,      -- whatsapp|instagram|zap|olx|asaas|...
  status    TEXT DEFAULT 'active',
  config    JSONB,              -- webhook URL, tokens (criptografados)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provisioning_jobs (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  phase     TEXT,               -- infra|rag|webhooks|notifications
  status    TEXT DEFAULT 'pending',  -- pending|running|done|failed
  log       JSONB,              -- log de execução detalhado
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);
