# Cal.com Integration + Roteamento Inteligente de Corretores

> Objetivo: explicar como integrar Cal.com (agendamentos) com sistema de roteamento inteligente de corretores, incluindo "roleta" com pesos definidos por gestão.

---

## 1. Visão Geral da Integração

```
┌──────────────────────────────────────┐
│   IA Agent: Agendamento de Visita    │
│   (já selecionou imóvel + cliente)   │
└────────────────┬─────────────────────┘
                 │
         ┌───────▼────────┐
         │ Corretor Router│ (IA que decide qual corretor)
         └───────┬────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
 ┌──▼──────────┐    ┌───────▼────────┐
 │Busca       │    │  Verifica Pesos│
 │Corretores  │    │  e Disponibilid│
 │Qualificados│    │  de Cal.com    │
 └──┬──────────┘    └────────┬───────┘
    │                        │
    └────────────┬───────────┘
                 │
         ┌───────▼──────────┐
         │  Seleciona       │
         │  Melhor Corretor │
         │  Baseado em:     │
         │  - Peso/Quota    │
         │  - Disponibilid  │
         │  - Especialidade │
         └───────┬──────────┘
                 │
         ┌───────▼──────────────┐
         │ Consulta Cal.com API │
         │ (busca horários)     │
         └───────┬──────────────┘
                 │
         ┌───────▼──────────────┐
         │ Oferece Horários ao  │
         │ Cliente na IA Chat   │
         │ (otimizados para rota)
         └───────┬──────────────┘
                 │
         ┌───────▼──────────────┐
         │  Cliente Escolhe +   │
         │  Confirma           │
         └───────┬──────────────┘
                 │
         ┌───────▼──────────────┐
         │ Cria Evento em       │
         │ Cal.com do Corretor  │
         │ + Envia Confirmação  │
         └──────────────────────┘
```

---

## 2. Modelo de "Roleta" de Corretores

### 2.1. Conceito

A gestão da imobiliária define **pesos** para cada corretor por **tipo de imóvel**.

Exemplo:
```json
{
  "property_type": "locacao_3q_classe_a",
  "routing_queue": [
    {
      "corretor_id": "cor_001_joao",
      "corretor_name": "João Silva",
      "weight": 2,  // Será chamado 2x antes do próximo
      "calls_remaining_this_week": 2,
      "specialization": ["locacao", "3q", "classe_a"]
    },
    {
      "corretor_id": "cor_002_junior",
      "corretor_name": "Júnior Pires",
      "weight": 3,  // Será chamado 3x antes do próximo
      "calls_remaining_this_week": 3,
      "specialization": ["locacao", "apartamento"]
    },
    {
      "corretor_id": "cor_003_mario",
      "corretor_name": "Mario Costa",
      "weight": 1,
      "calls_remaining_this_week": 1,
      "specialization": ["locacao"]
    }
  ]
}
```

**Interpretação:**
- A cada 6 agendamentos (2+3+1) nessa categoria:
  - João é escalado 2x
  - Júnior é escalado 3x
  - Mario é escalado 1x

### 2.2. Algoritmo de Seleção

```javascript
function selectCorretor(property_type, timestamp) {
  // 1. Busca a fila de roteamento para esse tipo de imóvel
  const queue = getRoutingQueue(property_type);
  
  // 2. Ordena por: calls_remaining (DESC) → weight (DESC) → random
  const sorted = queue.sort((a, b) => {
    if (a.calls_remaining !== b.calls_remaining) {
      return b.calls_remaining - a.calls_remaining;
    }
    if (a.weight !== b.weight) {
      return b.weight - a.weight;
    }
    return Math.random() - 0.5;
  });
  
  // 3. Tenta cada um na ordem até encontrar alguém disponível
  for (let corretor of sorted) {
    const availability = checkCalComAvailability(corretor.id);
    if (availability.hasSlots) {
      // 4. Decrementa o contador
      corretor.calls_remaining--;
      
      // 5. Se chegou a zero, reseta a semana
      if (corretor.calls_remaining === 0) {
        corretor.calls_remaining = corretor.weight;
      }
      
      return {
        corretor_id: corretor.id,
        corretor_name: corretor.name,
        available_slots: availability.slots
      };
    }
  }
  
  // 6. Se ninguém tem slot, retorna "agenda para próxima semana" ou usa fallback
  return { error: "Sem disponibilidade", suggested_date: nextWeek };
}
```

