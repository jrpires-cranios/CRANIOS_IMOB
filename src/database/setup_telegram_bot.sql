-- Atualização da tabela de corretores para suportar integração com o Telegram
ALTER TABLE corretores ADD COLUMN IF NOT EXISTS telegram_id TEXT UNIQUE;
ALTER TABLE corretores ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE corretores ADD COLUMN IF NOT EXISTS pwa_last_access TIMESTAMPTZ;
ALTER TABLE corretores ADD COLUMN IF NOT EXISTS bot_activated_at TIMESTAMPTZ;

-- Criação da tabela de tokens de ativação para o bot
CREATE TABLE IF NOT EXISTS corretor_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  corretor_id UUID REFERENCES corretores(id),
  cliente_id UUID REFERENCES clientes(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimizar busca de validação do código gerado
CREATE INDEX IF NOT EXISTS idx_corretor_activations_code ON corretor_activations(code);
CREATE INDEX IF NOT EXISTS idx_corretor_activations_corretor ON corretor_activations(corretor_id);
