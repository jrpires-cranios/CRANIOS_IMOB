# Apresentador de Imóveis + Self-Vistoria Digital

> Objetivo: descrever o fluxo de **Apresentador de Imóveis** (funcionário que visita propriedades com cliente) e **Self-Vistoria Digital** (cliente documenta estado do imóvel via app/form com fotos e video).

---

## 1. Apresentador de Imóveis – O Serviço Premium

### 1.1. Conceito

Em vez de cliente ir até a imobiliária buscar chaves, preencher fichas e andar pelas ruas:

- **Imobiliária designa um funcionário (Apresentador)**
- **Apresentador vai até o imóvel** (agendado via Cal.com)
- **Apresenta para o cliente** (gasta tempo explicando, resolvendo dúvidas)
- **Coleta feedback in-loco** (qual cômodo mais interessou, objeções, etc.)
- **Oferece Self-Vistoria** para cliente assinar digitalmente

**Resultado:** Cliente vê imóvel **sem burocracias**, imobiliária coleta dados ricos, e **economia operacional** (menos pessoal administrativo).

### 1.2. Fluxo de Agendamento do Apresentador

```
IA Agent: "Perfeito, tá agendado para amanhã 14:30.
           Nosso Apresentador, o Felipe, vai passar por você lá.
           Ele tem a chave, conhece bem o imóvel, e te mostra tudo.
           Leva uns 30-40min."

        ↓

Cliente recebe:
  - Convite em Cal.com com endereço + horário
  - SMS/WhatsApp com número do Felipe
  - QR code para check-in (opcional)

        ↓

Felipe (Apresentador) recebe notificação:
  - Propriedade: Rua X, 123, Apto 42
  - Cliente: João Silva (+55 11 99999-9999)
  - Horário: 14:30
  - Tempo estimado: 40min
  - Próxima visita: 15:30 (otimização de rota)

        ↓

Felipe chega ao imóvel, abre e aguarda cliente
  (Se cliente atrasar, pode contatar)

        ↓

Felipe passa por cada cômodo, responde dúvidas

        ↓

Ao final, Felipe oferece: "Vamos documentar o estado do imóvel
para proteger você de futuras dúvidas?"
  → Se sim: Cliente preenche Self-Vistoria
```

### 1.3. Otimização de Rotas (Para o Apresentador)

O Apresentador tem múltiplas visitas no dia. IA otimiza a sequência:

```javascript
// Backend: calcula melhor rota para o Apresentador

async function optimizePresenterDay(presenter_id, date) {
  // 1. Busca todas as visitas agendadas para esse Apresentador/data
  const appointments = await getAppointmentsByPresenter(presenter_id, date);
  // Ex: [
  //   { address: "Rua A, 100", time: "10:00", duration: 40 },
  //   { address: "Rua B, 200", time: "11:00", duration: 40 },
  //   { address: "Rua C, 150", time: "14:30", duration: 40 }
  // ]
  
  // 2. Calcula distância entre cada par
  const routes = await google_maps_api.getDistances(
    appointments.map(a => a.address)
  );
  
  // 3. Resolve TSP (Traveling Salesman Problem) para menor tempo total
  const optimized = solveTSP(appointments, routes);
  // Retorna: melhor sequência + sugestão de horários
  
  // 4. Se horários precisam ser ajustados, atualiza Cal.com
  for (let apt of optimized) {
    if (apt.suggested_time !== apt.original_time) {
      await calcom.updateAppointment(apt.id, {
        start: apt.suggested_time
      });
      
      // Notifica cliente
      await sendClientMessage(apt.client_id, 
        `Ajustamos seu horário para ${apt.suggested_time} 
         para oferecer melhor experiência. Tudo bem?`
      );
    }
  }
  
  // 5. Envia rota ao Apresentador (mapa, tempos de deslocamento)
  await notifyPresenter(presenter_id, {
    daily_route: optimized,
    estimated_total_time: totalTime,
    map_link: generateMapLink(optimized)
  });
}
```

**Exemplo de rota otimizada:**

```
Felipe - Dia 27/01/2026

📍 Saída: Escritório da imobiliária (8:30)
↓ [15 min de metrô]
🏠 Visita 1: Rua A, 100 - João Silva (10:00-10:40)
↓ [8 min de carro]
🏠 Visita 2: Rua B, 200 - Maria Santos (10:50-11:30)
↓ [12 min de carro]
🍽️ Almoço (11:40-13:00)
↓ [25 min de metrô]
🏠 Visita 3: Rua C, 150 - Pedro Costa (14:30-15:10)
↓ [10 min de carro]
🏠 Visita 4: Rua D, 50 - Anna Ferreira (15:30-16:10)
↓ [20 min de volta]
📍 Retorno: Escritório (16:30)

Tempo total: ~8h (com almoço), visitas com buffer
```

