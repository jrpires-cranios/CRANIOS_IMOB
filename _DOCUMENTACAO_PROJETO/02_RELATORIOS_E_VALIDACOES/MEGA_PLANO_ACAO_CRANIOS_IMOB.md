# Mega Plano de Acao - Cranios IMOB

Data: 2026-05-26

## Objetivo

Transformar o Cranios IMOB em uma versao vendavel, implantavel via Coolify e replicavel para uma nova imobiliaria em ate 3 horas, sem depender de configuracoes manuais longas.

Este plano consolida:

- auditoria local atual;
- relatorios ja criados nesta pasta;
- historico `01_Imob_Ultimas_tarefas_executadas_Cla.txt`;
- estado real do codigo em backend, frontend, landing, R2, Pinecone, Supabase, UazAPI, Asaas, Assinafy e Cal.com.

## Verdades confirmadas

### Banco/Supabase

O historico indica que os 25 SQL/migrations do tutorial foram aplicados no Supabase, com:

- 52 tabelas;
- 86 imoveis demo de Aracaju;
- 5 lancamentos adicionais ingeridos;
- tabelas como `imoveis`, `leads`, `clientes`, `corretores`, `negociacoes`, `vistorias`, `agendamentos_visitas`, `lead_memory`, `reservas`, `tenants`, `landing_leads`, `client_pipeline`;
- scripts de manutencao movidos para `_ARTEFATOS_LOCAIS/04_SCRIPTS_MANUTENCAO_AVULSOS`.

Risco:

- Isso precisa ser confirmado novamente no Supabase real antes do deploy final, porque a pasta local nao prova sozinha o estado atual do banco.

### R2 e Pinecone

O historico indica:

- bucket R2 `cranios-imob` com 5 PDFs em `Lancamentos/`;
- ingestao desses PDFs para Pinecone;
- namespace `lancamentos` criado;
- total historico de 296 vetores.

Risco critico:

- O historico antigo menciona Pinecone com dimensao 1024.
- O Pinecone real foi confirmado com dimensao 1024 e 296 vetores.
- Corrigido em 2026-05-26: `pinecone.service.ts` voltou a gerar embeddings com dimensao 1024.
- Antes de redeployar, ainda e obrigatorio fazer uma query/upsert real de validacao.

### Imoveis, fotos e Book PDF

Existe e esta implementado:

- `POST /api/imoveis/ingest`;
- upload de PDF;
- upload de ate 20 fotos;
- upload para R2;
- extracao de texto de PDF para lancamentos;
- chunking;
- upsert no Pinecone;
- criacao do imovel no Supabase;
- geracao de Book PDF em background;
- Book PDF com identidade visual da imobiliaria;
- pagina `frontend/src/pages/ImovelUpload.tsx`;
- entrada no Dashboard para cadastro de imoveis.

Riscos:

- Precisa teste real com PDF + fotos em container Docker.
- Puppeteer/Chromium precisa estar corretamente instalado no container/VPS.
- O endpoint usa namespace `${slug}:gabriel`; outros metodos Pinecone usam tambem formatos antigos como `gabriel_lancamentos_clienteId`. Padronizar namespaces e importante.
- Corrigido em 2026-05-26: chamada de `uploadPropertyPDF` em `/api/imoveis/ingest` estava com argumentos invertidos e foi ajustada para `buffer, imovelId, clienteId`.
- Corrigido em 2026-05-26: PDF de lancamento nao e mais salvo como `foto_principal`; agora entra como `book_pdf_url`.

### Landing e Cecilia

Existe:

- `landing_page`;
- deploy previsto por Cloudflare Pages;
- checkout via `/api/sales/checkout`;
- captura de leads via `/api/sales/landing-lead`;
- widget Cecilia.

Foi ajustado:

- `cecilia-widget.js` agora aceita `window.CRANIOS_API_BASE` e `window.CRANIOS_CECILIA_CHAT_PATH`.

Ainda parcial:

- Cecilia chama o chat geral;
- nao ha runtime Dify real conectado;
- nao ha endpoint dedicado `/api/sales/cecilia-chat`;
- chat web ainda nao passa pela mesma camada forte de humanizacao do WhatsApp.

### UazAPI/WhatsApp

Existe:

- `src/services/whatsapp.service.ts` usando UazAPI;
- `POST /api/webhooks/uazapi`;
- envio texto;
- envio audio;
- transcricao de audio recebido;
- acumulacao de mensagens;
- janela de agrupamento ajustada para 5 segundos;
- humanizacao;
- espelhamento audio/texto via `sendWithMirroring`.

