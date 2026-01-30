# Checklist de Implementação – CRM Imobiliário Omnichannel

> Objetivo: servir como **roteiro prático** de implantação, do zero até produção, de um CRM integrado a portais imobiliários e canais de atendimento.

---

## 1. Fase 0 – Preparação e Alinhamento

- [ ] Definir objetivo principal do projeto (ex.: “centralizar leads + chat dos principais portais”).
- [ ] Listar portais prioritários (ex.: ZAP/Viva Real, OLX, QuintoAndar, Imovelweb…).
- [ ] Mapear stack de tecnologia (Node.js, banco, hospedagem, etc.).
- [ ] Definir time envolvido (dev, infra, negócio).
- [ ] Criar repositório Git para o backend do CRM.
- [ ] Criar espaço de documentação (Notion, Confluence, etc.).

---

## 2. Fase 1 – Contas, Contratos e Acessos

### 2.1. Portais Imobiliários
- [ ] Criar/validar contas de **anunciante/imobiliária** em cada portal.
- [ ] Verificar se já há integração com algum CRM pronto (Jetimob, Imobzi etc.).
- [ ] Contatar cada portal perguntando sobre:
  - [ ] Integração via **feed XML** ou **API** para anúncios.
  - [ ] Possibilidade de **webhook de leads**.
  - [ ] Eventual acesso a **webhooks ou APIs de chat**.

### 2.2. Canais de Atendimento
- [ ] Avaliar uso de **WhatsApp Business API** (via Twilio, Zenvia, 360Dialog, etc.).
- [ ] Verificar se você usará uma **plataforma omnichannel pronta** (Nexloo, CloudCanal, etc.).
- [ ] Confirmar custos, limites de mensagens e políticas de uso.

### 2.3. Infraestrutura
- [ ] Definir ambiente (VPS própria, AWS, GCP, Azure…).
- [ ] Garantir HTTPS desde o início (Let’s Encrypt ou similar).
- [ ] Criar banco de dados (PostgreSQL recomendado).

---

## 3. Fase 2 – Backend Básico (Leads + Imóveis)

### 3.1. Projeto Node.js
- [ ] Inicializar projeto (`npm init`, `package.json`).
- [ ] Instalar dependências principais (Express, dotenv, pg/Sequelize, winston…).
- [ ] Configurar **app.js** com rotas base e healthcheck.

### 3.2. Banco de Dados
- [ ] Criar tabela **properties** (imóveis) com campos essenciais (código, título, cidade, preço, etc.).
- [ ] Criar tabela **leads** com campos (nome, e-mail, telefone, mensagem, origem, propertyId…).
- [ ] Criar índices básicos (por status, origem, createdAt).

### 3.3. Rotas Internas
- [ ] `GET /api/leads` – listar leads com filtros simples.
- [ ] `GET /api/leads/:id` – detalhes do lead.
- [ ] `GET /api/properties` – listar imóveis.
- [ ] `POST /api/properties` – criar/atualizar imóveis manualmente (para testes).

---

## 4. Fase 3 – Webhooks de Leads (Portais)

### 4.1. Endpoints de Webhook
- [ ] Criar rota `POST /api/webhooks/grupozap/lead`.
- [ ] Deixar preparada estrutura para outros portais: `…/quintoandar/lead`, `…/olx/lead`, etc.

### 4.2. Normalização de Payload
- [ ] Implementar service para **Grupo ZAP** que:
  - [ ] Recebe o payload do portal.
  - [ ] Converte para o modelo interno de Lead.
  - [ ] Garante idempotência (não duplica `externalId`).
- [ ] Repetir padrão para outros portais, sempre salvando em `leads` com `source` diferente.

### 4.3. Testes
- [ ] Simular chamadas com `curl` ou Postman.
- [ ] Validar gravação no banco.
- [ ] Garantir tratamento de erros (resposta 200 mesmo se o erro for interno, se o portal exigir).

---

## 5. Fase 4 – Envio de Imóveis para Portais

> Esta fase geralmente exige a documentação específica de cada portal (XML, API, credenciais).

