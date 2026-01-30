# Client Documentation Template – CRANIQS IMOB

> Template de documentação a enviar para CADA cliente com credenciais, guias e suporte.

---

## 📋 CONTEÚDO (Use Este Template)

Você vai customizar este arquivo por cliente e enviar via PDF/Notion.

---

## 🎉 Bem-vindo ao CRANIQS IMOB!

```
Cliente: [NOME_IMOBILIARIA]
Período: [DATA_CONTRATO] a [DATA_VENCIMENTO]
Status: ✅ ATIVO
Suporte: suporte@seu-dominio.com
Emergência: +55 (seu-whatsapp)
```

---

## 🔐 SUAS CREDENCIAIS (GUARDE COM CUIDADO!)

### Acesso Admin

```
URL: https://[seu-dominio].com/[cliente-id]
Email: [admin-email]
Senha: [SENHA_GERADA_ALEATORIA]

⚠️ MUDE ESTA SENHA NA PRIMEIRA EXECUÇÃO!
```

### Supabase (Seu Banco de Dados)

```
URL: https://[seu-project-id].supabase.co
API Key: [ANON_KEY_PÚBLICO]
Service Role: [SERVICE_ROLE_KEY] ⚠️ SEGREDO!

📌 Você precisa disso para:
   └─ Integração com ferramentas externas
   └─ Backup manual
   └─ Analytics avançado
```

### Airtable (Interface Visual)

```
Base ID: [BASE_ID]
API Key: [AIRTABLE_PAT_TOKEN]
Table: "Imóveis" (ID: tblXXXXXXXX)
Table: "Corretores" (ID: tblYYYYYYYY)

📌 Use para:
   └─ Adicionar/editar imóveis
   └─ Gerenciar corretores
   └─ Ver histórico de vendas
```

### Email (Resend)

```
Domain: [seu-dominio-custom]
API Key: [RESEND_API_KEY]
From Email: contato@[seu-dominio]

📌 Automático! Você não precisa fazer nada.
   └─ Leads recebem email automaticamente
   └─ Confirmações de agendamento
```

### Asaas (Pagamentos)

```
Merchant ID: [MERCHANT_ID]
API Key: [ASAAS_API_KEY]
Dashboard: https://sandbox.asaas.com (teste)
           https://app.asaas.com (produção)

📌 Integrado automaticamente
   └─ Seus clientes pagam via Pix
   └─ Você recebe na conta
   └─ Relatório automático
```

### Cal.com (Agendamentos)

```
Calendar URL: https://cal.com/[seu-username]/agendamento
API Key: [CAL_COM_API_KEY]
Timezone: America/Sao_Paulo

📌 Embed no seu website ou compartilhe link
   └─ Clientes agendam visitas automaticamente
   └─ Sincroniza com calendário
```

### Telegram Bot (Notificações)

```
Bot Username: @[seu_bot_username]
Chat ID: [CLIENT_CHAT_ID]
Token: [BOT_TOKEN]

📌 Você recebe notificações:
   └─ Novo lead chegou
   └─ Visitante viu imóvel
   └─ Agendamento confirmado
```

---

## 🚀 PRIMEIROS PASSOS

### PASSO 1: Acessar Dashboard (5 min)

```
1. Vá para: https://[seu-dominio].com/[cliente-id]
2. Faça login com email + senha
3. Mude sua senha (Settings → Security)
4. Configure seu perfil (Settings → Profile)
5. Pronto! Você está dentro.
```

### PASSO 2: Adicionar Primeiro Imóvel (10 min)

```
OPÇÃO A: Via Dashboard
├─ Clique em "Novo Imóvel"
├─ Preencha dados básicos
├─ Faça upload de fotos
├─ Clique "Publicar"
└─ Sistema publica automaticamente em ZAP, Viva Real, OLX

OPÇÃO B: Via Airtable (Interface Linda)
├─ Vá para Airtable (link acima)
├─ Clique no botão de + (novo record)
├─ Preencha formulário
├─ Faça upload de fotos
├─ Sistema processa automaticamente
```

### PASSO 3: Receber Leads (Automático)

```
Leads chegam por:
├─ ZAP.com (via webhook)
├─ Viva Real (via webhook)
├─ OLX (via webhook)
├─ Seu site (formulário próprio)
└─ Telegram (você pode conversar diretamente)

Você recebe:
├─ Notificação no Telegram
├─ Email de confirmação
├─ Aparece no dashboard
└─ Pode seguir up por telefone/WhatsApp
```

---

## 📱 USANDO O SISTEMA DIA-A-DIA

### Acessar Dashboard

