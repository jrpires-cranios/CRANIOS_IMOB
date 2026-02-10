# Guia de Integração de Chat Omnichannel – CRM Imobiliário

> Objetivo: explicar, em nível arquitetural e com exemplos práticos, **como centralizar o chat dos portais imobiliários e WhatsApp** dentro do seu CRM.

---

## 1. Conceito de Chat Omnichannel

Na prática, o que você quer é:

- Ter **uma única tela** onde o corretor veja e responda:
  - Mensagens vindas do ZAP/Viva Real (chat do portal)
  - Mensagens do QuintoAndar (chat interno da plataforma)
  - Mensagens de WhatsApp (via API oficial ou provedores)
  - Eventualmente, e‑mail e chat do site próprio
- E que todas essas interações fiquem **amarradas ao mesmo lead/imóvel** dentro do CRM.

Isso se faz com uma **camada de normalização de mensagens**, que traduz cada formato de portal para um **formato interno único**.

---

## 2. Arquitetura em Alto Nível

```text
PORTAIS / CANAIS

ZAP / Viva Real ─┐
QuintoAndar     ─┼──>  Webhooks / APIs  ──>  Message Hub (seu backend)  ──>  Banco / CRM
WhatsApp        ─┘

No front-end, um único painel de chat consome as conversas do CRM.
```

Componentes principais:

1. **Webhooks / APIs de Entrada**  
   Endpoints HTTP que recebem mensagens dos portais / WhatsApp.

2. **Serviço de Normalização**  
   Converte cada payload (ZAP, QuintoAndar, WhatsApp) para um **modelo interno único**.

3. **Banco de Dados de Conversas**  
   Tabelas de `conversations` e `messages` relacionando com `leads` e `properties`.

4. **Painel de Chat (Frontend)**  
   Interface única para os corretores.

5. **Conectores de Saída**  
   Quando o corretor responde pelo CRM, o backend reenvia a resposta pelo canal correto (ZAP, WhatsApp, etc.), respeitando as integrações disponíveis.

---

## 3. Modelo de Dados Interno (Simplificado)

### 3.1. Conversation

```sql
CREATE TABLE conversations (
  id              UUID PRIMARY KEY,
  lead_id         UUID,
  property_id     UUID,
  origin          VARCHAR(50),  -- zap, vivareal, quintoandar, whatsapp, etc.
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2. Message

```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  external_id     VARCHAR(100),   -- id da mensagem no portal
  direction       VARCHAR(10),    -- inbound (cliente) / outbound (corretor)
  sender_name     VARCHAR(255),
  sender_type     VARCHAR(50),    -- cliente, corretor, bot
  content_type    VARCHAR(20),    -- text, image, document, etc.
  content_text    TEXT,
  media_url       VARCHAR(500),
  origin          VARCHAR(50),    -- zap, whatsapp, etc.
  status          VARCHAR(20),    -- sent, delivered, read
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Modelo Unificado de Mensagem (em código)

```js
// Exemplo de objeto de mensagem usado internamente no CRM
const internalMessage = {
  id: 'uuid-interno',
  externalId: 'id-da-mensagem-no-portal',
  conversationId: 'uuid-da-conversa',

  direction: 'inbound', // ou 'outbound'
  sender: {
    name: 'João Silva',
    type: 'cliente' // ou 'corretor', 'bot'
  },

  content: {
    type: 'text',
    text: 'Gostaria de agendar uma visita',
    mediaUrl: null
  },

  origin: 'zap', // zap, vivareal, quintoandar, whatsapp...
  status: 'sent',
  createdAt: new Date().toISOString()
};
```

---

## 5. Webhooks de Entrada – Exemplo em Express

### 5.1. Rota para mensagens ZAP/Viva Real

```js
// src/routes/chat-webhooks.routes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

router.post('/zap', chatController.handleZapMessage);

module.exports = router;
```

### 5.2. Controller – Normalização e Salvamento

```js
// src/controllers/chat.controller.js
const chatService = require('../services/chat.service');

exports.handleZapMessage = async (req, res) => {
  try {
    const payload = req.body; // formato enviado pelo ZAP

    // Aqui você poderia validar assinatura do webhook, se o portal fornecer

    await chatService.processZapPayload(payload);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Erro no webhook ZAP', err);
    return res.status(500).json({ success: false });
  }
};
```

### 5.3. Service – Conversão de Payload ZAP → Modelo Interno