---

## 2. Self-Vistoria Digital

### 2.1. Conceito

Após Felipe apresentar o imóvel, ele oferece: **"Vamos documentar o estado do imóvel digitalmente? Assim você tem registro de tudo e protege seus direitos."**

Cliente preenche um **formulário/checklist** onde:
- Marca itens da propriedade (pintura, portas, janelas, etc.)
- **Concorda** ou **discorda** com o estado descrito
- Se discorda, **tira fotos/vídeos** como prova
- Tudo fica armazenado + documentado

### 2.2. Exemplo de Checklist Self-Vistoria

```json
{
  "vistoria_id": "vist_123",
  "property_id": "prop_456",
  "client_id": "lead_789",
  "date": "2026-01-27",
  "presenter": "Felipe Silva",
  
  "items": [
    {
      "category": "Estrutura Geral",
      "checks": [
        {
          "item": "Paredes - pintura e integridade",
          "state_description": "Pintado em branco há ~2 anos, sem rachaduras visíveis",
          "client_response": "Concordo",
          "client_notes": null,
          "photos": []
        },
        {
          "item": "Piso - estado geral",
          "state_description": "Porcelanato em bom estado, alguns pontos com desgaste mínimo",
          "client_response": "Discordo",
          "client_notes": "Tem uma trinca perto da cozinha que o apresentador não mencionou",
          "photos": ["url_foto_1", "url_foto_2"],
          "video": "url_video_trinca.mp4"
        },
        {
          "item": "Teto - sem infiltrações",
          "state_description": "Sem sinais de infiltração",
          "client_response": "Concordo",
          "client_notes": null,
          "photos": []
        }
      ]
    },
    
    {
      "category": "Cozinha",
      "checks": [
        {
          "item": "Fogão/cooktop",
          "state_description": "Cooktop 5 queimadores, funcionando",
          "client_response": "Concordo",
          "client_notes": null,
          "photos": ["url_foto_fogao"]
        },
        {
          "item": "Geladeira",
          "state_description": "Geladeira Brastemp prateada",
          "client_response": "Concordo",
          "client_notes": null,
          "photos": []
        }
      ]
    },
    
    // ... mais categorias
  ],
  
  "summary": {
    "total_items": 45,
    "client_agreed": 41,
    "client_disagreed": 4,
    "photos_uploaded": 8,
    "videos_uploaded": 1,
    "timestamp_completed": "2026-01-27T15:30:00Z",
    "client_signature_digital": "assinatura_hash_123"
  }
}
```

### 2.3. Flow na IA Chat (Depois da Visita com Apresentador)

```
Felipe: "João, você concordou em preencher a vistoria digital.
         Vou te mandar um link - leva uns 10-15 min."

        ↓

Cliente clica no link (SMS/Email/WhatsApp)
Abre formulário interativo:

[ ] Parede - pintada, sem rachaduras?
    ├─ SIM  (marca)
    ├─ NÃO  (tira foto/video como prova)
    └─ INCERTO

[ ] Piso - bom estado?
    └─ NÃO (cliente marca)
       └─ "Tem trinca perto da cozinha"
       └─ [CAMERA BUTTON] - tira 2 fotos
       └─ [VIDEO BUTTON] - grava video de 20seg

        ↓

Cliente submete formulário
        ↓

Sistema salva TUDO:
  - Responses
  - Fotos (armazenadas com timestamp)
  - Vídeos (armazenados)
  - Assinatura digital

        ↓

IA envia confirmação:
"Perfeito! Sua vistoria foi registrada.
 Você discordou em 4 pontos - isso está documentado com fotos/vídeos.
 Quando você se mudar, esse documento vai pro vistoriador final verificar.
 Você fica protegido! ✅"
```

### 2.4. Integração com Saída do Imóvel (Locação)

Quando cliente **sai do imóvel** (final da locação):

