__­ƒÅó SISTEMA IMOBILI├üRIO__

__Especifica├º├úo T├®cnica Completa__

M├│dulo de Distribui├º├úo de Leads, Gest├úo de Corretores & Dashboard do Gestor

Vers├úo

__1\.0 ÔÇö Revis├úo Inicial__

Data

__2025 ÔÇö Entrega ao Desenvolvedor__

Stack Principal

__TypeScript / Supabase / Pinecone__

Escopo

__Distribui├º├úo de Leads \+ Dashboard Gestor__

__├ìNDICE__

1\. Vis├úo Geral do M├│dulo

2\. Motor de Roleta ÔÇö Distribui├º├úo de Leads

3\. Sistema de Qualifica├º├úo de Corretores

4\. Filtros por Tipo de Im├│vel e Lan├ºamento

5\. Regras de Temperatura e Roteamento por IA

6\. Regras de Verifica├º├úo de Atendimento \(SLAs\)

7\. Dashboard do Gestor

8\. Modelo de Dados ÔÇö Supabase

9\. Endpoints da API REST

10\. Integra├º├úo com Agentes de IA Existentes

11\. Seguran├ºa e Acessos

12\. KPIs e M├®tricas de Performance

13\. Backlog e Checklist de Entrega

# __1\. Vis├úo Geral do M├│dulo__

Este documento especifica o m├│dulo de Distribui├º├úo Inteligente de Leads e o Dashboard do Gestor para o sistema imobili├írio baseado em agentes de IA\. O objetivo ├® garantir que cada lead seja roteado automaticamente ao corretor mais adequado com base em um conjunto de regras configur├íveis pelo gestor da imobili├íria\.

__Princ├¡pios Fundamentais do M├│dulo__

- Automatiza├º├úo total do roteamento ÔÇö nenhum lead deve aguardar atribui├º├úo manual\.
- Transpar├¬ncia e rastreabilidade ÔÇö cada decis├úo de roteamento deve ser registrada com motivo\.
- Configura├º├úo no\-code pelo gestor ÔÇö regras ajust├íveis via painel administrativo sem altera├º├Áes no c├│digo\.
- Integra├º├úo nativa com os agentes de IA j├í existentes \(QualificationAgent, SdrAgent, ChatAgent\)\.
- Dashboard exclusivo do gestor com m├®tricas em tempo real\.

__­ƒôî  Contexto de Arquitetura Atual__

O sistema j├í possui: ChatAgent, QualificationAgent, SdrAgent, SchedulingAgent e SearchAgent\.

O novo m├│dulo \(LeadRouter\) ir├í se conectar na sa├¡da do QualificationAgent e do SdrAgent,

recebendo o lead qualificado e aplicando as regras de distribui├º├úo antes de notificar o corretor\.

# __2\. Motor de Roleta ÔÇö Distribui├º├úo de Leads__

A roleta ├® o mecanismo principal de distribui├º├úo quando nenhuma regra de prioridade elimina a ambiguidade entre corretores eleg├¡veis\. Funciona como uma fila ponderada persistente no banco de dados\.

## __2\.1 Conceito de Peso na Roleta__

Cada corretor recebe um peso num├®rico inteiro \(m├¡nimo 1\)\. O gestor configura esses pesos livremente\. O algoritmo usa a l├│gica de Weighted Round\-Robin com controle de fila por contadores persistentes\.

__­ƒÄ»  Exemplo de Configura├º├úo ÔÇö Roleta Ponderada__

Jo├úo  ÔåÆ  peso 3   \(recebe 3 leads para cada ciclo completo\)

Maria ÔåÆ  peso 2   \(recebe 2 leads para cada ciclo completo\)

Chico ÔåÆ  peso 1   \(recebe 1 lead para cada ciclo completo\)

Sequ├¬ncia gerada: Jo├úo ÔåÆ Jo├úo ÔåÆ Jo├úo ÔåÆ Maria ÔåÆ Maria ÔåÆ Chico ÔåÆ \(reinicia\)

Total de 6 leads por ciclo\. Ao final do ciclo, os contadores resetam automaticamente\.

## __2\.2 Algoritmo ÔÇö Weighted Round\-Robin__

