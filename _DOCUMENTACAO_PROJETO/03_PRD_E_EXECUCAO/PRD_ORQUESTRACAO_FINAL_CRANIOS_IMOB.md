# PRD de Execucao e Orquestracao Final - Cranios IMOB

Data: 2026-05-26
Status: documento operacional para fechamento vendavel

## 1. Visao

Finalizar o Cranios IMOB como SaaS imobiliario vendavel, com deploy estavel no Coolify, onboarding replicavel em ate 3 horas, atendimento humanizado por UazAPI/WhatsApp, CRM nativo, site demo de imoveis, cadastro de imoveis com PDF/fotos/Book, RAG por agente e fluxo comercial landing -> checkout -> contrato -> onboarding.

## 2. Resultado Esperado

Ao final da execucao:

- O projeto sobe em VPS/Coolify via Dockerfile.
- `/health` e `/api/health` ficam healthy.
- Landing page vende e chama a API correta.
- Checkout Asaas sandbox funciona ponta a ponta.
- Contrato Assinafy e webhook funcionam ou ficam claramente marcados como pendencia externa.
- Onboarding cria cliente/tenant, R2, RAG, integracoes e acesso inicial.
- UazAPI recebe mensagens reais e responde com humanizacao, agrupamento e TTS quando aplicavel.
- CRM nativo recebe leads reais.
- Cadastro de imoveis aceita venda, locacao e lancamento com PDF/fotos.
- Book PDF e gerado com identidade visual da imobiliaria.
- Pinecone/RAG funciona sem erro de dimensao.
- O processo para instalar uma nova imobiliaria fica documentado e repetivel.

## 3. Estado Atual Confirmado

### Supabase

- Tabela `imoveis` existe.
- Consulta real confirmou `91` registros.
- Existem 5 lancamentos recentes:
  - Urbano 1060;
  - Residencial Luciano Friedheim;
  - Residencial Hildebrando 131;
  - Lindenberg Vista Brooklin;
  - Barra Garden.
- Esses 5 ainda estao sem `book_pdf_url`, `foto_principal` e `fotos`.

### Pinecone

- Indice real `cranios-imob-knowledge`.
- Dimensao real: `1024`.
- Codigo foi corrigido para gerar embeddings com `1024`.
- Necessario teste real de upsert/query apos deploy.

### R2

- Bucket principal existe.
- 5 PDFs de lancamentos existem em `Lançamentos/`.
- Endpoint de upload-url foi corrigido para usar `Lançamentos/${nomeSeguro}`.

### Backend/Frontend

- TypeScript backend passou.
- Testes unitarios passaram: 11 testes.
- Frontend TypeScript passou.
- Frontend build passou.
- Docker build ainda precisa ser validado em maquina com Docker.

## 4. Escopo de Execucao

### Dentro do Escopo

- Corrigir bugs de integracao.
- Completar rotas publicas e protegidas.
- Validar Supabase, R2 e Pinecone.
- Unificar fluxo comercial e onboarding.
- Melhorar cadastro de imoveis.
- Integrar humanizacao em canais.
- Preparar deploy Coolify.
- Criar checklist manual para o usuario.
- Criar prompts para agentes paralelos.

### Fora do Escopo Imediato

- Integracao real com OLX/ZAP/VivaReal se exigir contrato/API externa ainda nao liberada.
- Criacao automatica de novo projeto Supabase por cliente, se depender de conta/plano/API externa.
- Compra/configuracao de dominio e DNS sem acesso do usuario.
- Rotacao de segredos em paineis externos sem acao do usuario.

## 5. Agentes e Responsabilidades

### ORQ-01 - Orquestrador Mestre

Objetivo:

Distribuir, acompanhar, cobrar evidencias e impedir conflito entre agentes.

Prompt:

> Voce e o Orquestrador Mestre do fechamento Cranios IMOB. Sua funcao e transformar o PRD em execucao coordenada. Antes de liberar uma tarefa, confira dependencias. Ao receber conclusao de agente, exija evidencias: arquivos alterados, comandos rodados, resultados e riscos restantes. Nao permita duas tarefas editando o mesmo arquivo sem sequenciamento. Atualize o quadro P0/P1/P2 e bloqueie deploy se health, Supabase, Pinecone, R2, UazAPI ou auth estiverem inconsistentes.

Habilidades:

- gestao de dependencias;
- leitura de logs;
- revisao de PR;
- priorizacao P0/P1/P2;
- controle de qualidade.

Nao edita codigo diretamente, exceto documentos de status.

### AG-01 - Infra, GitHub e Coolify

Objetivo:

Garantir deploy reprodutivel via Dockerfile.

Arquivos provaveis:

- `Dockerfile`
- `.dockerignore`
- `package.json`
- `frontend/package.json`
- `.env.example`
- documentacao de deploy

