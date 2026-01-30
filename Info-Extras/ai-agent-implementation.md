# AI Agent Implementation – Guia Técnico Completo

> Objetivo: implementação passo-a-passo do Property Manager Agent com escolha de LLMs, integração com Airtable/Supabase e automações.

---

## 1. Escolha de LLMs (Recomendações por Tarefa)

### 1.1. Mapeamento de Tarefas × LLM

| Tarefa | Recomendação | Razão |
|--------|--------------|-------|
| **Intent Detection** (novo imóvel? venda?) | GPT-4o mini | Rápido, barato, 99% acurácia |
| **Geração de Descrição** (imóvel) | Claude 3.5 Sonnet | Melhor qualidade de texto, mais criativo |
| **Roteamento de Lead** (qual agente?) | GPT-4o | Raciocínio complexo, melhor com contexto |
| **Análise de Vistoria** (fotos/vídeo) | GPT-4o Vision | Reconhecimento de imagem superior |
| **Extração de Dados** (formulário → estruturado) | Claude 3.5 Haiku | Muito rápido, excelente JSON |
| **Análise de Preço** (IA sugere valor) | GPT-4o | Context window grande, histórico |

### 1.2. Opções de Integração

**Opção 1: OpenAI + Anthropic (Recomendado)**
```javascript
// .env
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
OPENROUTER_API_KEY=xxx  // fallback
```

**Opção 2: OpenRouter (Tudo em 1)**
```javascript
// OpenRouter abstrai múltiplos modelos
// Acessa OpenAI, Anthropic, DeepSeek, Mistral, etc.
// Melhor para distribuir custos
```

**Opção 3: Ollama Local (Economia Máxima)**
```javascript
// Roda LLMs localmente (Mistral, Llama, etc.)
// Sem custo de API
// Mas: mais lento, menos acurado
// Bom para: desenvolvimento + testes
```

**Recomendação:** OpenRouter (flexibilidade + economia)

---

## 2. Arquitetura do Agent

### 2.1. Fluxo Geral

```
Webhook do Airtable
    ↓
┌─ MESSAGE HUB ─────────────────────┐
│ Valida payload                    │
│ Extrai: event_type, tenant_id     │
└───────────────────────────────────┘
    ↓
┌─ INTENT DETECTION ─────────────────┐
│ "Novo imóvel" / "Venda" / "Update" │
│ (GPT-4o mini)                      │
└───────────────────────────────────┘
    ↓
┌─ AI AGENT ROUTER ──────────────────┐
│ ├─ PropertyCreationAgent            │
│ ├─ PropertySaleAgent                │
│ ├─ PropertyUpdateAgent              │
│ ├─ VistoriaAnalysisAgent            │
│ └─ PricingAgent                     │
└───────────────────────────────────┘
    ↓
┌─ EXECUTOR (Async Queue) ──────────┐
│ Faz o trabalho real                │
│ (upload, publish, sync)            │
└───────────────────────────────────┘
    ↓
┌─ LOGGER + MONITOR ─────────────────┐
│ Registra tudo em DB                │
│ Alertas se erro                    │
└───────────────────────────────────┘
```

---

## 3. Implementação (Node.js + Express)

### 3.1. Estrutura de Pastas

```
backend/
├── src/
│   ├── agents/
│   │   ├── property-creation.agent.js
│   │   ├── property-sale.agent.js
│   │   ├── property-update.agent.js
│   │   ├── vistoria-analysis.agent.js
│   │   └── base.agent.js (classe abstrata)
│   ├── services/
│   │   ├── llm.service.js (OpenAI/Claude/OpenRouter)
│   │   ├── airtable.service.js
│   │   ├── supabase.service.js
│   │   ├── storage.service.js
│   │   └── portal.service.js (ZAP, Viva Real)
│   ├── queue/
│   │   ├── agent-queue.js (Bull/RabbitMQ)
│   │   └── jobs.js
│   ├── routes/
│   │   ├── webhooks.routes.js
│   │   └── admin.routes.js
│   ├── utils/
│   │   ├── intent-detection.js
│   │   ├── logger.js
│   │   └── validators.js
│   └── middleware/
│       └── auth.middleware.js
├── .env
├── .env.example
├── docker-compose.yml
└── package.json
```

