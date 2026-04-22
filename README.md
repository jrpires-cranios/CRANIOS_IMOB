# Crânios IMOB — Plataforma SaaS Imobiliária com IA

Sistema multi-tenant completo para imobiliárias, com 9 agentes de IA, atendimento via WhatsApp com transcrição de áudio, CRM, financeiro, contratos digitais e geração automática de portfólios em PDF.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Express (TypeScript) |
| Frontend | React + Vite (TypeScript) |
| Banco de dados | Supabase (PostgreSQL) |
| IA / RAG | OpenAI GPT-4o + Pinecone |
| Storage | Cloudflare R2 |
| WhatsApp | UazAPI |
| E-mail | Resend |
| Pagamentos | Asaas |
| PDF / Portfólio | Puppeteer + Handlebars |
| Deploy | Coolify + Docker (DigitalOcean) |

---

## Arquitetura do Atendimento WhatsApp

```
Cliente envia mensagem (texto ou áudio)
        ↓
UazAPI Webhook → Acumulador 3s (agrupa msgs rápidas)
        ↓
   [se áudio] → Whisper STT → transcrição PT-BR
        ↓
   ChatAgent (9 agentes especializados)
        ↓
   Humanizador (remove padrões de IA)
        ↓
   Divisor inteligente + delays (efeito digitando)
        ↓
   [se cliente enviou áudio] → Google TTS → responde com áudio primeiro
        ↓
   UazAPI → entrega ao cliente
```

---

## Agentes de IA (9)

| Agente | Responsabilidade |
|---|---|
| **ChatAgent** | Orquestrador principal |
| **SDRAgent** | Qualificação inicial de leads |
| **QualificationAgent** | Perfil detalhado do cliente |
| **SearchAgent** | Busca semântica RAG de imóveis |
| **SchedulingAgent** | Agendamento de visitas |
| **FinanciamentoAgent** | Simulação de financiamento |
| **DocumentacaoAgent** | Geração de documentos |
| **DocumindAgent** | Análise de documentos |
| **SignNowAgent** | Assinatura digital |

---

## Serviços Principais (48)

### WhatsApp & Comunicação
- `whatsapp.service.ts` — Envio de texto e áudio via UazAPI
- `transcription.service.ts` — STT com OpenAI Whisper
- `tts.service.ts` — TTS com Google Cloud (OGG para WhatsApp)
- `humanizer.service.ts` — Remove padrões artificiais de IA
- `whatsapp-response.service.ts` — Acumulador, splitter, delays, espelhamento
- `email.service.ts` — E-mails via Resend

### Imóveis & RAG
- `pinecone.service.ts` — Indexação e busca vetorial
- `pdf-generator.service.ts` — PDF portfólio com identidade visual da imobiliária
- `r2-storage.service.ts` — Upload no Cloudflare R2

### CRM & Leads
- `lead.service.ts` — CRUD e gestão de leads
- `lead-memory.service.ts` — Memória cross-session
- `lead_router.service.ts` — Distribuição automática (roleta)

### Financeiro & Contratos
- `asaas.service.ts` — Cobranças e assinaturas
- `lease.service.ts` — Contratos de locação
- `sale.service.ts` — Contratos de venda

---

## Endpoints Principais (115 total)

```
POST /api/imoveis/ingest       Cadastrar imóvel (PDF + fotos → R2 + Pinecone + PDF book)
POST /api/chat                 Enviar mensagem para o agente
POST /api/webhooks/uazapi      WhatsApp incoming (UazAPI)
POST /api/webhooks/asaas       Pagamentos Asaas
GET  /api/leads                Listar leads
POST /api/auth/login           Login
POST /api/master/impersonate   Super Admin
```

---

## Configuração

```bash
cp .env.example .env
# preencher variáveis
npm install
npm run dev
```

Variáveis obrigatórias: `SUPABASE_URL`, `OPENAI_API_KEY`, `PINECONE_API_KEY`, `R2_*`, `UAZAPI_*`, `ASAAS_API_KEY`

Opcional (habilita áudio): `GOOGLE_TTS_API_KEY`

---

## Deploy (Coolify)

1. Conectar repositório GitHub no Coolify
2. Build Pack: Nixpacks
3. Adicionar variáveis de ambiente
4. `nixpacks.toml` já configura Chromium, NODE_ENV e Puppeteer automaticamente

---

## Multi-tenancy

Cada imobiliária tem namespace próprio no Pinecone, bucket R2 isolado, identidade visual no PDF e instância UazAPI independente.

---

*Crânios IMOB — Inteligência Artificial aplicada ao mercado imobiliário*
