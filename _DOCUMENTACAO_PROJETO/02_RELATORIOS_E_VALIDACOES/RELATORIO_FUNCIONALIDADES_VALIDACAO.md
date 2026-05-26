# Relatorio de Funcionalidades e Validacao - Cranios IMOB

Data: 2026-05-26

## Resumo Executivo

O projeto tem uma base grande e avancada, mas ainda nao esta 100% pronto para venda sem uma rodada de integracao ponta a ponta. A infraestrutura de deploy foi corrigida para Docker/Coolify, o build local passou, o build Docker passou na VPS e os healthchecks funcionaram. Funcionalmente, porem, existem areas reais, areas parcialmente ligadas e areas ainda simuladas.

O ponto mais importante: a estrutura de humanizacao existe e esta ligada ao webhook WhatsApp/UazAPI. Ela inclui acumulador de mensagens, delay de digitacao, divisao natural de respostas, humanizacao via LLM, transcricao de audio e TTS com fallback. Mas esse pipeline completo hoje esta aplicado ao canal WhatsApp/UazAPI, nao a todos os canais do produto.

## Status de Humanizacao, TTS e Voz

Status: parcial, com base forte implementada.

Arquivos principais:
- `src/services/humanizer.service.ts`
- `src/services/whatsapp-response.service.ts`
- `src/services/tts.service.ts`
- `src/services/voice-persona.service.ts`
- `src/services/transcription.service.ts`
- `src/services/whatsapp.service.ts`
- `src/server.ts`, rota `/api/webhooks/uazapi`

O que existe:
- Humanizer remove padroes de IA como "Certamente", "Com certeza", "Estou aqui para ajudar", excesso de markdown e excesso de emojis.
- O webhook UazAPI agrupa mensagens rapidas do mesmo contato em janela de 3 segundos.
- Respostas longas sao divididas em blocos naturais de ate aproximadamente 280 caracteres.
- Ha delay de digitacao proporcional ao tamanho do bloco, entre 800 ms e 3500 ms.
- Se o cliente envia audio, o sistema tenta transcrever com Whisper e responder com audio + texto.
- TTS tem fallback: Gemini-TTS, depois Google Chirp3-HD, depois Neural2.
- Personas de voz existem para Elena, SDR, agendamento, financiamento, qualificacao e corretor.

Limites atuais:
- O pipeline completo de humanizacao/TTS esta ligado ao WhatsApp via `/api/webhooks/uazapi`.
- O chat web `/api/chat` nao passa pelo mesmo `whatsappResponseService`, nem envia TTS.
- A landing/Cecilia usa widget web e chama `/api/chat`; portanto nao recebe TTS nem agrupamento WhatsApp.
- Nem todos os 9 agentes tem persona de voz propria. Alguns caem na persona padrao Elena.
- TTS depende de chaves e de `ffmpeg` no servidor para Gemini-TTS.

Recomendacao:
- Criar um `response-orchestrator.service.ts` unico para todos os canais.
- Aplicar humanizacao tambem em `/api/chat`, `/api/ai-search/chat` e Cecilia.
- Adicionar personas de voz para Ricardo, Amanda, Carlos, Lucas, Bruna, Gabriel, Marina e Roberto.
- Criar testes unitarios para `humanizer`, `splitForChat`, `typingDelay`, `accumulate` e fallback TTS.

## Fluxo de Compra, Pos-Pagamento e Onboarding de Novo Cliente

Status: parcial.

Arquivos principais:
- `landing_page/index.html`
- `landing_page/cranios_pricing_page.html`
- `landing_page/cecilia-widget.js`
- `src/services/sales-automation.service.ts`
- `src/controllers/webhook.controller.ts`
- `src/server.ts`
- `src/services/onboarding.service.ts`
- `frontend/src/pages/Onboarding.tsx`
- `frontend/src/pages/SecureKeysForm.tsx`

