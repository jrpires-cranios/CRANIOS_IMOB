-- ============================================================
-- VISTORIAS - Crânios IMOB
-- Vistorias de entrada e saída (locação)
-- ============================================================

CREATE TABLE IF NOT EXISTS vistorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relacionamentos
  negociacao_id UUID NOT NULL,
  imovel_id UUID NOT NULL,
  
  -- Tipo
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  
-- Agendamento
  data_agendada DATE,
  horario TIME,
  responsavel_id UUID, -- Prestador de serviço
  responsavel_nome TEXT,
  
  -- Status
  status TEXT DEFAULT 'agendada' CHECK (status IN ('agendada', 'em_andamento', 'concluida', 'cancelada')),
  
  -- Checklist (JSON com os itens)
  checklist JSONB DEFAULT '[]',
  /* Exemplo:
  [
    { "comodo": "sala", "item": "parede", "status": "ok", "obs": "", "fotos": [] },
    { "comodo": "quarto_1", "item": "porta", "status": "dano", "obs": "Risco na porta", "fotos": ["url1"] }
  ]
  */
  
  -- Discordâncias do cliente (vistoria digital)
  discordancias JSONB DEFAULT '[]',
  fotos_cliente JSONB DEFAULT '[]',
  videos_cliente JSONB DEFAULT '[]',
  
  -- Orçamentos de reparos
  orcamentos JSONB DEFAULT '[]',
  /* Exemplo:
  [
    { "servico": "pintura", "comodo": "sala", "valor": 500, "prestador_id": "uuid", "aprovado": false }
  ]
  */
  
  -- Assinaturas
  assinatura_cliente TEXT, -- URL da imagem
  assinatura_vistoriador TEXT,
  
  concluida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vistorias_negociacao ON vistorias(negociacao_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_imovel ON vistorias(imovel_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_tipo ON vistorias(tipo);
CREATE INDEX IF NOT EXISTS idx_vistorias_status ON vistorias(status);
CREATE INDEX IF NOT EXISTS idx_vistorias_data ON vistorias(data_agendada);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_vistorias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vistorias_updated_at
BEFORE UPDATE ON vistorias
FOR EACH ROW
EXECUTE FUNCTION update_vistorias_updated_at();

COMMENT ON TABLE vistorias IS 'Vistorias de entrada e saída para contratos de locação';
COMMENT ON COLUMN vistorias.checklist IS 'Checklist completo em JSON com fotos de cada item';
COMMENT ON COLUMN vistorias.discordancias IS 'Discordâncias do cliente enviadas via formulário digital';
