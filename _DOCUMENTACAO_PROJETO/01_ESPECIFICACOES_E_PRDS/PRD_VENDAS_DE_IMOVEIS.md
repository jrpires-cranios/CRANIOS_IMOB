PRD_VENDAS_DE_IMOVEIS

Agora tenho todos os dados de mercado necessários. Vou montar o documento completo — continuação do PRD anterior — com os novos módulos.

***

# PRD — Módulo Financeiro de Vendas, Comissões e Fluxo de Fechamento
**Projeto:** Crânios Imob | **Complemento ao PRD v1.0** | **Março 2026**

***

## 1. Parâmetros de Mercado (Base de Referência)

### Taxa de administração de locação

Não existe percentual máximo fixado em lei; o valor é livremente pactuado entre imobiliária e proprietário. O padrão de mercado no Brasil é: [alude.com](https://www.alude.com.br/blog/taxa-de-administracao-imobiliaria)

| Modelo de cobrança | Range de mercado | Observação |
|---|---|---|
| % sobre aluguel mensal | **8% a 12%** | Mais comum; 10% é o mais praticado. [imobiliariasinai.com](https://imobiliariasinai.com.br/blog/dicas/quanto-cobra-imobiliaria-administrar-imoveis/) |
| Aluguel garantido | **12% a 16%** | Imobiliária cobre inadimplência. [vistasoft.com](https://www.vistasoft.com.br/taxa-de-administracao-imobiliaria/) |
| Taxa mínima fixa | R$ 80 – R$ 150 | Usada quando % < valor mínimo viável. [ivannegocios.com](https://www.ivannegocios.com.br/central-de-ajuda/orientacoes-essenciais-para-proprietarios-e-beneficiarios-62/custos-de-administracao-105/qual-a-porcentagem-a-imobiliaria-cobra-para-administrar-o-imovel-693) |
| Taxa de intermediação (novo contrato) | **50% a 100% do 1º aluguel** | Cobrada uma vez na assinatura. [ivannegocios.com](https://www.ivannegocios.com.br/central-de-ajuda/orientacoes-essenciais-para-proprietarios-e-beneficiarios-62/custos-de-administracao-105/qual-a-porcentagem-a-imobiliaria-cobra-para-administrar-o-imovel-693) |

### Comissão de corretores — Venda

Conforme tabelas referenciais do CRECI: [sindimoveis-sc.org](https://sindimoveis-sc.org.br/comissao-de-corretores-entenda-como-funciona/)

| Tipo de imóvel | Range CRECI | Padrão mais praticado |
|---|---|---|
| Residencial urbano (usado) | 6% a 8% | **6%** |
| Lançamento / incorporação | 4% a 6% | **5%** |
| Imóvel rural | 6% a 10% | 6% a 8% |
| Industrial/comercial | 6% a 8% | 6% |
| Venda judicial | 5% (fixo) | 5% |

A divisão entre imobiliária e corretor costuma ser **50/50**, mas é inteiramente negociável por contrato interno. [creci-pb.gov](https://creci-pb.gov.br/tabela-referencial-de-honorarios-creci-pb/)

***

## 2. Novos Parâmetros Configuráveis (Onboard + Por Imóvel)

### 2.1 Parâmetros de Locação — Taxa Administrativa

Adicionados ao painel de onboard da imobiliária e sobrescrevíveis por imóvel, seguindo o mesmo modelo de herança do PRD v1.0:

| Parâmetro | Tipo de input | Padrão sugerido |
|---|---|---|
| Modelo de cobrança da taxa adm. | Radio: "% do aluguel" / "Valor fixo mensal" / "Aluguel garantido %" | % do aluguel |
| Percentual da taxa (%) | Input numérico | 10% |
| Valor mínimo fixo (R$) | Input numérico (opcional) | R$ 100 |
| Taxa de intermediação | Radio: "% do 1º aluguel" / "Valor fixo" / "Não cobrar" | 100% do 1º aluguel |
| Valor da taxa de intermediação | Input numérico | 100% |

### 2.2 Parâmetros de Venda — Comissão de Corretores

**Nível imobiliária (onboard):**

| Parâmetro | Tipo de input | Observação |
|---|---|---|
| % comissão padrão — lançamentos | Input numérico | Pré-definido com a construtora; herdado em todos os imóveis do empreendimento |
| % comissão padrão — usados | Input numérico | Default para imóveis não classificados como lançamento |
| Divisão imobiliária / corretor (%) | Dois inputs somando 100% | Ex.: 50% / 50% |
| Permite corretor personalizar % no fechamento? | Toggle Sim/Não | Se Não, o campo fica bloqueado no formulário de fechamento |

**Nível imóvel (cadastro do imóvel):**

- Para **lançamentos**: campo "% comissão do empreendimento" herdado da construtora/incorporadora, editável pelo gestor.
- Para **usados**: a comissão é deixada em branco no cadastro e **informada pelo corretor no fechamento**, dentro do range permitido pela imobiliária.

***

## 3. Fluxo Completo de Fechamento de Venda

O fluxo abaixo descreve o ciclo de vida de uma venda, desde o lead até a assinatura e formalização.

```
[Lead chegando]
       ↓
Agente de Atendimento (Telegram) recebe e qualifica
       ↓
Agendamento de visita → notifica corretor
       ↓
Corretor realiza visita
       ↓
┌──────────────────────────────────────────┐
│  FECHAMENTO  (corretor usa UM dos dois)  │
│  A) Painel web (Formulário de fechamento)│
│  B) Telegram (conversa com o agente)     │
└──────────────────────────────────────────┘
       ↓
Dados de fechamento registrados no Supabase:
 • Código do imóvel
 • Valor de venda
 • Condições de pagamento
 • % de comissão proposta
 • Observações livres
       ↓
Notificação automática ao GESTOR:
 • Card no Painel Administrativo (status: "Aguardando aprovação")
 • Mensagem no Telegram do gestor via agente IA
       ↓
┌─────────────────────────────────────────────┐
│  APROVAÇÃO DO GESTOR (um dos dois canais)   │
│  A) Clica "Aprovar" no painel               │
│  B) Responde "aprovar" no Telegram          │
└─────────────────────────────────────────────┘
       ↓
Status muda para "Aprovado" no banco de dados
       ↓
Agente Jurídico recebe briefing completo do negócio
       ↓
Agente de Documentação entra em contato com o cliente
(solicita checklist de documentos)
       ↓
Documentos recebidos → Análise pelo agente/responsável
       ↓
Sinalização ao Agente Jurídico: "docs OK, pode minutar"
       ↓
Contrato gerado + Assinatura Digital enviada ao cliente
       ↓
Cópia encaminhada ao RESPONSÁVEL POR CONTRATOS DE VENDAS
(e-mail + Telegram, configurados no onboard)
       ↓
Responsável confere dados e, se necessário, agenda visita ao cartório
com cliente + corretor para formalização presencial
```

***

## 4. Módulo: Painel de Fechamento do Corretor

### 4.1 Fluxo via Painel Web

1. Corretor acessa **"Nova Venda"**.
2. Digita o **código do imóvel** → sistema puxa automaticamente: endereço, tipo, valor de tabela, % comissão configurado, fotos e condições contratuais.
3. Corretor preenche:
   - Valor de fechamento (R$)
   - Condições de pagamento (campo texto + radio: "À vista / Financiamento / FGTS / Permuta / Misto")
   - % comissão (se a imobiliária permitir personalização; se não, exibe readonly)
   - Observações livres
4. Clica **"Enviar para aprovação"** → status `pending_approval` no banco.

### 4.2 Fluxo via Telegram (Agente IA)

O agente guia o corretor com um fluxo conversacional estruturado:

```
Agente: "Qual o código do imóvel?"
Corretor: "IMV-0042"
Agente: [puxa dados] "Imóvel encontrado: Apto 3 quartos, R$ 450.000 (tabela).
         Qual o valor de fechamento?"
Corretor: "R$ 430.000"
Agente: "Condições de pagamento?"
Corretor: "Financiamento CEF + R$50k entrada"
Agente: "% de comissão? (padrão: 6%)"
Corretor: "6%"
Agente: "Alguma observação?"
Corretor: "Cliente quer vistoria antes da assinatura"
Agente: "Resumo: [exibe card]. Confirmo o envio?"
Corretor: "Sim"
Agente: [registra no Supabase + notifica gestor]
```

***

## 5. Modelo de Dados Supabase (Novos Módulos)

```sql
-- Parâmetros financeiros de locação (agências)
ALTER TABLE agencies ADD COLUMN
  admin_fee_model        text DEFAULT 'pct_rent',       -- 'pct_rent' | 'fixed' | 'guaranteed_pct'
  admin_fee_pct          numeric(5,2) DEFAULT 10.0,
  admin_fee_min_value    numeric(10,2),                 -- taxa mínima em R$
  intermediation_model   text DEFAULT 'pct_first_rent', -- 'pct_first_rent' | 'fixed' | 'none'
  intermediation_value   numeric(10,2) DEFAULT 100.0;   -- 100% do 1º aluguel

-- Parâmetros financeiros de venda (agências)
ALTER TABLE agencies ADD COLUMN
  commission_pct_launch   numeric(5,2) DEFAULT 5.0,
  commission_pct_resale   numeric(5,2) DEFAULT 6.0,
  commission_split_agency numeric(5,2) DEFAULT 50.0,  -- % fica na imobiliária
  allow_custom_commission boolean DEFAULT true;

-- Parâmetros por imóvel (herança)
ALTER TABLE properties ADD COLUMN
  commission_pct          numeric(5,2),               -- null = herda da agency
  is_launch               boolean DEFAULT false,
  launch_developer        text;

-- Tabela de fechamentos de venda
CREATE TABLE sale_closings (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id       uuid REFERENCES properties(id),
  broker_id         uuid REFERENCES users(id),
  lead_id           uuid REFERENCES leads(id),
  closing_value     numeric(12,2) NOT NULL,
  payment_type      text NOT NULL,         -- 'cash' | 'financing' | 'fgts' | 'trade' | 'mixed'
  payment_notes     text,
  commission_pct    numeric(5,2) NOT NULL,
  commission_value  numeric(12,2) GENERATED ALWAYS AS (closing_value * commission_pct / 100) STORED,
  observations      text,
  status            text DEFAULT 'pending_approval', -- 'pending_approval' | 'approved' | 'rejected' | 'contract_sent' | 'signed' | 'done'
  approved_by       uuid REFERENCES users(id),
  approved_at       timestamptz,
  source_channel    text DEFAULT 'web',    -- 'web' | 'telegram'
  created_at        timestamptz DEFAULT now()
);

-- Responsável por contratos de venda (configurado no onboard)
ALTER TABLE agencies ADD COLUMN
  sales_contract_email    text,
  sales_contract_telegram text;  -- @username ou chat_id

-- Histórico de notificações de aprovação
CREATE TABLE closing_notifications (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  closing_id    uuid REFERENCES sale_closings(id),
  channel       text,            -- 'telegram' | 'panel'
  direction     text,            -- 'sent' | 'received'
  message       text,
  sent_at       timestamptz DEFAULT now()
);
```

***

## 6. Arquitetura dos Agentes no Fluxo de Venda

| Agente | Responsabilidade | Gatilho |
|---|---|---|
| **Agente de Atendimento** | Qualifica lead, agenda visita, notifica corretor | Lead entra no funil |
| **Agente do Corretor** | Recebe dados de fechamento via Telegram, estrutura e salva no Supabase | Corretor inicia conversa pós-visita |
| **Agente do Gestor** | Notifica aprovação pendente, processa "aprovar/rejeitar" via Telegram | `status = pending_approval` |
| **Agente Jurídico** | Recebe briefing aprovado, monta minuta do contrato | `status = approved` |
| **Agente de Documentação** | Contata cliente, solicita docs, faz checklist | Após aprovação |
| **Agente de Assinatura** | Envia contrato para assinatura digital, monitora | Docs analisados e OK |

Todos os agentes leem e escrevem na mesma tabela `sale_closings` com campos de status controlados, garantindo rastreabilidade completa do processo. [docs-b8tmkljqz-supabase.vercel](https://docs-b8tmkljqz-supabase.vercel.app/docs/guides/database/extensions/pgcron)

***

## 7. Prioridade de Implementação (Novos Módulos)

| Sprint | Entrega |
|---|---|
| Sprint 6 | Schema Supabase para comissões, taxa adm. e fechamentos; campos no onboard |
| Sprint 7 | Painel do corretor (formulário de fechamento web + pull automático do imóvel) |
| Sprint 8 | Agente Telegram do corretor (fluxo conversacional de fechamento) |
| Sprint 9 | Agente do Gestor (notificação + aprovação via Telegram) |
| Sprint 10 | Cadeia de agentes pós-aprovação (jurídico, documentação, assinatura) |
| Sprint 11 | Notificação ao responsável por contratos + agendamento de cartório |

***

## 8. Parâmetros Financeiros Consolidados (Referência Rápida para o Sistema)

| Módulo | Parâmetro | Range de mercado | Configurável por |
|---|---|---|---|
| Locação | Taxa de administração | 8% – 12% do aluguel [imobiliariasinai.com](https://imobiliariasinai.com.br/blog/dicas/quanto-cobra-imobiliaria-administrar-imoveis/) | Agência e imóvel |
| Locação | Taxa de intermediação | 50% – 100% do 1º aluguel [ivannegocios.com](https://www.ivannegocios.com.br/central-de-ajuda/orientacoes-essenciais-para-proprietarios-e-beneficiarios-62/custos-de-administracao-105/qual-a-porcentagem-a-imobiliaria-cobra-para-administrar-o-imovel-693) | Agência |
| Locação | Taxa mínima fixa | R$ 80 – R$ 150 [ivannegocios.com](https://www.ivannegocios.com.br/central-de-ajuda/orientacoes-essenciais-para-proprietarios-e-beneficiarios-62/custos-de-administracao-105/qual-a-porcentagem-a-imobiliaria-cobra-para-administrar-o-imovel-693) | Agência |
| Locação | Reajuste anual | IGP-M / IPCA / INPC | Agência e imóvel |
| Locação | Multa rescisória | 3 aluguéis ou 10% do contrato [qualityhouse.com](https://www.qualityhouse.com.br/2011/03/29/multa-por-rescisao-antecipada-de-aluguel-tem-que-ser-proporcional/) | Agência e imóvel |
| Venda | Comissão — lançamento | 4% – 6% [myside.com](https://myside.com.br/guia-imoveis/porcentagem-corretor-imoveis) | Agência e imóvel |
| Venda | Comissão — usado | 6% – 8% [sindimoveis-sc.org](https://sindimoveis-sc.org.br/comissao-de-corretores-entenda-como-funciona/) | Agência + corretor no fechamento |
| Venda | Divisão imob./corretor | 50% / 50% (padrão) [creci-pb.gov](https://creci-pb.gov.br/tabela-referencial-de-honorarios-creci-pb/) | Agência |