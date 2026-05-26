


🏢
SISTEMA IMOBILIÁRIO SaaS
Onboarding Automatizado por Imobiliária + Pipeline de RAG Dinâmico
Multi-tenant · Provisionamento Automático · RAG Personalizado por Agente e por Cliente
Arquitetura
Multi-tenant SaaS
RAG por agente
9 × N imobiliárias
Infra auto
Supabase + R2 + Pinecone
Integrações
10 canais por cliente

ÍNDICE
1. Arquitetura Multi-tenant e Modelo de Isolamento
2. Fluxo Completo do Onboarding (7 Etapas)
3. Schema Completo do Formulário de Onboarding
4. Pipeline de Geração Automática de RAG
5. Sistema de Variáveis RAG (Template Engine)
6. Namespaces e Estratégia Pinecone Multi-tenant
7. Provisionamento Automático de Infraestrutura
8. Personalização de Agentes por Imobiliária
9. Integrações e Webhooks Automatizados
10. Estrutura de Dados — Tabelas SaaS
11. API de Onboarding — Endpoints
12. Checklist de Entrega do Sistema de Onboarding

1. Arquitetura Multi-tenant e Modelo de Isolamento

O sistema opera no modelo multi-tenant onde cada imobiliária (tenant) é um cliente isolado com seus próprios recursos de infraestrutura, dados e inteligência artificial. O isolamento é total em três camadas.

1.1 Modelo de Isolamento por Camada
Camada
Estratégia de Isolamento
Recurso Criado por Tenant
Banco de Dados
Banco Supabase dedicado por tenant (database-per-tenant)
1 projeto Supabase por imobiliária
Armazenamento
Bucket R2 exclusivo com path prefix por tenant
1 bucket Cloudflare R2 por imobiliária
IA / RAG
Namespaces Pinecone isolados por tenant_id:agent_key
9 namespaces por imobiliária (1 por agente)
Agentes
Configurações e prompts armazenados no banco do tenant
Tabela agent_configs por imobiliária
Integrações
Credenciais criptografadas na tabela integrations do tenant
Webhooks e tokens exclusivos
Autenticação
JWT com claim tenant_id + role verificado em cada request
Usuário gestor vinculado ao tenant

🔐  Princípio de Segurança Multi-tenant
NUNCA um tenant acessa dados de outro tenant. Isso é garantido por:
1. RLS (Row Level Security) no Supabase: cada query filtra automaticamente pelo tenant_id.
2. Namespace Pinecone: queries sempre incluem o namespace do tenant como escopo obrigatório.
3. JWT middleware: todo request valida o claim tenant_id antes de qualquer operação.
4. Bucket R2: políticas IAM impedem acesso cross-tenant ao armazenamento.

1.2 Identificadores Únicos por Tenant
// Estrutura de identificação de cada tenant (imobiliária)
{
  tenant_id: "uuid-v4",                    // identificador global único
  tenant_slug: "horizonte-imoveis",         // usado em URLs e namespaces
  supabase_project_id: "rbhkwmesmvyt...",  // referência ao projeto Supabase
  r2_bucket: "horizonte-imoveis-docs",      // bucket de documentos
  pinecone_prefix: "horizonte_imoveis",     // prefixo dos namespaces
  // Namespaces Pinecone gerados:
  // horizonte_imoveis:elena, :ricardo, :amanda, :carlos,
  // :lucas, :bruna, :gabriel, :marina, :roberto, :geral
}

2. Fluxo Completo do Onboarding — 7 Etapas

O onboarding é um wizard de 7 etapas que coleta todos os dados necessários para provisionar o sistema completo de forma automática. Estima-se de 8 a 15 minutos para conclusão completa.

Etapa
Nome
O que coleta
Tempo Estimado
1
Empresa
Nome, CRECI, e-mail, telefone, site
1 min
2
Mercado
Cidade, estado, bairros, tipos de imóvel
2 min
3
Marca
Tom de voz global, slogan, cor, personalidade
2 min
4
Agentes IA
Nome custom, tom individual, observações por agente
4 min
5
Integrações
Portais, Asaas, redes sociais, API keys
3 min
6
Infraestrutura
Região Supabase, bucket R2, Pinecone env
1 min
7
Deploy
Review + disparo do provisionamento automático
Automático