O algoritmo deve ser implementado em TypeScript como um servi├ºo singleton \(LeadRouterService\) com o seguinte fluxo:

// src/services/lead\-router\.service\.ts

interface CorretorElegivel \{

  id: string;

  nome: string;

  peso: number;           // peso configurado pelo gestor

  creditos\_atuais: number; // contagem atual no ciclo

  status: 'ativo' | 'ausente' | 'pausado';

\}

function selecionarCorretor\(corretores: CorretorElegivel\[\]\): CorretorElegivel \{

  // 1\. Filtrar apenas corretores ativos

  // 2\. Encontrar o corretor com maior \(creditos\_atuais / peso\) normalizado

  // 3\. Decrementar cr├®dito do selecionado

  // 4\. Se todos chegaram a zero, resetar todos para seus pesos

  // 5\. Persistir estado no Supabase \(tabela: roulette\_state\)

\}

## __2\.3 Estados do Corretor na Roleta__

__Status__

__Comportamento__

__A├º├úo do Sistema__

ativo

Recebe leads normalmente

Incluso na roleta

ausente

Temporariamente indispon├¡vel

Exclu├¡do da roleta; leads redistribu├¡dos

pausado

Suspenso pelo gestor

Exclu├¡do da roleta; n├úo recebe nenhum lead

f├®rias

Per├¡odo de f├®rias configurado

Exclu├¡do automaticamente por data

## __2\.4 Controle de Aus├¬ncia e Overflow__

- Se um corretor marcado como 'ausente' estava em espera na roleta, o pr├│ximo eleg├¡vel da fila assume\.
- Se TODOS os corretores de um segmento estiverem ausentes, o lead deve ir para uma fila de espera \(tabela leads\_em\_espera\) e o gestor recebe notifica├º├úo via e\-mail/WhatsApp\.
- A fila de espera ├® processada automaticamente quando um corretor volta ao status 'ativo'\.

# __3\. Sistema de Qualifica├º├úo de Corretores__

Al├®m do peso na roleta, cada corretor possui um ├¡ndice interno de qualifica├º├úo que o sistema usa para priorizar leads com maior grau de dificuldade de fechamento\. Esse ├¡ndice ├® calculado automaticamente e tamb├®m pode ser ajustado manualmente pelo gestor\.

## __3\.1 ├ìndice de Qualifica├º├úo do Corretor \(IQC\)__

O IQC ├® um n├║mero de 0 a 100 calculado automaticamente com base nos indicadores hist├│ricos do corretor:

__Indicador__

__Peso no IQC__

__Fonte dos Dados__

Taxa de convers├úo \(leads ÔåÆ fechamento\)

35%

Tabela leads \+ contratos

Tempo m├®dio de resposta ao lead

20%

Tabela lead\_events \(primeiro contato\)

Avalia├º├úo de satisfa├º├úo do cliente \(NPS\)

20%

Formul├írio p├│s\-venda

Volume de leads atendidos \(experi├¬ncia\)

15%

Contagem hist├│rica

Reclama├º├Áes ou cancelamentos registrados

\-10%

Tabela reclamacoes

## __3\.2 Roteamento por Dificuldade do Lead__

O QualificationAgent j├í calcula um score de dificuldade do lead\. O LeadRouter deve usar esse score para decidir qual perfil de corretor recebe o lead:

__Score Dificuldade \(IA\)__

__Temperatura do Lead__

__Perfil M├¡nimo do Corretor__

__A├º├úo__

80 ÔÇô 100

Quente ­ƒöÑ

IQC ÔëÑ 75 \(S├¬nior\)

Roteamento imediato

50 ÔÇô 79

Morno ­ƒîí´©Å

IQC ÔëÑ 45 \(Pleno\)

Roteamento padr├úo

20 ÔÇô 49

Frio ÔØä´©Å

Qualquer IQC

Roleta normal

0 ÔÇô 19

Descart├ível ­ƒùæ´©Å

N/A

Fila de nurturing

__ÔÜÖ´©Å  Configura├º├úo pelo Gestor__

O gestor pode ajustar os limiares de cada faixa de dificuldade no painel\.

Pode tamb├®m for├ºar manualmente o IQC de um corretor \(override manual\)\.

