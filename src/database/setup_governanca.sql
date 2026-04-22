-- ==============================================================================
-- SETUP DE GOVERNANÇA, SEGURANÇA E TICKET - FASE 6
-- ==============================================================================

-- 1. Inclusão de Plano e Contagem de Corretores na Tabela Tenants (caso exista)
-- Verifica se a tabela tenants base já existe e adiciona as colunas de controle
ALTER TABLE "public"."tenants"
ADD COLUMN IF NOT EXISTS "plano" varchar(50) DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS "corretores_ativos" int DEFAULT 0;

-- 2. Tabela de Bloqueio de Sessão Única (Anti-Compartilhamento)
CREATE TABLE IF NOT EXISTS "public"."active_sessions" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid NOT NULL,         -- ID do Gestor ou Corretor
    "role" varchar(50) NOT NULL,     -- 'gestor' ou 'corretor'
    "tenant_id" uuid,                
    "session_token" text NOT NULL,
    "device_fingerprint" text,
    "ip_address" varchar(50),
    "user_agent" text,
    "last_seen" timestamp with time zone DEFAULT now(),
    "created_at" timestamp with time zone DEFAULT now()
);

-- Index para busca rápida por usuário
CREATE INDEX IF NOT EXISTS "idx_active_sessions_user_id" ON "public"."active_sessions" ("user_id");

-- 3. Tabela de Master Access (Chave Mestra / Impersonation)
CREATE TABLE IF NOT EXISTS "public"."master_access_log" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "tenant_id" uuid NOT NULL,
    "reason" text NOT NULL, -- Motivo para auditoria ("Cliente A relatou bug X")
    "token_hash" text NOT NULL,
    "ip_address" varchar(50),
    "started_at" timestamp with time zone DEFAULT now(),
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);

-- 4. Tabela do Sistema de Tickets com Triagem de IA
CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "tenant_id" uuid NOT NULL,
    "requested_by" uuid,             -- Usuário que abriu o ticket
    "title" varchar(255) NOT NULL,
    "description" text NOT NULL,
    
    -- Metadados classificados pela IA
    "category" varchar(50),          -- bug, config, billing, feature_request
    "severity" varchar(50),          -- P1-crítico, P2-alto, P3-médio, P4-baixo
    "can_self_resolve" boolean DEFAULT false,
    
    -- Operação
    "status" varchar(50) DEFAULT 'open', -- open, auto-resolved, in_progress, closed
    "ai_response" text,                  -- Resposta gerada pela triagem inicial
    "sla_deadline" timestamp with time zone,
    
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Index para busca de SLA e Status
CREATE INDEX IF NOT EXISTS "idx_tickets_status" ON "public"."support_tickets" ("status", "sla_deadline");

-- ==============================================================================
-- Atualização Inicial Segura (Opcional)
-- Atualiza contagem local caso a base já possua corretores
-- UPDATE "public"."tenants" t SET corretores_ativos = (SELECT COUNT(*) FROM "public"."corretores" c WHERE c.cliente_id = t.id) WHERE TRUE;
-- ==============================================================================
