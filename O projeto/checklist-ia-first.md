# Checklist de Implementação – CRM AI-First Omnichannel (Setup em 8h)

> Objetivo: roteiro prático para implantação de um **sistema de IA omnichannel imobiliário completo**, otimizado para **onboarding rápido** (primeira imobiliária em ~8 horas).

---

## Fase 0: Preparação Pré-Launch (Antes da Primeira Imobiliária)

**Responsável:** Tech Lead + DevOps

- [ ] **Infraestrutura Base**
  - [ ] VPS/Cloud (AWS, GCP, Azure) configurada e testada
  - [ ] PostgreSQL + Redis prontos para produção
  - [ ] SSL/HTTPS estabelecido
  - [ ] Backup automático configurado (daily)
  - [ ] Monitoramento (Sentry, DataDog, ou similar)

- [ ] **APIs & SDKs Integrados**
  - [ ] OpenAI API (ou outro modelo de IA) testado
  - [ ] Cal.com API integrada e validada
  - [ ] Google Maps API (para otimização de rotas)
  - [ ] Twilio/Zenvia (WhatsApp) testado
  - [ ] Instagram/Facebook Messenger webhooks prontos

- [ ] **Documentação de Código**
  - [ ] README com instruções de setup
  - [ ] API docs (Swagger/OpenAPI)
  - [ ] Guia de deployment
  - [ ] Troubleshooting common issues

---

## Fase 1: Cliente Onboarding (0-30 min)

**Responsável:** Account Manager / Equipe de Suporte

- [ ] **Levantamento de Informações**
  - [ ] Nome da imobiliária / Logo
  - [ ] Localização(ões) principais
  - [ ] Número de corretores / apresentadores
  - [ ] Principais portais onde anunciam (ZAP, Viva Real, etc.)
  - [ ] Bancos de dados de imóveis (Excel, CSV, banco próprio)
  - [ ] Preferências de IA (Tom, especialização)

- [ ] **Criação de Tenant**
  - [ ] ID único para a imobiliária no sistema
  - [ ] Diretório de upload preparado
  - [ ] Credenciais de acesso (Admin, Gestor, Corretor)

---

## Fase 2: Setup de Dados (0:30-2:30)

**Responsável:** Tech Support + Imobiliária

### 2.1. Upload de Propriedades

- [ ] **Preparação de Arquivo**
  - [ ] Arquivo Excel/CSV com todas as propriedades
  - [ ] Colunas esperadas: código, endereço, tipo, quartos, preço, descrição, fotos_url, etc.
  - [ ] Validação de dados (sem duplicatas, campos obrigatórios preenchidos)

- [ ] **Importação**
  - [ ] Executar script de import: `npm run import:properties --file=properties.csv --tenant=imob_001`
  - [ ] Validar quantidade de registros importados
  - [ ] Spot-check: visualizar 5-10 imóveis aleatoriamente para confirmar

- [ ] **Enriquecimento de Dados**
  - [ ] Geocodificação de endereços (latitude/longitude)
  - [ ] Classificação automática de tipo (lançamento, usado, etc.)
  - [ ] Calculo de "score" de imóvel (baseado em preço, localização, demanda)

### 2.2. Cadastro de Corretores

- [ ] **Upload de Lista**
  - [ ] Arquivo Excel com: nome, email, telefone, especialização, Cal.com username

- [ ] **Integração Cal.com**
  - [ ] Cada corretor cria conta pessoal em Cal.com
  - [ ] Gerar API key para cada um (ou usar central)
  - [ ] Mapear Cal.com username → ID interno do sistema

- [ ] **Configurar Pesos de Roteamento**
  - [ ] Para cada tipo de imóvel (locação_3q, vendas_lançamentos, etc.)
  - [ ] Definir peso/quota para cada corretor
  - [ ] Exemplo: João 2x, Júnior 3x, Mario 1x

### 2.3. Cadastro de Apresentadores

- [ ] **Upload de Pessoal**
  - [ ] Nome, email, telefone, disponibilidade horária
  - [ ] Configurar horários de trabalho no Cal.com

- [ ] **Preparar Rotas**
  - [ ] Mapear pontos de partida (escritório, região de cobertura)
  - [ ] Testar Google Maps integration para otimização

---

## Fase 3: Integração de Canais (2:30-4:30)

**Responsável:** Tech Support + Imobiliária

### 3.1. Portais Imobiliários (ZAP, Viva Real, etc.)

- [ ] **Webhooks de Leads**
  - [ ] Contatar suporte de cada portal para habilitar webhooks
  - [ ] Configurar endpoint de callback no sistema: `https://[seu_dominio]/api/webhooks/[portal_name]/lead`
  - [ ] Testar recebimento com lead de teste

- [ ] **Feed XML de Propriedades**
  - [ ] Gerar XML conforme especificação de cada portal
  - [ ] Validar XML (sem erros de schema)
  - [ ] Submeter arquivo ou ativar envio automático (12h em 12h)

### 3.2. WhatsApp / Telegram

- [ ] **Conectar Twilio/Zenvia**
  - [ ] Configurar credenciais de API
  - [ ] Testar envio/recebimento de mensagens
  - [ ] Número de WhatsApp Business vinculado

- [ ] **Webhooks de Entrada**
  - [ ] Configurar callback: `https://[seu_dominio]/api/webhooks/whatsapp/message`

### 3.3. Instagram / Messenger

- [ ] **Facebook Developer Account**
  - [ ] App registrado
  - [ ] Webhooks habilitados
  - [ ] Testar DM de entrada

### 3.4. Website Próprio

- [ ] **Chat Widget**
  - [ ] Incorporar script do chat no site
  - [ ] Testar envio/recebimento
  - [ ] Validar identidades de leads