Pode criar grupos de corretores 'especialistas' que t├¬m prioridade em certas faixas\.

## __3\.3 Override Manual de IQC__

O gestor pode, a qualquer momento, definir manualmente o IQC de um corretor, sobrescrevendo o c├ílculo autom├ítico\. O sistema deve registrar o override com data, motivo e quem realizou a altera├º├úo \(auditoria\)\.

# __4\. Filtros por Tipo de Im├│vel e Lan├ºamento__

O gestor pode restringir quais tipos de im├│veis ou campanhas de lan├ºamento cada corretor atende\. Os agentes de IA s├│ incluir├úo na roleta os corretores habilitados para o produto espec├¡fico do lead\.

## __4\.1 Categorias de Im├│veis Configur├íveis__

- Residencial \(Apartamento, Casa, Studio, Cobertura\)
- Comercial \(Sala, Loja, Galp├úo\)
- Lan├ºamentos \(cada lan├ºamento pode ser um 'produto' individualizado\)
- Loca├º├úo vs Venda \(corretor pode atuar em uma ou ambas as modalidades\)
- Faixa de Pre├ºo \(ex\.: corretor X s├│ atende im├│veis acima de R$ 500\.000\)

## __4\.2 Modelo de Habilita├º├úo por Corretor__

__Configura├º├úo__

__Tipo__

__Comportamento__

Tipo de im├│vel habilitado

Multi\-select

Corretor s├│ aparece na roleta para o tipo selecionado

Lan├ºamento espec├¡fico

Checkbox por campanha

Corretor exclusivo para aquele lan├ºamento

Faixa de valor \(min/max\)

Range num├®rico

Corretor exclu├¡do se valor do lead estiver fora da faixa

Modalidade \(venda/loca├º├úo\)

Toggle

Corretor exclu├¡do da roleta da modalidade n├úo habilitada

Bairros / Regi├Áes

Multi\-select geogr├ífico

Corretor s├│ recebe leads de ├íreas habilitadas

## __4\.3 Agente Gabriel ÔÇö Lan├ºamentos Premium__

O agente Gabriel \(GabrielSantos ÔÇö Especialista em Lan├ºamentos\) deve ter integra├º├úo direta com esse m├│dulo\. Quando um lead entra pelo funil de lan├ºamentos, o GabrielAgent filtra e s├│ encaminha para corretores com a flag 'lan├ºamento\_habilitado = true' E que estejam cadastrados especificamente naquele lan├ºamento\.

# __5\. Regras de Temperatura e Roteamento por IA__

O sistema deve implementar uma camada de decis├úo inteligente que combina o score gerado pelo QualificationAgent com as configura├º├Áes do gestor para criar um motor de roteamento contextual\.

## __5\.1 Fluxo Completo de Roteamento__

FLUXO: Lead recebido ÔåÆ Agente IA ÔåÆ LeadRouter

1\. Lead chega via WhatsApp / Formul├írio / Integra├º├úo

2\. Elena \(recepcionista\) faz acolhimento e coleta nome

3\. Amanda \(qualifica├º├úo\) analisa perfil e gera:

   \- score\_dificuldade: 0\-100

   \- temperatura: quente | morno | frio | descart├ível

   \- tipo\_imovel\_interesse: residencial | comercial | lan├ºamento

   \- faixa\_valor\_estimada: n├║mero

   \- urgencia: imediata | 30\_dias | 90\_dias | sem\_pressa

4\. LeadRouter\.distribuir\(lead\) executa:

   a\. Filtrar corretores por tipo\_imovel\_interesse

   b\. Filtrar por faixa\_valor\_estimada

   c\. Filtrar por status = 'ativo'

   d\. Se temperatura = 'quente' ÔåÆ filtrar por IQC ÔëÑ threshold

   e\. Aplicar roleta ponderada nos eleg├¡veis restantes

   f\. Registrar decis├úo em lead\_distribution\_log

   g\. Notificar corretor via WhatsApp \+ painel

## __5\.2 Regras de Prioridade ÔÇö Ordem de Avalia├º├úo__

As regras abaixo s├úo avaliadas em sequ├¬ncia \(a primeira que eliminar corretores tem preced├¬ncia\):