⚡  O que acontece automaticamente após o Deploy
1. Supabase: criação do projeto, migrations, RLS policies, seed de configurações iniciais.
2. Cloudflare R2: criação do bucket, configuração de CORS e políticas de acesso.
3. Pinecone: criação dos 9 namespaces + 1 namespace 'geral' com a base de conhecimento.
4. RAG Generation: os templates base (sua base atual) são preenchidos com as variáveis do tenant.
5. Chunking e Embedding: os arquivos Markdown gerados são vetorizados e indexados no Pinecone.
6. Integrações: webhooks registrados nas plataformas, tokens armazenados criptografados.
7. Notificação: e-mail enviado ao gestor com URL do dashboard e credenciais de acesso.

3. Schema Completo do Formulário de Onboarding

3.1 Etapa 1 — Empresa
Campo
Tipo
Validação / Observação
nome_imobiliaria
text (required)
Mín 3 chars. Usado como display name e para gerar o tenant_slug
creci
text (required)
Formato: CRECI-[UF] [número]-[tipo]. Verificado via API COFECI (futuro)
email_gestao
email (required)
Receberá credenciais de acesso e alertas do sistema
telefone_whatsapp
tel
Usado como número padrão de contato da imobiliária
site_url
url
Integrado no contexto dos agentes para referências de links
cnpj
text
Validado pelo algoritmo CNPJ. Usado em documentos e contratos

3.2 Etapa 2 — Mercado
Campo
Tipo
Uso no RAG
cidade_principal
text (required)
Inserido em TODOS os agentes: 'A {imobiliaria} atua em {cidade}'
estado
select UF
Contexto geográfico para Bruna (ITBI estadual, legislação local)
bairros_atuacao
textarea (csv)
Lista usada por Ricardo (contexto de bairros) e Carlos (mapa de visitas)
tipos_imovel
multi-select chips
Filtra habilitação dos agentes (ex: Gabriel só se tiver Lançamento)
faixa_ticket_medio
select range
Contexto financeiro para Lucas e Amanda (R$200k-500k / R$500k-1M / +R$1M)
anos_mercado
number
Usado nos scripts: 'Com X anos de mercado...'
diferenciais
textarea
Argumentos únicos inseridos nos scripts de Ricardo e Gabriel

3.3 Etapa 3 — Marca
Campo
Tipo
Impacto no Sistema
tom_voz_global
select (8 opções)
Padrão para todos os agentes que não têm tom individual configurado
slogan
text
Inserido na abertura de Elena e nas apresentações de Ricardo/Gabriel
cor_primaria_hex
color picker
CSS var do dashboard gerada automaticamente
personalidade_marca
textarea
Adicionada ao system prompt de todos os agentes como contexto de empresa
publico_alvo
select + texto livre
Ajusta linguagem: jovens/famílias/investidores/empresas
tom_proibido
textarea
Lista de expressões que os agentes nunca devem usar
cases_sucesso
textarea
Exemplos reais usados por Ricardo e Gabriel como prova social

3.4 Etapa 4 — Configuração por Agente (repetida para cada um dos 9)
Campo
Tipo
Comportamento
enabled
toggle boolean
Se false: agente não é provisionado, não aparece no sistema
nome_custom
text
Substitui o nome padrão nos scripts. Ex: 'Elena' → 'Bia'
tom_voz_individual
select (nullable)
Se preenchido, sobrescreve o tom_voz_global apenas para este agente
genero
select (M/F/Neutro)
Ajusta pronomes e concordâncias em todos os scripts do agente
observacoes_persona
textarea
Texto livre adicionado ao RAG: 'Sempre mencione X', 'Evite falar sobre Y'
especialidades_extras
tags
Habilidades adicionais além do papel base (ex: ROBERTO + 'avaliação de imóveis')
saudacao_custom
textarea
Substituição completa do script de abertura padrão

