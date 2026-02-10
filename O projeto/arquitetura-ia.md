# Arquitetura AI-First – Sistema Multiagente Imobiliário Omnichannel

> Objetivo: descrever a **arquitetura completa** de um sistema de IA conversacional especializado para imobiliárias, com roteamento inteligente, automação operacional e dashboard inteligente.

---

## 1. Visão Arquitetural de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                     CANAIS DE ENTRADA MULTICANAL                │
│  ZAP │ Viva Real │ Instagram │ Messenger │ Telegram │ Site     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ MESSAGE HUB │ (Normaliza tudo)
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼─────┐      ┌────▼──────┐     ┌────▼──────┐
   │INTENT     │      │PROFILE    │     │INTERACTION│
   │DETECTION │      │BUILDER    │     │MEMORY     │
   └────┬─────┘      └────┬──────┘     └────┬──────┘
        │                 │                   │
        └─────────────────┼───────────────────┘
                          │
        ┌─────────────────▼──────────────────┐
        │    AI AGENT ROUTER & DISPATCHER    │
        │  (Seleciona agente especializado) │
        └─────────────────┬──────────────────┘
                          │
        ┌─────────────────┴──────────────────┐
        │                                    │
    ┌───▼──────────┐  ┌──────────────────┐  ┌──▼────────────┐
    │AGENT GROUP   │  │  AGENT GROUP     │  │  AGENT GROUP │
    │ VENDAS       │  │  LOCAÇÃO         │  │  SUPORTE     │
    │              │  │                  │  │              │
    │- Lançamento  │  │- Investigativo   │  │- Jurídico    │
    │- Usados      │  │- Recomendação    │  │- Financeiro  │
    │- Premium     │  │- Agendamento     │  │- Técnico     │
    └───┬──────────┘  └──────┬───────────┘  └──┬───────────┘
        │                    │                  │
        └────────────────────┼──────────────────┘
                             │
        ┌────────────────────▼──────────────────┐
        │   AUTOMATION & HANDOFF LAYER          │
        │                                       │
        │ ┌──────────────────────────────────┐ │
        │ │ Cal.com Integration (Corretores) │ │
        │ └──────────────────────────────────┘ │
        │ ┌──────────────────────────────────┐ │
        │ │ Apresentador Routing & Otimização│ │
        │ └──────────────────────────────────┘ │
        │ ┌──────────────────────────────────┐ │
        │ │ Self-Vistoria Digital            │ │
        │ └──────────────────────────────────┘ │
        └────────────────────┬──────────────────┘
                             │
        ┌────────────────────▼──────────────────┐
        │    DATABASE & KNOWLEDGE BASE          │
        │                                       │
        │ ┌──────────────────────────────────┐ │
        │ │ Leads + Profiles                 │ │
        │ ├──────────────────────────────────┤ │
        │ │ Conversations & Context Memory   │ │
        │ ├──────────────────────────────────┤ │
        │ │ Properties & Inventory           │ │
        │ ├──────────────────────────────────┤ │
        │ │ Corretores & Performance Scores  │ │
        │ ├──────────────────────────────────┤ │
        │ │ Appointments & Routing History   │ │
        │ ├──────────────────────────────────┤ │
        │ │ Self-Vistoria Records & Images   │ │
        │ └──────────────────────────────────┘ │
        └────────────────────┬──────────────────┘
                             │
        ┌────────────────────▼──────────────────┐
        │       DASHBOARD & ANALYTICS          │
        │                                       │
        │ ┌──────────────────────────────────┐ │
        │ │ IA Performance & Satisfaction    │ │
        │ ├──────────────────────────────────┤ │
        │ │ Corretor Rankings & Hotlines     │ │
        │ ├──────────────────────────────────┤ │
        │ │ Conversion Funnels & Metrics     │ │
        │ ├──────────────────────────────────┤ │
        │ │ Apresentador Routes & Efficiency │ │
        │ ├──────────────────────────────────┤ │
        │ │ Real-time Operations View        │ │
        │ └──────────────────────────────────┘ │
        └────────────────────────────────────────┘
