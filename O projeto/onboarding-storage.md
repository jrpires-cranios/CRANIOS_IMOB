# Onboarding Não-Técnico + Otimização de Armazenamento

> Objetivo: descrever como fazer onboarding de imobiliárias SEM programadores, e estratégias de armazenamento barato para fotos/vídeos.

---

## 1. Onboarding Não-Técnico (Para Account Managers / Admin)

### 1.1. A Realidade

O checklist-ia-first.md tem 8 fases em 8 horas. **Nem todas precisam de dev.**

Breakdown:
- ✅ **30% podem ser feitas por não-técnico** (onboarding, dados, configuração)
- 🔴 **70% precisam de técnico** (APIs, código, testes)

O segredo é **automação + interfaces amigáveis** para as partes não-técnicas.

### 1.2. O Que Pode Fazer Não-Técnico?

**Fase 1: Cliente Onboarding (30 min)**
- [ ] Preencher formulário simples com dados da imobiliária
- [ ] Fazer upload de logo
- [ ] Listar portais onde anunciam (checkboxes)
- [ ] Número de corretores / apresentadores

**Como:** Formulário web simples, salva em spreadsheet do Google Sheets ou banco

---

**Fase 2A: Upload de Propriedades (1-2 horas)**
- [ ] Receber arquivo Excel/CSV do cliente com imóveis
- [ ] Validar (sem erros óbvios)
- [ ] Clicar botão "IMPORTAR" no painel admin
- [ ] Sistema roda o import automaticamente

**Como:** Interface drag-drop + validação automática

---

**Fase 2B: Cadastro de Corretores (30 min)**
- [ ] Receber lista de corretores (nome, email, telefone)
- [ ] Clicar "IMPORTAR CORRETORES"
- [ ] Sistema cria contas + envia emails aos corretores
- [ ] Corretores criam conta em Cal.com (eles fazem isso)

**Como:** Upload CSV + automação de emails

---

**Fase 2C: Cadastro de Apresentadores (30 min)**
- [ ] Receber lista de apresentadores
- [ ] Upload CSV
- [ ] Sistema cria contas automáticas

**Como:** Simples como corretores

---

**Fase 3: Integração de Canais (1-2 horas, depende do cliente)**
- [ ] Para **ZAP/Viva Real:** Passar credenciais (login/senha) → Sistema testa automático
- [ ] Para **WhatsApp:** Passar número → Link de auth automático
- [ ] Para **Instagram:** Passar credenciais Facebook → Sistema testa

**Como:** Painel com "Conectar [Portal]" → OAuth ou formulário simples

---

**Fase 4: Customização Básica de IA (30 min)**
- [ ] Escolher "Tom de voz" (formal, descontraído, premium)
- [ ] Inserir nome da imobiliária
- [ ] Escolher especialização principal (vendas, locação, ambos)
- [ ] Inserir informações sobre financiamento (se oferecem)

**Como:** Dropdowns + text inputs simples, salva em template de prompt

---

**Fase 5: Treinamento (30 min)**
- [ ] Assistir video curto (~5 min) mostrando:
  - Como usar painel de admin
  - Como interpretar dashboard
  - Como ajustar pesos de corretores
  - Como ver analytics
- [ ] Fazer teste simples (conversar com IA de teste)
- [ ] Q&A com Account Manager

**Como:** Videos gravados + Zoom ao vivo para dúvidas

---

**Fase 6: Go-Live (15 min)**
- [ ] Clicar "ATIVAR" no painel
- [ ] Sistema ativa webhooks, inicia coleta de leads
- [ ] Pronto!

**Como:** Um botão, confirma antes de clicar

---

### 1.3. O Que Precisa de Técnico?

- Testes de webhook (confirmar que ZAP/Viva Real estão enviando leads)
- Integração de APIs backend (OpenAI, Cal.com, Google Maps)
- Testes de performance
- Setup de monitoring/alertas
- Troubleshooting se algo cair

---

### 1.4. O Painel "Tenant Admin" (Para Não-Técnico)

**Layout básico:**

