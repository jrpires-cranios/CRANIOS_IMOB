# Exemplo de Integração em Node.js – CRM Imobiliário ↔ Portais

> Objetivo: fornecer um **exemplo prático**, em Node.js, de como estruturar um backend para integrar seu CRM a portais imobiliários (principalmente via webhooks de leads e feeds/API de anúncios).

---

## 1. Visão Geral da Arquitetura

Este exemplo considera:

- **Backend:** Node.js + Express
- **Banco de dados:** PostgreSQL (poderia ser outro relacional)
- **Objetivos principais:**
  - Receber **leads** dos portais (webhooks HTTP `POST`)
  - Salvar leads e imóveis no banco
  - Ter rotas REST para consultar e manipular esses dados

Não é um “produto pronto”, mas um **starting point** sobre o qual você pode evoluir.

---

## 2. Estrutura de Pastas Sugerida

```text
projeto-crm-imobiliario/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── logger.js
│   ├── routes/
│   │   ├── leads.routes.js
│   │   ├── properties.routes.js
│   │   └── webhooks.routes.js
│   ├── controllers/
│   │   ├── leads.controller.js
│   │   ├── properties.controller.js
│   │   └── webhooks.controller.js
│   ├── services/
│   │   ├── leads.service.js
│   │   └── properties.service.js
│   ├── models/
│   │   ├── lead.model.js
│   │   └── property.model.js
│   └── app.js
├── .env
├── package.json
└── server.js
```

---

## 3. package.json (exemplo básico)

```json
{
  "name": "crm-imobiliario-omni",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "body-parser": "^1.20.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.35.0",
    "winston": "^3.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

---

## 4. Configuração de Ambiente (.env)

```bash
PORT=3000
NODE_ENV=development

# Banco de dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_imobiliario
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

# Chaves de integrações (exemplos)
GRUPOZAP_TOKEN=sua_chave_aqui
```

> Nunca faça commit do `.env`. Use `.env.example` com valores fictícios no repositório.

---

## 5. Conexão com Banco (src/config/db.js)

```js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

module.exports = sequelize;
```

---

## 6. Logger Simples (src/config/logger.js)

```js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;
```

---

## 7. Modelos (Sequelize) – Imóvel e Lead

### 7.1. Imóvel (src/models/property.model.js)

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  externalCode: { // Código do imóvel no portal / imobiliária
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: DataTypes.STRING,
  state: DataTypes.STRING,
  neighborhood: DataTypes.STRING,
  priceSale: DataTypes.DECIMAL,
  priceRent: DataTypes.DECIMAL,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  }
}, {
  tableName: 'properties',
  timestamps: true
});

module.exports = Property;
```

### 7.2. Lead (src/models/lead.model.js)

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Property = require('./property.model');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  externalId: { // ID do lead no portal
    type: DataTypes.STRING,
    unique: true
  },
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  message: DataTypes.TEXT,
  source: DataTypes.STRING, // zap, vivareal, quintoandar, etc.
  status: {
    type: DataTypes.STRING,
    defaultValue: 'new'
  }
}, {
  tableName: 'leads',
  timestamps: true
});

Property.hasMany(Lead, { foreignKey: 'propertyId' });
Lead.belongsTo(Property, { foreignKey: 'propertyId' });

module.exports = Lead;
```

---

## 8. App Express (src/app.js)

```js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const logger = require('./config/logger');
const sequelize = require('./config/db');

// Rotas
const leadsRoutes = require('./routes/leads.routes');
const propertiesRoutes = require('./routes/properties.routes');
const webhooksRoutes = require('./routes/webhooks.routes');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

app.use('/api/leads', leadsRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Inicialização do banco
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // em produção use migrations
    logger.info('Banco conectado');
  } catch (err) {
    logger.error('Erro ao conectar banco', err);
  }
})();

module.exports = app;
```

---

## 9. Server (server.js)

```js
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`CRM rodando na porta ${PORT}`);
});
```

---

## 10. Rotas e Controllers Essenciais

### 10.1. Webhook de Lead (ex.: Grupo ZAP) – Rota

`src/routes/webhooks.routes.js`

```js
const express = require('express');
const router = express.Router();
const webhooksController = require('../controllers/webhooks.controller');