```

---

## 2. Componentes Principais

### 2.1. Message Hub & Intent Detection

**Responsabilidade:**
- Receber mensagens de todos os canais (ZAP, Instagram, Telegram, WhatsApp, Site)
- Normalizar payload para formato interno único
- Detectar **intenção inicial** do lead (venda, locação, dúvida, agendamento)
- Enriquecer contexto (qual imóvel, se veio de anúncio, etc.)

**Inputs:**
```json
{
  "channel": "instagram_dm",
  "sender_id": "lead_123",
  "message": "Olá, tenho interesse no apartamento de 3 quartos",
  "metadata": {
    "property_id": "prop_456",
    "referrer": "instagram_ad_lançamentos",
    "timestamp": "2026-01-27T11:50:00Z"
  }
}
```

**Outputs:**
```json
{
  "lead_id": "lead_123",
  "conversation_id": "conv_789",
  "detected_intent": "interested_in_property",
  "category": "vendas_lancamentos",
  "property_id": "prop_456",
  "origin": "instagram",
  "context": {
    "initial_profile": {},
    "needs_investigation": true
  }
}
```

### 2.2. Profile Builder

**Responsabilidade:**
- Construir perfil do lead a partir das interações
- Identificar padrões de comportamento
- Enriquecer dados (família, orçamento, localização preferida, timing)

**Dados Coletados:**
```javascript
{
  lead_id: "lead_123",
  personal: {
    name: "João Silva",
    phone: "+55 11 99999-9999",
    email: "joao@email.com",
    family_size: 3,
    family_profile: "família_jovem_com_crianças"
  },
  real_estate: {
    property_type_interested: ["apartamento", "casa"],
    bedrooms: 3,
    bathrooms: 2,
    preferred_neighborhoods: ["Vila Madalena", "Pinheiros"],
    search_radius_km: 5,
    budget_min: 400000,
    budget_max: 800000,
    lease_vs_purchase: "lease" // ou "purchase"
  },
  behavioral: {
    engagement_level: 0.85, // 0-1
    response_time_avg_seconds: 120,
    messages_sent: 15,
    questions_depth: "investigative", // superficial / investigative / technical
    show_interest_signals: ["asked_about_lease", "asked_about_neighborhoods"]
  }
}
```

### 2.3. AI Agent Router

**Responsabilidade:**
- Receber contexto do lead + intent
- Selecionar **qual grupo de agentes** melhor serve o lead
- Opcionalmente, selecionar **qual agente específico** (se houver vários)

**Lógica de Roteamento:**
```javascript
// Exemplos de decisão
if (intent === "interested_in_property" && property.type === "lançamento") {
  return agents.vendas.lançamentos;
}

if (intent === "general_inquiry" && !lead.has_property_in_mind) {
  return agents.locacao.investigativo;
}

if (lead.already_has_appointment && intent === "confirm_or_reschedule") {
  return agents.suporte.agendamento;
}

// Fallback
return agents.suporte.geral;
```

### 2.4. Interaction Memory

**Responsabilidade:**
- Manter histórico completo de cada conversa
- Armazenar contexto para evitar repetição de perguntas
- Permitir que agentes entendam histórico anterior

**Estrutura:**
```javascript
{
  conversation_id: "conv_789",
  lead_id: "lead_123",
  messages: [
    {
      timestamp: "2026-01-27T10:00:00Z",
      sender: "lead",
      agent_type: "investigativo",
      message_text: "Olá, procuro apartamento 3 quartos",
      context_snapshot: { budget: null, location: null }
    },
    {
      timestamp: "2026-01-27T10:05:00Z",
      sender: "agent",
      agent_type: "investigativo",
      message_text: "Bem-vindo! Qual é seu orçamento aproximado?",
      action: "question_budget"
    }
    // ... mais mensagens
  ],
  interaction_summary: {
    total_messages: 25,
    duration_minutes: 45,
    questions_asked: ["budget", "location", "timeline"],
    objections_handled: ["price", "neighborhood_distance"],
    properties_suggested: ["prop_456", "prop_789"],
    engagement_score: 0.92
  }
}
```

---

## 3. Grupos de Agentes Especializados

### 3.1. Grupo VENDAS

**Subagentes:**
- **Agent: Vendas Lançamentos** → especializado em imóveis novos, construção, facilidades
- **Agent: Vendas Usados** → foco em imóvel pronto, histórico, margens
- **Agent: Premium** → luxury properties, high-end clients, exclusividade

**Características Comuns:**
- Técnicas de vendas avançadas
- Storytelling sobre o imóvel
- Objection handling experiente
- Urgência tática (vagas limitadas, oportunidades)

### 3.2. Grupo LOCAÇÃO

**Subagentes:**
- **Agent: Investigativo** → descobre necessidades, analisa perfil, recomenda alternativas
- **Agent: Recomendação** → baseado no perfil, sugere imóveis similares, faz "concierge"
- **Agent: Agendamento de Visita** → otimiza horários, integra com Apresentador

**Características Comuns:**
- Entendimento profundo de necessidades
- Construção de relação empática
- Recomendações personalizadas
- Facilidade de agendamento

### 3.3. Grupo SUPORTE

**Subagentes:**
- **Agent: Jurídico** → responde dúvidas sobre contratos, direitos, obrigações
- **Agent: Financeiro** → explica opções de financiamento, CET, simulações
- **Agent: Técnico** → responde sobre infraestrutura, condomínio, manutenção

**Características Comuns:**
- Informação precisa e verificável
- Escalação clara para humanos se necessário
- Documentação de perguntas frequentes

---

## 4. Fluxo de Conversa Típico

### Cenário 1: Lead vem de anúncio específico (Locação)

```
1. Lead clica em anúncio do imóvel "Apt 3Q - Vila Madalena" no Instagram
   → Message Hub detecta: intent=interested, category=locacao, property_id=prop_456