- [ ] Implementar gerador de **XML feed** baseado na sua tabela `properties` (para ZAP, Viva Real, Imovelweb, etc.).
- [ ] Criar rotina (cron) para gerar e enviar o XML conforme exigência (ex.: a cada 12h).
- [ ] Tratar resposta do portal (erros de validação, campos obrigatórios faltando).
- [ ] Registrar logs por imóvel (sucesso/falha) para auditoria.

---

## 6. Fase 5 – Módulo de Chat Omnichannel

### 6.1. Modelagem
- [ ] Criar tabela **conversations** (origem, leadId, propertyId, status…).
- [ ] Criar tabela **messages** (conversationId, direction, content, origin, status…).

### 6.2. Webhooks de Mensagens
- [ ] Criar rotas `POST /api/webhooks/zap/messages` (ou equivalente) para mensagens de chat.
- [ ] Criar rotas para WhatsApp (`/api/webhooks/whatsapp`).
- [ ] Normalizar todos os payloads para o mesmo modelo de `messages`.

### 6.3. API Interna de Chat
- [ ] `GET /api/conversations` – listar conversas.
- [ ] `GET /api/conversations/:id/messages` – histórico de mensagens.
- [ ] `POST /api/conversations/:id/messages` – enviar mensagem.

### 6.4. Frontend (MVP)
- [ ] Criar uma tela com:
  - [ ] Lista de conversas (com origem, último texto, data, não lidos).
  - [ ] Janela de mensagens.
  - [ ] Campo de texto e botão “Enviar”.

---

## 7. Fase 6 – Segurança e Compliance

- [ ] Implementar **autenticação** para usuários internos (JWT, OAuth ou similar).
- [ ] Controlar permissões (corretor só vê leads da sua carteira, por exemplo).
- [ ] Adicionar **rate limiting** em endpoints sensíveis (envio de mensagens, webhooks).
- [ ] Garantir HTTPS em toda comunicação externa.
- [ ] Rever armazenamento de dados sensíveis (criptografia se necessário).
- [ ] Documentar práticas de **LGPD** (finalidade, tempo de retenção, direito de exclusão).

---

## 8. Fase 7 – Observabilidade e Monitoramento

- [ ] Implementar logs estruturados (JSON) com nível (info, warn, error).
- [ ] Adicionar correlação de logs por request id.
- [ ] Configurar monitoramento básico (CPU, memória, latência).
- [ ] Criar dashboards de:
  - [ ] Volume de leads por origem.
  - [ ] Tempo médio de resposta.
  - [ ] Taxa de conversão por portal.
- [ ] Configurar alertas básicos (erros 5xx, falha ao conectar no banco, etc.).

---

## 9. Fase 8 – Homologação e Go‑Live

- [ ] Rodar bateria de testes em ambiente de **staging** com dados de teste.
- [ ] Validar integração com pelo menos 1 portal “real” em ambiente controlado.
- [ ] Validar recebimento de leads reais e envio de mensagens reais.
- [ ] Treinar equipe de corretores/atendimento no uso do novo painel.
- [ ] Planejar janela de Go‑Live (horário com menor fluxo).
- [ ] Ter plano de rollback simples (voltar para processo anterior, se necessário).

---

## 10. Pós Go‑Live

- [ ] Acompanhar métricas diariamente na 1ª semana.
- [ ] Corrigir rapidamente qualquer problema de UX/fluxo da equipe.
- [ ] Coletar feedback dos usuários internos.
- [ ] Priorizar melhorias de qualidade de vida (atalhos, filtros, buscas).
- [ ] Iniciar planejamento para integrar **novos portais/canais**.

---

## 11. Resumo de Prioridades (se tiver pouco tempo/time)

1. **Primeiro:**
   - Receber leads (webhooks) e gravar tudo de forma confiável.
2. **Depois:**
   - Enviar imóveis automaticamente (XML/API) para reduzir trabalho manual.
3. **Na sequência:**
   - Chat omnichannel (inicio com ZAP/Viva Real + WhatsApp).
4. **Por fim:**
   - Otimizações, automações avançadas, relatórios sofisticados.

Esse checklist funciona como um **mapa de estrada**. Você pode marcar item por item à medida que avança, adaptando profundidade e ordem conforme sua realidade (tamanho de equipe, prazos, orçamento, etc.).
