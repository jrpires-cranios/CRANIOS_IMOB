# Arquitetura Multi-Tenant + Data Orchestration (Supabase + Airtable + IA)

> Objetivo: descrever como cada cliente terá suas próprias contas (Supabase, Airtable), como sincronizar dados entre elas, e como IA automatiza cadastro/remoção de imóveis.

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                   PARA CADA IMOBILIÁRIA                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CLIENT A: XYZ Real Estate                                 │
│  ├─ Supabase Account (seu DB)                             │
│  ├─ Airtable Workspace (UI para adicionar imóveis)        │
│  └─ AI Agent (cadastro/remoção automática)                │
│                                                             │
│  CLIENT B: ABC Imóveis                                     │
│  ├─ Supabase Account (seu DB)                             │
│  ├─ Airtable Workspace (UI para adicionar imóveis)        │
│  └─ AI Agent (cadastro/remoção automática)                │
│                                                             │
│  CLIENT C: Premium Property Group                          │
│  ├─ Supabase Account (seu DB)                             │
│  ├─ Airtable Workspace (UI para adicionar imóveis)        │
│  └─ AI Agent (cadastro/remoção automática)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Fluxo de Dados:

Human (Admin da Imobiliária)
    ↓
Airtable (interface bonita, fácil)
    ↓
AI Agent (processa: novo imóvel? venda? remoção?)
    ↓
┌─────────────────────────────────────────┐
│  Ações automáticas (baseado em intent)  │
├─────────────────────────────────────────┤
│ ✓ Novo imóvel para alugar               │
│   └─ Cria record no Supabase            │
│   └─ Faz upload de fotos/vídeos         │
│   └─ Publica nos portais (ZAP, etc.)    │
│                                         │
│ ✓ Imóvel vendido                        │
│   └─ Remove do Airtable                 │
│   └─ Remove do Supabase                 │
│   └─ Despublica dos portais             │
│   └─ Arquiva em histórico               │
│                                         │
│ ✓ Editar características do imóvel      │
│   └─ Atualiza no Supabase               │
│   └─ Re-sincroniza em portais           │
│                                         │
│ ✓ Adicionar fotos/vídeos novos          │
│   └─ Upload em Supabase Storage         │
│   └─ Atualiza record no Airtable        │
└─────────────────────────────────────────┘
    ↓
Supabase (single source of truth dos dados)
    ↓
Portais (ZAP, Viva Real, OLX, etc. via XML/API)
    ↓
Clientes veem imóvel online
```

---

## 2. Divisão de Responsabilidades

### 2.1. Airtable (Input Layer)

**O que fica lá:**
- ✅ Visão "bonita" dos imóveis (table view, gallery view)
- ✅ Formulário de entrada (novo imóvel)
- ✅ Campos customizáveis (admin pode adicionar campos)
- ✅ Automações nativas (se X, então Y)
- ✅ Integração com IA para cadastro

**O que NÃO fica lá:**
- ❌ Banco de dados "real" (fonte da verdade)
- ❌ Histórico de leads/conversas
- ❌ Dados de analytics
- ❌ Fotos/vídeos (apenas links)

**Acesso:** Admin da imobiliária + equipe comercial (veem imóveis)

---

### 2.2. Supabase (Core Database)

**O que fica lá:**
- ✅ **Single source of truth:** properties, leads, conversations, vistorias, etc.
- ✅ Fotos/vídeos (URLs em Supabase Storage)
- ✅ Leads e conversas com IA
- ✅ Histórico de sincronizações (quando Airtable atualizou)
- ✅ Analytics e KPIs
- ✅ Dados de corretores, apresentadores
- ✅ Self-vistorias com fotos

**Acesso:** Sistema (backend), Airtable (via API), IA Agent (via API)

---

### 2.3. Airtable (cada cliente)

Cada cliente terá sua própria conta Airtable (ou você cria workspace dentro da sua conta).

**Benefícios:**
- ✅ Cliente ve seus imóveis em interface visual bonita
- ✅ Admin (cliente) consegue adicionar imóvel sem código
- ✅ Pode colaborar com equipe (múltiplos usuários)
- ✅ Airtable cuida de interface, você cuida de dados

**Desvantagem:**
- ❌ Airtable não é "free" para 10+ clients ($ por base)

---

### 2.4. Supabase (cada cliente)

Cada cliente terá sua própria conta Supabase (project separado).

**Por quê:**
- ✅ Isolamento total de dados (segurança)
- ✅ Escalabilidade (cada client tem seus próprios recursos)
- ✅ Compliance LGPD (dados sensíveis separados)
- ✅ Controle de custos (você vê exatamente quanto cada cliente consome)

**Desvantagem:**
- ❌ Supabase por projeto tem custo (Free até ~50GB)

---

## 3. Fluxo de Sincronização (Airtable ↔ Supabase)

### 3.1. Novo Imóvel no Airtable

**Trigger:** Admin adiciona nova linha na tabela "Imóveis"

**Fluxo:**

```
1. Admin preenche formulário no Airtable:
   - Endereço: "Rua A, 100, Apto 42"
   - Tipo: "Apartamento"
   - Quartos: 3
   - Preço: R$ 3.500
   - Status: "Aguardando Publicação"
   - Fotos: [attachments]

