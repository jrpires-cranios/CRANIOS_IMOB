-- ============================================================
-- MULTI-TENANT ONBOARDING SYSTEM
-- ============================================================
-- Criação da tabela de clientes (imobiliárias)
-- Cada cliente recebe seu próprio bucket R2 isolado
-- ============================================================

-- Função auxiliar para gerar slug a partir do nome
CREATE OR REPLACE FUNCTION generate_slug(text) 
RETURNS text AS $$
  SELECT LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE($1, '[áàãâä]', 'a', 'gi'),
        '[éèêë]', 'e', 'gi'
      ),
      '[^a-z0-9]+', '-', 'gi'
    )
  );
$$ LANGUAGE SQL IMMUTABLE;

-- Tabela principal de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  razao_social VARCHAR(255),
  cnpj VARCHAR(18) UNIQUE,
  
  -- Contato
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  website VARCHAR(255),
  
  -- Endereço
  endereco JSONB DEFAULT '{}'::jsonb,
  -- Exemplo: { 
  --   "rua": "Rua Exemplo", 
  --   "numero": "123", 
  --   "bairro": "Centro", 
  --   "cidade": "Aracaju", 
  --   "estado": "SE", 
  --   "cep": "49000-000" 
  -- }
  
  -- Branding
  logo_url TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#667eea', -- Padrão roxo
  cor_secundaria VARCHAR(7) DEFAULT '#764ba2',
  
  -- R2 Storage (Bucket isolado por cliente)
  bucket_name VARCHAR(100) UNIQUE NOT NULL,
  bucket_url TEXT, -- URL pública: https://pub-xxx.r2.dev/bucket-name
  bucket_created_at TIMESTAMPTZ,
  storage_usado_gb DECIMAL(10,2) DEFAULT 0, -- Tracking de uso
  
  -- Configurações personalizadas
  config JSONB DEFAULT '{
    "auto_generate_books": true,
    "watermark_enabled": false,
    "max_storage_gb": 50,
    "features": ["lancamentos", "vendas", "locacao"],
    "pdf_template": "default"
  }'::jsonb,
  
  -- Status e Plano
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso', 'trial', 'cancelado')),
  plano VARCHAR(50) DEFAULT 'basico' CHECK (plano IN ('trial', 'basico', 'profissional', 'enterprise')),
  trial_expira_em DATE,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  
  -- Constraints
  CONSTRAINT clientes_slug_lowercase CHECK (slug = LOWER(slug)),
  CONSTRAINT clientes_bucket_lowercase CHECK (bucket_name = LOWER(bucket_name)),
  CONSTRAINT clientes_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);
CREATE INDEX IF NOT EXISTS idx_clientes_plano ON clientes(plano);
CREATE INDEX IF NOT EXISTS idx_clientes_bucket ON clientes(bucket_name);
CREATE INDEX IF NOT EXISTS idx_clientes_slug ON clientes(slug);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON clientes(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para gerar slug automaticamente se não fornecido
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.nome);
        
        -- Garantir unicidade adicionando número se necessário
        WHILE EXISTS (SELECT 1 FROM clientes WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')) LOOP
            NEW.slug := NEW.slug || '-' || FLOOR(RANDOM() * 1000)::TEXT;
        END LOOP;
    END IF;
    
    -- Gerar bucket_name baseado no slug se não fornecido
    IF NEW.bucket_name IS NULL OR NEW.bucket_name = '' THEN
        NEW.bucket_name := NEW.slug;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_slug
    BEFORE INSERT OR UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_slug();

-- ============================================================
-- ATUALIZAR TABELAS EXISTENTES PARA MULTI-TENANT
-- ============================================================

-- Adicionar cliente_id em imoveis
DO $$
BEGIN
    -- Verifica se a tabela existe antes de alterar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'imoveis') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'imoveis' AND column_name = 'cliente_id'
        ) THEN
            ALTER TABLE imoveis ADD COLUMN cliente_id UUID REFERENCES clientes(id);
            CREATE INDEX IF NOT EXISTS idx_imoveis_cliente_id ON imoveis(cliente_id);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'imoveis' AND column_name = 'bucket_book_url'
        ) THEN
            ALTER TABLE imoveis ADD COLUMN bucket_book_url TEXT;
        END IF;
    END IF;
END $$;