Prompt:

> Analise e corrija o deploy do Cranios IMOB para Coolify usando Dockerfile. Confirme porta 3000, healthcheck `/api/health`, Chromium/Puppeteer, ffmpeg, build backend/frontend e start `node dist/server.js`. Nao use Nixpacks. Gere evidencias de build e liste variaveis obrigatorias. Nao toque em regras de negocio.

Pode rodar em paralelo com:

- AG-03 RAG;
- AG-05 Canais;
- AG-07 Documentacao.

Deve aguardar:

- AG-02 confirmar migrations criticas antes do deploy final.

### AG-02 - Supabase e Modelo de Dados

Objetivo:

Garantir que schema real esta alinhado ao codigo.

Arquivos provaveis:

- `database/**`
- `src/database/**`
- scripts de verificacao/migracao

Prompt:

> Verifique o Supabase real e crie migrations idempotentes para colunas/tabelas usadas pelo codigo. Confirme `imoveis`, `clientes`, `tenants`, `landing_leads`, `client_pipeline`, `portal_configs`, `portal_listings`, `mensagens`, `lead_memory`. Corrija apenas via SQL/migrations seguras. Nao apague dados. Entregue contagem de registros, colunas faltantes e script de verificacao pos-deploy.

Pode rodar em paralelo com:

- AG-01 ate o deploy final;
- AG-03;
- AG-04.

Bloqueia:

- AG-01 deploy final;
- AG-04 onboarding final;
- AG-06 imoveis se faltarem colunas.

### AG-03 - Pinecone, RAG e Memoria

Objetivo:

Padronizar RAG e evitar falha de dimensao/namespaces.

Arquivos provaveis:

- `src/services/pinecone.service.ts`
- `src/services/rag-generator.service.ts`
- `src/agents/chat_agent.ts`
- scripts de ingestao

Prompt:

> Corrija e valide RAG. O indice Pinecone real usa dimensao 1024. Padronize namespaces para `{tenant_slug}:{agent_key}` e `{tenant_slug}:geral`, mantendo fallback compativel com dados antigos. Corrija busca que procura formatos divergentes. Corrija lead memory se houver return antes de gravar memoria. Crie teste ou script de query RAG por tenant/agente.

Pode rodar em paralelo com:

- AG-01;
- AG-05.

Deve aguardar:

- AG-02 para confirmar colunas/tabelas de memoria.

### AG-04 - Fluxo Comercial e Onboarding

Objetivo:

Criar esteira unica de venda e ativacao.

Arquivos provaveis:

- `src/services/sales-automation.service.ts`
- `src/controllers/webhook.controller.ts`
- `src/server.ts`
- `frontend/src/pages/Onboarding.tsx`

Prompt:

> Unifique o fluxo landing -> checkout Asaas -> contrato Assinafy -> onboarding -> Cal.com -> criacao cliente/tenant. Reduza divergencia entre `landing_leads`, `client_pipeline`, `clientes` e `tenants`. Crie orquestrador de provisionamento com estados claros e idempotencia. Nao quebre webhooks existentes. Entregue matriz de status e testes manuais.

Pode rodar em paralelo com:

- AG-05;
- AG-07.

Deve aguardar:

- AG-02 confirmar schema;
- AG-03 confirmar padrao de RAG.

### AG-05 - UazAPI, Humanizacao, TTS e Canais

Objetivo:

Unificar experiencia de atendimento.

Arquivos provaveis:

- `src/services/whatsapp.service.ts`
- `src/services/whatsapp-response.service.ts`
- `src/services/humanizer.service.ts`
- `src/services/tts.service.ts`
- `src/services/transcription.service.ts`
- `src/server.ts`
- `frontend/src/components/ChatWidget.tsx`

Prompt:

> Valide UazAPI, transcricao, TTS, agrupamento de mensagens e humanizacao. Crie uma camada comum de orquestracao de canais para WhatsApp e chat web. WhatsApp deve manter agrupamento de 5s. Chat web deve usar humanizer e mesmo cerebro do WhatsApp. Nao sugerir Z-API nem Meta. Entregue testes simulados de payload UazAPI texto/audio e roteiro de teste real.

Pode rodar em paralelo com:

- AG-03;
- AG-04.

Deve aguardar:

- AG-03 para RAG/memoria unificada.

### AG-06 - Imoveis, Fotos, Book PDF e Portais

Objetivo:

Fechar cadastro e publicacao inicial de imoveis.

Arquivos provaveis:

- `src/server.ts`
- `src/services/r2-storage.service.ts`
- `src/services/pdf-generator.service.ts`
- `frontend/src/pages/ImovelUpload.tsx`
- `frontend/src/pages/PropertyForm.tsx`
- `src/jobs/portal-publisher.job.ts`
- `src/portals/**`