---

## 3. Cal.com Integration (Backend)

### 3.1. Setup Inicial

Cada corretor cria **sua conta pessoal** em Cal.com:

```
https://cal.com/joao-silva
https://cal.com/junior-pires
https://cal.com/mario-costa
```

Na imobiliária, mantemos mapeamento:
```json
{
  "corretor_id": "cor_001_joao",
  "cal_com_username": "joao-silva",
  "cal_com_api_key": "sk_live_...",  // Seguro em .env
  "working_hours": "09:00-18:00",
  "buffer_between_appointments": 30,  // minutos
  "current_specialization": ["locacao", "3q", "classe_a"]
}
```

### 3.2. Buscar Disponibilidade (API Call)

```javascript
// Arquivo: src/services/calcom.service.js

const axios = require('axios');

async function getCorretoraAvailableSlots(corretor_cal_username, date) {
  // 1. Query Cal.com API para buscar disponibilidade
  
  const url = `https://api.cal.com/v1/slots`;
  
  const response = await axios.get(url, {
    params: {
      username: corretor_cal_username,
      dateFrom: date,
      dateTo: addDays(date, 1),  // Próximos 7 dias, por exemplo
      apiKey: process.env.CALCOM_API_KEY_GLOBAL  // Chave geral da imobiliária
    }
  });
  
  // 2. Filtra por horários que fazem sentido (evita muito cedo/tarde)
  const slots = response.data.slots.filter(s => {
    const hour = parseInt(s.time.split(':')[0]);
    return hour >= 9 && hour <= 18;
  });
  
  return slots;  // Ex: ["09:00", "09:30", "10:00", ...]
}

module.exports = { getCorretoraAvailableSlots };
```

### 3.3. Criar Agendamento em Cal.com

```javascript
// Após cliente confirmar horário

async function createAppointmentInCalCom(corretor_id, client_info, appointment_details) {
  const corretor = await getCorretor(corretor_id);
  
  const payload = {
    username: corretor.cal_com_username,
    eventTypeId: "viewing",  // ID do tipo de evento em Cal.com
    name: client_info.name,
    email: client_info.email,
    location: appointment_details.property_address,
    notes: `Property: ${appointment_details.property_id}\nClient: ${client_info.name}`,
    start: appointment_details.datetime,
    guests: [client_info.email],  // Cliente recebe convite
    apiKey: corretor.cal_com_api_key  // API key do corretor
  };
  
  const response = await axios.post(
    'https://api.cal.com/v1/bookings',
    payload
  );
  
  return response.data;  // Retorna confirmation + calendar link
}
```

### 3.4. Enviar Confirmação ao Cliente (via Chat IA)

```javascript
// Após agendamento confirmado, IA envia mensagem ao cliente

