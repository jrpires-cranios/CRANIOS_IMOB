# Relatorio - Landing, Site de Imoveis e Onboarding Vendavel

Data: 2026-05-26

## 1. Landing page localizada

Pasta encontrada:

`C:\Users\junio\projetos-automacao\projetos\Cranios-IMOB-REAL\CRANIOS_IMOB-main\landing_page`

Arquivos principais:

- `index.html`
- `cranios_pricing_page.html`
- `calculadora_roi_cranios_com_relatorio.html`
- `calculadora_roi_cranios_imob.html`
- `calculadora.html`
- `cecilia-widget.js`
- `Cecilia-Dify-Cranios-Imob/`

O README da landing informa que o deploy atual e feito por Cloudflare Pages e que a API esperada e `https://api.cranios.pro`.

Status atual:

- A landing existe.
- A landing esta fora do Docker principal do backend/app.
- A landing chama endpoints do backend, principalmente `/api/sales/landing-lead` e `/api/sales/checkout`.
- O widget da Cecilia chama o chat do backend.
- Foi ajustado o widget para permitir trocar a API por `window.CRANIOS_API_BASE` e o endpoint por `window.CRANIOS_CECILIA_CHAT_PATH`, mantendo `https://api.cranios.pro` como padrao.

Risco:

- Se o backend do Coolify/API cair, a landing perde checkout, lead e Cecilia.
- Como a landing esta fora do Docker principal, ela precisa de pipeline proprio de deploy e configuracao de URL da API.

## 2. Site demo de imoveis localizado

O site/app de imoveis esta no frontend React principal:

- `frontend/src/components/FeaturedProperties.tsx`
- `frontend/src/components/SearchProperties.tsx`
- `frontend/src/components/PropertyCard.tsx`
- `frontend/src/components/PropertyDetailsModal.tsx`
- `frontend/src/client.ts`

Endpoints backend localizados:

- `GET /api/imoveis`
- `GET /api/imoveis/destaque`
- `GET /api/imoveis/search`
- `GET /api/imoveis/:id`
- `POST /api/imoveis`
- `PUT /api/imoveis/:id`
- `DELETE /api/imoveis/:id`
- `POST /api/imoveis/ingest`
- `POST /api/imoveis/sugestao-preco`
- `POST /api/imoveis/gerar-conteudo`

Base de dados/arquivos encontrados:

- `database/dados_imoveis_aracaju.sql`
- `database/supabase_schema.sql`
- `scripts/imoveis_airtable.csv`

Observacao importante:

- O arquivo `scripts/imoveis_airtable.csv` existe, mas esta praticamente em uma unica linha de dados, o que indica exportacao/formatacao irregular. O `Import-Csv` leu somente 1 linha como registro, apesar do conteudo conter muitos imoveis concatenados.
- Portanto, o catalogo "50+ imoveis" provavelmente esta no Supabase real ou em exportacao quebrada/local incompleta. Para confirmar quantidade real, e necessario consultar a tabela `imoveis` do Supabase com seguranca, sem imprimir credenciais.

## 3. Fluxo landing -> venda -> onboarding

Fluxo existente em codigo:

1. Landing captura lead em `/api/sales/landing-lead`.
2. Checkout chama `/api/sales/checkout`.
3. Backend cria/atualiza `landing_leads`.
4. Backend cria cliente e cobranca PIX no Asaas.
5. Asaas envia webhook em `/api/webhooks/asaas`.
6. Com pagamento confirmado, backend envia contrato via Assinafy.
7. Assinafy envia webhook em `/api/webhooks/assinafy`.
8. Com contrato assinado, backend envia kit de onboarding com link Cal.com.
9. Cal.com envia webhook em `/api/webhooks/calcom`.
10. Backend registra agendamento e atualiza status do lead.

Correcoes aplicadas:

- Checkout agora falha com mensagem clara se a chave Asaas nao estiver configurada.
- Link Cal.com saiu de hardcode e pode vir de `CALCOM_ONBOARDING_URL` ou `CALCOM_ONBOARDING_EVENT_URL`.
- Webhook Asaas agora prioriza `landing_leads` quando vier `externalReference`, evitando criar cliente no pipeline antigo com e-mail simulado.
- Webhook Assinafy agora tambem processa `landing_leads` mesmo quando nao houver registro no `client_pipeline` antigo.