3.5 Etapa 5 — Integrações
Integração
Dados Necessários
Como é Configurada
OLX Imóveis
Webhook URL + secret
POST /webhooks/olx/{tenant_id} registrado na plataforma
ZAP Imóveis
API token ZAP
Polling a cada 5 min ou webhook se disponível no plano
Viva Real
API token Viva Real
Integração via API oficial ou scraping autorizado
Imovel Web
Webhook token
POST /webhooks/imovelweb/{tenant_id}
Asaas
API Key (produção/sandbox)
Armazenada criptografada. Marina usa para emissão de cobranças
WhatsApp Business
Phone Number ID + Access Token
Meta Cloud API — webhook /webhooks/whatsapp/{tenant_id}
Instagram DM
Access Token + Page ID
Meta Graph API — mesma conta pode integrar FB + IG
Facebook Messenger
Page Access Token + App Secret
Webhook verificado via Meta Developers
Telegram Bot
Bot Token (@BotFather)
setWebhook para /webhooks/telegram/{tenant_id}
TikTok Mensagens
App ID + Secret
TikTok Business API — em beta no Brasil

4. Pipeline de Geração Automática de RAG

A geração do RAG acontece em 4 fases após o submit do onboarding. O processo é assíncrono e leva entre 2 e 8 minutos dependendo do volume de texto e da velocidade da API de embeddings.

4.1 Diagrama do Pipeline
ONBOARDING FORM SUBMIT
         │
         ▼
┌─────────────────────┐
│  1. PARSE & VALIDATE │  → Validar campos obrigatórios, formatar dados
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. PROVISION INFRA  │  → Supabase + R2 + Pinecone (paralelo, ~90s)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│ 3. RAG TEMPLATE ENGINE       │
│   Para cada agente ativo:    │
│   a) Carregar template base  │  ← Base criada anteriormente (9 arquivos MD)
│   b) Substituir variáveis    │  ← Dados do formulário do tenant
│   c) Adicionar personalizações│  ← nome_custom, tom, observacoes, etc.
│   d) Gerar arquivo MD final  │  ← Output: RAG_elena_horizonte.md
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 4. EMBED + INDEX PINECONE   │
│   Para cada arquivo MD:      │
│   a) Chunking (800 tokens)   │
│   b) Embedding (text-ada-002)│
│   c) Upsert namespace        │  → namespace: {slug}:{agent_key}
│   d) Marcar status indexed   │
└─────────────────────────────┘
           │
           ▼
TENANT ONLINE → Notificação por e-mail

4.2 Função de Geração do RAG (TypeScript)
// src/onboarding/rag-generator.ts

interface TenantOnboardingData {
  company: CompanyData;
  market: MarketData;
  brand: BrandData;
  agents: Record<AgentKey, AgentConfig>;
}

async function generateTenantRAG(data: TenantOnboardingData): Promise<void> {
  const { company, market, brand, agents } = data;

  // Variáveis de substituição globais
  const globalVars = buildGlobalVars(company, market, brand);

  // Para cada agente ativo
  for (const [agentKey, agentConfig] of Object.entries(agents)) {
    if (!agentConfig.enabled) continue;

    // 1. Carregar template base do agente
    const template = await loadTemplate(`rag_base/${agentKey.toLowerCase()}.md`);

    // 2. Substituir variáveis globais + específicas do agente
    const agentVars = buildAgentVars(agentConfig, agentKey, globalVars);
    const ragContent = applyVariables(template, { ...globalVars, ...agentVars });

    // 3. Chunking e indexação no Pinecone
    const namespace = `${company.slug}:${agentKey.toLowerCase()}`;
    await chunkAndIndex(ragContent, namespace, { agent: agentKey, tenant: company.slug });
  }

  // 4. Indexar base geral
  await chunkAndIndex(applyVariables(GENERAL_RAG, globalVars),
    `${company.slug}:geral`, { tenant: company.slug });
}

5. Sistema de Variáveis RAG — Template Engine

O Template Engine substitui placeholders nos arquivos Markdown base pelos dados reais de cada imobiliária. O resultado é um RAG completamente personalizado, como se tivesse sido escrito especificamente para aquela empresa.