async function sendAppointmentConfirmationToClient(conversation_id, appointment) {
  const message = `
✅ **Agendamento Confirmado!**

📍 **Imóvel:** ${appointment.property_address}
📅 **Data e Hora:** ${formatDate(appointment.datetime)}
👤 **Seu Apresentador:** ${appointment.corretor_name}
📱 **Contato:** ${appointment.corretor_phone}

O ${appointment.corretor_name} terá acesso ao imóvel e te mostrará cada espaço.
Estimamos uns 30-40 minutos.

Se precisar remarcar, clique no link no email que você vai receber em breve!

Uma pergunta: você tem interesse em receber notícias de outros imóveis similares? 
Posso enviar atualizações sempre que algo novo chegar na sua faixa de preferência.
  `;
  
  await saveMessage(conversation_id, {
    sender: "agent",
    content: message,
    action: "appointment_confirmed",
    appointment_id: appointment.id
  });
}
```

---

## 4. Otimização de Rotas (Apresentador)

Quando múltiplos imóveis estão sendo visitados no mesmo dia, otimizamos rotas:

```javascript
async function optimizePresenterRoute(appointments_list, presentador_id) {
  // appointments_list = [
  //   { property_id: 'prop_1', address: '...', time: '10:00' },
  //   { property_id: 'prop_2', address: '...', time: '10:45' },
  //   { property_id: 'prop_3', address: '...', time: '11:30' }
  // ]
  
  // 1. Calcula distâncias entre propriedades (via Google Maps API)
  const distances = await calculateDistances(appointments_list.map(a => a.address));
  
  // 2. Roda algoritmo TSP (Traveling Salesman) para minimizar tempo total
  const optimized = solveTSP(appointments_list, distances);
  
  // 3. Ajusta horários para manter buffer entre visitas
  const adjusted = addBuffersBetweenAppointments(optimized, 30);  // 30min buffer
  
  // 4. Atualiza Cal.com com novos horários (se necessário)
  for (let apt of adjusted) {
    await updateCalComAppointment(apt.id, {
      start: apt.new_time
    });
  }
  
  return adjusted;
}
```

---

## 5. Dashboard para Gestão de Corretores

Tela para gestores ajustarem pesos:

```html
<!-- Exemplo de UI -->
<div class="corretor-routing-manager">
  <h2>Roteamento de Corretores - Locação 3Q Classe A</h2>
  
  <table>
    <tr>
      <th>Corretor</th>
      <th>Peso Atual</th>
      <th>Chamadas Restantes (Semana)</th>
      <th>Taxa de Conversão</th>
      <th>Ações</th>
    </tr>
    <tr>
      <td>João Silva</td>
      <td><input type="number" value="2" /></td>
      <td>2/2</td>
      <td>45%</td>
      <td><button>Salvar</button></td>
    </tr>
    <tr>
      <td>Júnior Pires</td>
      <td><input type="number" value="3" /></td>
      <td>2/3</td>
      <td>62%</td>
      <td><button>Salvar</button></td>
    </tr>
  </table>
  
  <p>📊 Distribuição visual: João 2/6 (33%), Júnior 3/6 (50%), Mario 1/6 (17%)</p>
</div>
```

---

## 6. Fluxo Completo de Exemplo

```
1. Cliente vem pelo Instagram (propriedade específica)
   └─ Agent.Agendamento detecta que quer visitar

2. Agent chama: selectCorretor("locacao_3q_classe_a")
   └─ Retorna: João Silva (seu peso permitiu)

3. Agent busca Cal.com (João Silva)
   └─ Retorna slots: ["14:00", "14:30", "15:00", "17:00"]

4. Agent oferece ao cliente:
   "Qual horário você prefere?"
   └─ Cliente escolhe: "14:30"

5. Agent cria appointment em Cal.com
   └─ João recebe notificação
   └─ Cliente recebe convite + link

6. Se múltiplas visitas, Apresentador route é otimizada
   └─ "João, você tem 3 visitas amanhã. Ótima rota seria: Prop1 (14h) → Prop2 (14:45) → Prop3 (15:30)"

7. Dashboard mostra: João foi chamado (--1 de suas 2 cotas da semana)
   └─ Próximo será Júnior (que tem mais cotas)
```

---

## 7. Segurança & Compliance

- **API Keys:** Cal.com keys são armazenadas em `.env`, nunca em banco
- **Autorização:** Apenas gestor pode modificar pesos de roteamento
- **Auditoria:** Todo agendamento fica registrado (quem escalou, quando, para qual corretor)
- **LGPD:** Dados de clientes em Cal.com estão restritos (contato apenas com gestor da imobiliária)

---

Esta integração torna o sistema **super eficiente**, garantindo que:
- Ninguém é sobrecarregado
- Cada corretor tem suas cotas respeitadas
- Clientes conseguem horários otimizados
- A imobiliária aumenta conversão (menor tempo de resposta)
