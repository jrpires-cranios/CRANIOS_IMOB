# Airtable Setup – Configuração Completa para Imobiliárias

> Objetivo: guia passo-a-passo de como configurar Airtable para cada cliente, incluindo tabelas, campos, automações e webhooks.

---

## 1. Preparação Inicial

### 1.1. Conta Airtable (Do Cliente ou Sua)

**Opção A: Cliente cria própria conta** (Recomendado para compliance)
- Cliente vai para airtable.com
- Cria conta com email da empresa
- Compartilha com você (ou você fica como editor)

**Opção B: Você cria workspace na sua conta**
- Você cria um workspace para cada cliente
- Cliente acessa como "Guest" ou "Collaborator"
- Mais fácil de controlar, mas menos autônomo para cliente

**Recomendação:** Opção A (cliente independente)

---

## 2. Estrutura de Bases e Tabelas

### 2.1. Base Principal: "GESTÃO DE IMÓVEIS"

Cada cliente terá 1 base com múltiplas tabelas.

```
Base: GESTÃO DE IMÓVEIS
├── Table: 🏠 Propriedades
├── Table: 📊 Corretores
├── Table: 🎥 Vistorias
├── Table: 📈 Analytics (view apenas)
└── Table: ⚙️ Configurações Internas (não mostrar para cliente)
```

---

### 2.2. Table 1: 🏠 PROPRIEDADES

**Campos principais:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| **ID Airtable** | Autonumber | Sim | ID único da tabela |
| **Endereço** | Single line text | Sim | Rua, número, cidade |
| **Tipo** | Single select | Sim | Casa / Apt / Sala / etc |
| **Quartos** | Number | Sim | Quantidade |
| **Banheiros** | Number | Não | Quantidade |
| **Área (m²)** | Number | Não | Metragem total |
| **Preço** | Currency | Sim | Valor em R$ |
| **Descrição** | Long text | Não | Detalhes adicionais |
| **Fotos** | Attachments | Não | Upload de imagens |
| **Vídeos** | Attachments | Não | Upload de vídeos |
| **Status** | Single select | Sim | "Aguardando" / "Publicado" / "Vendido" / "Arquivado" |
| **Data Publicação** | Date | Não | Auto-preenchida quando publica |
| **Supabase ID** | Single line text | Não | ID no banco real (preenchido por bot) |
| **Publicado Em** | Multiple select | Não | "ZAP" / "Viva Real" / "OLX" / "Instagram" (preenchido por bot) |
| **Data Criação** | Created time | Sim | Auto-generated |
| **Última Edição** | Last modified time | Sim | Auto-generated |
| **Observações** | Long text | Não | Notas internas da equipe |

**Grid View Padrão:**

```
Configurar colunas visíveis:
├─ ID Airtable
├─ Endereço
├─ Tipo
├─ Quartos
├─ Preço
├─ Status
├─ Publicado Em
└─ Data Publicação
```

**Gallery View (Visual):**

```
Mostrar:
├─ Foto principal (cover)
├─ Título: Endereço + Tipo
├─ Subtítulo: Preço + Quartos/Banheiros
└─ Status como badge
```

---

### 2.3. Table 2: 📊 CORRETORES

**Campos:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| **ID** | Autonumber | Sim |
| **Nome Completo** | Single line text | Sim |
| **Email** | Email | Sim |
| **Telefone** | Phone number | Sim |
| **CRECI** | Single line text | Não |
| **Status** | Single select | Sim ("Ativo" / "Inativo") |
| **Cal.com Username** | Single line text | Não |
| **Peso Roteamento** | Number | Sim (default: 1) |
| **Propriedades Atribuídas** | Link to another record | Não |
| **Data Ingresso** | Date | Não |

---

### 2.4. Table 3: 🎥 VISTORIAS

**Campos:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| **ID** | Autonumber | Sim |
| **Propriedade** | Link to Propriedades | Sim |
| **Cliente** | Single line text | Sim |
| **Data Vistoria** | Date | Sim |
| **Corretor** | Link to Corretores | Sim |
| **Fotos Vistoria** | Attachments | Não |
| **Vídeo Vistoria** | Attachments | Não |
| **Status** | Single select | Sim ("Agendada" / "Realizada" / "Cancelada") |
| **Notas Vistoria** | Long text | Não |
| **Lead ID (Supabase)** | Single line text | Não |