---

## Fase 4: Configuração de Agentes de IA (4:30-6:00)

**Responsável:** Tech Lead + Product Manager

- [ ] **Criar Prompts Customizados**
  - [ ] Agent.Investigativo → prompt específico para a imobiliária
  - [ ] Agent.Recomendacao → tom de voz, estilo
  - [ ] Agent.Vendas → mensagens de lançamentos se aplicável
  - [ ] Agent.Suporte → informações jurídicas/financeiras específicas

- [ ] **Testar Conversas**
  - [ ] Rodar 10+ conversas de teste com cada agente
  - [ ] Validar qualidade de respostas
  - [ ] Ajustar prompts conforme feedback

- [ ] **Configurar Roteamento**
  - [ ] Definir regras de intent detection
  - [ ] Mapear intents → agentes
  - [ ] Testar escalação (quando IA chama humano)

---

## Fase 5: Dashboard & Monitoramento (6:00-7:00)

**Responsável:** DevOps + Analytics

- [ ] **Criar Dashboard Inicial**
  - [ ] KPIs básicos (leads, agendamentos, vendas)
  - [ ] Gráficos de conversão
  - [ ] Ranking de corretores

- [ ] **Configurar Alertas**
  - [ ] NPS < threshold → avisar
  - [ ] Taxa de escalação > X% → avisar
  - [ ] No-shows > Y → avisar

- [ ] **Criar Relatórios Automáticos**
  - [ ] Relatório diário por email
  - [ ] Relatório semanal de performance

---

## Fase 6: Treinamento & Go-Live (7:00-8:00)

**Responsável:** Account Manager + Trainers

- [ ] **Treinar Equipe da Imobiliária**
  - [ ] Painel de administração (ajustar pesos, ver analytics)
  - [ ] Como usar Cal.com
  - [ ] App de Apresentador (se houver mobile)
  - [ ] Como interpretar Self-Vistoria

- [ ] **Testar End-to-End**
  - [ ] Simular cliente vindo de ZAP
  - [ ] IA oferece recomendações
  - [ ] Cliente agenda visita
  - [ ] Apresentador recebe notificação
  - [ ] Self-Vistoria é preenchida
  - [ ] Evento aparece no dashboard

- [ ] **Go-Live**
  - [ ] Ativar webhooks de portais
  - [ ] Notificar clientes/corretores
  - [ ] Acompanhamento de 24h (suporte on-call)

---

## Fase 7: Primeiras 24-48 Horas

**Responsável:** Suporte + Tech

- [ ] **Monitoramento Intenso**
  - [ ] Acompanhar logs por erros
  - [ ] Validar que leads estão entrando
  - [ ] IA está respondendo normalmente?
  - [ ] Corretores recebendo agendamentos?

- [ ] **Ajustes Rápidos**
  - [ ] Responder dúvidas de uso
  - [ ] Corrigir bugs imediatos
  - [ ] Refinar prompts se necessário (baseado em conversas reais)

---

## Checklist de Qualidade (Antes de Each Milestone)

### Antes de Importar Propriedades
- [ ] Arquivo CSV validado (sem erros)
- [ ] 100+ propriedades para teste (mínimo)
- [ ] Fotos dos imóveis acessíveis (URLs válidas)

### Antes de Habilitar Webhooks
- [ ] Teste de webhook com payload simulado
- [ ] Validação de assinatura (se portal oferecer)
- [ ] Resposta HTTP 200 OK

### Antes de Treinar Equipe
- [ ] 5+ conversas de teste executadas com sucesso
- [ ] IA consegue recomendar imóveis relevantes
- [ ] Dashboard mostra dados corretos

### Antes de Go-Live
- [ ] 0 erros críticos nos logs
- [ ] Performance < 2s para qualquer requição
- [ ] 99.9% uptime testado
- [ ] NPS mínimo esperado validado em testes

---

## Métricas de Sucesso (Primeira Semana)

Após 7 dias de operação, esperamos:

✅ **Leads**
- Recebendo leads de pelo menos 2 portais
- Mín 20 leads/dia (depende do tamanho da imobiliária)

✅ **IA**
- Taxa de escalação < 5% (IA consegue responder sozinha)
- Satisfação de cliente ≥ 4.0/5

✅ **Conversão**
- Lead → Agendamento ≥ 30%
- Agendamento → Venda ≥ 25%

✅ **Sistema**
- Uptime ≥ 99.5%
- Tempo de resposta IA < 3 segundos
- Zero escalações involuntárias (bugs)

---

## Troubleshooting Rápido

| Problema | Causa Provável | Solução |
|----------|------------------|----------|
| Leads não chegam | Webhook não habilitado | Verificar portal, testar com payload simulado |
| IA não responde | API de modelo down | Verificar OpenAI/Anthropic status |
| Corretor não recebe agendamento | Cal.com não sincronizado | Validar API key, testar disponibilidade |
| Dashboard vazio | Dados não importados | Re-rodar import script |
| Foto do imóvel não aparece | URL inválida | Validar URLs no arquivo original |

---

## Pós-Setup (Semana 2+)

Após go-live bem-sucedido:

- [ ] Agendar reunião semanal de análise
- [ ] Refinar prompts baseado em dados reais
- [ ] Aumentar quantidade de agentes (se necessário)
- [ ] Integrar novos canais (se cliente solicitar)
- [ ] Planejar melhorias de UX

---

**Objetivo final:** Uma imobiliária completamente operacional com IA omnichannel em **~8 horas**, gerando leads, agendamentos e vendas desde o primeiro dia.

O segredo é **modularidade**: cada componente funciona independente, e podemos desativar/reativar sem afetar o resto do sistema.