2. Airtable Automation (nativa):
   └─ Quando registro é criado
      └─ POST para seu webhook: https://seu-backend.com/api/airtable/property-created
         └─ Body contém: { tableId, recordId, fields: {...} }

3. Seu Backend recebe:
   └─ Identifica que é novo imóvel (status = "Aguardando")
   └─ Cria AI Agent Task: "Processar novo imóvel"
   └─ Agent Task entra na queue

4. AI Agent (Async Job):
   ├─ Lê dados do Airtable (nome, quartos, preço, etc.)
   ├─ Extrai intent: "Novo imóvel para aluguel"
   ├─ Faz upload de fotos (Airtable attachments → Supabase Storage)
   ├─ Cria record no Supabase (INSERT properties)
   ├─ Gera descrição profissional da propriedade (IA generativa)
   ├─ Publica nos portais (ZAP, Viva Real via XML/API)
   └─ Atualiza status no Airtable: "✅ Publicado"

5. Cliente vê no Airtable:
   └─ Status muda de "Aguardando" para "✅ Publicado"
   └─ Nota: "Publicado em ZAP, Viva Real, OLX"
```

---

### 3.2. Imóvel Vendido (Remoção)

**Trigger:** Admin muda status no Airtable para "Vendido"

**Fluxo:**

```
1. Admin atualiza registro:
   - Status: "Vendido"
   - Data de Venda: 27/01/2026

2. Airtable Automation:
   └─ Quando status muda para "Vendido"
      └─ POST para webhook: https://seu-backend.com/api/airtable/property-sold
         └─ Body contém: { propertyId, soldDate }

3. Seu Backend:
   └─ Identifica: "Imóvel foi vendido"
   └─ Cria AI Agent Task: "Arquivar imóvel vendido"

4. AI Agent:
   ├─ Remove de portais (ZAP, Viva Real, OLX)
   ├─ Marca como "archived" no Supabase
   ├─ Move fotos para Cold Storage (Backblaze)
   ├─ Registra histórico de venda (quem vendeu, valor, data)
   ├─ Remove de rotação de buscas da IA
   └─ Notifica: "Imóvel removido de todos os canais"

5. Sistema:
   └─ Airtable não deleta (fica como histórico)
   └─ Supabase marca como "archived" (não aparece em buscas)
   └─ Portais removem de publicação imediato
```

---

### 3.3. Editar Características do Imóvel

**Trigger:** Admin edita quartos, preço, descrição, etc.

**Fluxo:**

```
1. Admin edita no Airtable:
   - Preço: R$ 3.500 → R$ 3.200
   - Descrição: [...texto novo...]