router.post('/grupozap/lead', webhooksController.handleGrupoZapLead);

module.exports = router;
```

### 10.2. Controller – Receber Lead

`src/controllers/webhooks.controller.js`

```js
const leadsService = require('../services/leads.service');
const logger = require('../config/logger');

exports.handleGrupoZapLead = async (req, res) => {
  try {
    const payload = req.body;

    // Exemplo de payload simplificado esperado do portal
    // {
    //   leadId: 'abc123',
    //   imovelCodigo: 'COD123',
    //   nome: 'João',
    //   email: 'joao@email',
    //   telefone: '+55 11 9... ',
    //   mensagem: 'Gostaria de visitar',
    //   origem: 'zap_imoveis'
    // }

    const lead = await leadsService.createFromGrupoZap(payload);

    return res.status(200).json({ success: true, id: lead.id });
  } catch (err) {
    logger.error('Erro webhook GrupoZAP', err);
    return res.status(500).json({ success: false });
  }
};
```

### 10.3. Service – Normalizar e Salvar Lead

`src/services/leads.service.js`

```js
const Lead = require('../models/lead.model');
const Property = require('../models/property.model');

exports.createFromGrupoZap = async (payload) => {
  // Idempotência: não duplicar
  if (payload.leadId) {
    const existing = await Lead.findOne({ where: { externalId: payload.leadId } });
    if (existing) return existing;
  }

  // Localizar ou criar imóvel correspondente
  let property = null;
  if (payload.imovelCodigo) {
    property = await Property.findOne({ where: { externalCode: payload.imovelCodigo } });
  }

  const lead = await Lead.create({
    externalId: payload.leadId,
    name: payload.nome,
    email: payload.email,
    phone: payload.telefone,
    message: payload.mensagem,
    source: payload.origem || 'zap_imoveis',
    propertyId: property ? property.id : null
  });

  return lead;
};
```

---

## 11. Rotas para Consultar Leads

`src/routes/leads.routes.js`

```js
const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leads.controller');

router.get('/', leadsController.list); // listar leads com filtros simples
router.get('/:id', leadsController.getById);

module.exports = router;
```

`src/controllers/leads.controller.js`

```js
const Lead = require('../models/lead.model');

exports.list = async (req, res) => {
  const { status, source } = req.query;
  const where = {};
  if (status) where.status = status;
  if (source) where.source = source;

  const leads = await Lead.findAll({ where, order: [['createdAt', 'DESC']] });
  res.json(leads);
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  const lead = await Lead.findByPk(id);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
  res.json(lead);
};
```

---

## 12. Testando com curl (Simulação de Webhook)

```bash
curl -X POST http://localhost:3000/api/webhooks/grupozap/lead \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "lead_123",
    "imovelCodigo": "APTO_SP_001",
    "nome": "João da Silva",
    "email": "joao@example.com",
    "telefone": "+55 11 99999-9999",
    "mensagem": "Gostaria de agendar uma visita",
    "origem": "zap_imoveis"
  }'
```

Se tudo estiver correto, você deve receber uma resposta semelhante a:

```json
{
  "success": true,
  "id": "UUID-gerado"
}
```

---

## 13. Próximos Passos

1. **Adicionar autenticação** (JWT/OAuth) para o painel interno do CRM.
2. **Criar camada de serviço para envio de imóveis** (via XML ou API, dependendo do portal).
3. **Adicionar mais webhooks** para outros portais (QuintoAndar, OLX, etc.), sempre normalizando o payload para o mesmo modelo de Lead.
4. **Criar dashboards** para acompanhar volume de leads por origem, conversão, tempo de resposta.

---

Este exemplo deve ser suficiente para um **MVP de backend** que recebe leads dos portais imobiliários e centraliza essas informações em um CRM próprio, pronto para ser acoplado a um front-end e a um sistema de atendimento omnichannel (WhatsApp, chat web, telefone, etc.).