Prompt:

> Finalize a esteira de imoveis: venda, locacao e lancamento com PDF/fotos, R2, Supabase, Pinecone e Book PDF. O formulario principal deve usar endpoint multipart quando houver arquivos. Gere/regerar Book PDF dos 5 lancamentos sem fotos quando houver imagens, ou marque como pendente visual. Portais OLX/ZAP/VivaReal devem ficar claramente como mock/desativado ate integracao real.

Pode rodar em paralelo com:

- AG-05 se nao editar `server.ts` ao mesmo tempo.

Deve aguardar:

- AG-02 confirmar colunas `fotos`, `book_pdf_url`, `foto_principal`;
- AG-03 confirmar namespace RAG.

### AG-07 - Auth, Permissoes, Planos e Sessoes

Objetivo:

Fechar minimo vendavel de seguranca.

Arquivos provaveis:

- `src/middlewares/session-guard.middleware.ts`
- `src/services/session.service.ts`
- `src/services/plan-limits.service.ts`
- rotas auth/manager/corretores

Prompt:

> Valide auth real, sessoes unicas, rotas publicas, rotas protegidas, roles e limites por plano. Garanta que landing, checkout, webhooks e onboarding publico nao exigem sessao. Garanta que manager/corretores/CRM exigem sessao. Complete limites de corretores/leads/storage onde for seguro. Entregue matriz de acesso.

Pode rodar em paralelo com:

- AG-01;
- AG-03.

Deve aguardar:

- AG-02 para schema de planos/roles.

### AG-08 - Landing, Cecilia e Vendas

Objetivo:

Fazer a landing vender e capturar leads corretamente.

Arquivos provaveis:

- `../landing_page/**`
- `src/server.ts`
- `src/services/sales-automation.service.ts`

Prompt:

> Ajuste landing e Cecilia para fluxo real de vendas. Widget deve usar API configuravel e endpoint dedicado. A decisao do CEO e usar Cecilia no Dify como runtime principal, com fallback local apenas para contingencia tecnica. Configure `DIFY_CECILIA_BASE_URL` e `DIFY_CECILIA_API_KEY`, envie ROI/contexto para o Dify e mantenha captura progressiva de lead e chamada para checkout Asaas. Teste local com API staging.

Pode rodar em paralelo com:

- AG-04 conceitualmente, mas nao editar as mesmas rotas simultaneamente.

Deve aguardar:

- AG-04 definir contrato dos endpoints comerciais.

### AG-09 - QA, Testes E2E e Regressao

Objetivo:

Validar tudo antes do deploy final.

Prompt:

> Crie e execute checklist de QA. Rode TypeScript, testes, build frontend, build Docker se disponivel, healthchecks, chamadas API, payloads webhook simulados e fluxo minimo produto. Registre evidencia, erro, severidade e responsavel. Nao corrija codigo sem autorizacao do Orquestrador.

Deve aguardar:

- Finalizacao de AG-01 a AG-08.

### AG-10 - Documentacao Operacional

Objetivo:

Gerar material para instalacao, suporte e venda.

Arquivos:

- `_DOCUMENTACAO_PROJETO/**`

Prompt:

> Gere documentacao operacional: checklist deploy Coolify, checklist onboarding 3h, variaveis de ambiente, testes sandbox, roteiro demo comercial, limites conhecidos e tarefas manuais do CEO. Mantenha linguagem clara e operacional.

Pode rodar em paralelo com todos, mas precisa atualizar depois das conclusoes finais.

## 6. Dependencias e Paralelismo

### Pode Rodar em Paralelo Imediatamente

- AG-01 Infra prepara Docker/Coolify.
- AG-02 Supabase verifica schema.
- AG-03 Pinecone verifica RAG.
- AG-05 Canais valida UazAPI/humanizacao.
- AG-10 Documentacao organiza guias.

### Deve Esperar

- AG-04 Onboarding espera AG-02 e AG-03.
- AG-06 Imoveis espera AG-02 e AG-03 antes de ajustes finais.
- AG-08 Cecilia espera AG-04 definir endpoints comerciais.
- AG-09 QA espera implementacoes.
- Deploy final espera AG-01, AG-02, AG-03, AG-05 e AG-07.

### Nao Pode Rodar em Paralelo no Mesmo Arquivo

- `src/server.ts`: AG-04, AG-05, AG-06 e AG-08 precisam de fila.
- `src/services/pinecone.service.ts`: somente AG-03.
- `src/middlewares/session-guard.middleware.ts`: AG-07, com revisao do Orquestrador.
- `src/services/sales-automation.service.ts`: AG-04 e AG-08 precisam coordenar.
- `frontend/src/pages/PropertyForm.tsx`: AG-06 somente.