O que existe:
- Landing page separada com CTA de planos e chamadas para checkout.
- Endpoints `/api/sales/landing-lead` e `/api/sales/checkout`.
- Criacao ou atualizacao de lead da landing em `landing_leads`.
- Checkout Asaas sandbox/producao conforme ambiente.
- Webhook Asaas em `/api/webhooks/asaas`.
- Webhook Assinafy em `/api/webhooks/assinafy`.
- Webhook Cal.com em `/api/webhooks/calcom`.
- Envio de contrato Assinafy apos pagamento confirmado.
- Envio de kit de onboarding apos assinatura.
- Criacao de cliente `pre_ativo` apos assinatura.
- Registro do agendamento Cal.com e status `onboarding_agendado`.
- Onboarding wizard que cria tenant e dispara geracao de RAG.
- Formulario seguro para chaves via `/api/onboarding/secure-keys`.

Limites atuais:
- Existem duas rotas `/api/crm-lead-capture` no `server.ts`, o que cria ambiguidade e pode deixar uma delas inacessivel.
- Parte do fluxo antigo usa simulacao de pagamento/Assinafy.
- O webhook Asaas usa `payment.customerEmail || 'novo@cliente.com'`, o que pode criar cliente errado se o payload nao trouxer email.
- O link Cal.com esta hardcoded em alguns pontos.
- O onboarding cria tenant e RAG, mas nao comprova automaticamente criacao completa de todos os recursos externos.
- As chaves recebidas no secure form sao salvas como JSONB, indicadas como "criptografadas (simulado)", mas nao ha criptografia real aplicada no codigo visto.

Recomendacao:
- Remover duplicidade de `/api/crm-lead-capture`.
- Consolidar todo pos-pagamento em `sales-automation.service.ts`.
- Validar assinatura de webhooks Asaas/Assinafy/Cal.com com tokens reais.
- Buscar dados completos do customer no Asaas quando o webhook nao trouxer email.
- Criptografar `api_credentials` antes de salvar.
- Criar teste E2E de compra: landing -> checkout -> webhook pagamento -> contrato -> assinatura -> onboarding -> tenant ativo.

## Landing Page e Cecilia-Dify

Status: landing existe; Cecilia existe como widget e pacote Dify/documentacao, mas nao esta totalmente unificada.

Arquivos principais:
- `landing_page/index.html`
- `landing_page/cranios_pricing_page.html`
- `landing_page/cecilia-widget.js`
- `landing_page/Cecilia-Dify-Cranios-Imob/*`
- `Cecilia-Dify-Cranios-Imob/*`

O que existe:
- Landing page de vendas separada da aplicacao principal.
- Widget `cecilia-widget.js`.
- Widget chama `https://api.cranios.pro/api/chat`.
- Widget registra lead via `https://api.cranios.pro/api/sales/landing-lead`.
- Checkout chama `https://api.cranios.pro/api/sales/checkout`.
- Ha prompt orquestrador e RAGs da Cecilia para Dify.

Limites atuais:
- A pasta `landing_page` esta fora do app principal e nao entra no Dockerfile atual do backend/frontend.
- A Cecilia do widget chama `/api/chat`, que usa o chatAgent principal, nao necessariamente o prompt Dify da Cecilia.
- O pacote Dify existe como artefato/documentacao, mas nao foi identificado como runtime integrado ao deploy atual.
- A API base esta hardcoded como `https://api.cranios.pro`, nao relativa/configuravel.

Recomendacao:
- Decidir se landing sera deploy separado ou incorporado ao Docker principal.
- Se for incorporada, copiar `landing_page` para `public/landing` no build.
- Criar rota/persona especifica `/api/sales/cecilia-chat` ou adaptar `/api/chat` por `tenant/persona`.
- Trocar API hardcoded por configuracao.
- Indexar os RAGs da Cecilia no Pinecone e amarrar a persona Cecilia ao backend.

## Telegram Para Corretores e Geracao de Documento

Status: parcial.

Arquivos principais:
- `src/bots/telegram/corretor.bot.ts`
- `src/services/telegram/activation.service.ts`
- `src/services/pdf-generator.service.ts`
- `src/server.ts`, rota `/api/telegram/gerar-link`