Ainda pendente para venda:

- Validar webhooks reais do Asaas sandbox.
- Validar payload real do Assinafy.
- Validar payload real do Cal.com.
- Unificar definitivamente `client_pipeline` antigo e `landing_leads` novo para nao duplicar estados.

## 4. Onboarding automatico

Existem dois fluxos:

### Fluxo antigo

Endpoint: `POST /api/onboarding`

Faz:

- cria bucket R2;
- cria pastas `Lancamentos/`, `Vendas/`, `Locacao/`;
- cria cliente na tabela `clientes`;
- envia e-mail de boas-vindas se Resend estiver configurado.

### Fluxo novo multi-tenant

Endpoint: `POST /api/onboarding/submit`

Faz:

- cria tenant na tabela `tenants`;
- salva integracoes em `tenant_integrations`;
- gera RAG por agente no Pinecone;
- marca tenant como ativo apos provisionamento.

Correcao aplicada:

- O fluxo novo agora tambem tenta criar bucket R2 e pastas automaticamente quando as credenciais R2 existem.

Limite atual:

- O sistema nao cria um novo projeto Supabase automaticamente. Ele cria registros/tabelas dentro do Supabase master configurado.
- O sistema nao cria indice Pinecone automaticamente. Ele usa o indice configurado em `PINECONE_INDEX_NAME`.
- O RAG por tenant/agente existe, mas depende de `OPENAI_API_KEY`, `PINECONE_API_KEY` e indice Pinecone com dimensao compativel.

## 5. Pinecone/RAG

Foi localizado:

- `src/services/pinecone.service.ts`
- `src/services/rag-generator.service.ts`

Correcoes aplicadas:

- Embedding `text-embedding-3-small` foi ajustado para dimensao 1536, alinhando comentario, fallback e configuracao esperada.

Risco:

- Se o indice Pinecone tiver sido criado com outra dimensao, os upserts falharao. Validar no dashboard Pinecone antes do deploy final.

## 6. Cecilia

Existe:

- pacote/documentacao RAG/prompt em `landing_page/Cecilia-Dify-Cranios-Imob/`;
- widget `cecilia-widget.js`;
- chamada do widget para backend.

Estado real:

- A Cecilia ainda nao esta integrada a um runtime Dify real.
- O widget conversa com `/api/chat`, usando o chat geral do backend.
- O pipeline completo de humanizacao/TTS/agrupamento ainda esta mais forte no WhatsApp/UazAPI, nao em todos os canais.

Pendente para ficar vendavel:

- Criar endpoint dedicado `/api/sales/cecilia-chat`.
- Aplicar persona/RAG especifico da Cecilia.
- Aplicar humanizacao e delay tambem no chat web.
- Decidir se Dify sera runtime real ou se a Cecilia sera nativa no backend.

## 7. Validacoes executadas

Comandos executados com sucesso:

- `npx tsc --noEmit`
- `npm test`
- `cd frontend && npx tsc --noEmit`
- `cd frontend && npm run build`

Resultado:

- Backend TypeScript passou.
- Testes unitarios passaram: 11 testes em 3 arquivos.
- Frontend TypeScript passou.
- Build de producao do frontend passou.

Aviso:

- Vite alertou que o bundle principal esta acima de 500 kB. Nao bloqueia deploy, mas recomenda code splitting no futuro.

## 8. Conclusao vendavel

O projeto esta muito avancado, mas ainda nao esta 100% vendavel como instalacao replicavel em ate 3 horas.

Para vender com seguranca, o proximo bloco deve fechar:

1. Deploy backend/app no Coolify usando Dockerfile.
2. Deploy landing Cloudflare Pages apontando para a API correta.
3. Teste real Asaas sandbox -> webhook -> Assinafy -> onboarding -> Cal.com.
4. Unificacao dos fluxos `landing_leads`, `client_pipeline`, `clientes` e `tenants`.
5. Cecilia com endpoint proprio e humanizacao de chat web.
6. Confirmacao da base real de imoveis no Supabase.
7. Script/checklist de onboarding operacional para ativar cliente em ate 3 horas.