Riscos:

- Validar payload real do seu servidor UazAPI.
- Confirmar coluna `clientes.uazapi_instance_id` no Supabase real.
- Confirmar `UAZAPI_BASE_URL`, `UAZAPI_TOKEN`, `UAZAPI_INSTANCE` no Coolify.
- Validar envio de audio em ambiente Docker.

### Venda automatizada

Existe:

- landing lead;
- checkout Asaas;
- webhook Asaas;
- envio de contrato via Assinafy;
- webhook Assinafy;
- envio de kit de onboarding;
- webhook Cal.com;
- status de onboarding em `landing_leads` e `clientes`.

Foi corrigido:

- Asaas sem chave agora falha com erro claro;
- link Cal.com saiu de hardcode;
- webhook Asaas prioriza `landing_leads` quando `externalReference` existe;
- webhook Assinafy nao retorna antes de processar `landing_leads`.

Ainda parcial:

- fluxo antigo `client_pipeline` e fluxo novo `landing_leads` convivem;
- payload real de Assinafy precisa ser testado;
- payload real do Cal.com precisa ser testado;
- criacao final de tenant/cliente depois da compra ainda precisa ser uma unica esteira clara.
- Corrigido em 2026-05-26: `sessionGuard` passou a liberar rotas publicas criticas de venda/onboarding, incluindo `/sales/landing-lead`, `/sales/checkout`, `/onboarding/submit`, `/onboarding/secure-keys` e `/secure/checkout`.

### CRM nativo

Existe:

- CRM Kanban;
- leads;
- roleta;
- briefing;
- proprietarios;
- financeiro;
- comissoes;
- visitas;
- vistorias;
- prestadores;
- relatorios;
- BI;
- sessoes e limites parcialmente previstos.

Pendente vendavel:

- auth real e permissoes por perfil;
- quotas por plano fechadas;
- encerramento de sessao concorrente validado ponta a ponta;
- fluxo master/admin validado sem depender de acesso do cliente.

### Publicacao multicanal de imoveis

Existe arquitetura:

- `portalPublisher`;
- `portal_configs`;
- `portal_listings`;
- adapters OLX, ZAP, VivaReal;
- webhook de mudanca em imoveis.

Estado real:

- adapters OLX/ZAP/VivaReal ainda sao simulados.
- Instagram gera texto, mas nao publica automaticamente.
- WhatsApp ainda nao tem uma esteira de campanha/anuncio automatica para listas ou segmentos.
- `portal_configs` e `portal_listings` existem no banco remoto, mas estao vazias.

## Plano por frentes paralelas

### Frente 1 - Deploy/Coolify/GitHub

Responsavel ideal: Agente Infra/Deploy.

Objetivo:

Rodar backend + frontend no Coolify via Dockerfile, com container healthy.

Tarefas:

1. Confirmar Dockerfile atual e build local.
2. Confirmar `PORT=3000`, `/health` e `/api/health`.
3. Confirmar Chromium/Puppeteer no Docker.
4. Confirmar envs no Coolify apenas runtime, sem segredos em build-time.
5. Resolver push GitHub bloqueado pela conta sem permissao.
6. Subir branch limpa no GitHub correto.
7. Rodar deploy Coolify por Dockerfile.
8. Validar logs sem segredo.
9. Testar dominio provisiorio `sslip.io`.
10. So depois apontar dominio real.

Bloqueador atual:

- Git push anterior falhou por permissao da conta `VitaFlowia` no repo `jrpires-cranios/CRANIOS_IMOB`.

### Frente 2 - Banco e dados

Responsavel ideal: Agente Dados/Supabase.

Objetivo:

Garantir que o Supabase real esta 100% alinhado ao codigo.

Tarefas:

1. Consultar contagem de tabelas no Supabase real.
2. Confirmar colunas criticas:
   `clientes.uazapi_instance_id`, `clientes.bucket_name`, `clientes.logo_url`, `clientes.cor_primaria`, `clientes.cor_secundaria`, `imoveis.fotos`, `imoveis.book_pdf_url`, `landing_leads.assinafy_document_id`, `tenants.r2_bucket`, `tenants.pinecone_prefix`.
3. Confirmar 86 imoveis demo e 5 lancamentos.
4. Confirmar RLS/policies/triggers principais.
5. Guardar scripts de migracao oficiais em uma pasta `database/migrations_safe`.
6. Criar script unico de verificacao pos-deploy.