```
┌─────────────────────────────────────────────────────┐
│  PAINEL ADMIN - Imobiliária: XYZ Real Estate       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📋 SETUP (6 passos)                               │
│  ├─ [✅] Dados da Imobiliária                      │
│  ├─ [✅] Upload de Propriedades                    │
│  ├─ [✅] Cadastro de Corretores                    │
│  ├─ [✅] Cadastro de Apresentadores                │
│  ├─ [⏳] Integração de Portais (Em Progresso)     │
│  │  ├─ [ ] ZAP - Clique para conectar              │
│  │  ├─ [✅] Viva Real - Conectado                 │
│  │  ├─ [ ] OLX - Clique para conectar              │
│  │  ├─ [ ] WhatsApp - Clique para conectar         │
│  │  └─ [ ] Instagram - Clique para conectar        │
│  ├─ [⏳] Customização de IA                        │
│  │  ├─ Tom de Voz: [Dropdown: Formal / Casual...]  │
│  │  ├─ Especialização: [Dropdown: Vendas / Locação]│
│  │  ├─ Financiamento: [Checkbox] Oferecemos        │
│  │  └─ [SALVAR]                                    │
│  └─ [⏳] Treinamento & Go-Live                     │
│     ├─ [ASSISTIR VIDEO] (5 min)                    │
│     ├─ [TESTE COM IA]                              │
│     └─ [ATIVAR AGORA] (vai para produção)         │
│                                                     │
│  📊 DASHBOARD (Depois de Ativo)                     │
│  ├─ Leads Hoje: 12                                 │
│  ├─ Agendamentos: 5                                │
│  ├─ NPS: 72                                        │
│  └─ [Ver Mais]                                     │
│                                                     │
│  ⚙️ GESTÃO                                          │
│  ├─ Ajustar Pesos de Corretores                    │
│  ├─ Ver Relatórios                                 │
│  ├─ Contatos de Suporte Técnico                    │
│  └─ Documentação                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 1.5. Checklist Revisado (Para Não-Técnico)

**Fase 1-2 (1h): Setup Básico**
- [ ] Preencher form de imobiliária
- [ ] Upload de logo
- [ ] Upload de propriedades (CSV)
- [ ] Upload de corretores (CSV)
- [ ] Upload de apresentadores (CSV)

**Fase 3 (1h): Integração de Canais**
- [ ] Conectar ZAP (passar credenciais)
- [ ] Conectar Viva Real
- [ ] Conectar WhatsApp
- [ ] Conectar Instagram (se usar)

**Fase 4 (30min): Customização IA**
- [ ] Escolher tom
- [ ] Escolher especialização
- [ ] Ativar/desativar tipos de serviço

**Fase 5 (30min): Treinamento**
- [ ] Assistir vídeos
- [ ] Fazer teste com IA
- [ ] Q&A

**Fase 6 (15min): Go-Live**
- [ ] Clicar "ATIVAR"
- [ ] Pronto!

**Total:** ~4-5 horas para não-técnico (vs 8h full stack)

---

### 1.6. Como Estruturar a Equipe

**Modelo Escalável:**

```
1 Account Manager + 1 Admin (não-técnico)
    ↓
Consegue onboard 2-3 imobiliárias por semana
(cada uma em 4-5h de trabalho)

1 Tech Lead + 2 Devs
    ↓
