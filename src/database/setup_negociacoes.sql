-- ============================================================
-- SISTEMA DE NEGOCIAÇÕES - Crânios IMOB
-- Substitui a tabela 'reservas' com lógica mais completa
-- ============================================================

-- Tabela principal de negociações (locação ou venda)
CREATE TABLE IF NOT EXISTS negociacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL, -- Código gerado (ex: NEG-20260212-001)
  
  -- Relacionamentos
  imovel_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  corretor_id UUID, -- Quem iniciou a negociação
  
  -- Tipo e Status
  tipo TEXT NOT NULL CHECK (tipo IN ('locacao', 'venda')),
  status TEXT DEFAULT 'proposta' CHECK (status IN (
    'proposta', 
    'documentacao', 
    'contrato_preparado', 
    'aguardando_pagamento',
    'concluido', 
    'cancelado'
  )),
  
  -- Bloqueio de 48h
  bloqueio_inicio TIMESTAMPTZ,
  bloqueio_expira TIMESTAMPTZ, -- bloqueio_inicio + 48h
  imovel_bloqueado BOOLEAN DEFAULT FALSE,
  
  -- Valores
  valor_proposta DECIMAL(12,2),
  valor_fechado DECIMAL(12,2),
  forma_pagamento TEXT, -- 'a_vista', 'financiamento', 'parcelado'
  
  -- Documentação
  docs_status TEXT DEFAULT 'pendente' CHECK (docs_status IN ('pendente', 'em_analise', 'aprovado', 'reprovado')),
  docs_anexos JSONB DEFAULT '[]', -- URLs dos documentos
  
  -- Pagamento (Asaas)
  asaas_customer_id TEXT,
  asaas_subscription_id TEXT, -- Para locação (recorrência)
  asaas_payment_id TEXT, -- Para venda (entrada)
  link_pagamento_caução TEXT,
  link_pagamento_entrada TEXT,
  
  -- Vistoria (para locação)
  vistoria_entrada_id UUID,
  vistoria_saida_id UUID,
  
  -- Contrato
  contrato_url TEXT,
  contrato_assinado_em TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_negociacoes_status ON negociacoes(status);
CREATE INDEX IF NOT EXISTS idx_negociacoes_imovel ON negociacoes(imovel_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_lead ON negociacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_bloqueio ON negociacoes(imovel_bloqueado, bloqueio_expira) WHERE imovel_bloqueado = TRUE;
CREATE INDEX IF NOT EXISTS idx_negociacoes_codigo ON negociacoes(codigo);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_negociacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_negociacoes_updated_at
BEFORE UPDATE ON negociacoes
FOR EACH ROW
EXECUTE FUNCTION update_negociacoes_updated_at();

-- Comentários
COMMENT ON TABLE negociacoes IS 'Controla todo o ciclo de negociação de imóveis (locação e venda)';
COMMENT ON COLUMN negociacoes.codigo IS 'Código único para o cliente mencionar na conversa';
COMMENT ON COLUMN negociacoes.imovel_bloqueado IS 'TRUE quando o imóvel está bloqueado por 48h durante negociação';
COMMENT ON COLUMN negociacoes.asaas_subscription_id IS 'ID da recorrência mensal no Asaas (apenas para locação)';