## 7. Backlog Priorizado

### P0 - Bloqueia Venda/Deploy

1. Resolver GitHub: repo correto precisa receber esta versao local.
2. Confirmar Docker build.
3. Confirmar Coolify Dockerfile porta 3000.
4. Confirmar Supabase schema critico.
5. Testar Pinecone 1024 upsert/query.
6. Testar R2 upload/download.
7. Testar UazAPI webhook real.
8. Testar Asaas sandbox checkout/webhook.
9. Confirmar rotas publicas sem sessao.
10. Criar orquestrador minimo de onboarding pos-compra.

### P1 - Necessario Para Primeiro Cliente Pago

1. Unificar clientes/tenants.
2. Criar usuario gestor real.
3. Criar checklist onboarding 3h.
4. Fazer chat web usar humanizacao.
5. Conectar Cecilia ao endpoint de vendas.
6. Completar quotas por plano.
7. Ligar PropertyForm ao fluxo multipart quando houver arquivos.
8. Gerar Books dos imoveis com fotos.

### P2 - Fortalecimento Comercial

1. Publicacao multicanal real.
2. Campanhas WhatsApp segmentadas.
3. PDF comparativo Telegram por busca natural.
4. Analytics de funil e conversao.
5. Code splitting frontend.
6. Monitoramento e alertas.

## 8. Criterios de Aceite

### Deploy

- Container healthy no Coolify.
- `/api/health` retorna success.
- SPA abre sem erro.
- Logs nao mostram tokens.

### Banco

- `imoveis` retorna 91+ registros.
- Inserir imovel teste funciona.
- `clientes.uazapi_instance_id` existe.
- `imoveis.book_pdf_url` existe.

### RAG

- Pinecone query retorna contexto.
- Ingestao nao falha por dimensao.
- Namespace do tenant e encontrado pelo agente.

### WhatsApp

- UazAPI recebe texto.
- UazAPI envia texto.
- Audio recebido e transcrito.
- Resposta audio funciona quando TTS configurado.
- Agrupamento 5s funciona.

### Comercial

- Landing registra lead.
- Checkout Asaas sandbox cria cobranca.
- Webhook Asaas atualiza lead.
- Assinafy recebe contrato ou erro externo documentado.
- Cal.com booking atualiza status.

### Imoveis

- Cadastro venda sem PDF funciona.
- Cadastro locacao sem PDF funciona.
- Cadastro lancamento com PDF funciona.
- Fotos sobem para R2.
- Book PDF e gerado.
- Site lista imovel criado.

## 9. Comando Para o Orquestrador

Use este comando como mensagem inicial:

> Orquestrador, execute o PRD de fechamento do Cranios IMOB. Primeiro, abra um quadro com AG-01 a AG-10. Dispare em paralelo apenas AG-01, AG-02, AG-03, AG-05 e AG-10. Bloqueie AG-04, AG-06, AG-08 e AG-09 ate as dependencias estarem verdes. Para cada agente, exija: arquivos lidos, arquivos alterados, comandos executados, resultado, riscos restantes e proxima acao. Se dois agentes precisarem editar `src/server.ts`, coloque em fila. Nao autorize deploy final enquanto GitHub, Supabase, Pinecone, R2, UazAPI, healthcheck e sessionGuard nao estiverem validados. Ao final, gere relatorio de aceite e checklist de go-live.

## 10. Primeira Execucao Recomendada

1. AG-02 confirma schema.
2. AG-03 testa Pinecone 1024.
3. AG-01 valida Docker/Coolify.
4. AG-05 testa payload UazAPI.
5. Orquestrador libera AG-04 onboarding.
6. Orquestrador libera AG-06 imoveis.
7. AG-09 roda QA completo.
8. AG-10 fecha documentacao final.

## 11. Decisoes Atualizadas Pelo CEO

- Repositorio final: atual `jrpires-cranios/CRANIOS_IMOB`.
- App principal: `imob.cranios.pro`.
- API recomendada: `api.imob.cranios.pro`.
- Landing recomendada: `real.cranios.pro`, com possibilidade de publicar via Netlify.
- Subdominios de clientes: `nomeimobiliaria.cranios.pro` quando nao usarem dominio proprio.
- Cecilia: runtime principal no Dify.
- Publicacao automatica em OLX/ZAP/VivaReal: fase 2, com PRD proprio.
- Onboarding: completo, com dados da empresa, marca, paleta, logo, personas, nomes dos agentes, canais e integracoes.
- E-mails Resend:
  - onboarding/setup: `setup@cranios.pro`;
  - atendimento/comercial: `ola@cranios.pro`;
  - suporte/SAC: `suporte@cranios.pro`.