Fazem a parte técnica (APIs, integração, testes)
(compartilhado entre vários clients)
```

**Resultado:** Você **desacopla** onboarding do código.

---

## 2. Otimização de Armazenamento (Fotos + Vídeos)

### 2.1. O Desafio

**Volumes esperados (por imobiliária/mês):**

- Fotos de imóveis: 500-2000 fotos (10-30 imóveis, 20-100 fotos cada)
- Vídeos de Self-Vistoria: 100-500 vídeos (10-50 seg cada, 5-50MB)
- Total: ~2-5 GB/mês por cliente

**Custo se usar cloud ingênuo:**
- AWS S3: ~$0.023 por GB armazenado = $46-115/mês por cliente
- CloudFront (CDN): extra ~$0.085 por GB = +$170-425/mês

**Isso é caro para scale (10+ clientes = $2k+/mês).**

---

### 2.2. Estratégia Multi-Tier (Recomendado)

```
┌─────────────────────────────────────┐
│   FOTOS RECENTES (< 30 dias)        │ ← Hot Data
│   Supabase Storage (barato)         │
│   ~2-3 GB/mês                       │
│   Latência: 50-200ms                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   VÍDEOS DE VISTORIA (ativos)       │ ← Warm Data
│   Bunny CDN (super barato)          │
│   ~1-2 GB/mês                       │
│   Latência: 20-50ms (CDN)           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   ARQUIVOS HISTÓRICOS (>90 dias)    │ ← Cold Data
│   Backblaze B2 (super super barato) │
│   Acessado raramente                │
│   Latência: OK (acesso infrequente) │
└─────────────────────────────────────┘
```

---

### 2.3. Supabase Storage (Para Fotos Recentes)

**O que é:** Storage de blob do Supabase (PostgreSQL + S3 under the hood)

**Preço:**
- Armazenamento: $5/month + $0.025 por GB (após primeiros 10GB)
- **Exemplo:** 50 GB = $5 + (40 × $0.025) = **$6/mês** ✅

**Vantagens:**
- Integrado com Supabase (Auth, DB, tudo junto)
- Muito barato
- Fácil de usar
- RLS (Row Level Security) built-in

**Como usar:**

```javascript
// Upload de foto do imóvel
const { data, error } = await supabase.storage
  .from('property-photos')
  .upload(`properties/${property_id}/${filename}`, file, {
    cacheControl: '3600',
    upsert: false
  });

// Receber URL pública
const { data: { publicUrl } } = supabase.storage
  .from('property-photos')
  .getPublicUrl(`properties/${property_id}/${filename}`);
```

**⚠️ Problema:** Supabase Storage é OK para fotos, mas vídeos grandes (10-50MB) podem ser lentos.

---

### 2.4. Bunny CDN (Para Vídeos de Vistoria)

**O que é:** CDN com preço ridiculamente barato

**Preço:**
- Armazenamento: $0.01 por GB/mês
- Download (CDN): $0.03 por GB transferido (vs $0.085 no CloudFront)
- **Exemplo:** 30GB armazenado + 100GB transferido/mês = $0.30 + $3 = **$3.30/mês** ✅

**Vantagens:**
- **Mais barato que qualquer alternativa**
- CDN global automático
- Upload/download rápido
- Suporta streaming de vídeo

**Como usar:**

```javascript
// Upload de vídeo de vistoria para Bunny
const bunnyAPI = 'https://storage.bunnycdn.com';
const storageZone = 'imobiliario-videos';

async function uploadVistoriaVideo(video_file, vistoria_id) {
  const formData = new FormData();
  formData.append('file', video_file);
  
  const response = await fetch(
    `${bunnyAPI}/${storageZone}/vistoria/${vistoria_id}/${video_file.name}`,
    {
      method: 'PUT',
      headers: {
        'AccessKey': process.env.BUNNY_ACCESS_KEY
      },
      body: video_file
    }
  );
  
  // URL pública fica:
  // https://imobiliario-videos.b-cdn.net/vistoria/{id}/{filename}
  
  return response;
}
```

---

### 2.5. Backblaze B2 (Para Arquivos Históricos)

**O que é:** Armazenamento de objetos super barato (alternativa ao S3)

**Preço:**
- Armazenamento: $0.006 por GB/mês
- **Exemplo:** 100GB histórico = $0.60/mês ✅

**Vantagens:**
- Mais barato que qualquer coisa
- Replicação automática
- Pode viver atrás de Bunny CDN se precisar acesso rápido

**Como:** Menos importante para operação diária. Fotos/vídeos com >90 dias movem para B2 automaticamente.

---

### 2.6. Arquitetura Completa (Exemplo)

```
Cliente faz upload de foto do imóvel
        ↓
Sistema salva em Supabase Storage
        ↓
URL pública: https://supabase.com/storage/...
        ↓
Exibe no dashboard, sites, portais
        ↓
[30 dias depois, cron job roda]
        ↓
Move para Backblaze B2
        ↓