5.1 Variáveis Globais (substituídas em TODOS os agentes)
Variável
Fonte no Formulário
Exemplo de Resultado
{IMOBILIARIA_NOME}
company.name
Horizonte Imóveis
{IMOBILIARIA_SLOGAN}
brand.slogan
'Realizando o sonho do lar'
{IMOBILIARIA_CRECI}
company.creci
CRECI-BA 12345-J
{IMOBILIARIA_SITE}
company.site
https://horizonte.com.br
{CIDADE_PRINCIPAL}
market.city
Salvador
{ESTADO}
market.state
BA
{BAIRROS_PRINCIPAIS}
market.neighborhoods
Barra, Itaigara, Pituba
{TIPOS_IMOVEL}
market.propertyTypes.join(', ')
Apartamento, Casa, Lançamento
{TOM_GLOBAL}
brand.globalTone
Consultivo e empático
{PERSONALIDADE_MARCA}
brand.personality
[texto completo da persona da empresa]
{ANOS_MERCADO}
market.yearsInMarket
15 anos
{PUBLICO_ALVO}
brand.targetAudience
Famílias de classe média-alta
{TICKET_MEDIO}
market.avgTicket
R$ 500k a R$ 1,2M
{DIFERENCIAIS}
market.differentials
Assessoria jurídica inclusa, vistoria grátis
{HORARIO_ATENDIMENTO}
company.serviceHours
Seg–Sex 8h–18h, Sáb 8h–14h

5.2 Variáveis por Agente (substituídas apenas no agente específico)
Variável
Fonte
Observação
{AGENTE_NOME}
agents[key].name || defaultName
Se não customizado, usa o nome padrão da base
{AGENTE_TOM}
agents[key].tone || brand.globalTone
Hierarquia: individual > global > padrão do agente
{AGENTE_GENERO_ARTIGO}
agents[key].gender
'o' ou 'a' (para concordância gramatical)
{AGENTE_OBSERVACOES}
agents[key].customObs
Adicionado ao bloco 'Regras Especiais' do agente
{AGENTE_SAUDACAO}
agents[key].customGreeting
Substitui completamente o script de abertura se preenchido
{AGENTE_ESPECIALIDADES}
agents[key].extraSkills
Competências extras além do papel base
{CASES_SUCESSO}
brand.successCases
Inserido nos scripts de argumentação de Ricardo e Gabriel
{TOM_PROIBIDO}
brand.prohibitedTone
Bloco 'Nunca diga' personalizado por empresa

5.3 Variáveis Condicionais (geradas logicamente)
// Variáveis calculadas automaticamente pelo sistema

// Se tipos_imovel inclui 'Lançamento' → Gabriel é habilitado por padrão
// Se tipos_imovel NÃO inclui 'Locação' → Marina tem scripts de locação removidos
// Se ticket_medio > R$1M → Ricardo recebe argumentação premium
// Se anos_mercado > 10 → Scripts incluem 'Com mais de {ANOS_MERCADO} de tradição...'

const conditionals: ConditionalBlock[] = [
  {
    condition: data.market.propertyTypes.includes('Lançamento'),
    agent: 'GABRIEL',
    addBlock: 'LANÇAMENTOS_PREMIUM_CONTEXT',
  },
  {
    condition: data.market.avgTicket === 'above_1M',
    agents: ['RICARDO', 'AMANDA'],
    replaceBlock: 'QUALIFICACAO_BASICA' → 'QUALIFICACAO_PREMIUM',
  },
]

6. Namespaces e Estratégia Pinecone Multi-tenant

6.1 Estrutura de Namespaces por Tenant
// Para a imobiliária 'Horizonte Imóveis' (slug: horizonte_imoveis)

horizonte_imoveis:elena     → Scripts de recepção e roteamento
horizonte_imoveis:ricardo   → Consultoria de imóveis, argumentação comercial
horizonte_imoveis:amanda    → Qualificação, lead scoring, perfis
horizonte_imoveis:carlos    → Agendamentos, confirmações, protocolos
horizonte_imoveis:lucas     → Financiamento, simulações, FGTS, bancos
horizonte_imoveis:bruna     → Jurídico, contratos, LGPD, documentação
horizonte_imoveis:gabriel   → Lançamentos, SDR premium, reservas
horizonte_imoveis:marina    → Cobranças, Asaas, orçamentos, boletos
horizonte_imoveis:roberto   → Vistorias, manutenção, fornecedores
horizonte_imoveis:geral     → Objeções universais, fluxos, SLAs