O que existe:
- Bot central Telegram.
- Ativacao por deep link e QR code.
- Vinculo do corretor por `telegram_id`.
- Comando `/imovel [ID]` gera ou recupera PDF do imovel e envia link.
- Notificacao de novo lead qualificado para corretor.
- Fluxo de feedback pos-visita por Telegram.

Limites atuais:
- O bot ainda nao entende solicitacao natural do corretor como "me mande 3 apartamentos ate 500 mil no Jardins".
- O fluxo atual exige ID do imovel.
- Nao foi identificado gerador de documento comparativo com "melhores opcoes" a partir de uma solicitacao aberta.
- PDF atual e book/dossie de um imovel, nao necessariamente um shortlist consultivo multi-imovel.

Recomendacao:
- Criar comando `/buscar` com parsing por LLM ou filtros.
- Buscar imoveis no Supabase/Pinecone.
- Gerar PDF de shortlist com 3 a 10 melhores opcoes.
- Enviar arquivo PDF diretamente no Telegram, nao so link.
- Registrar historico do pedido do corretor e quais imoveis foram enviados.

## CRM, Gestao, Usuarios, Limites e Sessao

Status: parcial.

Arquivos principais:
- `frontend/src/pages/CRMKanban.tsx`
- `src/services/session.service.ts`
- `src/middlewares/session-guard.middleware.ts`
- `src/services/plan-limits.service.ts`
- `src/services/master-access.service.ts`
- `src/manager.controller.ts`

O que existe:
- CRM Kanban no frontend.
- Rotas de leads e status no backend.
- Briefing de lead para corretor.
- Roleta e distribuicao de leads.
- Limite de corretores por plano em `plan-limits.service.ts`.
- Controle de sessoes em `sessions_v2`.
- Corretor limitado a 1 sessao; gestor atualmente 5 sessoes para homologacao.
- Sessao antiga e removida quando excede o limite.
- Middleware retorna `SESSION_INVALIDATED` quando a sessao foi derrubada.
- Master access/impersonation com log de auditoria.

Limites atuais:
- Login principal ainda e demo-login com credenciais fixas.
- Nao ha fluxo completo de Supabase Auth real no frontend.
- Limite de leads por mes esta marcado como "a implementar".
- Nem todas as rotas parecem exigir permissao/role granular.
- O frontend usa fallback mock em algumas telas se o backend nao retorna dados.
- A protecao por sessao pode bloquear chamadas API que ainda nao enviam `x-session-token`.

Recomendacao:
- Implementar auth real com Supabase Auth/JWT.
- Padronizar `x-session-token` em todo `apiClient`.
- Ajustar limite de gestor para regra comercial final.
- Implementar quota de leads, usuarios, storage, mensagens e TTS por plano.
- Criar RBAC por role: super_admin, gestor, corretor, financeiro, juridico.

## Agentes de IA

Status: arquitetura e prompts presentes; validacao funcional ponta a ponta ainda pendente.

Arquivos principais:
- `src/agents/personas.ts`
- `src/agents/chat_agent.ts`
- `src/agents/search_agent.ts`
- `src/agents/sdr_agent.ts`
- `src/agents/qualification_agent.ts`
- `src/agents/scheduling_agent.ts`
- `src/agents/financiamento_agent.ts`
- `src/agents/documentacao_agent.ts`
- `src/agents/documind_agent.ts`
- `src/agents/signnow_agent.ts`

Agentes/personas de negocio previstos:
- Elena
- Ricardo
- Amanda
- Carlos
- Lucas
- Bruna
- Gabriel
- Marina
- Roberto

Agentes tecnicos/codigo:
- Chat
- Search
- SDR
- Qualification
- Scheduling
- Financiamento
- Documentacao
- DocuMind
- SignNow

O que existe:
- Personas principais existem em `personas.ts`.
- `chat_agent.ts` usa historico, localidades do banco, lead memory, NPS pendente e contexto de imovel.
- Modulos tecnicos existem separados.