```
URL: https://[seu-dominio].com/[cliente-id]
Usuário: [seu-email]
Senha: [sua-senha]

Principais abas:
├─ Dashboard (visão geral, KPIs)
├─ Imóveis (gerenciar propriedades)
├─ Leads (clientes interessados)
├─ Chat (conversa com leads)
├─ Agendamentos (visitas marcadas)
├─ Analytics (relatórios)
└─ Configurações (preferências)
```

### Airtable (Adicionar Imóvel Rápido)

```
Link: [AIRTABLE_BASE_URL]

Campos obrigatórios:
├─ Endereço
├─ Tipo (Apartamento/Casa/Terreno)
├─ Quartos
├─ Banheiros
├─ Preço
└─ Fotos (mínimo 3)

Sistema faz automaticamente:
├─ Cria descrição IA
├─ Faz upload de fotos
├─ Publica em portais
├─ Notifica você
└─ Aguarda leads
```

### Telegram (Notificações)

```
Bot: @[seu_bot_username]

Você recebe:
✅ "Novo lead de João Silva"
✅ "Agendamento confirmado para 14/2"
✅ "João viu seu imóvel 3x hoje"

Você pode responder:
├─ Mensagens de texto
├─ Fotos adicionais
├─ Links (agendamento, WhatsApp)
└─ Informações
```

---

## 📊 ENTENDENDO SEUS DADOS

### Dashboard (Metrics Importantes)

```
VISÃO GERAL:
├─ Imóveis ativos: Quantos estão publicados
├─ Leads este mês: Quantos clientes interessados
├─ Conversão: % de leads → agendamento
├─ Revenue: Quanto você ganhou
└─ Next actions: O que fazer agora

GRÁFICOS:
├─ Tendência de leads (semana/mês/ano)
├─ Imóveis por tipo
├─ Performance por portal
├─ Classificação de corretores
└─ NPS (satisfação dos clientes)
```

### Airtable View (Imóveis)

```
Gallery View:
├─ Vê todos os imóveis com fotos
├─ Clica para detalhar
├─ Arrasta para mudar status
└─ Filtro por tipo/preço/status

Table View:
├─ Spreadsheet com todos os dados
├─ Edita campos em massa
├─ Sorteia por qualquer coluna
└─ Busca rápida

Calendar View:
├─ Vê por data de publicação
├─ Timeline de atualizações
└─ Eventos importantes
```

---

## 🔄 FLUXO AUTOMÁTICO (Como Funciona)

### Novo Imóvel Publicado

```
VOCÊ FAZ:                  SISTEMA FAZ AUTOMÁTICO:
Adiciona em Airtable  →    AI lê informações
Faz upload de fotos   →    Gera descrição profissional
Clica "Publicar"      →    Upload de fotos (cloud)
                      →    Publica em ZAP.com
                      →    Publica em Viva Real
                      →    Publica em OLX
                      →    Notifica você (Telegram)
                      →    Coloca no dashboard
                      →    Status: ✅ Ativo

RESULTADO: Imóvel visível em 10+ portais em 5 minutos!
```

### Lead Chega (De Um Portal)

```
LEAD AÇÃO:            SISTEMA FAZ:           VOCÊ RECEBE:
Clica em seu imóvel   →  Rastreia visita   →  Notif Telegram
Preenche formulário   →  Valida dados      →  Email com dados
Deixa contato         →  Cria registro     →  Chat com lead
                      →  Envia confirmação →  Segue up automático

VOCÊ DECIDE:
├─ Responder via chat (no dashboard)
├─ Chamar por telefone
├─ Enviar WhatsApp
└─ Agendar visita (Cal.com)
```

### Lead Agenda Visita

```
LEAD AÇÃO:              SISTEMA FAZ:          VOCÊ RECEBE:
Clica "Agendar"     →   Mostra datas livres →  Notif Telegram
Escolhe horário     →   Confirma automático →  Email confirmação
Recebe confirmação  →   Envia lembrança 24h →  Alerta no calendar

VOCÊ PODE:
├─ Ver calendário completo
├─ Gerenciar múltiplas visitas
├─ Adicionar notas
└─ Exportar para seu calendário
```

### Imóvel Vendido/Alugado

```
VOCÊ FAZ:                   SISTEMA FAZ:
Marca em Airtable      →    Status muda para "Vendido"
"Status: Vendido"      →    Remove de portais
Data + preço de venda  →    Arquivo de histórico
                       →    Libera espaço para novo imóvel
                       →    Notifica você (Telegram)

RESULTADO: Imovel desaparece automaticamente de buscas
```

---

## 🆘 TROUBLESHOOTING (Problemas Comuns)

### "Imóvel não está sendo publicado"