1. Corretor com status ativo/dispon├¡vel no momento\.
2. Corretor habilitado para o tipo de im├│vel do lead\.
3. Corretor dentro da faixa de valor configurada\.
4. Corretor com IQC m├¡nimo para a temperatura do lead\.
5. Corretor dentro da regi├úo/bairro do lead \(se configurado\)\.
6. Aplicar peso da roleta nos eleg├¡veis restantes\.

## __5\.3 Regras Adicionais de Neg├│cio__

- Regra de Re\-atribui├º├úo: Se o corretor n├úo responder o lead em X minutos \(configur├ível\), o lead pode ser re\-atribu├¡do automaticamente ao pr├│ximo da roleta\.
- Regra de Exclusividade: Certos leads podem ser marcados como 'VIP' e sempre ir para um corretor espec├¡fico independente da roleta\.
- Regra de Hist├│rico: Se o cliente j├í teve atendimento anterior com um corretor, o sistema deve preferencialmente encaminhar para o mesmo corretor \(reconex├úo\)\.
- Regra de Balanceamento Di├írio: O gestor pode configurar um limite m├íximo de leads por corretor por dia\.

# __6\. Regras de Verifica├º├úo de Atendimento ÔÇö SLAs__

O m├│dulo de SLA monitora automaticamente a qualidade e velocidade do atendimento dos corretores, gerando alertas e atualizando o IQC em tempo real\.

## __6\.1 SLAs de Atendimento__

__Evento__

__SLA Padr├úo__

__SLA Cr├¡tico__

__A├º├úo ao Violar__

Primeiro contato com lead quente

5 minutos

15 minutos

Alerta \+ re\-atribui├º├úo

Primeiro contato com lead morno

30 minutos

2 horas

Alerta ao gestor

Resposta a mensagem do cliente

2 horas

24 horas

Alerta \+ penalidade no IQC

Confirma├º├úo de visita agendada

1 hora

4 horas

Alerta ao gestor

Registro de resultado da visita

24 horas

48 horas

Penalidade no IQC

Atualiza├º├úo de status do lead

24 horas

72 horas

Alerta recorrente

__ÔÜÖ´©Å  Configura├º├úo de SLAs pelo Gestor__

Todos os tempos de SLA acima s├úo valores padr├úo\. O gestor pode ajustar cada um

individualmente no painel de configura├º├Áes\. Pode tamb├®m configurar por turno de trabalho

\(ex\.: SLA pausado entre 22h e 8h se o corretor n├úo trabalha ├á noite\)\.

## __6\.2 Eventos Monitorados e Rastreados__

- lead\_recebido: Timestamp de quando o lead foi atribu├¡do ao corretor\.
- primeiro\_contato: Timestamp da primeira mensagem enviada pelo corretor\.
- visita\_agendada: Confirma├º├úo de agendamento via SchedulingAgent\.
- visita\_realizada: Registro de presen├ºa ou aus├¬ncia\.
- proposta\_enviada: Gera├º├úo de proposta formal\.
- negociacao\_iniciada: Troca de contrapropostas registradas\.
- contrato\_assinado: Assinatura via DocuSign ou SignNow\.
- lead\_perdido: Motivo do n├úo\-fechamento \(obrigat├│rio preencher\)\.

# __7\. Dashboard do Gestor__

O dashboard ├® exclusivo para o perfil de gestor \(role = 'manager'\)\. ├ë composto por 3 ├íreas principais: Configura├º├úo de Regras, Monitoramento em Tempo Real e Relat├│rios de Performance\.

## __7\.1 Aba 1 ÔÇö Configura├º├úo de Distribui├º├úo__

__Componente de UI__

__Funcionalidade__

Tabela de corretores com pesos

Ajuste de peso por drag\-and\-drop ou campo num├®rico

Toggle de status por corretor

Ativar / Pausar / Marcar f├®rias com data

Multi\-select de tipos de im├│vel

Habilitar/desabilitar tipos por corretor

Seletor de lan├ºamentos

Vincular corretor a campanhas espec├¡ficas

Range slider de faixa de valor

Definir valor m├¡nimo e m├íximo por corretor

Mapa de bairros/regi├Áes

Selecionar ├íreas de atua├º├úo geogr├ífica