```
1. Antes de entregar as chaves, ele recebe:
   "Vamos fazer a vistoria de saída? Leva 15 minutos."

2. Cliente acessa mesmo formulário, mas agora no modo "SAÍDA"
   - Vê as respostas que deu quando ENTROU
   - Documenta qualquer mudança
   - Compara: "Quando entrei, aqui estava assim..."
   
3. Sistema detecta automaticamente:
   - Desgaste normal de uso vs. danos
   - IA analisa fotos/vídeos de ENTRADA vs. SAÍDA
   
4. Resultado:
   - Se tudo OK → Cliente recebe caução de volta
   - Se danos → Documentado, ambas as partes têm prova
```

### 2.5. Benefícios da Self-Vistoria

**Para Cliente:**
- ✅ Protege contra acusações de danos que ele não fez
- ✅ Documentação clara (fotos/vídeos com timestamp)
- ✅ Sem stress de vistoriador terceiro

**Para Imobiliária:**
- ✅ Economia: não precisa contratar vistoriador externo
- ✅ Documentação: prova clara em caso de litígio
- ✅ Segurança: registra estado real da propriedade
- ✅ Dados ricos: sabe exatamente que problemas surgem durante uso

**Para Apresentador:**
- ✅ Menos burocracia manual
- ✅ Registro automático (não precisa preencher ficha à mão)

---

## 3. Integração no Banco de Dados

### 3.1. Tabelas Necessárias

```sql
-- Apresentadores
CREATE TABLE presenters (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  status VARCHAR(50),  -- active, on_leave, etc.
  created_at TIMESTAMP
);

-- Agendamentos de Apresentador (referencia Cal.com)
CREATE TABLE presenter_appointments (
  id UUID PRIMARY KEY,
  presenter_id UUID REFERENCES presenters(id),
  property_id UUID REFERENCES properties(id),
  client_id UUID REFERENCES leads(id),
  scheduled_time TIMESTAMP,
  estimated_duration_minutes INT,
  cal_com_event_id VARCHAR(255),
  status VARCHAR(50),  -- confirmed, completed, no_show, rescheduled
  notes_presenter TEXT,
  feedback_score INT,  -- 1-5 stars
  created_at TIMESTAMP
);

-- Self-Vistoria
CREATE TABLE self_vistoria (
  id UUID PRIMARY KEY,
  presenter_appointment_id UUID REFERENCES presenter_appointments(id),
  client_id UUID REFERENCES leads(id),
  property_id UUID REFERENCES properties(id),
  vistoria_type VARCHAR(50),  -- entrada, saida
  
  items_total INT,
  items_agreed INT,
  items_disagreed INT,
  
  completed_at TIMESTAMP,
  client_signature_hash VARCHAR(255),
  created_at TIMESTAMP
);

-- Detalhes de itens da vistoria
CREATE TABLE vistoria_items (
  id UUID PRIMARY KEY,
  vistoria_id UUID REFERENCES self_vistoria(id),
  
  category VARCHAR(100),  -- Estrutura, Cozinha, Banheiro, etc.
  item_name VARCHAR(255),
  state_description TEXT,
  client_response VARCHAR(50),  -- concordo, discordo, incerto
  client_notes TEXT,
  
  photos_json JSONB,  -- array de URLs das fotos
  video_url VARCHAR(500),
  
  created_at TIMESTAMP
);
```

### 3.2. Relatório de Vistoria (Para Gestor)

Dashboard que mostra:

```
Vistorias Completadas Hoje:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
João Silva - Rua A, 100
  ✅ 42/42 itens concordados
  📊 100% satisfação

Maria Santos - Rua B, 200
  ⚠️  38/42 itens concordados
  📸 4 discordâncias com fotos
  📊 90% satisfação

Pedro Costa - Rua C, 150
  ⚠️  35/42 itens concordados
  📸 7 discordâncias com fotos + vídeos
  📊 83% satisfação

[Clique para ver detalhes / fotos / vídeos]
```

---

## 4. Checklist de Implementação

- [ ] Criar tabela de Apresentadores (gestão de pessoal)
- [ ] Integrar Cal.com com rotina de agendamento de Apresentador
- [ ] Implementar algoritmo de otimização de rotas (TSP)
- [ ] Criar formulário/app de Self-Vistoria (Web + Mobile)
- [ ] Implementar upload de fotos/vídeos com timestamp
- [ ] Adicionar análise de IA (comparar entrada vs. saída)
- [ ] Dashboard para gestão de Apresentadores
- [ ] Notificações para Apresentador (rota diária, próxima visita)
- [ ] Integração com assinatura digital (DocuSign ou similar)

---

Este sistema torna a imobiliária muito mais **premium** e **eficiente**, reduzindo custos operacionais enquanto melhora experiência do cliente.