```
Causa possível: Dados incompletos

Solução:
1. Vá para Airtable → Seu imóvel
2. Verifique campos obrigatórios:
   ├─ Endereço completo?
   ├─ Preço preenchido?
   ├─ Mínimo 3 fotos?
   └─ Status correto? ("Aguardando publicação")
3. Aguarde 5 minutos
4. Ainda não? Notifique: suporte@seu-dominio.com
```

### "Lead não recebeu meu email"

```
Causa possível: Email para spam

Solução:
1. Peça para client verificar SPAM
2. Se problema persistir:
   └─ Vá ao dashboard → Leads
   └─ Clique no lead → "Reenviar email"
3. Ainda com problema? Suporte: suporte@seu-dominio.com
```

### "Agendamento não apareceu no calendário"

```
Causa possível: Sincronização lenta

Solução:
1. Aguarde 2-3 minutos
2. Atualize página (F5)
3. Se não aparecer:
   └─ Vá em Telegram (vai receber notif)
   └─ Vá em Airtable → Agendamentos
4. Suporte se problema persistir
```

### "Preciso de relatório de vendas"

```
Solução:
1. Dashboard → Analytics
2. Selecione período (mês/trimestre/ano)
3. Clique "Exportar PDF"
4. Arquivo baixa em segundos
5. Compartilhe com seu contador
```

---

## 📞 SUPORTE

### Tipo de Suporte

```
DÚVIDA TÉCNICA:
└─ Email: suporte@seu-dominio.com
└─ Resposta: 24h

EMERGÊNCIA (Sistema offline):
└─ Telegram: @seu_bot
└─ Resposta: Imediato

FEATURE REQUEST (Quero novo recurso):
└─ Email: features@seu-dominio.com
└─ Análise: 48h
└─ Implementação: Próxima versão

BILLING (Dúvida sobre fatura):
└─ Email: financeiro@seu-dominio.com
└─ Resposta: 24h
```

### Documentação Online

```
FAQ: https://seu-dominio.com/docs/faq
Video Tutorials: https://youtube.com/seu-canal
Knowledge Base: https://seu-dominio.com/kb
Roadmap: https://seu-dominio.com/roadmap
```

---

## 🔐 SEGURANÇA

### Boas Práticas

```
✅ Mude sua senha na primeira execução
✅ Não compartilhe seu API key
✅ Logout quando terminar
✅ Ative 2FA (Settings → Security)
✅ Revise logs regularmente
✅ Backup mensal de dados (você pode exportar)
```

### Seus Dados Estão Seguros

```
✅ Banco de dados PostgreSQL (Supabase)
✅ Criptografia SSL/TLS (HTTPS)
✅ Backup automático diário
✅ Conformidade LGPD (Brasil)
✅ Sem compartilhamento com terceiros
✅ Você é dono dos seus dados
```

---

## 📈 CRESCIMENTO COM SISTEMA

### Dicas para Mais Leads

```
1. AIRTABLE SEMPRE ATUALIZADO
   └─ Adicione imóvel toda semana
   └─ Mantenha descrição atualizada
   └─ Fotos de qualidade

2. RESPONDA RÁPIDO
   └─ Chat no dashboard em <1h
   └─ WhatsApp confirmação
   └─ Agendamento facilitado

3. USE ANALYTICS
   └─ Veja quais imóveis geram mais lead
   └─ Potencialize os melhores
   └─ Melhore os ruins

4. FEEDBACK DE LEADS
   └─ Pergunte por que não comprou
   └─ Aprenda com recusas
   └─ Melhore próximas ofertas
```

---

## 🚀 EVOLUÇÃO DO SISTEMA

### Próximas Features (Roadmap)

```
MÊS 1-3:
├─ Live chat com leads
├─ WhatsApp integrado
└─ Self-vistoria com IA

MÊS 4-6:
├─ Video tour (IA gera)
├─ CRM de corretores
└─ Análise de preço por IA

MÊS 7-12:
├─ Marketplace de crédito
├─ Integração com financeiras
└─ IA negotiation assistant
```

---

## ✅ Próximos Passos Seu

1. **Hoje:** Mude sua senha
2. **Hoje:** Configure seu perfil
3. **Amanhã:** Adicione primeiro imóvel
4. **Semana:** Aguarde leads chegarem
5. **Contínuo:** Responda leads rapidamente

---

## 📧 Contato

```
Suporte: suporte@seu-dominio.com
Emergência: +55 (seu whatsapp)
Website: https://seu-dominio.com
Dashboard: https://seu-dominio.com/[cliente-id]
```

---

**Bem-vindo ao CRANIQS IMOB! Vamos ganhar muito dinheiro junto! 🚀**