Configura├º├úo de SLAs

Ajustar tempos por evento e por corretor

IQC Override

Ajustar manualmente o ├¡ndice com campo de justificativa

Regras VIP / Exclusividade

Vincular clientes ou empresas a corretores fixos

## __7\.2 Aba 2 ÔÇö Monitoramento em Tempo Real__

Painel ao vivo com atualiza├º├úo a cada 60 segundos \(ou via WebSocket\)\. Deve exibir:

- Mapa de calor dos leads abertos por corretor \(cards visuais\)\.
- Sem├íforo de SLA: verde \(dentro\), amarelo \(aten├º├úo\), vermelho \(violado\) por lead\.
- Contador de leads na fila de espera \(sem corretor dispon├¡vel\)\.
- Alertas em tempo real: viola├º├Áes de SLA, leads sem resposta, corretor ausente com leads ativos\.
- Feed de atividade recente: ├║ltimas 20 a├º├Áes do sistema\.

## __7\.3 Aba 3 ÔÇö Relat├│rios e Performance Individual__

Todos os relat├│rios devem ser filtr├íveis por per├¡odo \(hoje, semana, m├¬s, intervalo personalizado\)\. Cada relat├│rio deve ter op├º├úo de exporta├º├úo em CSV e PDF\.

__M├®tricas por Corretor \(vis├úo individual\)__

__M├®trica__

__Descri├º├úo__

Total de leads recebidos

Contagem de leads atribu├¡dos no per├¡odo

Taxa de convers├úo \(%\)

\(Contratos assinados / Leads recebidos\) ├ù 100

Ticket m├®dio \(R$\)

M├®dia do valor dos im├│veis fechados

Faturamento gerado \(R$\)

Soma de comiss├Áes ou valor total dos neg├│cios

Tempo m├®dio de primeiro contato

M├®dia do tempo entre atribui├º├úo e 1┬¬ mensagem

Taxa de resposta \(%\)

Leads que receberam resposta / total

Leads perdidos e motivos

Lista com categoriza├º├úo por motivo de perda

NPS m├®dio recebido

Avalia├º├úo dos clientes atendidos

IQC atual vs hist├│rico

Evolu├º├úo do ├¡ndice ao longo do tempo

__M├®tricas Gerais da Imobili├íria__

- Total de leads no per├¡odo vs per├¡odo anterior \(varia├º├úo %\)\.
- Funil de convers├úo: Leads ÔåÆ Qualificados ÔåÆ Visitas ÔåÆ Propostas ÔåÆ Contratos\.
- Tempo m├®dio de ciclo de vendas \(lead at├® contrato\)\.
- Distribui├º├úo de leads por origem \(WhatsApp, site, portais, indica├º├úo\)\.
- Ranking de corretores por taxa de convers├úo e faturamento\.
- Leads perdidos por corretor \(detalhado por motivo\)\.

# __8\. Modelo de Dados ÔÇö Supabase__

## __8\.1 Novas Tabelas a Criar__

__Tabela: corretores\_config__

CREATE TABLE corretores\_config \(

  id            UUID PRIMARY KEY DEFAULT gen\_random\_uuid\(\),

  corretor\_id   UUID REFERENCES auth\.users\(id\) NOT NULL,

  peso\_roleta   INT DEFAULT 1 CHECK \(peso\_roleta >= 1\),

  status        TEXT DEFAULT 'ativo' CHECK \(status IN \('ativo','ausente','pausado','ferias'\)\),

  ferias\_inicio DATE,

  ferias\_fim    DATE,

  iqc           NUMERIC\(5,2\) DEFAULT 50\.0,

  iqc\_override  BOOLEAN DEFAULT FALSE,

  iqc\_motivo    TEXT,

  tipos\_imovel  TEXT\[\],       \-\- ex: \['residencial','lancamento'\]

  modalidades   TEXT\[\],       \-\- ex: \['venda','locacao'\]

  valor\_min     NUMERIC\(12,2\),

  valor\_max     NUMERIC\(12,2\),

  bairros       TEXT\[\],

  lancamentos   UUID\[\],       \-\- IDs dos lan├ºamentos habilitados

  limite\_leads\_dia INT,

  sla\_config    JSONB,        \-\- overrides de SLA por corretor

  created\_at    TIMESTAMPTZ DEFAULT NOW\(\),

  updated\_at    TIMESTAMPTZ DEFAULT NOW\(\)

\);