-- Adicionar cliente_id em leads
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'leads' AND column_name = 'cliente_id'
        ) THEN
            ALTER TABLE leads ADD COLUMN cliente_id UUID REFERENCES clientes(id);
            CREATE INDEX IF NOT EXISTS idx_leads_cliente_id ON leads(cliente_id);
        END IF;
    END IF;
END $$;

-- Adicionar cliente_id em negociacoes (somente se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'negociacoes') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'negociacoes' AND column_name = 'cliente_id'
        ) THEN
            ALTER TABLE negociacoes ADD COLUMN cliente_id UUID REFERENCES clientes(id);
            CREATE INDEX IF NOT EXISTS idx_negociacoes_cliente_id ON negociacoes(cliente_id);
        END IF;
    END IF;
END $$;

-- Adicionar cliente_id em agendamentos_visitas (somente se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agendamentos_visitas') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'agendamentos_visitas' AND column_name = 'cliente_id'
        ) THEN
            ALTER TABLE agendamentos_visitas ADD COLUMN cliente_id UUID REFERENCES clientes(id);
            CREATE INDEX IF NOT EXISTS idx_visitas_cliente_id ON agendamentos_visitas(cliente_id);
        END IF;
    END IF;
END $$;

-- ============================================================
-- INSERIR CLIENTE MESTRE (CRÂNIOS IMOB)
-- ============================================================

INSERT INTO clientes (
    nome,
    slug,
    razao_social,
    email,
    telefone,
    whatsapp,
    website,
    bucket_name,
    bucket_url,
    bucket_created_at,
    status,
    plano,
    config,
    endereco
) VALUES (
    'Crânios IMOB',
    'cranios-imob',
    'Crânios Inteligência Imobiliária LTDA',
    'contato@cranios-imob.com',
    '(79) 99999-9999',
    '(79) 99999-9999',
    'https://cranios-imob.com',
    'cranios-imob',
    'https://pub-2f365728cc2a2a1812985203ea49054b.r2.dev/cranios-imob',
    NOW(),
    'ativo',
    'enterprise',
    '{
        "auto_generate_books": true,
        "watermark_enabled": false,
        "max_storage_gb": 500,
        "features": ["lancamentos", "vendas", "locacao", "analytics", "api_access"],
        "pdf_template": "premium"
    }'::jsonb,
    '{
        "rua": "Av Principal",
        "numero": "1000",
        "bairro": "Farolândia",
        "cidade": "Aracaju",
        "estado": "SE",
        "cep": "49032-000"
    }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Associar todos imóveis existentes ao cliente mestre
DO $$
DECLARE
    cranios_id UUID;
BEGIN
    SELECT id INTO cranios_id FROM clientes WHERE slug = 'cranios-imob';
    
    IF cranios_id IS NOT NULL THEN
        UPDATE imoveis SET cliente_id = cranios_id WHERE cliente_id IS NULL;
        UPDATE leads SET cliente_id = cranios_id WHERE cliente_id IS NULL;
        
        RAISE NOTICE 'Dados associados ao cliente Crânios IMOB (ID: %)', cranios_id;
    END IF;
END $$;

-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================

-- View de clientes ativos com estatísticas
CREATE OR REPLACE VIEW v_clientes_stats AS
SELECT 
    c.id,
    c.nome,
    c.slug,
    c.status,
    c.plano,
    c.storage_usado_gb,
    c.created_at,
    COUNT(DISTINCT i.id) AS total_imoveis,
    COUNT(DISTINCT l.id) AS total_leads,
    COUNT(DISTINCT n.id) AS total_negociacoes
FROM clientes c
LEFT JOIN imoveis i ON i.cliente_id = c.id
LEFT JOIN leads l ON l.cliente_id = c.id
LEFT JOIN negociacoes n ON n.cliente_id = c.id
GROUP BY c.id;

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE clientes IS 'Tabela de clientes (imobiliárias) do sistema multi-tenant';
COMMENT ON COLUMN clientes.bucket_name IS 'Nome do bucket R2 isolado para este cliente';
COMMENT ON COLUMN clientes.config IS 'Configurações personalizadas do cliente em JSON';
COMMENT ON COLUMN clientes.storage_usado_gb IS 'Tracking de storage usado em GB para cobrança';

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

SELECT 'Setup de multi-tenant concluído com sucesso!' AS status;
SELECT COUNT(*) AS total_clientes FROM clientes;