### Frente 3 - Pinecone/RAG

Responsavel ideal: Agente RAG.

Objetivo:

Evitar quebra silenciosa do RAG por dimensao ou namespace.

Tarefas:

1. Confirmar dimensao real do indice Pinecone.
2. Se indice for 1024, reverter codigo para 1024 ou criar novo indice 1536 e reingerir.
3. Padronizar namespace:
   - tenant onboarding: `${slug}:elena`, `${slug}:gabriel`, `${slug}:geral`;
   - lancamentos: `${slug}:gabriel`;
   - fallback global: `demo:gabriel` ou `global:gabriel`.
4. Criar teste de query RAG por agente.
5. Reingerir PDFs se necessario.
6. Documentar processo de reset/reindexacao.

Bloqueador critico:

- Dimensao 1024 x 1536 foi corrigida no codigo para 1024, mas precisa validacao real em ambiente com as chaves.

### Frente 4 - Onboarding vendavel em ate 3 horas

Responsavel ideal: Agente Produto/Onboarding.

Objetivo:

Criar uma esteira unica de ativacao de cliente.

Fluxo alvo:

Compra no site -> Asaas confirmado -> Assinafy assinado -> kit onboarding -> Cal.com -> formulario seguro -> cria tenant/cliente -> cria R2 -> gera RAG -> registra UazAPI -> ativa CRM -> envia acesso.

Tarefas:

1. Unificar `landing_leads`, `client_pipeline`, `clientes` e `tenants`.
2. Definir tabela/estado principal do ciclo de cliente.
3. Fazer `enviarOnboardingKit` apontar para um onboarding operacional real.
4. Fazer `/api/onboarding/submit` criar ou atualizar tambem `clientes`.
5. Fazer onboarding gerar R2 + RAG + integracoes + usuario/admin inicial.
6. Criar checklist de onboarding guiado para operador.
7. Criar relatorio final: tempo estimado e pendencias por cliente.

### Frente 5 - UazAPI, humanizacao e TTS

Responsavel ideal: Agente IA/Canais.

Objetivo:

Fazer todos os canais responderem de forma humana e consistente.

Tarefas:

1. Validar payload real ReceivedCallback do UazAPI.
2. Validar envio texto.
3. Validar envio audio.
4. Confirmar TTS e vozes por agente.
5. Aplicar humanizer no chat web.
6. Criar endpoint dedicado para Cecilia.
7. Criar policy de tempo:
   - WhatsApp: agrupamento 5s;
   - chat web: typing delay menor, resposta humanizada;
   - Telegram: objetivo e documental.
8. Criar testes com frases proibidas, jargoes e padroes roboticos.

### Frente 6 - Cecilia e landing

Responsavel ideal: Agente Vendas/Landing.

Objetivo:

Transformar a Cecilia em vendedora real da Cranios, conectada ao checkout e ao CRM.

Tarefas:

1. Criar `/api/sales/cecilia-chat`.
2. Carregar prompt/persona da Cecilia.
3. Conectar RAG de vendas/FAQ/ROI.
4. Capturar lead progressivamente.
5. Detectar plano de interesse.
6. Disparar checkout Asaas.
7. Registrar conversa em `landing_leads`.
8. Atualizar widget para usar endpoint dedicado.
9. Testar landing local e Cloudflare Pages.

### Frente 7 - Imoveis, Book PDF e portais

Responsavel ideal: Agente Imoveis/Portais.

Objetivo:

Criar uma esteira de cadastro/publicacao realmente comercial.

Tarefas:

1. Testar `/api/imoveis/ingest` com:
   - locacao sem PDF;
   - venda com fotos;
   - lancamento com PDF + fotos.
2. Confirmar upload R2.
3. Confirmar Book PDF com logo/cores da imobiliaria.
4. Confirmar `book_pdf_url` no Supabase.
5. Confirmar aparicao no site demo.
6. Criar botao "enviar por WhatsApp" com Book PDF.
7. Criar fila de publicacao multicanal.
8. Trocar adapters simulados por integracao real ou feed XML para portais.
9. Definir escopo comercial inicial: publicar no site + gerar Book + texto Instagram + envio WhatsApp antes de prometer OLX/ZAP real.

Correcoes ja aplicadas em 2026-05-26:

- `uploadPropertyPDF` corrigido em `/api/imoveis/ingest`.
- `Lançamentos/${nomeSeguro}` corrigido no endpoint de upload-url.
- Pinecone alinhado para 1024 dimensoes.
- Rotas publicas criticas liberadas no `sessionGuard`.