__Tabela: roulette\_state__

CREATE TABLE roulette\_state \(

  id            UUID PRIMARY KEY DEFAULT gen\_random\_uuid\(\),

  corretor\_id   UUID REFERENCES corretores\_config\(corretor\_id\),

  creditos      INT DEFAULT 0,    \-\- cr├®ditos restantes no ciclo atual

  total\_recebidos INT DEFAULT 0,  \-\- contador hist├│rico

  ultimo\_lead\_at  TIMESTAMPTZ,

  updated\_at    TIMESTAMPTZ DEFAULT NOW\(\)

\);

__Tabela: lead\_distribution\_log__

CREATE TABLE lead\_distribution\_log \(

  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid\(\),

  lead\_id         UUID NOT NULL,

  corretor\_id     UUID REFERENCES corretores\_config\(corretor\_id\),

  temperatura     TEXT,

  score\_dificuldade INT,

  motivo\_escolha  TEXT,       \-\- JSON com raz├úo da decis├úo

  corretores\_eleg├¡veis UUID\[\], \-\- quem foi avaliado

  status          TEXT DEFAULT 'pendente',

  atribuido\_at    TIMESTAMPTZ DEFAULT NOW\(\)

\);

__Tabela: lead\_sla\_events__

CREATE TABLE lead\_sla\_events \(

  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid\(\),

  lead\_id         UUID NOT NULL,

  corretor\_id     UUID,

  evento          TEXT NOT NULL,   \-\- 'primeiro\_contato', 'visita\_agendada', etc\.

  sla\_limite\_min  INT,             \-\- em minutos

  realizado\_em    TIMESTAMPTZ,

  sla\_status      TEXT,            \-\- 'ok', 'atencao', 'violado'

  created\_at      TIMESTAMPTZ DEFAULT NOW\(\)

\);

# __9\. Endpoints da API REST__

## __9\.1 Distribui├º├úo de Leads__

__Endpoint__

__M├®todo__

__Descri├º├úo__

POST /api/leads/distribute

POST

Distribui um lead rec├®m\-qualificado ao corretor eleg├¡vel

GET /api/leads/:id/briefing

GET

Retorna resumo comportamental do lead gerado por LLM

POST /api/leads/:id/reassign

POST

Re\-atribui lead a outro corretor \(manual pelo gestor\)

GET /api/leads/queue

GET

Lista leads na fila de espera sem corretor atribu├¡do

## __9\.2 Configura├º├úo de Corretores__

__Endpoint__

__M├®todo__

__Descri├º├úo__

GET /api/manager/corretores

GET

Lista corretores com configura├º├Áes completas

PUT /api/manager/corretores/:id

PUT

Atualiza configura├º├úo de um corretor \(peso, status, etc\.\)

POST /api/manager/corretores/:id/iqc\-override

POST

Aplica IQC manual com justificativa

GET /api/manager/roulette/state

GET

Retorna estado atual da roleta

POST /api/manager/roulette/reset

POST

Reinicia ciclo da roleta manualmente

## __9\.3 Dashboard e M├®tricas__

__Endpoint__

__M├®todo__

__Descri├º├úo__

GET /api/manager/dashboard/overview

GET

KPIs gerais da imobili├íria

GET /api/manager/dashboard/corretores

GET

M├®tricas individuais de todos os corretores

GET /api/manager/dashboard/corretores/:id

GET

M├®tricas detalhadas de um corretor espec├¡fico

GET /api/manager/dashboard/funnel

GET

Dados do funil de convers├úo

GET /api/manager/sla/alerts

GET

Alertas de SLA ativos em tempo real

GET /api/manager/reports/export

GET

Exporta├º├úo de relat├│rio em CSV ou PDF

## __9\.4 Endpoint de Lead Briefing \(LLM\)__

O endpoint GET /api/leads/:id/briefing deve chamar o modelo LLM com o hist├│rico completo da conversa do lead e retornar um briefing estruturado para o corretor:

// Estrutura de resposta do briefing

