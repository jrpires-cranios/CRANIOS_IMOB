-- ================================================================
-- CRÂNIOS IMOB - PIPELINE DE CLIENTES E AUTOMAÇÃO
-- Executar no SQL Editor do Supabase MASTER
-- ================================================================

CREATE TABLE IF NOT EXISTS client_pipeline (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  company_name          TEXT,
  email                 TEXT UNIQUE NOT NULL,
  phone                 TEXT,

  -- Asaas
  asaas_customer_id     TEXT,
  asaas_payment_id      TEXT,
  asaas_subscription_id TEXT,
  plan_value            DECIMAL(10,2),

  -- Acesso
  supabase_user_id      UUID,
  tenant_slug           TEXT,

  -- Contrato
  assinafy_document_id  TEXT,
  contract_sent_at      TIMESTAMPTZ,
  contract_signed_at    TIMESTAMPTZ,
  contract_storage_path TEXT,

  -- Onboard
  onboard_scheduled_at  TIMESTAMPTZ,
  onboard_completed_at  TIMESTAMPTZ,
  api_keys_received_at  TIMESTAMPTZ,

  -- Credenciais Sigilosas (idealmente usar pgcrypto para criptografar em producao)
  api_credentials       JSONB,
  secure_form_token     TEXT,

  -- Pipeline
  status                TEXT NOT NULL DEFAULT 'LEAD',
  status_updated_at     TIMESTAMPTZ DEFAULT NOW(),
  notes                 TEXT,

  -- Datas
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES client_pipeline(id),
  from_status TEXT,
  to_status   TEXT,
  changed_by  TEXT,
  notes       TEXT,
  changed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para atualizar updated_at e status_updated_at automaticamente
CREATE OR REPLACE FUNCTION update_pipeline_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   IF OLD.status IS DISTINCT FROM NEW.status THEN
      NEW.status_updated_at = NOW();
      INSERT INTO pipeline_history (client_id, from_status, to_status, changed_by, notes)
      VALUES (NEW.id, OLD.status, NEW.status, 'system', 'Mudança automática via trigger');
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_pipeline ON client_pipeline;
CREATE TRIGGER trg_update_pipeline
BEFORE UPDATE ON client_pipeline
FOR EACH ROW
EXECUTE FUNCTION update_pipeline_timestamp();

-- ================================================================
-- POLÍTICAS RLS (Tabela protegida, acessível somente por Service Role ou Master)
-- ================================================================
ALTER TABLE client_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas administradores podem ler pipeline" ON client_pipeline 
FOR SELECT USING (
  auth.email() IN ('ceo@cranios.pro', 'setup@cranios.pro')
);

CREATE POLICY "Apenas administradores podem atualizar pipeline" ON client_pipeline 
FOR UPDATE USING (
  auth.email() IN ('ceo@cranios.pro', 'setup@cranios.pro')
);
