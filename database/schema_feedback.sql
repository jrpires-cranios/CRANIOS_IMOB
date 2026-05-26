-- Tabela principal de feedback de visita
CREATE TABLE IF NOT EXISTS visit_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agendamento_id UUID NOT NULL REFERENCES agendamentos_visitas(id) ON DELETE CASCADE,
    corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

    -- Momento 2: avaliacao do sistema
    system_briefing_score INTEGER, -- 0-5: utilidade do briefing
    system_satisfaction_score INTEGER, -- 0-5: satisfacao geral com o sistema

    -- Momento 3: feedback investigativo
    client_reaction TEXT, -- 'amou'|'gostou'|'indiferente'|'nao_gostou'
    closing_probability INTEGER, -- 0-10
    next_step TEXT, -- 'vai_pensar'|'ver_outro'|'deu_data'|'fechamento'|'desistiu'
    followup_date DATE, -- se deu uma data
    objections TEXT, -- texto livre
    objection_category TEXT, -- categorizado pela IA

    -- Controle
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    collection_method TEXT DEFAULT 'telegram'
);

-- RLS
ALTER TABLE visit_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants podem gerenciar seus próprios feedbacks"
    ON visit_feedback
    FOR ALL
    USING (tenant_id = auth.uid()); -- Simulação simples de tenant RLS

-- Índices para performance (Dashboard de Eficiência, etc)
CREATE INDEX IF NOT EXISTS idx_visit_feedback_corretor ON visit_feedback(corretor_id);
CREATE INDEX IF NOT EXISTS idx_visit_feedback_tenant ON visit_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visit_feedback_collected ON visit_feedback(collected_at);
