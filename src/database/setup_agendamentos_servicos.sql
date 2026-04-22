-- ============================================================
-- AGENDAMENTOS DE SERVIÇOS - Crânios IMOB
-- Agendamentos de vistorias, manutenção, entrega de chaves, etc
-- ============================================================

CREATE TABLE IF NOT EXISTS agendamentos_servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relacionamentos
  prestador_id UUID NOT NULL REFERENCES prestadores_servicos(id),
  imovel_id UUID,
  negociacao_id UUID,
  vistoria_id UUID,
  
  -- Tipo de serviço
  tipo_servico TEXT NOT NULL,
  /* Tipos:
     'vistoria_entrada', 'vistoria_saida', 
     'reparo_eletrico', 'reparo_hidraulico', 'pintura', 'limpeza',
     'entrega_chaves', 'visita_guiada_concierge'
  */
  
  -- Agendamento
  data_agendada DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME,
  duracao_estimada_minutos INTEGER DEFAULT 60,
  
  -- Status
  status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado')),
  
  -- Detalhes
  descricao TEXT,
  observacoes TEXT,
  valor_cobrado DECIMAL(10,2),
  
  -- Conclusão
  concluido_em TIMESTAMPTZ,
  avaliacao_cliente INTEGER CHECK (avaliacao_cliente BETWEEN 1 AND 5),
  feedback_cliente TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agend_servicos_prestador ON agendamentos_servicos(prestador_id);
CREATE INDEX IF NOT EXISTS idx_agend_servicos_imovel ON agendamentos_servicos(imovel_id);
CREATE INDEX IF NOT EXISTS idx_agend_servicos_data ON agendamentos_servicos(data_agendada, horario_inicio);
CREATE INDEX IF NOT EXISTS idx_agend_servicos_status ON agendamentos_servicos(status);
CREATE INDEX IF NOT EXISTS idx_agend_servicos_tipo ON agendamentos_servicos(tipo_servico);

-- Constraint: Não pode agendar no passado
ALTER TABLE agendamentos_servicos 
ADD CONSTRAINT check_servico_data_futura 
CHECK (data_agendada >= CURRENT_DATE);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_agend_servicos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agend_servicos_updated_at
BEFORE UPDATE ON agendamentos_servicos
FOR EACH ROW
EXECUTE FUNCTION update_agend_servicos_updated_at();

COMMENT ON TABLE agendamentos_servicos IS 'Agendamentos de serviços com prestadores terceirizados';
COMMENT ON COLUMN agendamentos_servicos.tipo_servico IS 'Tipo do serviço agendado (vistoria, reparo, entrega de chaves, etc)';
COMMENT ON COLUMN agendamentos_servicos.avaliacao_cliente IS 'Avaliação de 1 a 5 estrelas do cliente sobre o serviço';