\{

  resumo: string,              // 3\-4 linhas sobre o cliente

  perfil\_financeiro: string,   // capacidade estimada

  preferencias: string\[\],      // o que o cliente buscou

  objecoes\_mapeadas: string\[\], // resist├¬ncias identificadas pela IA

  melhor\_abordagem: string,    // sugest├úo de como o corretor deve iniciar

  pontos\_atencao: string\[\],    // alertas sobre o cliente

  score\_dificuldade: number,   // 0\-100

  temperatura: string,         // quente|morno|frio

  urgencia: string             // imediata|30dias|90dias|sem\_pressa

\}

# __10\. Integra├º├úo com Agentes de IA Existentes__

## __10\.1 Ponto de Integra├º├úo do QualificationAgent__

No arquivo qualification\_agent\.ts, ao finalizar a an├ílise do lead, deve ser adicionada a chamada ao LeadRouterService:

// qualification\_agent\.ts ÔÇö adicionar ao final de qualifyLead\(\)

const leadData = \{

  id: lead\.id,

  temperatura: result\.temperatura,

  score\_dificuldade: result\.score,

  tipo\_imovel: result\.tipo\_imovel\_interesse,

  faixa\_valor: result\.faixa\_valor\_estimada,

  urgencia: result\.urgencia,

  bairro\_interesse: result\.bairro

\};

await LeadRouterService\.distribuir\(leadData\);  // ÔåÉ novo hook

## __10\.2 Integra├º├úo com SdrAgent \(Lan├ºamentos\)__

O SdrAgent \(sdr\_agent\.ts\) deve verificar, antes de notificar um corretor, se aquele corretor est├í habilitado para o lan├ºamento espec├¡fico via LeadRouterService\.filtrarCorretoresPorLancamento\(lancamentoId\)\.

## __10\.3 Integra├º├úo com SchedulingAgent__

Quando o SchedulingAgent confirmar um agendamento, deve disparar o evento 'visita\_agendada' para o m├│dulo de SLA: SlaService\.registrarEvento\(leadId, 'visita\_agendada', corretorId\)\.

# __11\. Seguran├ºa e Controle de Acessos__

__Recurso__

__Quem Acessa__

__Controle__

Dashboard completo

Apenas gestor \(role=manager\)

JWT \+ RLS Supabase

M├®tricas individuais do corretor

Corretor v├¬ apenas as suas

JWT \+ filtro por user\_id

Configura├º├úo de regras

Apenas gestor

Middleware de role no Express

Lead Briefing

Corretor atribu├¡do ao lead

Verifica├º├úo de ownership

IQC Override

Apenas gestor

Auditoria com log imut├ível

Exporta├º├úo de relat├│rios

Apenas gestor

Rate limit: 10 req/hora

Redistribui├º├úo manual de lead

Apenas gestor

Log de quem redistribuiu e motivo

__­ƒöÉ  Pol├¡ticas de Row\-Level Security \(RLS\) no Supabase__

Tabela corretores\_config: SELECT, UPDATE apenas pelo pr├│prio corretor OU manager\.

Tabela lead\_distribution\_log: SELECT apenas pelo manager\.

Tabela lead\_sla\_events: SELECT pelo corretor atribu├¡do OU manager\.

Tabela roulette\_state: SELECT/UPDATE apenas pelo LeadRouterService \(service\_role\)\.

# __12\. KPIs e M├®tricas de Performance__

Lista completa de KPIs que devem ser calculados e exibidos no dashboard\. Todos devem ser computados via queries SQL otimizadas \(views materializadas no Supabase quando necess├írio para performance\)\.

## __12\.1 KPIs Individuais do Corretor__

__KPI__

__F├│rmula__

__Frequ├¬ncia de Update__

Taxa de Convers├úo \(%\)

Fechamentos / Leads ├ù 100

Tempo real

Ticket M├®dio \(R$\)

Soma valores / Qtd fechamentos

Tempo real

Faturamento Gerado \(R$\)

Soma de comiss├Áes no per├¡odo

Di├íria

Tempo M├®dio 1┬║ Contato \(min\)

AVG\(primeiro\_contato \- atribui├º├úo\)

Tempo real

Taxa de Resposta \(%\)

Leads respondidos / total ├ù 100

