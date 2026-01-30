# Dashboard Inteligente de Operações & Analytics

> Objetivo: descrever um **dashboard unificado** que mostra performance de IA, corretores, apresentadores, conversões e satisfação de clientes em tempo real.

---

## 1. Visão Geral do Dashboard

O dashboard é a **nervura operacional** da imobiliária. Mostra:
- **Performance de IA** (satisfação, conversão, taxa de escalação)
- **Ranking de Corretores** (vendas, velocidade, conversão)
- **Eficiência do Apresentador** (rotas, tempo médio, feedback)
- **Funil de Conversão** (lead → agendamento → venda)
- **Análise de Leads** (origem, tipos, drop-off points)
- **Pesquisa de Satisfação** (NPS, CSAT, feedback qualitativo)

```
┌─────────────────────────────────────────────────────────┐
│          Dashboard Principal - Visão Executiva          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 KPIs TOP (Cards)                                    │
│  ├─ Leads Hoje: 24 ⬆️ 12%                             │
│  ├─ Conversão (Lead→Agendamento): 38% ⬆️ 5%          │
│  ├─ Conversão (Agendamento→Venda): 32% ⬆️ 2%         │
│  ├─ NPS: 72 (Muito Bom)                                │
│  └─ Receita Mês: R$ 2.3M                               │
│                                                         │
│  📈 Funil de Conversão (Visual)                         │
│  │                                                      │
│  │  Leads ──→ Agendamento ──→ Vistoria ──→ Fechamento │
│  │   200      76 (38%)      68 (89%)    22 (32%)       │
│  │                                                      │
│  └─ Drop-off Analysis: Maior queda entre "Agendamento" │
│     e "Vistoria Realizada" → Investigar motivo        │
│                                                         │
│  🤖 Performance de IA (Segmentado por Agente)          │
│  ├─ Agent.Investigativo                                │
│  │  └─ Conversação média: 12 mensagens                 │
│  │  └─ Escalação: 5%                                   │
│  │  └─ Satisfação: 4.2/5 (85 reviews)                 │
│  │                                                     │
│  ├─ Agent.Recomendacao                                 │
│  │  └─ Imóveis médios oferecidos: 3.5                 │
│  │  └─ Taxa de clique: 72% (lead abre propriedade)   │
│  │  └─ Satisfação: 4.5/5 (120 reviews)               │
│  │                                                     │
│  └─ Agent.Agendamento                                  │
│     └─ Taxa de sucesso: 91% (cliente confirma)        │
│     └─ Tempo médio: 3.2 min                           │
│     └─ Satisfação: 4.8/5 (240 reviews)               │
│                                                         │
│  🏆 Ranking de Corretores (Top 10)                     │
│  ├─ 1. João Silva: 18 vendas (R$ 4.2M) ⭐ 4.7/5       │
│  ├─ 2. Júnior Pires: 15 vendas (R$ 3.8M) ⭐ 4.6/5    │
│  ├─ 3. Mario Costa: 12 vendas (R$ 2.9M) ⭐ 4.4/5     │
│  └─ [mais...]                                          │
│                                                         │
│  🚚 Performance de Apresentadores                       │
│  ├─ Felipe Silva: 23 visitas/semana, 4.8/5 feedback   │
│  ├─ Ana Costa: 21 visitas/semana, 4.7/5 feedback      │
│  └─ [mais...]                                          │
│                                                         │
│  🔴 Alertas & Anomalias                                │
│  ├─ ⚠️  Agent.Lançamentos: 2 escalações agressivas     │
│  ├─ ⚠️  Corretor "Silva": 3 clientes pediram mudança  │
│  └─ ⚠️  Apresentador "Felipe": 2 atrasos (+15 min)    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Seções Detalhadas do Dashboard

### 2.1. IA Performance Analytics

**Tabs:**
- Resumo (todas os agentes)
- Investigativo
- Recomendação
- Agendamento
- Suporte (Jurídico, Financeiro, Técnico)

**Métricas por Agente:**

```json
{
  "agent_type": "investigativo",
  "period": "2026-01-01 a 2026-01-27",
  
  "engagement": {
    "total_conversations": 342,
    "avg_messages_per_conversation": 11.3,
    "avg_duration_minutes": 15.2,
    "response_time_seconds": 4.1
  },
  
  "satisfaction": {
    "nps_score": 58,  // Net Promoter Score
    "csat": 4.2,  // Customer Satisfaction (1-5)
    "review_count": 85,
    "sentiment_positive": 78,
    "sentiment_neutral": 15,
    "sentiment_negative": 7
  },
  
  "escalation": {
    "escalations_total": 17,
    "escalation_rate": 5.0,  // %
    "top_escalation_reasons": [
      "Cliente quer humano",
      "Dúvida jurídica (3x)",
      "Financeiro (2x)"
    ]
  },
  
  "conversion": {
    "conversations_to_appointment": 142,  // de 342
    "conversion_rate": 41.5,  // %
    "trend": "↑ +3.2% vs semana anterior"
  }
}
```

**Visualizações:**
- Gráfico de satisfação por semana
- Distribuição de durações de conversa
- Heatmap de horários (quando IA tem mais sucesso)
- Funil: conversa → agendamento → venda

### 2.2. Ranking de Corretores

**Tabela Interativa:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Ranking de Corretores - Período: Janeiro 2026                   │
├─────────────────────────────────────────────────────────────────┤
│ Pos │ Nome           │ Vendas │ Receita   │ Rating │ Conversão │
├─────────────────────────────────────────────────────────────────┤
│  1  │ João Silva     │   18   │ R$4.2M    │ 4.7/5  │   38%     │
│  2  │ Júnior Pires   │   15   │ R$3.8M    │ 4.6/5  │   35%     │
│  3  │ Mario Costa    │   12   │ R$2.9M    │ 4.4/5  │   32%     │
│  4  │ Ana Silva      │   11   │ R$2.6M    │ 4.8/5  │   29%     │
│  5  │ Carlos Dias    │    9   │ R$2.1M    │ 4.3/5  │   27%     │
└─────────────────────────────────────────────────────────────────┘

Clique em um corretor para ver:
  - Detalhes de vendas recentes
  - Feedback de clientes
  - Performance por tipo de imóvel
  - Histórico de rotas (Apresentador)
```