### Frente 8 - Auth, planos, limites e seguranca

Responsavel ideal: Agente Seguranca/Auth.

Objetivo:

Fechar o minimo vendavel para acesso de clientes reais.

Tarefas:

1. Validar login real.
2. Validar sessao unica.
3. Validar roles:
   - admin master;
   - gestor imobiliaria;
   - corretor;
   - operacional.
4. Validar quotas por plano:
   - corretores;
   - leads;
   - imoveis;
   - atendimentos;
   - agentes/canais.
5. Rotacionar segredos expostos.
6. Remover segredos de repositorio.
7. Garantir que logs nao exibem tokens.

## Ordem de execucao recomendada

### Bloco 0 - Congelamento e backup

1. Fazer backup da pasta atual.
2. Exportar lista de envs do Coolify.
3. Confirmar backup Supabase.
4. Confirmar backup R2.
5. Criar branch `stabilization/coolify-vendavel`.

### Bloco 1 - Fechar deploy

1. Resolver GitHub permission.
2. Subir codigo limpo.
3. Deploy Coolify via Dockerfile.
4. Validar healthchecks.
5. Validar app abre.

### Bloco 2 - Validar integracoes essenciais

1. Supabase.
2. R2.
3. Pinecone.
4. OpenAI/OpenRouter.
5. Resend.
6. UazAPI.
7. Asaas sandbox.
8. Assinafy.
9. Cal.com.

### Bloco 3 - Fluxo vendavel

1. Landing lead.
2. Checkout sandbox.
3. Webhook pagamento.
4. Contrato.
5. Assinatura.
6. Onboarding.
7. Criacao tenant/cliente.
8. RAG.
9. Acesso CRM.

### Bloco 4 - Demo comercial

1. Site demo com imoveis.
2. Cadastro novo imovel com fotos.
3. Book PDF.
4. Busca IA.
5. WhatsApp atendimento.
6. Telegram corretor.
7. CRM Kanban.
8. Dashboard gestor.

### Bloco 5 - Hardening para venda

1. Auth/roles/quotas.
2. Monitoramento.
3. Logs.
4. Backup.
5. Documentacao de instalacao.
6. Checklist de onboarding em 3 horas.

## Testes obrigatorios

Local:

- `npx tsc --noEmit`
- `npm test`
- `cd frontend && npx tsc --noEmit`
- `cd frontend && npm run build`
- `docker build`

Container:

- `/health`
- `/api/health`
- SPA abre
- `/api/imoveis`
- `/api/imoveis/ingest`
- `/api/chat`
- `/api/webhooks/uazapi` com payload simulado

Integracoes:

- Supabase insert/select/update.
- R2 upload/download.
- Pinecone upsert/query.
- Resend email.
- UazAPI texto/audio.
- Asaas sandbox checkout/webhook.
- Assinafy contrato/webhook.
- Cal.com booking webhook.

Produto:

- Novo cliente via landing.
- Onboarding tenant.
- Criacao de imovel com fotos.
- Book PDF.
- Atendimento WhatsApp.
- Cadastro lead CRM.
- Corretor recebe/consulta.
- Gestor ve dashboard.

## Riscos que podem quebrar no futuro

1. Mudanca de payload UazAPI.
2. Indice Pinecone com dimensao diferente do codigo.
3. Puppeteer sem Chromium no container.
4. Webhooks externos demorando ou mudando campos.
5. Mistura de `clientes`, `tenants`, `landing_leads`, `client_pipeline`.
6. Segredos vazados no GitHub.
7. CSV/exportacoes de imoveis mal formatadas.
8. Portais imobiliarios nao aceitarem API direta.
9. Coolify rodar build com segredos como build-time.
10. Chat web/Cecilia parecer robotico se continuar fora da humanizacao.

## Definicao de pronto para vender

O sistema so deve ser considerado vendavel quando:

- deploy Coolify estiver estavel;
- landing estiver apontando para API correta;
- compra sandbox concluir o ciclo inteiro;
- onboarding criar cliente utilizavel;
- WhatsApp/UazAPI responder com humanizacao;
- cadastro de imovel gerar Book PDF;
- site demo mostrar os imoveis;
- CRM registrar e acompanhar leads;
- gestor conseguir operar sem ajuda tecnica;
- houver checklist replicavel de instalacao em ate 3 horas.