---

## 3. Automações Nativas do Airtable

### 3.1. Automação: Novo Imóvel → Webhook

**Trigger:** Quando um novo record é criado em "Propriedades"

**Ação:** Send webhook notification

```
Webhook Configuration:
Method: POST
URL: https://seu-backend.com/api/webhooks/airtable/property-created
Headers:
  - Authorization: Bearer {seu_token_secreto}
  - Content-Type: application/json

Body JSON:
{
  "event": "property.created",
  "tenantId": "{valor do campo Tenant ID}",
  "airtableRecordId": "{record_id()}",
  "airtableTableId": "{table_id()}",
  "propertyData": {
    "address": "{Endereço}",
    "type": "{Tipo}",
    "bedrooms": "{Quartos}",
    "bathrooms": "{Banheiros}",
    "price": "{Preço}",
    "description": "{Descrição}",
    "photos": "{Fotos}"
  }
}
```

---

### 3.2. Automação: Status Muda para "Publicado"

**Trigger:** Campo "Status" muda para "Publicado"

**Ação:** Update record (preencher Data Publicação)

```
Update field:
  "Data Publicação" = NOW()
```

---

### 3.3. Automação: Status Muda para "Vendido"

**Trigger:** Campo "Status" muda para "Vendido"

**Action 1:** Send webhook

```
POST https://seu-backend.com/api/webhooks/airtable/property-sold

Body:
{
  "event": "property.sold",
  "airtableRecordId": "{record_id()}",
  "supabaseId": "{Supabase ID}",
  "saleDate": "{Data Venda}",
  "salePrice": "{Valor Venda}"
}
```

**Action 2:** Move to another view (opcional, para arquivo)

```
Move record to "Vendidos" view (se quiser organizar por abas)
```

---

### 3.4. Automação: Atualizar Qualquer Campo Importante

**Trigger:** Campo "Preço" ou "Descrição" é modificado

**Ação:** Send webhook (update)

```
POST https://seu-backend.com/api/webhooks/airtable/property-updated

Body:
{
  "event": "property.updated",
  "airtableRecordId": "{record_id()}",
  "supabaseId": "{Supabase ID}",
  "changedFields": {
    "price": "{Preço}",
    "description": "{Descrição}"
  }
}
```

---

## 4. Setup Passo-a-Passo (Para Não-Técnico)

### 4.1. Criar Base

1. Acesse airtable.com
2. Clique "+ Add a workspace" ou "+ Create new base"
3. Nome: "GESTÃO DE IMÓVEIS – [Nome da Imobiliária]"
4. Descrição: "Gestão centralizada de propriedades, corretores e vistorias"

---

### 4.2. Criar Tabela "Propriedades"

1. Na nova base, renomeie a tabela padrão para "🏠 Propriedades"
2. Delete o campo "Name" padrão
3. Crie campos conforme tabela da seção 2.2

**Dica:** Para adicionar campo, clique "+", nomeie, escolha tipo

---

### 4.3. Configurar Tipos de Campo

**Status (Single Select):**
```
Valores:
- Aguardando (cor amarela)
- Publicado (cor verde)
- Vendido (cor vermelha)
- Arquivado (cor cinza)
```

**Tipo (Single Select):**
```
Valores:
- Apartamento
- Casa
- Sala Comercial
- Terreno
- Sobrado
- Kitnet
```

**Publicado Em (Multiple Select):**
```
Valores:
- ZAP
- Viva Real
- OLX
- Instagram
- LinkedIn
- Imobiliário
```

---

### 4.4. Criar Tabelas Secundárias

Repita o processo para:
- 📊 Corretores
- 🎥 Vistorias

**Importante:** Adicione links entre tabelas:
- Propriedades → Corretores (Link field "Corretor Responsável")
- Vistorias → Propriedades (Link field "Propriedade")
- Vistorias → Corretores (Link field "Corretor")

---

### 4.5. Adicionar Views

