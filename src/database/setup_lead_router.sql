CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- corretores_config
CREATE TABLE IF NOT EXISTS corretores_config (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corretor_id   UUID REFERENCES corretores(id) ON DELETE CASCADE NOT NULL UNIQUE,
  peso_roleta   INT DEFAULT 1 CHECK (peso_roleta >= 1),
  status        TEXT DEFAULT 'ativo' CHECK (status IN ('ativo','ausente','pausado','ferias')),
  ferias_inicio DATE,
  ferias_fim    DATE,
  iqc           NUMERIC(5,2) DEFAULT 50.0,
  iqc_override  BOOLEAN DEFAULT FALSE,
  iqc_motivo    TEXT,
  tipos_imovel  TEXT[],       -- ex: ['residencial','lancamento']
  modalidades   TEXT[],       -- ex: ['venda','locacao']
  valor_min     NUMERIC(12,2),
  valor_max     NUMERIC(12,2),
  bairros       TEXT[],
  lancamentos   UUID[],       -- IDs dos lançamentos habilitados
  limite_leads_dia INT,
  sla_config    JSONB,        -- overrides de SLA por corretor
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- roulette_state
CREATE TABLE IF NOT EXISTS roulette_state (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corretor_id   UUID REFERENCES corretores_config(corretor_id) ON DELETE CASCADE UNIQUE,
  creditos      INT DEFAULT 0,    -- créditos restantes no ciclo atual
  total_recebidos INT DEFAULT 0,  -- contador histórico
  ultimo_lead_at  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- lead_distribution_log
CREATE TABLE IF NOT EXISTS lead_distribution_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id         UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  corretor_id     UUID REFERENCES corretores_config(corretor_id) ON DELETE SET NULL,
  temperatura     TEXT,
  score_dificuldade INT,
  motivo_escolha  TEXT,       -- JSON com razão da decisão
  corretores_elegiveis UUID[], -- quem foi avaliado
  status          TEXT DEFAULT 'pendente',
  atribuido_at    TIMESTAMPTZ DEFAULT NOW()
);

-- lead_sla_events
CREATE TABLE IF NOT EXISTS lead_sla_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id         UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  corretor_id     UUID REFERENCES corretores(id) ON DELETE SET NULL,
  evento          TEXT NOT NULL,   -- 'primeiro_contato', 'visita_agendada', etc.
  sla_limite_min  INT,             -- em minutos
  realizado_em    TIMESTAMPTZ,
  sla_status      TEXT,            -- 'ok', 'atencao', 'violado'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_corretores_config_updated_at ON corretores_config;
CREATE TRIGGER update_corretores_config_updated_at
BEFORE UPDATE ON corretores_config
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_roulette_state_updated_at ON roulette_state;
CREATE TRIGGER update_roulette_state_updated_at
BEFORE UPDATE ON roulette_state
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS enable
ALTER TABLE corretores_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE roulette_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_distribution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sla_events ENABLE ROW LEVEL SECURITY;

-- Creating open policies for now as requested (service role access will be fine and anon for local test)
DROP POLICY IF EXISTS "Enable read access for all users" ON corretores_config;
CREATE POLICY "Enable read access for all users" ON corretores_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable update for all users" ON corretores_config;
CREATE POLICY "Enable update for all users" ON corretores_config FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON corretores_config;
CREATE POLICY "Enable insert for all users" ON corretores_config FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON roulette_state;
CREATE POLICY "Enable read access for all users" ON roulette_state FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable update for all users" ON roulette_state;
CREATE POLICY "Enable update for all users" ON roulette_state FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON roulette_state;
CREATE POLICY "Enable insert for all users" ON roulette_state FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON lead_distribution_log;
CREATE POLICY "Enable read access for all users" ON lead_distribution_log FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert access for all users" ON lead_distribution_log;
CREATE POLICY "Enable insert access for all users" ON lead_distribution_log FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON lead_sla_events;
CREATE POLICY "Enable read access for all users" ON lead_sla_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert access for all users" ON lead_sla_events;
CREATE POLICY "Enable insert access for all users" ON lead_sla_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update access for all users" ON lead_sla_events;
CREATE POLICY "Enable update access for all users" ON lead_sla_events FOR UPDATE USING (true);