```js
// src/services/chat.service.js
const { v4: uuid } = require('uuid');
const db = require('../config/db'); // conexão (sequelize ou pg direto)

async function processZapPayload(payload) {
  // Exemplo de payload esperado (você vai adaptar ao real):
  // {
  //   messageId: '123',
  //   conversationId: 'abc',
  //   imovelCodigo: 'APTO_001',
  //   clienteNome: 'João',
  //   texto: 'Tenho interesse',
  //   origem: 'zap_imoveis'
  // }

  const conversationId = await ensureConversation(payload);

  const message = {
    id: uuid(),
    external_id: payload.messageId,
    conversation_id: conversationId,
    direction: 'inbound',
    sender_name: payload.clienteNome,
    sender_type: 'cliente',
    content_type: 'text',
    content_text: payload.texto,
    media_url: null,
    origin: payload.origem || 'zap_imoveis',
    status: 'sent'
  };

  await db.query(
    'INSERT INTO messages (id, external_id, conversation_id, direction, sender_name, sender_type, content_type, content_text, media_url, origin, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [
      message.id,
      message.external_id,
      message.conversation_id,
      message.direction,
      message.sender_name,
      message.sender_type,
      message.content_type,
      message.content_text,
      message.media_url,
      message.origin,
      message.status
    ]
  );
}

async function ensureConversation(payload) {
  // Regra simples: uma conversa por lead/imóvel/origem
  const origin = payload.origem || 'zap_imoveis';

  const result = await db.query(
    'SELECT id FROM conversations WHERE origin = $1 AND property_id = $2 LIMIT 1',
    [origin, payload.imovelCodigo]
  );

  if (result.rows.length > 0) {
    return result.rows[0].id;
  }

  const id = uuid();
  await db.query(
    'INSERT INTO conversations (id, property_id, origin, status) VALUES ($1,$2,$3,$4)',
    [id, payload.imovelCodigo, origin, 'active']
  );

  return id;
}

module.exports = {
  processZapPayload
};
```

> Para QuintoAndar, WhatsApp, etc., a ideia é idêntica: você cria funções `processQuintoAndarPayload`, `processWhatsAppPayload` que convertem cada formato para o mesmo modelo de `messages`.

---

## 6. Integração com WhatsApp (Visão Rápida)

Você pode usar:

- **API oficial do WhatsApp Business (Meta)**
- Ou provedores como **Twilio**, **Zenvia**, **360Dialog**, etc.

Exemplo conceitual usando Twilio:

```js
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

async function sendWhatsApp(to, message) {
  const result = await client.messages.create({
    from: 'whatsapp:+55XXXXXXXXXXX',
    to: `whatsapp:${to}`,
    body: message
  });

  return result;
}
```

Webhook de entrada do WhatsApp (recebendo mensagens dos clientes):

```js
app.post('/webhooks/whatsapp', async (req, res) => {
  const payload = req.body;

  // payload.Body → texto da mensagem
  // payload.From → número do cliente

  // 1) Normalizar para o mesmo modelo de message interno
  // 2) Gravar na tabela messages
  // 3) Associar a uma conversation

  res.status(200).send('OK');
});
```

---

## 7. Painel de Chat (Frontend) – Conceito

Independente do framework (React, Vue, Angular), o painel normalmente tem:

1. **Lista de conversas** (esquerda)
   - Nome do contato / lead
   - Origem (ZAP, QuintoAndar, WhatsApp)
   - Última mensagem
   - Badge de não lidos

2. **Janela de mensagens** (direita)
   - Histórico completo da conversa
   - Diferenciação entre mensagens recebidas/enviadas
   - Indicação de canal (icone de ZAP, WhatsApp, etc.)

3. **Área de composição**
   - Campo de texto
   - Botão de enviar
   - Possibilidade de anexar arquivos/imagens

O frontend apenas consome endpoints REST como:

- `GET /api/conversations` – lista de conversas
- `GET /api/conversations/:id/messages` – histórico de mensagens
- `POST /api/conversations/:id/messages` – enviar nova mensagem (o backend decide por qual canal ela sai).

---

## 8. Segurança Essencial

1. **Autenticação no painel**  
   - JWT ou sessão, garantindo que só corretores/autorizados acessem as conversas.

2. **Validação de Webhooks**  
   - Sempre que portal ou provedor (WhatsApp/Twilio) permitir, usar assinatura HMAC/secret para validar que o webhook realmente veio deles.

3. **Rate limiting**  
   - Limitar envios por minuto por usuário/conversa para evitar abuso ou ban de canais como WhatsApp.

4. **LGPD**  
   - Armazenar apenas dados necessários
   - Ter política clara de retenção (por quanto tempo guardar mensagens)
   - Facilitar anonimização/remoção sob solicitação.

---

## 9. Checklist de Implementação de Chat

1. **Definir quais canais entram no MVP**  
   - Ex.: ZAP/Viva Real + WhatsApp.

2. **Modelar banco de dados**  
   - Criar tabelas `conversations` e `messages`.

3. **Criar endpoints de webhook**  
   - `/webhooks/zap`, `/webhooks/whatsapp`, etc.

4. **Implementar normalização de payload**  
   - ZAP → modelo interno
   - WhatsApp → modelo interno

5. **Criar API REST interna**  
   - `GET /api/conversations`
   - `GET /api/conversations/:id/messages`
   - `POST /api/conversations/:id/messages`

6. **Construir painel de chat**  
   - Primeiro com funcionalidades mínimas
   - Depois evoluir para filtros, buscas, etc.

7. **Testar intensamente**  
   - Cargas (muitos leads simultâneos)
   - Conectividade (quedas de rede)
   - Erros de canal (mensagens não entregues).

---

## 10. Resumo

- É totalmente possível **centralizar o chat dos portais + WhatsApp em um único CRM**.
- A chave é tratar **mensagem como uma entidade única**, independente do canal, e **normalizar tudo** para um mesmo modelo interno.
- Você não precisa que o portal “exponha o chat inteiro por API”; basta que ele permita **webhooks de lead/mensagem** ou algum tipo de notificação que você consiga capturar e transformar em mensagens internas.

Esse guia serve como base arquitetural para você ou seu time técnico evoluírem um módulo de **chat omnichannel imobiliário** integrado à estrutura de APIs/feeds que já discutimos para anúncios e leads.