Para cada tabela, crie:

**Grid View (padrão):** Mostra tudo em tabela

**Gallery View:** Fotos em cards (ótimo para Propriedades)

**Kanban View:** Agrupa por "Status" (ótimo para fluxo)

**Calendar View:** Data de Vistoria em calendário

---

## 5. Setup de Webhooks (Mais Técnico)

### 5.1. Obter API Token do Airtable

1. Airtable.com → Account settings
2. Developer hub → Personal access tokens
3. Criar novo token com escopo "data.records:write"
4. Copiar o token (guarde em lugar seguro)

---

### 5.2. Configurar Automações

No Airtable:
1. Abra a base
2. Na toolbar superior, clique "Automations"
3. Clique "+ Create new automation"

**Automação 1: Novo Imóvel**

```
When: Record created in table "Propriedades"
Then: Send web request

Request Type: POST
Request URL: https://seu-backend.com/api/webhooks/airtable/property-created
Request Headers:
  Authorization: Bearer {seu_api_token}
  Content-Type: application/json

Request Body: (JSON conforme seção 3.1)
```

**Salvar e ativar ✅**

Repita para as automações 3.2, 3.3, 3.4

---

### 5.3. Testar Webhook

1. No Airtable, adicione um novo record "Propriedade" de teste
2. Verifique se webhook foi enviado (seu backend vai logar)
3. Se recebeu, parabéns! ✅

---

## 6. Segurança

### 6.1. Permissões

**Para Cliente (Admin):**
- Edit data
- Edit records
- View automations

**Para Sua Equipe (de Suporte):**
- Editor (acesso total)

**Para Corretores (opcional):**
- Comment only (não podem editar)

Compartilhe base via email do cliente

---

### 6.2. API Key Segura

Nunca commite API keys no código:

```javascript
// .env
AIRTABLE_API_TOKEN=pat_xxxxxxxxxxxx
AIRTABLE_BASE_ID=appxxxxxxxxxxxx

// Usar em código:
const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_API_TOKEN
});
```

---

## 7. Checklist de Setup

- [ ] Base criada com nome da imobiliária
- [ ] Tabela "Propriedades" com todos os campos
- [ ] Tabela "Corretores" pronta
- [ ] Tabela "Vistorias" pronta
- [ ] Views criadas (Grid, Gallery, Kanban)
- [ ] Campos de tipo Single/Multiple Select configurados
- [ ] Links entre tabelas criados
- [ ] 4 Automações de webhook criadas e ativadas
- [ ] Webhooks testados com record de teste
- [ ] Cliente compartilhado na base
- [ ] Documentação compartilhada com cliente (como preencher)

---

## 8. Documentação para Cliente

Crie um documento (Google Docs ou PDF) com:

**"Como Usar Airtable – Guia Rápido"**

```
1. Adicionar Novo Imóvel
   ├─ Clique "+" em Grid view
   ├─ Preencha campos obrigatórios
   ├─ Adicione fotos (clique em "Fotos")
   ├─ Deixe Status = "Aguardando"
   ├─ Salve com Ctrl+Enter
   └─ Sistema automaticamente publica em 5-10 minutos

2. Imóvel Vendido?
   ├─ Encontre o imóvel na tabela
   ├─ Mude Status → "Vendido"
   ├─ Preencha "Data Venda" e "Valor Venda"
   └─ Sistema remove de todos os portais automaticamente

3. Editar Preço ou Descrição
   ├─ Clique no campo
   ├─ Edite
   ├─ Salve
   └─ Publica atualização nos portais em 1-2h

4. Ver Todas as Propriedades por Status
   ├─ Use o Kanban View
   ├─ Arraste entre colunas (Aguardando → Publicado → Vendido)
   └─ Tudo sincroniza automaticamente
```

---

## Conclusão

Com esse setup:
- ✅ Cliente tem interface bonita (Airtable)
- ✅ Você tem integração com seu backend (webhooks)
- ✅ Tudo é automático (automações nativas)
- ✅ Escalável para múltiplos clientes (mesmo padrão)

Próximo passo: Implementar os endpoints de webhook no backend! 🚀

