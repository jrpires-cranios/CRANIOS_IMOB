ATUALIZAÇÃO ONBOARD_CADASTROIMOVEL_BD_AGENTES

***

# PRD — Módulo de Parametrização Financeira de Contratos de Locação
**Projeto:** Crânios Imob | **Versão:** 1.0 | **Data:** Março 2026

***

## 1. Visão Geral e Objetivo

Criar um módulo de configuração financeira de contratos que opere em **dois níveis hierárquicos**: padrões globais definidos na imobiliária (onboard) e sobrescritas individuais por imóvel. O agente de criação de contratos e o agente de locação devem consumir essas informações diretamente do banco de dados para gerar contratos precisos e responder dúvidas de leads. O sistema deve ainda buscar índices financeiros reais de forma automática e enviar notificações de reajuste com antecedência.

***

## 2. Decisão de Arquitetura — Onboard vs. Por Imóvel

A melhor abordagem é **modelo híbrido com herança de configuração**, por dois motivos práticos:

- **Eficiência no cadastro:** a imobiliária que trabalha com um único padrão (ex.: todos os contratos com IGP-M, 30 meses, multa de 3 aluguéis) cadastra uma vez no onboard e todos os imóveis herdam automaticamente, sem retrabalho.
- **Flexibilidade total:** qualquer imóvel pode sobrescrever individualmente qualquer parâmetro herdado, sem afetar os demais.

**Regra de resolução de parâmetros (priority chain):**

```
Configuração do Imóvel (se preenchida)
        ↓ fallback se nulo
Configuração da Imobiliária (onboard)
        ↓ fallback se nulo
Defaults do sistema (Crânios Imob)
```

