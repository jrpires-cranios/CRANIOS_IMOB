-- Tabela para rastreio de historico de precos e precificacao de IA
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    imovel_id UUID NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
    old_price NUMERIC,
    new_price NUMERIC NOT NULL,
    suggested_price NUMERIC,
    reason TEXT NOT NULL, -- 'cadastro', 'ia_suggestion', 'manual_reduction', 'manual_increase'
    confidence_level TEXT, -- 'ALTA', 'MEDIA', 'BAIXA' 
    comparables_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_price_history_imovel ON price_history(imovel_id);
CREATE INDEX IF NOT EXISTS idx_price_history_tenant ON price_history(tenant_id);