---

### 3.2. Service: LLM (MultiProvider)

```javascript
// src/services/llm.service.js

const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

class LLMService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    // OpenRouter como fallback
    this.openrouter = {
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY
    };
  }

  /**
   * Intent Detection (GPT-4o mini - rápido + barato)
   */
  async detectIntent(payload) {
    const prompt = `
      Analise o seguinte evento do Airtable e identifique a intenção.
      
      Evento: ${JSON.stringify(payload)}
      
      Classifique como:
      - "property.create" (novo imóvel)
      - "property.sale" (imóvel vendido)
      - "property.update" (dados atualizados)
      - "vistoria.create" (nova vistoria)
      
      Responda apenas com: {"intent": "property.create", "confidence": 0.95}
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',  // Rápido + barato
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,  // Determinístico
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Generate Description (Claude 3.5 - melhor qualidade)
   */
  async generatePropertyDescription(propertyData) {
    const prompt = `
      Crie uma descrição profissional e atrativa para este imóvel:
      
      Tipo: ${propertyData.type}
      Endereço: ${propertyData.address}
      Quartos: ${propertyData.bedrooms}
      Banheiros: ${propertyData.bathrooms}
      Área: ${propertyData.area}m²
      Preço: R$ ${propertyData.price}
      
      Características adicionais: ${propertyData.notes || ''}
      
      Gere uma descrição:
      - Profissional mas amigável
      - Entre 150-300 caracteres
      - Destaque diferenciais
      - Sem spam
      - Pronta para publicar em portais
    `;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
  }

  /**
   * Analyze Photos (GPT-4o Vision - reconhecimento de imagem)
   */
  async analyzeVistoriaPhotos(imageUrls) {
    const imageContent = imageUrls.map(url => ({
      type: 'image_url',
      image_url: { url }
    }));

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `
                Analise estas fotos da vistoria de um imóvel.
                Identifique:
                1. Condição geral (Excelente / Boa / Razoável / Ruim)
                2. Problemas visíveis
                3. Itens que precisam reparos
                4. Potenciais melhorias
                
                Responda em JSON estruturado.
              `
            },
            ...imageContent
          ]
        }
      ]
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Extract Data (Claude Haiku - rápido para parsing)
   */
  async extractStructuredData(text) {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `
            Extraia informações estruturadas deste texto:
            
            "${text}"
            
            Retorne JSON com:
            {
              "property_type": "...",
              "bedrooms": "...",
              "bathrooms": "...",
              "area": "...",
              "price": "...",
              "address": "..."
            }
          `
        }
      ]
    });

    return JSON.parse(response.content[0].text);
  }
}

module.exports = new LLMService();
```

---

### 3.3. Base Agent (Abstract)

```javascript
// src/agents/base.agent.js

class BaseAgent {
  constructor(tenantId, supabaseClient, airtableClient) {
    this.tenantId = tenantId;
    this.supabase = supabaseClient;
    this.airtable = airtableClient;
    this.logger = console; // Pode ser Winston/Pino
  }