2. Airtable Automation:
   └─ Quando campo "Preço" ou "Descrição" muda
      └─ POST webhook com apenas os campos que mudaram

3. Seu Backend:
   └─ Identifica: "Atualizando imóvel existente"
   └─ Cria AI Agent Task: "Atualizar imóvel em portais"

4. AI Agent:
   ├─ Atualiza record no Supabase
   ├─ Re-publica nos portais (envia XML atualizado)
   ├─ Gera nova descrição se texto mudou (IA generativa)
   └─ Atualiza timestamp "last_updated"

5. Resultado:
   └─ Portais refletem mudança dentro de 1-2h
```

---

### 3.4. Adicionar Fotos/Vídeos Novos

**Trigger:** Admin adiciona attachments no Airtable

**Fluxo:**

```
1. Admin no Airtable:
   - Clica em campo "Fotos"
   - Faz upload de imagens novas

2. Airtable Automation:
   └─ Detecta novo attachment
   └─ POST webhook com URL temporária do Airtable

3. Seu Backend:
   └─ Baixa imagem do Airtable (link temporário)
   └─ Faz upload em Supabase Storage
   └─ Atualiza record em Supabase com nova URL

4. Result:
   └─ Fotos agora aparecem em todos os canais
   └─ Airtable sincronizado com Supabase
```

---

## 4. AI Agent para Cadastro/Remoção

### 4.1. O Agent de Gestão de Imóveis

**Responsabilidades:**

```
AGENT: "Property Manager"
├─ Intent: Novo Imóvel
│  ├─ Ler dados do Airtable
│  ├─ Validar campos obrigatórios
│  ├─ Fazer upload de fotos/vídeos
│  ├─ Criar record no Supabase
│  ├─ Gerar descrição (IA generativa)
│  ├─ Publicar nos portais
│  └─ Atualizar status no Airtable
│
├─ Intent: Imóvel Vendido/Alugado
│  ├─ Remover de portais
│  ├─ Arquivar no Supabase
│  ├─ Mover fotos para Cold Storage
│  ├─ Registrar venda no histórico
│  └─ Atualizar Airtable
│
└─ Intent: Atualizar Imóvel
   ├─ Sincronizar campos mudados
   ├─ Re-publicar nos portais
   ├─ Atualizar IA em Supabase
   └─ Registrar changelog
```

### 4.2. Implementação (Pseudo-código)

```javascript
// src/agents/property-manager.agent.js

class PropertyManagerAgent {
  constructor(airtable_client, supabase_client, openai_client) {
    this.airtable = airtable_client;
    this.supabase = supabase_client;
    this.openai = openai_client;
  }

  /**
   * Processa novo imóvel do Airtable
   */
  async handleNewProperty(airtableRecord, tenantId) {
    try {
      console.log(`📝 Processando novo imóvel: ${airtableRecord.fields.Endereco}`);
      
      // 1. Validar dados
      this.validatePropertyData(airtableRecord.fields);
      
      // 2. Download de fotos (Airtable → local)
      const photos = await this.downloadAirtableAttachments(
        airtableRecord.fields.Fotos
      );
      
      // 3. Upload para Supabase Storage
      const photoUrls = await this.uploadToSupabaseStorage(
        photos,
        tenantId,
        airtableRecord.id
      );
      
      // 4. Criar descrição com IA
      const description = await this.generatePropertyDescription(
        airtableRecord.fields,
        this.openai
      );
      
      // 5. Criar record no Supabase
      const supabaseRecord = await this.supabase
        .from('properties')
        .insert({
          tenant_id: tenantId,
          external_id: airtableRecord.id, // link com Airtable
          address: airtableRecord.fields.Endereco,
          type: airtableRecord.fields.Tipo,
          bedrooms: airtableRecord.fields.Quartos,
          bathrooms: airtableRecord.fields.Banheiros,
          price: airtableRecord.fields.Preco,
          description: description,
          photo_urls: photoUrls,
          status: 'active',
          source: 'airtable',
          published_at: new Date()
        })
        .single();
      
      // 6. Publicar em portais (XML/API)
      await this.publishToPortals(supabaseRecord, tenantId);
      
      // 7. Atualizar status no Airtable
      await this.airtable.update(airtableRecord.id, {
        Status: '✅ Publicado',
        'Supabase ID': supabaseRecord.id,
        'Data Publicação': new Date().toISOString(),
        'Publicado Em': 'ZAP, Viva Real, OLX'
      });
      
      console.log(`✅ Imóvel publicado: ${supabaseRecord.id}`);
      
      return { success: true, supabaseId: supabaseRecord.id };
      
    } catch (error) {
      console.error(`❌ Erro ao processar imóvel:`, error);
      
      // Atualizar Airtable com erro
      await this.airtable.update(airtableRecord.id, {
        Status: '❌ Erro',
        'Erro': error.message
      });
      
      throw error;
    }
  }