// Query sempre inclui namespace do agente + geral
const results = await pinecone.query({
  namespace: `${tenant.slug}:${activeAgent.toLowerCase()}`,
  topK: 5,
  vector: await embed(userMessage),
});
const general = await pinecone.query({
  namespace: `${tenant.slug}:geral`,
  topK: 3,
  vector: await embed(userMessage),
});

6.2 Metadata por Chunk Indexado
Metadata Key
Valor
Uso
tenant_id
uuid do tenant
Filtro de segurança em todas as queries
tenant_slug
horizonte_imoveis
Identificação legível
agent_key
ELENA / RICARDO / etc.
Qual agente gerou este chunk
section
scripts / faqs / objecoes
Tipo de conteúdo para análise de performance
source_template
rag_base/01_elena.md
Rastreabilidade da origem do conteúdo
created_at
ISO timestamp
Para invalidação e re-indexação quando atualizar
version
1.0 / 1.1 / etc.
Controle de versão do RAG
is_customized
boolean
Se é conteúdo base ou foi personalizado pelo tenant

7. Provisionamento Automático de Infraestrutura

Após o submit do formulário de onboarding, um job assíncrono é disparado. Todas as etapas são executadas em paralelo onde possível, com checkpoints de rollback em caso de falha.

7.1 Sequência de Provisionamento
Fase
Ação
Serviço/API
Timeout
1a
Criar projeto Supabase via Management API
Supabase Management API v1
60s
1b
Aplicar migrations SQL e seed inicial
Supabase SQL Editor API
30s
1c
Configurar RLS policies por tabela
Supabase Management API
15s
2a
Criar bucket Cloudflare R2
Cloudflare API v4
10s
2b
Configurar CORS e políticas de acesso
Cloudflare API v4
10s
3a
Gerar RAG personalizado (template engine)
Processo interno
30s
3b
Chunking dos 10 arquivos MD gerados
Processo interno
20s
3c
Criar embeddings via OpenAI text-ada-002
OpenAI Embeddings API
60-120s
3d
Upsert vetores nos namespaces Pinecone
Pinecone API
30-60s
4a
Registrar webhooks nas plataformas
Meta API, Telegram, Portais
30s
4b
Criar usuário gestor no Supabase Auth
Supabase Auth API
5s
4c
Enviar e-mail de boas-vindas com credenciais
Resend API
5s

7.2 Tratamento de Falhas e Rollback
Cada fase tem retry automático com 3 tentativas e backoff exponencial.
Falha na Fase 1 (Supabase): abortar e notificar. Nenhum outro recurso foi criado.
Falha na Fase 3 (RAG/Pinecone): tenant fica ativo mas RAG em fila de reprocessamento.
Status de provisionamento salvo em tabela provisioning_jobs para rastreabilidade.
Painel de admin mostra progresso em tempo real via WebSocket.

8. Personalização de Agentes por Imobiliária

8.1 Hierarquia de Personalização
HIERARQUIA (da menor para maior prioridade):

1. BASE FIXA (nunca alterada)
   → Missão principal do agente, regras éticas, proibições

2. TOM GLOBAL DA MARCA
   → brand.globalTone aplicado a todos os agentes

3. TOM INDIVIDUAL DO AGENTE
   → agents[key].tone (sobrescreve o global para este agente)

4. OBSERVAÇÕES DE PERSONA
   → agents[key].customObs (adicionado ao final do bloco de identidade)

5. SAUDAÇÃO CUSTOM
   → agents[key].customGreeting (substitui COMPLETAMENTE o script de abertura)

Regra: personalização de maior prioridade sempre vence.
Regra: o conteúdo técnico (FAQs, objeções) NUNCA é sobrescrito por personalização.