  /**
   * Valida dados antes de processar
   */
  async validateData(data, requiredFields) {
    const missing = requiredFields.filter(f => !data[f]);
    if (missing.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missing.join(', ')}`);
    }
  }

  /**
   * Log com contexto
   */
  log(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      tenantId: this.tenantId,
      message,
      ...context
    };
    
    this.logger[level](JSON.stringify(logEntry));
    
    // Opcional: salvar em DB para auditoria
    this.saveAuditLog(logEntry);
  }

  /**
   * Atualizar status no Airtable
   */
  async updateAirtableStatus(recordId, updates) {
    await this.airtable.update(recordId, updates);
    this.log('info', 'Airtable updated', { recordId, updates });
  }

  /**
   * Notificar erro
   */
  async notifyError(error, context) {
    this.log('error', error.message, { context, stack: error.stack });
    
    // Opcional: enviar para Slack/Discord
    // await alertOnSlack(error, context);
  }
}

module.exports = BaseAgent;
```

---

### 3.4. Property Creation Agent

```javascript
// src/agents/property-creation.agent.js

const BaseAgent = require('./base.agent');
const llmService = require('../services/llm.service');
const storageService = require('../services/storage.service');
const portalService = require('../services/portal.service');

class PropertyCreationAgent extends BaseAgent {
  async execute(airtableRecord) {
    try {
      this.log('info', 'Starting property creation', { recordId: airtableRecord.id });

      // 1. Validar dados
      await this.validateData(airtableRecord.fields, [
        'Endereco',
        'Tipo',
        'Quartos',
        'Preco'
      ]);

      // 2. Download de fotos do Airtable
      const photos = await this.downloadAttachments(
        airtableRecord.fields.Fotos
      );
      this.log('info', `Downloaded ${photos.length} photos`);

      // 3. Upload para Supabase Storage
      const photoUrls = await storageService.uploadPropertyPhotos(
        photos,
        this.tenantId,
        airtableRecord.id
      );
      this.log('info', 'Photos uploaded to Supabase', { count: photoUrls.length });

      // 4. Gerar descrição com IA (Claude)
      const description = await llmService.generatePropertyDescription({
        type: airtableRecord.fields.Tipo,
        address: airtableRecord.fields.Endereco,
        bedrooms: airtableRecord.fields.Quartos,
        bathrooms: airtableRecord.fields.Banheiros,
        area: airtableRecord.fields['Área (m²)'],
        price: airtableRecord.fields.Preco,
        notes: airtableRecord.fields.Observacoes
      });
      this.log('info', 'Description generated by AI');

      // 5. Criar record no Supabase
      const supabaseRecord = await this.supabase
        .from('properties')
        .insert({
          tenant_id: this.tenantId,
          external_id: airtableRecord.id,
          address: airtableRecord.fields.Endereco,
          type: airtableRecord.fields.Tipo,
          bedrooms: airtableRecord.fields.Quartos,
          bathrooms: airtableRecord.fields.Banheiros,
          area: airtableRecord.fields['Área (m²)'],
          price: airtableRecord.fields.Preco,
          description: description,
          photo_urls: photoUrls,
          status: 'active',
          published_at: new Date()
        })
        .select()
        .single();
      
      this.log('info', 'Supabase record created', { supabaseId: supabaseRecord.id });

      // 6. Publicar em portais (ZAP, Viva Real, OLX)
      const publishResults = await portalService.publishProperty(
        supabaseRecord,
        this.tenantId
      );
      this.log('info', 'Published to portals', publishResults);

      // 7. Atualizar Airtable com sucesso
      await this.updateAirtableStatus(airtableRecord.id, {
        Status: '✅ Publicado',
        'Supabase ID': supabaseRecord.id,
        'Data Publicação': new Date().toISOString(),
        'Publicado Em': Object.keys(publishResults).join(', ')
      });

      this.log('info', 'Property creation completed successfully', {
        supabaseId: supabaseRecord.id
      });

      return { success: true, supabaseId: supabaseRecord.id };

    } catch (error) {
      this.log('error', 'Property creation failed', { error: error.message });
      
      await this.updateAirtableStatus(airtableRecord.id, {
        Status: '❌ Erro',
        'Erro': error.message
      });

      throw error;
    }
  }

  async downloadAttachments(attachmentField) {
    if (!attachmentField || attachmentField.length === 0) {
      return [];
    }

    return Promise.all(
      attachmentField.map(async (att) => {
        const response = await fetch(att.url);
        const buffer = await response.buffer();
        return { filename: att.filename, buffer };
      })
    );
  }
}

module.exports = PropertyCreationAgent;
```

---

### 3.5. Property Sale Agent

```javascript
// src/agents/property-sale.agent.js

class PropertySaleAgent extends BaseAgent {
  async execute(airtableRecord) {
    try {
      this.log('info', 'Processing property sale', { recordId: airtableRecord.id });

      const supabaseId = airtableRecord.fields['Supabase ID'];
      if (!supabaseId) {
        throw new Error('Supabase ID not found');
      }

      // 1. Buscar propriedade
      const property = await this.supabase
        .from('properties')
        .select('*')
        .eq('id', supabaseId)
        .single();

      // 2. Remover de portais
      await portalService.unpublishProperty(property, this.tenantId);
      this.log('info', 'Unpublished from portals');

      // 3. Arquivar no Supabase
      await this.supabase
        .from('properties')
        .update({
          status: 'archived',
          archived_at: new Date(),
          sale_date: airtableRecord.fields['Data Venda'],
          sale_price: airtableRecord.fields['Valor Venda']
        })
        .eq('id', supabaseId);

      // 4. Mover fotos para Cold Storage (async)
      this.archivePhotosAsync(property.photo_urls);

      // 5. Atualizar Airtable
      await this.updateAirtableStatus(airtableRecord.id, {
        Status: '✅ Vendido',
        'Removido De': 'Todos os portais'
      });

      this.log('info', 'Property sale processed successfully');

      return { success: true };

    } catch (error) {
      this.log('error', 'Property sale failed', { error: error.message });
      throw error;
    }
  }

  archivePhotosAsync(photoUrls) {
    // Fire and forget
    setImmediate(async () => {
      try {
        await storageService.moveToBackblaze(photoUrls);
      } catch (err) {
        this.log('warn', 'Photo archival failed', { error: err.message });
      }
    });
  }
}

module.exports = PropertySaleAgent;
```

---

### 3.6. Webhook Handler

```javascript
// src/routes/webhooks.routes.js

const express = require('express');
const router = express.Router();
const llmService = require('../services/llm.service');
const agentQueue = require('../queue/agent-queue');

router.post('/airtable', async (req, res) => {
  try {
    const { tenantId, event, airtableRecordId, propertyData } = req.body;

    // 1. Detectar intenção com IA
    const { intent } = await llmService.detectIntent(req.body);
    console.log(`Intent detected: ${intent}`);

    // 2. Rotear para agente correto
    let AgentClass;
    if (intent === 'property.create') {
      AgentClass = require('../agents/property-creation.agent');
    } else if (intent === 'property.sale') {
      AgentClass = require('../agents/property-sale.agent');
    } else if (intent === 'property.update') {
      AgentClass = require('../agents/property-update.agent');
    }

    // 3. Adicionar à fila para processamento assíncrono
    await agentQueue.add('process-agent', {
      tenantId,
      AgentClass: AgentClass.name,
      airtableRecord: propertyData,
      airtableRecordId
    });

    res.json({ success: true, intent });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 4. Queue (Bull + Redis)

### 4.1. Setup da Fila

```javascript
// src/queue/agent-queue.js

const Queue = require('bull');
const redis = require('redis').createClient();

const agentQueue = new Queue('agent-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Processar jobs
agentQueue.process('process-agent', 5, async (job) => {
  const { tenantId, AgentClass, airtableRecord } = job.data;
  
  console.log(`Processing agent job: ${AgentClass}`);
  
  // Dinâmico: require do agent baseado no nome
  const Agent = require(`../agents/${AgentClass.toLowerCase().replace(/agent$/, '')}.agent`);
  const agent = new Agent(tenantId, supabaseClient, airtableClient);
  
  return await agent.execute(airtableRecord);
});

// Listeners
agentQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

agentQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

module.exports = agentQueue;
```

---

## 5. Checklist de Implementação

- [ ] Criar estrutura de pastas (agents/, services/, queue/)
- [ ] Implementar LLMService (OpenAI + Anthropic)
- [ ] Implementar BaseAgent (classe abstrata)
- [ ] Implementar PropertyCreationAgent
- [ ] Implementar PropertySaleAgent
- [ ] Implementar PropertyUpdateAgent
- [ ] Implementar VistoriaAnalysisAgent
- [ ] Configurar Bull/Redis para filas
- [ ] Implementar webhook handler
- [ ] Testar com record de teste no Airtable
- [ ] Setup logging/monitoring
- [ ] Deploy para staging

---

## Conclusão

Você tem um **agent pipeline robusto** que:
- ✅ Detecta intent com IA
- ✅ Roteia para agent correto
- ✅ Processa async (não bloqueia webhook)
- ✅ Integra com Airtable/Supabase
- ✅ Publica em portais
- ✅ Logging completo
- ✅ Escalável

Próximo passo: Implementar os Agents específicos e testar! 🚀

