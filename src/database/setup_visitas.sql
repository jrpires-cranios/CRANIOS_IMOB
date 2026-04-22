-- ============================================================
-- AGENDAMENTOS DE VISITAS - Crânios IMOB
-- Controla visitas aos imóveis (NÃO bloqueia o imóvel)
-- ============================================================

CREATE TABLE IF NOT EXISTS agendamentos_visitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relacionamentos
  imovel_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  
  -- Agendamento
  data_visita DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado', 'realizado', 'cancelado', 'nao_compareceu')),
  
  -- Responsável (corretor ou concierge)
  responsavel_tipo TEXT CHECK (responsavel_tipo IN ('corretor', 'concierge')),
  responsavel_id UUID,
  responsavel_nome TEXT,
  
  -- Observações
  notas TEXT,
  origem TEXT, -- 'whatsapp', 'site', 'telefone'
  
  -- Confirmação
  confirmado BOOLEAN DEFAULT FALSE,
  confirmado_em TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para evitar conflitos de horário
CREATE INDEX IF NOT EXISTS idx_visitas_data_horario ON agendamentos_visitas(data_visita, horario_inicio);
CREATE INDEX IF NOT EXISTS idx_visitas_imovel ON agendamentos_visitas(imovel_id);
CREATE INDEX IF NOT EXISTS idx_visitas_lead ON agendamentos_visitas(lead_id);
CREATE INDEX IF NOT EXISTS idx_visitas_status ON agendamentos_visitas(status);

-- Constraint: Não pode agendar visitas no passado
ALTER TABLE agendamentos_visitas 
ADD CONSTRAINT check_data_futura 
CHECK (data_visita >= CURRENT_DATE);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_visitas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visitas_updated_at
BEFORE UPDATE ON agendamentos_visitas
FOR EACH ROW
EXECUTE FUNCTION update_visitas_updated_at();

COMMENT ON TABLE agendamentos_visitas IS 'Agendamentos de visitas aos imóveis. NÃO bloqueia o imóvel, apenas evita conflitos de horário.';
COMMENT ON COLUMN agendamentos_visitas.responsavel_tipo IS 'Quem fará a visita: corretor interno ou concierge terceirizado';