**Gráficos:**
- Evolução de vendas por semana
- Mix de tipos de imóvel vendido
- Rating trend (é confiável?)
- Tempo médio para fechar (do agendamento à venda)

### 2.3. Funil de Conversão (Real-time)

```
Período Atual: Esta Semana (27 Jan - 2 Fev)

📊 FUNIL VISUAL
═══════════════════════════════════════════════════════════════

🟦 LEADS CAPTADOS
│  200 leads
│  ├─ ZAP: 68 (34%)
│  ├─ Viva Real: 42 (21%)
│  ├─ Instagram: 38 (19%)
│  ├─ Site próprio: 28 (14%)
│  ├─ WhatsApp/Telegram: 18 (9%)
│  └─ Outros: 6 (3%)
│
├─► Análise: Leads via ZAP estão 15% acima do normal
│

🟦 LEADS QUALIFICADOS (Agendaram Visita)
│  76 leads (38% de conversão)
│  ├─ Locação: 45 (59%)
│  ├─ Vendas: 28 (37%)
│  └─ Leasing: 3 (4%)
│
├─► Análise: Taxa de 38% está 2% acima da meta
│

🟦 APRESENTAÇÕES REALIZADAS
│  68 visitas (89% dos agendados)
│  ├─ Completadas: 64 (94%)
│  ├─ No-show cliente: 3 (4%)
│  └─ Canceladas: 1 (1.5%)
│
├─► Análise: 3 no-shows - investigar se há padrão
│

🟦 SELF-VISTORIA PREENCHIDA
│  64 (100% de quem visitou)
│  ├─ Concordância 100%: 52 (81%)
│  ├─ Com discordâncias: 12 (19%)
│  └─ Fotos/Vídeos anexados: 31 (48%)
│
├─► Análise: Clientes estão documentando bem
│

🟦 PROPOSTAS ENVIADAS
│  58 (85% de quem visitou)
│  ├─ Aprovadas: 45 (78%)
│  ├─ Sob análise: 10 (17%)
│  └─ Rejeitadas: 3 (5%)
│
├─► Análise: Taxa de aprovação de proposta está alta
│

🟦 VENDAS FECHADAS
│  22 (38% de quem visitou | 29% de leads iniciais)
│  ├─ Receita semana: R$ 650k
│  └─ Valor médio: R$ 29.5k (aluguel) / R$ 450k (venda)
│
├─► Análise: Receita 18% acima da projeção
│

═══════════════════════════════════════════════════════════════

DROP-OFF ANALYSIS (Onde perdemos clientes?)
═══════════════════════════════════════════════════════════════

❌ Leads → Agendamento: 124 leads não agendaram (62%)
   Motivos (baseado em feedback):
   - "Não achei a opção certa" (45%)
   - "Preço acima do orçamento" (28%)
   - "Locação está em outro bairro" (15%)
   - "Sem resposta" (12%)

❌ Agendamento → Vistoria: 8 não compareceram (11%)
   Motivos:
   - Não conseguiu contato (+15min) (5 clientes)
   - Mudou de ideia (2)
   - Família desistiu (1)

❌ Vistoria → Proposta: 10 não pediram proposta (15%)
   Motivos (feedback Apresentador):
   - Cliente ficou indeciso
   - "Vou pensar, você me chama"
   - Imóvel pequeno demais
```