Isso significa que campos não preenchidos no imóvel herdam do onboard da imobiliária, que por sua vez herda dos defaults do sistema — simples e seguro. [calculojuridico.com](https://calculojuridico.com.br/api-indices-docs/)

***

## 3. Escopo de Funcionalidades

### F1 — Painel de Configuração Financeira (Onboard da Imobiliária)

**Seção: Contrato Padrão**

| Campo | Tipo de input | Observação |
|---|---|---|
| Prazo do contrato (meses) | Input numérico | Padrão sugerido: 30 meses |
| Carência de multa (meses) | Input numérico | Ex.: 0 = sem carência |
| Isenção após carência | Toggle (Sim/Não) | Se sim, zera multa após período |
| Tipo de multa | Radio: "Nº de aluguéis" ou "% do contrato" | |
| Valor da multa | Input numérico (%) ou (nº) | Depende da seleção acima |
| Multa proporcional ao tempo | Toggle (Sim/Não) | Padrão: Sim |
| Aviso prévio inquilino (dias) | Input numérico | Padrão: 30 dias |

**Seção: Reajuste de Aluguel**

| Campo | Tipo de input | Observação |
|---|---|---|
| Índices disponíveis | Checkboxes múltiplos | IGP-M, IPCA, INPC (marcáveis) |
| Índice padrão | Radio entre os marcados | Qual será pré-selecionado |
| Periodicidade de reajuste | Fixo: 12 meses | Bloqueado por lei |
| Antecedência do aviso (dias) | Input numérico | Padrão: 30 dias antes do aniversário |
| Canal de notificação | Checkboxes | E-mail, WhatsApp, Push |

***

### F2 — Configuração Individual por Imóvel

Na tela de cadastro de imóvel, uma seção **"Condições Contratuais"** que herda os valores do onboard (exibindo-os como placeholder/default), com opção de sobrescrever campo a campo. Campos não editados mantêm o valor herdado da imobiliária.

**UX sugerida:** um pequeno badge "herdado" ao lado do campo quando ele está usando o valor do onboard; ao clicar e editar, o badge muda para "personalizado", com um link "Restaurar padrão".

***

### F3 — Atualização Automática de Índices

#### 3.1 Fontes de dados (APIs gratuitas e confiáveis)

- **IPCA e INPC → API pública do IBGE** (sem autenticação) [servicodados.ibge.gov](https://servicodados.ibge.gov.br/api/docs/)
  ```
  https://servicodados.ibge.gov.br/api/v3/agregados/7060/periodos/{AAAAMM}/variaveis/2266
  ```
- **IGP-M → API do Cálculo Jurídico** (requer API key, plano gratuito disponível) [calculojuridico.com](https://calculojuridico.com.br/api-indices-docs/)
  ```
  POST https://indices.calculojuridico.com.br/v1/index
  Body: { "index_kind": "igpm", "start_date": "01/MM/AAAA", "end_date": "01/MM/AAAA" }
  ```
- **Alternativa gratuita para todos os índices → IPEA Data** (API governamental aberta) [ipeadata.gov](http://www.ipeadata.gov.br/api/)

#### 3.2 Arquitetura no Supabase

**Tabela de cache de índices:**
```sql
CREATE TABLE financial_indices (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  index_type  text NOT NULL,        -- 'igpm' | 'ipca' | 'inpc'
  reference_month date NOT NULL,    -- primeiro dia do mês de referência
  variation_pct numeric(8,4) NOT NULL,
  cumulative_factor numeric(12,8),
  fetched_at  timestamptz DEFAULT now(),
  UNIQUE(index_type, reference_month)
);
```

**Edge Function `sync-financial-indices`:**
- Busca o mês anterior nas 3 APIs
- Faz upsert na tabela `financial_indices`
- Executa via `pg_cron` todo dia 15 de cada mês (quando os índices costumam ser divulgados) [docs-b8tmkljqz-supabase.vercel](https://docs-b8tmkljqz-supabase.vercel.app/docs/guides/database/extensions/pgcron)

```sql
-- Habilitar extensões no Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar execução todo dia 15 às 10h (horário de Brasília = 13:00 UTC)
SELECT cron.schedule(
  'sync-indices-monthly',
  '0 13 15 * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
            || '/functions/v1/sync-financial-indices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```


***

### F4 — Sistema de Avisos de Reajuste

#### 4.1 Tabela de controle de notificações

```sql
CREATE TABLE lease_adjustment_notices (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id        uuid REFERENCES leases(id),
  notice_date     date NOT NULL,        -- data programada do envio
  adjustment_date date NOT NULL,        -- data do aniversário/reajuste
  status          text DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
  sent_at         timestamptz,
  channel         text[],              -- ['email', 'whatsapp']
  created_at      timestamptz DEFAULT now()
);
```

#### 4.2 Trigger ao criar contrato

Ao inserir um novo contrato, uma **Postgres Function + Trigger** já popula a tabela de avisos para todos os 12 meses futuros de aniversário do contrato, calculando a `notice_date = adjustment_date - X days` (X vem do parâmetro da imobiliária). [docs-b8tmkljqz-supabase.vercel](https://docs-b8tmkljqz-supabase.vercel.app/docs/guides/database/extensions/pgcron)

#### 4.3 pg_cron diário de disparo

```sql
SELECT cron.schedule(
  'send-lease-adjustment-notices',
  '0 9 * * *',  -- todo dia às 09:00 UTC-3 (12:00 UTC)
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
            || '/functions/v1/send-adjustment-notices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
    ),
    body := concat('{"today": "', now()::date, '"}')::jsonb
  );
  $$
);
```


A Edge Function `send-adjustment-notices` busca todos os registros com `notice_date = hoje` e `status = 'pending'`, calcula o percentual de reajuste usando os índices da tabela `financial_indices`, e envia via e-mail/WhatsApp. [docs-b8tmkljqz-supabase.vercel](https://docs-b8tmkljqz-supabase.vercel.app/docs/guides/database/extensions/pgcron)

***

### F5 — Integração com Agentes de IA

#### 5.1 Agente Criador de Contratos

Ao criar um contrato, o agente faz uma query com a seguinte lógica:

```sql
-- Buscar parâmetros resolvidos para um imóvel (com herança)
SELECT
  COALESCE(p.lease_duration_months, a.default_lease_duration_months, 30) AS lease_duration_months,
  COALESCE(p.penalty_type, a.default_penalty_type, 'months_rent') AS penalty_type,
  COALESCE(p.penalty_value, a.default_penalty_value, 3) AS penalty_value,
  COALESCE(p.adjustment_index, a.default_adjustment_index, 'igpm') AS adjustment_index,
  COALESCE(p.penalty_grace_months, a.default_penalty_grace_months, 0) AS penalty_grace_months
FROM properties p
JOIN agencies a ON a.id = p.agency_id
WHERE p.id = $1;
```

O agente recebe esse JSON resolvido e o usa como contexto para preencher as cláusulas contratuais.

#### 5.2 Agente de Locação (atendimento ao lead)

Os mesmos parâmetros são incluídos no contexto do RAG ao iniciar uma conversa de atendimento sobre um imóvel específico. O agente pode responder com precisão:

> *"O contrato deste imóvel é de 24 meses, com reajuste anual pelo IPCA. Se você sair antes de 12 meses, a multa é proporcional ao tempo restante, com base em 3 aluguéis."*

***

## 4. Modelo de Dados Supabase (Resumo)

```
agencies                     -- imobiliária (onboard)
  └─ default_lease_duration_months
  └─ default_penalty_type
  └─ default_penalty_value
  └─ default_adjustment_index[ ]  -- array: ['igpm','ipca']
  └─ notice_days_before

properties                   -- imóvel (herda de agencies)
  └─ lease_duration_months    -- nullable (usa default se null)
  └─ penalty_type             -- nullable
  └─ penalty_value            -- nullable
  └─ adjustment_index         -- nullable
  └─ notice_days_before       -- nullable

leases                       -- contratos ativos
  └─ property_id
  └─ start_date
  └─ end_date
  └─ monthly_rent
  └─ resolved_adjustment_index  -- snapshot no momento da assinatura
  └─ resolved_penalty_value     -- snapshot

financial_indices            -- cache de índices atualizados
  └─ index_type, reference_month, variation_pct

lease_adjustment_notices     -- fila de avisos agendados
  └─ lease_id, notice_date, adjustment_date, status
```

***

## 5. Fluxo de Dados End-to-End

```
[Onboard Imobiliária] → configura defaults → tabela agencies
        ↓
[Cadastro do Imóvel] → sobrescreve opcionalmente → tabela properties
        ↓
[Assinatura do Contrato] → resolve parâmetros com herança → tabela leases
        + Trigger → popula lease_adjustment_notices para todos os aniversários
        ↓
[pg_cron dia 15/mês] → Edge Fn busca IBGE/FGV → upsert financial_indices
        ↓
[pg_cron diário 09h] → Edge Fn verifica notice_date = hoje → envia avisos
        ↓
[Agente IA] → query resolvedora → contexto do contrato/lead
```

***

## 6. Prioridade de Implementação

| Sprint | Entrega |
|--------|---------|
| Sprint 1 | Tabelas Supabase (agencies, properties, leases, financial_indices, notices) + query de herança |
| Sprint 2 | UI onboard (checkboxes de índice, inputs de percentual) + UI de imóvel com herança visual |
| Sprint 3 | Edge Function `sync-financial-indices` + pg_cron mensal |
| Sprint 4 | Trigger de geração de avisos + Edge Function `send-adjustment-notices` + pg_cron diário |
| Sprint 5 | Injeção de parâmetros nos agentes de contrato e locação |

***

Com essa arquitetura, o agente de locação e o agente criador de contratos sempre consumirão parâmetros corretos e atualizados diretamente do banco, sem necessidade de input manual. A query de herança garante que a imobiliária não precisa repetir configurações para cada imóvel, mas tem liberdade total quando quiser personalizar. [calculojuridico.com](https://calculojuridico.com.br/api-indices-docs/)