  /**
   * Processa venda/remoção de imóvel
   */
  async handlePropertySold(propertyId, tenantId, saleData) {
    try {
      console.log(`📊 Processando venda: ${propertyId}`);
      
      // 1. Buscar property no Supabase
      const property = await this.supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
      
      // 2. Remover de portais
      await this.removeFromPortals(property, tenantId);
      
      // 3. Arquivar no Supabase
      await this.supabase
        .from('properties')
        .update({
          status: 'archived',
          archived_at: new Date(),
          sale_date: saleData.saleDate,
          sale_price: saleData.salePrice
        })
        .eq('id', propertyId);
      
      // 4. Mover fotos para Cold Storage (opcional, assíncrono)
      this.archivePhotosAsync(property.photo_urls, tenantId);
      
      // 5. Atualizar Airtable
      await this.airtable.update(property.external_id, {
        Status: '✅ Vendido',
        'Data Venda': saleData.saleDate,
        'Valor Venda': saleData.salePrice,
        'Removido De': 'Todos os portais'
      });
      
      console.log(`✅ Imóvel arquivado: ${propertyId}`);
      
    } catch (error) {
      console.error(`❌ Erro ao processar venda:`, error);
      throw error;
    }
  }

  /**
   * Processa atualização de imóvel
   */
  async handlePropertyUpdate(airtableRecord, tenantId) {
    const { id: airtableId, fields } = airtableRecord;
    
    // Buscar property no Supabase pelo external_id
    const property = await this.supabase
      .from('properties')
      .select('*')
      .eq('external_id', airtableId)
      .eq('tenant_id', tenantId)
      .single();
    
    // Atualizar apenas campos que mudaram
    const updates = {
      price: fields.Preco,
      description: fields.Descricao,
      bedrooms: fields.Quartos,
      bathrooms: fields.Banheiros,
      updated_at: new Date()
    };
    
    await this.supabase
      .from('properties')
      .update(updates)
      .eq('id', property.id);
    
    // Re-publicar em portais
    await this.publishToPortals(
      { ...property, ...updates },
      tenantId
    );
    
    console.log(`✅ Imóvel atualizado: ${property.id}`);
  }

  // ... métodos auxiliares
}

module.exports = PropertyManagerAgent;
```

---

## 5. Webhook do Airtable (Backend)

```javascript
// src/routes/airtable-webhooks.routes.js

