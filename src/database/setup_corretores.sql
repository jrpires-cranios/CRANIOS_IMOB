-- Create or update corretores table
CREATE TABLE IF NOT EXISTS corretores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  creci VARCHAR(50),
  foto_url TEXT,
  calcom_api_key TEXT,           -- API key pessoal do corretor no Cal.com
  calcom_username TEXT,          -- username no Cal.com (para link público)
  calcom_event_type_id INTEGER,  -- ID do evento "Visita de Imóvel"
  ativo BOOLEAN DEFAULT true,
  na_roleta BOOLEAN DEFAULT true,
  peso_roleta INTEGER DEFAULT 1, -- 1=normal, 2=dobro de leads, 0=pausado
  total_leads_recebidos INTEGER DEFAULT 0,
  total_vendas INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying active brokers
CREATE INDEX IF NOT EXISTS idx_corretores_ativo ON corretores(ativo, na_roleta);
CREATE INDEX IF NOT EXISTS idx_corretores_cliente ON corretores(cliente_id);

-- Create roleta_leads table to track assignments
CREATE TABLE IF NOT EXISTS roleta_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  corretor_id UUID REFERENCES corretores(id),
  lead_id UUID REFERENCES leads(id),
  data_atribuicao TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, aceito, recusado, convertido
  motivo_recusa TEXT
);

-- Index for reporting
CREATE INDEX IF NOT EXISTS idx_roleta_leads_corretor ON roleta_leads(corretor_id);
CREATE INDEX IF NOT EXISTS idx_roleta_leads_lead ON roleta_leads(lead_id);

-- Link tables if they have corretor_id (for future)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS corretor_id UUID REFERENCES corretores(id);
ALTER TABLE agendamentos_visitas ADD COLUMN IF NOT EXISTS corretor_id UUID REFERENCES corretores(id);
