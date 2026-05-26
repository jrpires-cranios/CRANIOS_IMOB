# PRD Fase 2 - Publicacao Multicanal e Portais Imobiliarios

Data: 2026-05-26
Status: fase 2, nao prometer como funcional na venda inicial

## 1. Objetivo

Transformar o modulo atual de publicacao em portais, hoje estrutural/simulado, em uma esteira real para publicar, atualizar, pausar e remover anuncios de imoveis em multiplos canais.

## 2. Escopo

### Canais alvo

- Site proprio da imobiliaria/tenant.
- WhatsApp para campanhas segmentadas.
- Instagram/Facebook via Meta Graph API.
- Portais imobiliarios via API/feed/parceria:
  - OLX;
  - ZAP Imoveis;
  - VivaReal;
  - outros mediante contrato.

### Fora do escopo imediato

- Prometer publicacao automatica em OLX/ZAP/VivaReal antes de confirmar acesso real a API/feed.
- Automacao que viole termos de uso de portais.

## 3. Estado Atual

Existe:

- `portalPublisher`;
- `portal_configs`;
- `portal_listings`;
- adapters `olx`, `zap`, `vivareal`;
- webhook de mudanca em imoveis;
- geracao de descricao e legenda Instagram com IA;
- Book PDF por imovel.

Ainda nao existe:

- credenciais reais de portais;
- chamadas reais para OLX/ZAP/VivaReal;
- feed XML/JSON validado;
- configuracao por tenant;
- fila robusta de publicacao;
- UI clara de status por canal;
- retry/backoff;
- aprovacao manual antes de publicar.

## 4. Arquitetura Proposta

### 4.1 Tabelas

Usar e expandir:

- `portal_configs`
- `portal_listings`

Adicionar, se necessario:

- `publication_jobs`
- `publication_job_logs`
- `publication_assets`

Campos recomendados para `publication_jobs`:

- `id`
- `tenant_id`
- `imovel_id`
- `portal`
- `action` (`publish`, `update`, `unpublish`, `sync_status`)
- `status` (`queued`, `running`, `success`, `failed`, `cancelled`)
- `attempts`
- `last_error`
- `scheduled_at`
- `started_at`
- `finished_at`
- `created_at`

### 4.2 Fluxo ideal

1. Imovel criado ou atualizado.
2. Sistema gera descricao, fotos normalizadas e Book PDF.
3. Usuario escolhe canais.
4. Sistema valida requisitos minimos por canal.
5. Publicacao entra em fila.
6. Worker executa adapter do canal.
7. `portal_listings` registra `external_id`, URL e status.
8. Dashboard exibe status.
9. Falhas geram retry e log explicavel.

## 5. Requisitos Por Canal

### Site proprio

Requisitos:

- publicar imediatamente quando `disponivel=true`;
- usar fotos, `foto_principal`, `book_pdf_url`, preco e descricao;
- suportar `cliente_slug`.

Status atual:

- parcialmente pronto.

### WhatsApp

Requisitos:

- gerar mensagem curta;
- anexar link do Book PDF ou pagina do imovel;
- enviar para listas/segmentos autorizados;
- respeitar opt-in/LGPD;
- registrar campanha e respostas.

Status atual:

- envio UazAPI existe;
- falta campanha segmentada.

### Instagram/Facebook

Requisitos:

- gerar legenda;
- preparar imagens em proporcao correta;
- usar Meta Graph API;
- exigir conta business conectada;
- aprovar antes de publicar.

Status atual:

- texto de Instagram existe;
- publicacao real nao existe.

### OLX/ZAP/VivaReal

Requisitos:

- confirmar forma oficial de integracao:
  - API;
  - feed XML;
  - parceiro homologado;
  - area logada manual.
- mapear campos obrigatorios;
- validar fotos;
- validar endereco;
- validar CRECI/CNPJ;
- salvar external ID.

Status atual:

- adapters simulados.

## 6. Regras de Produto

- A fase 1 deve exibir portais como "Planejado/Fase 2" ou "Mock desativado".
- Nao mostrar botao "publicar em OLX/ZAP" se nao houver credencial/config real.
- Permitir "Gerar pacote de publicacao" mesmo sem API:
  - legenda;
  - descricao;
  - Book PDF;
  - links;
  - imagens organizadas.
- Publicacao real sempre deve ter revisao humana inicialmente.

## 7. Plano de Implementacao

### Etapa 1 - Fundacao

1. Normalizar `portal_configs` por tenant.
2. Criar `publication_jobs`.
3. Criar worker de fila.
4. Criar tela de status.
5. Desligar adapters mock em producao.

### Etapa 2 - Site + WhatsApp

1. Publicar no site proprio.
2. Gerar pacote WhatsApp.
3. Enviar Book PDF/link por UazAPI.
4. Registrar respostas.

### Etapa 3 - Instagram/Facebook

1. Conectar Meta Business.
2. Publicar post/reels simples.
3. Registrar URL/status.

### Etapa 4 - Portais

1. Confirmar API/feed oficial.
2. Implementar adapter real por portal.
3. Validar homologacao.
4. Ativar por cliente/plano.

## 8. Prompts Para Agentes

### Agente Portais

> Analise `portalPublisher`, `portal_configs`, `portal_listings` e adapters. Transforme o modulo mock em arquitetura de fila segura. Nao implemente scraping nem automacao contra termos de uso. Gere interfaces para adapters reais e mantenha portais desligados sem credenciais.

### Agente WhatsApp Campanhas

> Crie fluxo de pacote de publicacao por WhatsApp usando UazAPI. Use opt-in, segmentacao, logs e limite por plano. Nao disparar massa sem aprovacao humana.

### Agente Meta Social

> Planeje integracao com Meta Graph API para publicar imoveis no Instagram/Facebook. Liste permissoes, tokens, requisitos de conta business, fluxo OAuth e fallback manual.

### Agente UI

> Crie interface de status multicanal por imovel: site, WhatsApp, Instagram, OLX, ZAP, VivaReal. Mostrar pronto, pendente, erro, desativado e mock. Nao prometer canal sem config real.

## 9. Criterios de Aceite

- Nenhum canal simulado aparece como ativo em producao.
- Site proprio publica imovel corretamente.
- WhatsApp envia pacote aprovado.
- Job de publicacao tem logs e retry.
- UI mostra status por canal.
- Portais so ativam com credenciais reais.