2. Router seleciona: Agent.Locacao.Investigativo

3. Agent começa:
   "Olá João! Vi que você se interessou pelo nosso apartamento em Vila Madalena. 
    Para oferecer as melhores alternativas, me conta:
    - Quantas pessoas vão morar aí?
    - Qual sua timeline ideal para mudar?
    - Esse é seu orçamento ideal ou tem flexibilidade?"

4. Conforme lead responde, Profile é enriquecido

5. Se lead quer agendar visita:
   → Router escalona para Agent.Locacao.Agendamento
   → Agendamento integrado com Cal.com do corretor + Apresentador

6. Se lead quer outras opções:
   → Agent.Locacao.Recomendacao busca similares, oferece alternativas
   → Mantém engajamento alto, "concierge digital"
```

### Cenário 2: Lead vem só de "internet" (site geral)

```
1. Lead entra no site, clica em "Conversar com IA"
   → Message Hub detecta: intent=general_inquiry, category=unknown, no_property_id

2. Router seleciona: Agent.Locacao.Investigativo (padrão para "genérico")

3. Agent questiona:
   "Bem-vindo! Você está procurando para:
    a) Alugar
    b) Comprar
    c) Ambos"

4. Lead responde "Alugar"
   → Agent continua investigação (quartos, orçamento, localização, timeline)

5. Profile Builder vai montando o "avatar" do lead em tempo real

6. Agent.Recomendacao entra em ação, oferecendo:
   - Primeiras 3 opções baseadas no que foi dito
   - Opção de refinar busca (horário, confortos específicos, etc.)

7. Lead escolhe propriedade
   → Agent.Agendamento entra, oferece horários otimizados
   → Cal.com + Apresentador coordenado
```

### Cenário 3: Lead retorna após agendamento prévio (Suporte)

```
1. Lead volta à conversa: "Olá, agendei visita, tenho dúvida sobre contrato"
   → Message Hub detecta: intent=support_question, conversation_id=conv_789 (existente)

2. Interaction Memory recupera histórico completo

3. Router seleciona: Agent.Suporte.Juridico

4. Agent responde com conhecimento de contexto:
   "João, vi que você está interessado no apto de Vila Madalena. 
    Sobre o contrato... [resposta específica]"

5. Se pergunta é repetida ou muito técnica:
   → Escalona para humano jurista com contexto completo
```

---

## 5. Persistence & Context Flow

**Onde tudo é armazenado:**

1. **Leads Table**
   - Basic info: name, phone, email, origin
   - Behavioral scores: engagement_level, response_time, conversion_likelihood

2. **Conversations Table**
   - conversation_id, lead_id, current_agent_type, status
   - Last interaction timestamp, assigned_human (se houver)

3. **Messages Table**
   - message_id, conversation_id, sender (lead/agent), channel, content
   - Embedding (vector) para busca semântica

4. **Profiles Table**
   - lead_id, personal_data, real_estate_preferences, behavioral_patterns
   - Last updated timestamp

5. **Interaction Memory Cache**
   - conversation_id, summary, key_points, pending_actions
   - TTL: pode ser em Redis para velocidade

---

## 6. Escalação para Humanos

**Critérios de Escalação:**

```javascript
if (
  agent.confidence < 0.6 ||
  lead.has_asked_same_question_3_times ||
  lead.expressed_frustration ||
  agent_type === "juridico" && question_is_contract_specific ||
  conversation.duration > 60_minutes ||
  lead.requested_human_explicitly
) {
  escalate_to_human(conversation_id, context);
}
```

**Quando human entra:**
- Tem acesso a TODO o histórico (mensagens, profile, scores)
- Sabe exatamente onde IA parou
- Pode assumir ou apenas corrigir/complementar

---

## 7. KPIs & Observabilidade

Métricas importantes para monitorar:

- **Agent Performance**
  - Avg conversation duration
  - Lead satisfaction (post-interaction)
  - Conversion rate (lead → agendamento)
  - Escalation rate

- **Lead Health**
  - Engagement score progression
  - Response time patterns
  - Objection handling effectiveness

- **System Health**
  - API latency (intent detection, routing)
  - Message processing time
  - Error rates by channel

---

## 8. Próximas Fases

Este documento descreve a arquitetura de **Intent Detection + Routing + Agents**.

Documentos complementares cobrirão:
- `agentes-especializados.md` → Prompts e comportamentos de cada agente
- `integracao-cal-roteamento.md` → Cal.com + Corretor Matching
- `apresentador-vistoria.md` → Apresentador de Imóveis + Self-Vistoria
- `dashboard-analytics.md` → Dashboard unificado + KPIs

---

Este é o **coração do sistema**. Tudo funciona em volta dessa arquitetura.