### 2.4. Pesquisa de Satisfação & NPS

**Real-time NPS Tracker:**

```
NPS Score: 72 (Janeiro) - EXCELENTE

Classificação:
  ✅ Promotores (9-10): 156 clientes (68%)
  ⚪ Neutros (7-8): 48 clientes (21%)
  ❌ Detratores (0-6): 21 clientes (11%)

Trending:
  - 27/Jan: 72 NPS
  - 20/Jan: 68 NPS  (+4 vs semana anterior)
  - 13/Jan: 65 NPS

Feedback Qualitativo:
  Promotores dizem:
    "IA foi super atencioso" (32 menções)
    "Apresentador profissional" (28 menções)
    "Processo rápido e fácil" (24 menções)
  
  Detratores dizem:
    "Demora entre agendamento e visita" (8 menções)
    "IA poderia oferecer mais opções" (7 menções)
    "Chato o no-show do corretor" (4 menções)

Actions Tomadas:
  ✅ Reduzir tempo entre agendamento e visita (em andamento)
  ✅ Aumentar quantidade de recomendações (testando)
  ✅ Treinar apresentadores sobre punctualidade
```

### 2.5. Análise de Origem de Leads

**Heatmap de Canais:**

```
┌─────────────────────────────────────────┐
│  Leads por Canal vs. Conversão Final    │
├─────────────────────────────────────────┤
│                                         │
│ ZAP        │ 200 leads → 32 vendas (16%) │
│ Viva Real  │ 150 leads → 28 vendas (19%) │ ⭐ Melhor ROI
│ Instagram  │  85 leads → 22 vendas (26%) │ ⭐ Melhor ROI
│ Site       │  60 leads → 10 vendas (17%) │
│ WhatsApp   │  30 leads → 8 vendas (27%)  │ ⭐ Melhor ROI
│ Telegram   │  15 leads → 2 vendas (13%)  │
│                                         │
└─────────────────────────────────────────┘

Insight:
  Instagram tem taxa de conversão 26% - está sendo subestimado!
  Sugestão: Aumentar investimento em anúncios Instagram
```

---

## 3. Dashboard Interno para Gestores