8.2 Exemplos de Personalização por Perfil de Imobiliária
Perfil da Imobiliária
Configuração de Agente Recomendada
Resultado no RAG
Premium / Luxo
Tom global: 'Exclusivo e sofisticado'. Slogan de posicionamento premium
Elena nunca usa gírias; Ricardo fala de 'endereços raros'; Gabriel usa linguagem de clube exclusivo
Popular / Minha Casa Minha Vida
Tom: 'Acolhedor e próximo'. Público: 'Famílias de baixa/média renda'
Lucas foca no FGTS e MCMV; Amanda tem playbook específico para primeira compra
Foco em Locação
Desabilitar Gabriel (sem lançamentos). Marina com scripts de locação expandidos
Amanda qualifica para locação; Roberto tem checklist de vistoria de entrada reforçado
Investidores / Comercial
Amanda com modo investidor ativo. Ricardo com argumentação de ROI
Foco em rentabilidade, vacância e cap rate em todos os scripts
Startup / Imobiliária Digital
Tom: 'Jovem e descontraído'. Todos os nomes custom da marca
Linguagem informal mas profissional, referências a tech e agilidade

9. Integrações e Webhooks Automatizados

9.1 Arquitetura de Webhooks Multi-tenant
// Endpoint único que roteie por tenant e canal
POST /api/webhooks/{channel}/{tenant_id}

// Exemplos:
POST /api/webhooks/whatsapp/uuid-tenant-horizonte
POST /api/webhooks/zap/uuid-tenant-horizonte
POST /api/webhooks/olx/uuid-tenant-horizonte
POST /api/webhooks/telegram/uuid-tenant-horizonte

// Middleware de roteamento:
app.post('/api/webhooks/:channel/:tenantId', async (req, res) => {
  const { channel, tenantId } = req.params;
  const tenant = await getTenant(tenantId);
  if (!tenant || !tenant.integrations[channel]) return res.status(404);

  // Verificar assinatura HMAC do webhook
  await verifyWebhookSignature(req, tenant.integrations[channel].secret);

  // Normalizar payload para formato interno
  const lead = await normalizeIncomingLead(channel, req.body);

  // Disparar para o pipeline de IA do tenant
  await ingestLead(tenant, lead);
});

9.2 Normalização de Lead por Canal
Canal
Formato Original
Campo Normalizado
WhatsApp (Meta)
messages[].from + text.body
{ channel: 'whatsapp', phone: '+55...', message: '...', name: profile.name }
Instagram DM
messaging.sender.id + message.text
{ channel: 'instagram', user_id: '...', message: '...', name: (via profile API) }
ZAP Imóveis
lead.nome + lead.telefone + imovel_id
{ channel: 'zap', phone, name, imovel_ref: '...' }
OLX
contact.name + contact.phone + ad_id
{ channel: 'olx', phone, name, ad_ref: '...' }
Telegram
message.from.first_name + message.text
{ channel: 'telegram', chat_id, name, message }
Facebook Messenger
sender.id + message.text
{ channel: 'facebook', user_id, message, name: (via profile API) }

10. Estrutura de Dados — Tabelas SaaS (Banco Master)

O sistema SaaS tem um banco Master (dados da plataforma) e N bancos de tenant (dados de cada imobiliária). O banco Master gerencia o onboarding e o billing.

10.1 Tabelas do Banco Master
-- Banco MASTER (plataforma SaaS)

CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  status        TEXT DEFAULT 'provisioning',  -- provisioning|active|suspended
  plan          TEXT DEFAULT 'starter',       -- starter|pro|enterprise
  supabase_project_id TEXT,
  r2_bucket     TEXT,
  pinecone_prefix TEXT,
  onboarding_data JSONB,   -- snapshot do formulário completo
  provisioned_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_integrations (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  channel   TEXT NOT NULL,      -- whatsapp|instagram|zap|olx|asaas|...
  status    TEXT DEFAULT 'active',
  config    JSONB,              -- webhook URL, tokens (criptografados)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE provisioning_jobs (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  phase     TEXT,               -- infra|rag|webhooks|notifications
  status    TEXT DEFAULT 'pending',  -- pending|running|done|failed
  log       JSONB,              -- log de execução detalhado
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

11. API de Onboarding — Endpoints

Endpoint
Método
Descrição
POST /api/onboarding/start
POST
Inicia sessão de onboarding, retorna onboarding_session_id
PATCH /api/onboarding/:id/step/:step
PATCH
Salva dados de cada etapa (auto-save a cada campo)
POST /api/onboarding/:id/submit
POST
Finaliza e dispara o job de provisionamento
GET /api/onboarding/:id/status
GET
Retorna status do job de provisionamento (polling/WS)
GET /api/tenants/:slug/rag/status
GET
Status de indexação de cada namespace Pinecone
POST /api/tenants/:slug/rag/regenerate
POST
Re-gera RAG de um ou todos os agentes (pós-onboarding)
PATCH /api/tenants/:slug/agents/:key
PATCH
Atualiza configuração de um agente (sem re-provisionar infra)
POST /api/tenants/:slug/agents/:key/regenerate-rag
POST
Re-gera RAG apenas para um agente específico

🔄  Re-geração de RAG Pós-Onboarding
O gestor pode atualizar a persona de um agente A QUALQUER MOMENTO pelo dashboard.
A alteração dispara automaticamente: template engine → chunking → re-embedding → upsert Pinecone.
O processo leva entre 30 e 90 segundos e o agente fica temporariamente usando o RAG anterior.
Ao concluir, o novo RAG substitui o anterior e o agente passa a usar a versão atualizada.
Histórico de versões mantido (últimas 5 versões do RAG de cada agente).

12. Checklist de Entrega do Sistema de Onboarding

Sprint 1 — Formulário e Banco
#
Entrega
Critério de Aceite
1
Wizard React de 7 etapas com validação e auto-save
Dados persistidos por etapa, navegação livre entre etapas completas
2
Preview do RAG em tempo real no painel lateral
Atualiza em < 500ms após qualquer mudança no formulário
3
Schema Zod de validação de todos os campos do formulário
Todos os campos obrigatórios validados antes de avançar
4
Banco Master com tabelas tenants, tenant_integrations, provisioning_jobs
Migrations aplicadas, RLS configurado
5
API POST /api/onboarding/start e PATCH /step/:step
Auto-save funcional, sessão persiste no reload

Sprint 2 — Template Engine e Pinecone
#
Entrega
Critério de Aceite
6
Template Engine TypeScript com substituição de todas as variáveis
100% das variáveis substituídas corretamente em testes unitários
7
Sistema de blocos condicionais (imóvel de luxo, MCMV, investidores)
Conteúdo certo inserido para cada perfil de imobiliária
8
Pipeline de chunking (800 tokens, 150 overlap)
Chunks gerados com metadata correta
9
Integração com OpenAI embeddings + upsert Pinecone por namespace
Vetores indexados, query de teste retorna resultado correto
10
Re-geração de RAG individual por agente via API
Novo RAG ativo em < 90s após chamada da API

Sprint 3 — Infra Automática e Webhooks
#
Entrega
Critério de Aceite
11
Provisioning automático Supabase via Management API
Projeto criado, migrations aplicadas, RLS ativo
12
Criação automática de bucket Cloudflare R2
Bucket criado com CORS e políticas corretas
13
Registro automático de webhooks: WhatsApp, Telegram, OLX, ZAP
Mensagens recebidas roteadas ao tenant correto
14
Normalização de leads por canal (WhatsApp, portais, sociais)
Lead normalizado para formato interno em < 200ms
15
Dashboard de status do provisionamento em tempo real (WebSocket)
Cada fase visível com progresso e log
16
E-mail de boas-vindas com credenciais via Resend API
E-mail entregue em < 30s após conclusão do provisionamento


🎯  Resultado Final do Sistema
Cada nova imobiliária cadastrada terá em menos de 10 minutos:
→ Banco de dados isolado (Supabase) com todas as tabelas e regras de segurança
→ Armazenamento de documentos (Cloudflare R2) pronto para receber PDFs de imóveis
→ 10 namespaces Pinecone com RAG personalizado para cada agente de IA
→ Webhooks ativos para todos os canais selecionados no onboarding
→ Dashboard do gestor acessível com login e senha enviados por e-mail
→ Agentes de IA funcionando com o nome, tom e personalidade da marca