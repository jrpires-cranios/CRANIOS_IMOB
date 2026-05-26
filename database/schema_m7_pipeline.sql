-- Adicionar risk_score na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMPTZ;

-- Tabela de log de reativacao
CREATE TABLE IF NOT EXISTS reactivation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    corretor_id UUID REFERENCES corretores(id),
    mensagem_original TEXT NOT NULL,
    mensagem_enviada TEXT,
    responded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reactivation_log_lead ON reactivation_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_reactivation_log_tenant ON reactivation_log(tenant_id);