**Painel de Controle - Ajuste de Pesos de Corretores:**

```html
<div class="admin-dashboard">
  <h2>Gestão de Rotas & Corretores</h2>
  
  <section class="corretor-weight-adjuster">
    <h3>Definir Pesos para Categoria: Locação 3Q</h3>
    
    <table>
      <tr>
        <th>Corretor</th>
        <th>Peso Atual</th>
        <th>Conversão</th>
        <th>Rating</th>
        <th>Novo Peso</th>
        <th>Ação</th>
      </tr>
      <tr>
        <td>João Silva</td>
        <td>2</td>
        <td>38%</td>
        <td>4.7/5</td>
        <td><input type="number" value="3" min="1" max="5"/></td>
        <td><button onclick="updateWeight('joao', 3)">✓ Salvar</button></td>
      </tr>
      <tr>
        <td>Júnior Pires</td>
        <td>3</td>
        <td>35%</td>
        <td>4.6/5</td>
        <td><input type="number" value="3" min="1" max="5"/></td>
        <td><button onclick="updateWeight('junior', 3)">✓ Salvar</button></td>
      </tr>
    </table>
    
    <p>💡 Dica: Aumentar peso de João resultará em +1 agendamento/semana para ele</p>
  </section>
</div>
```

---

## 4. Alertas & Automação

O dashboard dispara **alertas automáticos** para gestão:

```javascript
// Exemplos de regras

if (nps_trend.last_7_days < nps_trend.last_14_days - 5) {
  sendAlert("NPS caiu > 5 pontos em 7 dias! Investigar.", 'warning');
}

if (corretor.no_show_rate > 0.15) {  // 15%
  sendAlert(`Corretor ${corretor.name} com 15%+ de no-shows`, 'critical');
}

if (agent.escalation_rate > 0.08) {  // 8%
  sendAlert(`IA ${agent.type} escalando > 8% das conversas`, 'warning');
}

if (drop_off.leads_to_appointment < 0.35) {  // < 35%
  sendAlert("Taxa de agendamento caiu! Revisar prompts da IA?", 'warning');
}
```

---

## 5. Relatórios Exportáveis

Gestores podem exportar:

- ✅ Relatório semanal de performance (PDF)
- ✅ Análise de NPS com feedback qualitativo (Excel)
- ✅ Ranking de corretores (PDF para reunião)
- ✅ Funil de conversão (Slide)
- ✅ Análise de origem de leads (Google Sheets compartilhado)

---

## 6. Dados Necessários (Banco de Dados)

```sql
-- Analytics - Snapshots diários
CREATE TABLE analytics_daily_snapshot (
  id UUID PRIMARY KEY,
  date DATE,
  
  -- KPIs
  leads_count INT,
  leads_qualified INT,
  appointments_scheduled INT,
  appointments_completed INT,
  self_vistoria_count INT,
  proposals_sent INT,
  sales_closed INT,
  revenue_amount DECIMAL,
  
  -- Satisfação
  nps_score INT,
  csat_average DECIMAL,
  
  created_at TIMESTAMP
);

-- Performance por Agente
CREATE TABLE agent_daily_performance (
  id UUID PRIMARY KEY,
  date DATE,
  agent_type VARCHAR(50),
  
  conversations INT,
  avg_duration_minutes DECIMAL,
  escalation_count INT,
  satisfaction_avg DECIMAL,
  
  created_at TIMESTAMP
);

-- Performance por Corretor
CREATE TABLE corretor_daily_performance (
  id UUID PRIMARY KEY,
  date DATE,
  corretor_id UUID,
  
  appointments_assigned INT,
  appointments_completed INT,
  sales_closed INT,
  revenue_amount DECIMAL,
  satisfaction_avg DECIMAL,
  no_show_count INT,
  
  created_at TIMESTAMP
);
```

---

Este dashboard é a **cabine de controle** do sistema, permitindo visibilidade total e ajustes rápidos conforme necessário.