URL muda para: https://imobiliario.b2.com/... (ou via Bunny CDN se precisar)
        ↓
Acesso raro, mas ainda disponível

---

Cliente faz Self-Vistoria com vídeo (20MB)
        ↓
Sistema salva em Bunny CDN (direto)
        ↓
URL pública: https://imobiliario-videos.b-cdn.net/...
        ↓
Exibe no painel da vistoria
        ↓
Corretores baixam para análise
        ↓
[90 dias depois]
        ↓
Move para Backblaze B2
```

---

### 2.7. Custo Estimado (10 Imobiliárias)

**Cenário:**
- 10 imobiliárias ativas
- Cada uma: 2GB fotos/mês + 1GB vídeos/mês
- Total: 30GB/mês (fotos + vídeos)
- + 500GB histórico acumulado

**Breakdown mensal:**

| Serviço | Uso | Preço |
|---------|-----|-------|
| Supabase Storage | 20GB fotos | $5 + (10 × $0.025) = $5.25 |
| Bunny CDN | 10GB vídeos, 100GB transfer | $0.10 + $3 = $3.10 |
| Backblaze B2 | 500GB histórico | 500 × $0.006 = $3 |
| **TOTAL** | **~30GB hot, 500GB cold** | **~$11.35/mês** |

**Vs AWS:**
- AWS S3: 30GB × $0.023 = $0.69
- AWS CloudFront: 100GB × $0.085 = $8.50
- AWS Glacier (histórico): 500GB × $0.004 = $2
- **TOTAL AWS: $11.19** (similar, mas Bunny é mais simples)

✅ **Conclusão:** Com Supabase + Bunny + B2, você paga ~$11-15/mês para 10 clientes.

---

## 3. Supabase Storage: Vale a Pena?

### 3.1. Prós
- ✅ Integrado com Supabase (já tem Auth, DB, tudo)
- ✅ RLS (Row Level Security) built-in = cada cliente só vê suas fotos
- ✅ Barato
- ✅ Fácil de usar

### 3.2. Contras
- ❌ Não é ideal para vídeos grandes (streaming pode ser lento)
- ❌ Sem CDN global automático (CloudFront extra caro)
- ❌ Upload/download lentos para clientes distantes

### 3.3. Recomendação
✅ **Use Supabase para fotos** (fazer upload, exibir em dashboard)
❌ **NÃO use para vídeos** (use Bunny em vez)

---

## 4. Arquitetura de Código (Como Implementar)

### 4.1. Service de Upload (Node.js)

```javascript
// src/services/storage.service.js

const supabase = require('@supabase/supabase-js').createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const bunny = require('@bunnycdn/bunny-sdk');

/**
 * Upload de foto (para Supabase)
 */
async function uploadPropertyPhoto(file, property_id, tenant_id) {
  const filename = `${Date.now()}-${file.originalname}`;
  const path = `properties/${tenant_id}/${property_id}/${filename}`;
  
  const { data, error } = await supabase.storage
    .from('property-photos')
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '86400'  // 1 dia
    });
  
  if (error) throw error;
  
  // Retorna URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('property-photos')
    .getPublicUrl(path);
  
  return {
    filename,
    url: publicUrl,
    size: file.size,
    storage: 'supabase'
  };
}

/**
 * Upload de vídeo de vistoria (para Bunny)
 */
async function uploadVistoriaVideo(file, vistoria_id, tenant_id) {
  const filename = `${Date.now()}-${file.originalname}`;
  const path = `vistoria/${tenant_id}/${vistoria_id}/${filename}`;
  
  const bunnyStorage = new bunny.BunnyStorage({
    accessKey: process.env.BUNNY_ACCESS_KEY,
    storageZone: process.env.BUNNY_STORAGE_ZONE  // 'imobiliario-videos'
  });
  
  const result = await bunnyStorage.upload(path, file.buffer);
  
  if (!result.success) throw new Error('Bunny upload failed');
  
  return {
    filename,
    url: `${process.env.BUNNY_CDN_URL}/${path}`,
    size: file.size,
    duration: file.duration,  // Se tiver metadata
    storage: 'bunny'
  };
}