Limites atuais:
- Nem todos os agentes tem teste automatizado.
- Nem todos os agentes foram validados com integrações reais.
- Parte de Assinafy/DocuMind/SignNow aparenta ser simulada ou dependente de configuracao externa ainda nao provada.
- Necessario validar o roteamento entre agentes em conversas reais.

## Locacao, Venda, Documentos e Financeiro

Status: parcialmente implementado.

O que existe:
- Checkout seguro para envio de documentos.
- Upload de documentos para R2 com fallback simulado.
- Geracao de contrato via Assinafy.
- Criacao de recorrencia Asaas para locacao.
- Rotas de locacao.
- Rotas de fechamento de venda.
- Aprovacao/rejeicao de fechamento.
- Notificacao Telegram para aprovacoes.
- Financeiro, comissoes, proprietarios, vistorias, ordens de servico e relatorios.

Limites atuais:
- `secure checkout` usa valores mockados como aluguel base de R$ 2500.
- Assinafy em alguns fluxos ainda usa PDF mock ou endpoints diferentes.
- Precisa validar schemas reais das tabelas no Supabase.
- Precisa testar upload/download R2 real.
- Precisa testar Asaas sandbox com cliente, pagamento, webhook e recorrencia.

## Testes Ja Realizados

Executado e passou:
- `npm test`
- `npx tsc --noEmit`
- `cd frontend && npx tsc --noEmit`
- `cd frontend && npm run build`
- `npm run build`
- `docker build` na VPS
- Container smoke na VPS com variaveis dummy:
  - `/health`
  - `/api/health`
  - SPA

Testes automatizados existentes:
- `financiamento-agent.test.ts`
- `roleta.service.test.ts`
- `whatsapp.service.test.ts`

Gaps de teste:
- Sem teste E2E de compra/onboarding.
- Sem teste E2E WhatsApp/UazAPI.
- Sem teste Telegram real.
- Sem teste de webhook Asaas/Assinafy/Cal.com com payloads reais.
- Sem teste R2 upload/download real.
- Sem teste Pinecone RAG real.
- Sem teste Supabase Auth real.
- Sem teste de quota por plano.
- Sem teste de sessao invalidada no frontend.
- Sem teste de TTS fallback.

## Principais Riscos Antes de Vender

1. GitHub ainda nao recebeu o commit corrigido por falha de permissao da conta `VitaFlowia`.
2. Segredos expostos historicamente precisam ser rotacionados.
3. Cecilia/landing estao separadas do deploy principal.
4. Fluxo pos-compra existe, mas ainda mistura automacao real e simulacao.
5. Auth real ainda nao substituiu totalmente `demo-login`.
6. Webhooks precisam ser validados com payload real.
7. TTS/humanizacao nao cobre todos os canais.
8. Telegram gera dossie por ID, nao shortlist inteligente por pedido natural.
9. Secure onboarding salva credenciais sem criptografia real identificada.
10. Rotas duplicadas no `server.ts` podem gerar comportamento inesperado.

## Prioridade de Implementacao

Prioridade 0 - nao vender antes:
- Enviar commit corrigido ao GitHub.
- Rotacionar segredos.
- Deploy Coolify com Dockerfile e smoke em URL publica.
- Validar Supabase, Asaas sandbox, Resend, R2, Pinecone, UazAPI e Telegram.
- Remover duplicidade de rotas criticas.
- Substituir ou proteger `demo-login`.

Prioridade 1 - produto comercial minimo:
- Unificar pipeline de humanizacao para todos os canais.
- Consolidar fluxo compra -> pagamento -> contrato -> assinatura -> onboarding -> tenant ativo.
- Landing + Cecilia conectadas ao backend correto.
- CRM Kanban conectado a dados reais.
- Telegram `/buscar` e PDF de shortlist.
- Criptografia real para credenciais dos clientes.

Prioridade 2 - escala:
- Quotas por plano completas.
- RBAC completo.
- Observabilidade e alertas.
- Jobs com fila/retry.
- Dashboard de uso por tenant.
- Testes E2E automatizados.
