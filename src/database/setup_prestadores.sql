-- ============================================================
-- PRESTADORES DE SERVIÇOS - Crânios IMOB
-- Cadastro de profissionais terceirizados
-- ============================================================

CREATE TABLE IF NOT EXISTS prestadores_servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID, -- Multi-tenant (futuro)
  
  -- Dados
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'vistoria', 'eletricista', 'encanador', 'pintor', 'pedreiro', 'concierge', 'marido_de_aluguel'
  telefone TEXT,
  email TEXT,
  cpf_cnpj TEXT,
  
  -- Endereço
  cidade TEXT DEFAULT 'Aracaju',
  estado TEXT DEFAULT 'SE',
  
  -- Agenda (futuro: integração com módulo próprio)
  possui_modulo_agendamento BOOLEAN DEFAULT FALSE,
  api_key TEXT, -- Para integração via API
  
  -- Financeiro
  valor_hora DECIMAL(10,2),
  valor_visita DECIMAL(10,2), -- Valor fixo por visita/serviço
  forma_pagamento TEXT DEFAULT 'pix', -- 'pix', 'transferencia', 'dinheiro'
  
  -- Avaliação
  nota_media DECIMAL(3,2) DEFAULT 0.0,
  total_servicos INTEGER DEFAULT 0,
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  verificado BOOLEAN DEFAULT FALSE, -- Se passou por verificação de docs
  
  -- Observações
  especialidades TEXT[], -- Array de especialidades
  observacoes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prestadores_tipo ON prestadores_servicos(tipo);
CREATE INDEX IF NOT EXISTS idx_prestadores_ativo ON prestadores_servicos(ativo) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_prestadores_tenant ON prestadores_servicos(tenant_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_prestadores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prestadores_updated_at
BEFORE UPDATE ON prestadores_servicos
FOR EACH ROW
EXECUTE FUNCTION update_prestadores_updated_at();

COMMENT ON TABLE prestadores_servicos IS 'Cadastro de prestadores de serviço terceirizados (vistoria, manutenção, concierge)';
COMMENT ON COLUMN prestadores_servicos.possui_modulo_agendamento IS 'TRUE se o prestador paga pelo módulo de agendamento (renda extra)';
COMMENT ON COLUMN prestadores_servicos.api_key IS 'Chave API para integração automática de agenda';