module.exports = {
  uploadPropertyPhoto,
  uploadVistoriaVideo
};
```

### 4.2. Rotas de Upload (Express)

```javascript
// src/routes/storage.routes.js

router.post('/properties/:property_id/photos', 
  authenticate, 
  multer.single('photo'),
  async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const { property_id } = req.params;
      
      const result = await storageService.uploadPropertyPhoto(
        req.file,
        property_id,
        tenant_id
      );
      
      // Salvar referência no banco
      await db.query(
        'INSERT INTO property_media (property_id, url, type, storage) VALUES ($1, $2, $3, $4)',
        [property_id, result.url, 'photo', 'supabase']
      );
      
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post('/vistoria/:vistoria_id/videos',
  authenticate,
  multer.single('video'),
  async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const { vistoria_id } = req.params;
      
      const result = await storageService.uploadVistoriaVideo(
        req.file,
        vistoria_id,
        tenant_id
      );
      
      // Salvar no banco
      await db.query(
        'INSERT INTO vistoria_media (vistoria_id, url, type, storage) VALUES ($1, $2, $3, $4)',
        [vistoria_id, result.url, 'video', 'bunny']
      );
      
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
```

### 4.3. Automação: Move para Cold Storage (Cron)

```javascript
// src/jobs/archive-old-media.job.js

const cron = require('node-cron');

/**
 * Roda diariamente: move fotos/vídeos com >90 dias para Backblaze B2
 */
cron.schedule('0 2 * * *', async () => {
  console.log('🗄️ Iniciando archivamento de mídia antiga...');
  
  try {
    // Buscar mídia com >90 dias
    const oldMedia = await db.query(
      `SELECT * FROM property_media 
       WHERE created_at < NOW() - INTERVAL '90 days'
       AND archived_at IS NULL`
    );
    
    for (let media of oldMedia.rows) {
      // Download do Supabase
      const file = await downloadFromSupabase(media.url);
      
      // Upload para Backblaze B2
      const b2Result = await uploadToBackblaze(file, media.id);
      
      // Atualizar DB
      await db.query(
        `UPDATE property_media 
         SET storage = 'backblaze', 
             archived_url = $1,
             archived_at = NOW()
         WHERE id = $2`,
        [b2Result.url, media.id]
      );
      
      // Deletar do Supabase (economizar espaço)
      await deleteFromSupabase(media.url);
    }
    
    console.log(`✅ Archivados ${oldMedia.rows.length} arquivos`);
  } catch (err) {
    console.error('❌ Erro no archivamento:', err);
  }
});

module.exports = cron;
```

---

## 5. Checklist de Implementação

- [ ] Criar conta Supabase + bucket `property-photos`
- [ ] Criar conta Bunny CDN + storage zone `imobiliario-videos`
- [ ] Criar conta Backblaze B2 (para histórico)
- [ ] Implementar serviço `storage.service.js`
- [ ] Implementar rotas de upload
- [ ] Testar upload/download
- [ ] Configurar RLS no Supabase (cada tenant só acessa seus arquivos)
- [ ] Implementar cron de archivamento
- [ ] Monitorar custos (Dashboard do Bunny/Supabase)

---

## 6. Monitoramento de Custos

**Rastrear:**
- Supabase: Dashboard → Storage
- Bunny: Dashboard → Statistics
- Backblaze: Account → Billing

**Alerta se:**
- Supabase > $20/mês (indica crescimento, revisar retenção)
- Bunny > $10/mês por cliente (pode otimizar vídeos)
- Total storage > 100GB/cliente (considerar compressão)

---

## Resumo

| Solução | Fotos | Vídeos | Histórico | Custo/mês (10 clientes) |
|---------|-------|--------|-----------|------------------------|
| AWS S3 + CloudFront | ✅ | ✅ | ❌ | $150+ |
| **Supabase + Bunny + B2** | ✅✅ | ✅✅ | ✅ | **$15** |
| Google Cloud Storage | ✅ | ✅ | ✅ | $80+ |

**Recomendação final:** Supabase (fotos) + Bunny (vídeos) + Backblaze (histórico).
Você economiza **>90% em armazenamento** vs AWS.