router.post('/airtable/webhook', authenticateTenant, async (req, res) => {
  const { tenantId } = req.user;
  const payload = req.body;
  
  try {
    // Airtable pode enviar múltiplos eventos
    for (let event of payload.actionMetadata.changes) {
      const { createdTablesById, changedTablesById, changedMetadata } = event;
      
      // Se criou novo record
      if (createdTablesById) {
        for (let record of createdTablesById['tblProperties']) { // ID da table
          const agent = new PropertyManagerAgent(...);
          await agent.handleNewProperty(record, tenantId);
        }
      }
      
      // Se alterou record
      if (changedTablesById) {
        for (let record of changedTablesById['tblProperties']) {
          const agent = new PropertyManagerAgent(...);
          
          // Detectar tipo de mudança
          if (record.fields.Status === 'Vendido') {
            await agent.handlePropertySold(
              record.fields['Supabase ID'],
              tenantId,
              {
                saleDate: record.fields['Data Venda'],
                salePrice: record.fields['Valor Venda']
              }
            );
          } else {
            await agent.handlePropertyUpdate(record, tenantId);
          }
        }
      }
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Erro ao processar webhook Airtable:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 6. Custo de Infrastructure

### 6.1. Por Cliente

| Serviço | Uso | Custo |
|---------|-----|-------|
| Supabase (projeto próprio) | DB + Auth + Storage | $25/mês (Free) ou $100+ (Pro) |
| Airtable (base própria) | Tabela de imóveis | $12/mês (Plus) ou $20+ (Pro) |
| Seu Backend (compartilhado) | Webhooks, AI processing | ~$5/cliente (rateado) |
| Storage (Supabase + Bunny) | Fotos/vídeos | $1-5/mês |
| **TOTAL por cliente** | | **$40-130/mês** |

### 6.2. Você Cobra do Cliente

Sugestões:
- **Plano Básico:** R$ 299/mês (1 imobiliária, até 50 imóveis)
- **Plano Pro:** R$ 699/mês (1 imobiliária, até 200 imóveis)
- **Plano Enterprise:** Custom (múltiplas locações, equipes)

**Margem:** Com custo de ~$100/mês, você lucra ~$200-600/mês por cliente ✅

---

## 7. Fluxo de Onboarding Atualizado

```
NOVA IMOBILIÁRIA ENTRA

Fase 0: Setup Cliente (30min)
├─ Criar projeto Supabase (você cria, não o cliente)
├─ Criar workspace Airtable (cliente cria conta)
├─ Conectar Airtable → seu backend (API key + webhook)
└─ Testar webhook com record de teste

Fase 1-6: Como antes (checklist-ia-first.md)
├─ Upload de imóveis no Airtable
├─ Agent processa e publica em portais
├─ Cliente vê dashboard
└─ Go-live

Fase 7+: Operação
├─ Cliente adiciona/remove imóveis no Airtable
├─ Agent processa automático
├─ Tudo sincronizado em real-time
```

---

## 8. Benefícios da Arquitetura

✅ **Para Você (Fornecedor):**
- Supabase separado por cliente = melhor escalabilidade
- Você tem single source of truth (seu backend)
- Airtable é "interface" = cliente happy
- AI Agent automatiza operações repetitivas
- Economia: Airtable é caro, mas cliente paga por isso

✅ **Para o Cliente:**
- Airtable é bonito, fácil de usar
- Não precisa entender Supabase/banco de dados
- Automação = menos trabalho manual
- Cada imóvel publicado em todos os portais em minutos

---

## 9. Roadmap de Features

**MVP:**
- ✅ Novo imóvel (criar, upload de fotos, publicar)
- ✅ Remover imóvel (venda, desativação)
- ✅ Atualizar informações

**Phase 2:**
- [ ] Sincronização bidirecional (mudança no Supabase → Airtable)
- [ ] Histórico de alterações (changelog)
- [ ] Versionamento de descrição (A/B test)

**Phase 3:**
- [ ] Feedback dos portais (ZAP diz "imóvel alugou") → avisa Airtable
- [ ] Inteligência de preço (IA sugere preço baseado em mercado)
- [ ] Template de descrição (cliente customiza formato)

---

## Resumo

Você está criando um **data orchestration layer** onde:

1. **Airtable** = Interface linda (cliente entra lá)
2. **Seu Backend** = Orquestrador (API, webhooks, automações)
3. **AI Agent** = Executor (processa eventos e automatiza)
4. **Supabase** = Database (fonte da verdade)
5. **Portais** = Publicação (ZAP, Viva Real, etc.)

Tudo sincronizado, escalável, e o cliente apenas trabalha no Airtable.

Isso é **arquitetura enterprise-grade** para um SaaS imobiliário. 🚀