Tempo real

NPS M├®dio

AVG\(notas NPS no per├¡odo\)

Di├íria

Leads Perdidos \(%\)

Perdidos / total ├ù 100

Tempo real

IQC Atual

C├ílculo composto \(ver se├º├úo 3\.1\)

Semanal \+ em cada evento

## __12\.2 KPIs Gerais da Imobili├íria__

- Volume total de leads por per├¡odo e canal de origem\.
- Taxa de qualifica├º├úo \(leads qualificados / leads brutos\)\.
- Funil completo com percentuais de convers├úo entre etapas\.
- Tempo m├®dio de ciclo de venda \(lead at├® contrato\)\.
- Ranking de corretores por convers├úo, faturamento e NPS\.
- Distribui├º├úo de leads por tipo de im├│vel, bairro e faixa de valor\.
- Efici├¬ncia das regras de roteamento \(% de leads VIP convertidos vs\. roleta normal\)\.

# __13\. Backlog e Checklist de Entrega__

Lista priorizada de todas as entregas deste m├│dulo\. O desenvolvedor deve marcar cada item conforme conclus├úo\.

## __Prioridade Alta ÔÇö Entrega Sprint 1__

__\#__

__Entrega__

__Crit├®rio de Aceite__

1

Tabelas Supabase \(corretores\_config, roulette\_state, lead\_distribution\_log, lead\_sla\_events\)

Migrations aplicadas, RLS configurado

2

LeadRouterService ÔÇö motor de roleta ponderada

Testes unit├írios passando com 100% dos casos

3

Integra├º├úo com QualificationAgent

Leads qualificados s├úo atribu├¡dos automaticamente

4

API: POST /api/leads/distribute

Funcional com logs de decis├úo

5

API: GET /api/leads/:id/briefing

Retorna JSON estruturado via LLM

6

Tela de configura├º├úo de corretores no painel do gestor

Todos os campos da spec funcionais

## __Prioridade Alta ÔÇö Entrega Sprint 2__

__\#__

__Entrega__

__Crit├®rio de Aceite__

7

Motor de SLA ÔÇö c├ílculo e alertas autom├íticos

Alertas disparados dentro do tempo configurado

8

IQC ÔÇö c├ílculo autom├ítico semanal

IQC recalculado toda segunda\-feira 00h

9

Dashboard ÔÇö Aba de Monitoramento em Tempo Real

Atualiza a cada 60s, sem├íforo de SLA vis├¡vel

10

Dashboard ÔÇö M├®tricas individuais por corretor

Dados corretos vs\. queries SQL diretas

11

Regras de re\-atribui├º├úo autom├ítica por SLA

Lead re\-atribu├¡do ap├│s X minutos sem resposta

## __Prioridade M├®dia ÔÇö Entrega Sprint 3__

__\#__

__Entrega__

__Crit├®rio de Aceite__

12

Exporta├º├úo de relat├│rios \(CSV \+ PDF\)

Arquivo gerado e dispon├¡vel para download

13

Funil de convers├úo visual no dashboard

Gr├ífico de funil com percentuais corretos

14

Ranking de corretores

Orden├ível por taxa de convers├úo, faturamento e NPS

15

Regra de reconex├úo \(cliente j├í atendido\)

Lead com hist├│rico vai para mesmo corretor

16

Notifica├º├Áes push para gestor \(viola├º├Áes SLA\)

WhatsApp \+ e\-mail configur├íveis

17

Testes automatizados do LeadRouterService

Cobertura m├¡nima de 80%

__­ƒÜÇ  Pr├│ximos Passos Recomendados__

1\. Alinhar este documento com o time de desenvolvimento\.

2\. Revisar e ajustar os thresholds de temperatura e IQC conforme realidade da imobili├íria\.

3\. Definir valores iniciais de peso da roleta para cada corretor\.

4\. Configurar ambiente de staging para testes antes de produ├º├úo\.

5\. Criar base de RAG com FAQs, obje├º├Áes e contexto regional \(Pinecone\)\.

6\. Planejar treinamento dos corretores no uso do painel e do lead briefing\.

*Documento gerado como especifica├º├úo t├®cnica oficial para entrega ao desenvolvedor\.*

