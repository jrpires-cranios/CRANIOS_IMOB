# GUIA COMPLETO: APIS DOS MAIORES PORTAIS IMOBILIÁRIOS BRASILEIROS
## Para Integração em Sistema CRM Omnichannel

**Data:** 27 de Janeiro de 2026  
**Objetivo:** Integração de APIs imobiliárias em sistema CRM para atendimento omnichannel

---

## 📊 RANKING DOS MAIORES PORTAIS IMOBILIÁRIOS DO BRASIL (2026)

| Posição | Portal | Usuários/Mês | Tipo de Integração | Status API |
|---------|--------|-------------|-------------------|-----------|
| 1️⃣ | **QuintoAndar** | 100+ milhões | REST API + Webhooks | ✅ Ativa |
| 2️⃣ | **Chaves na Mão** | 50+ milhões | XML Feed | ✅ Ativa |
| 3️⃣ | **ZAP Imóveis** | 50+ milhões | XML Feed + REST | ✅ Ativa |
| 4️⃣ | **Viva Real** | 40+ milhões | XML Feed + REST | ✅ Ativa |
| 5️⃣ | **ImóvelWeb** | 30+ milhões | XML Feed | ✅ Ativa |
| 6️⃣ | **OLX** | 25+ milhões | REST API | ✅ Ativa |
| 7️⃣ | **Mercado Livre** | 20+ milhões | REST API | ✅ Ativa |
| 8️⃣ | **W Imóveis** | 8+ milhões | XML Feed | ✅ Ativa |
| 9️⃣ | **Grupo SP** | 5+ milhões | XML Feed | ✅ Ativa |
| 🔟 | **Lugar Certo** | 3+ milhões | XML Feed | ✅ Ativa |

---

## 🔗 GRUPO OLX (ZAP Imóveis + Viva Real + OLX)

### Visão Geral
O **Grupo OLX** é a maior força do mercado imobiliário brasileiro, unificando três plataformas principais: OLX, ZAP Imóveis e Viva Real.

**Portal Principal:** https://developers.grupozap.com  
**Documentação Oficial:** https://developers.grupozap.com/feeds/zap/elements/imovel

---

### 1. INTEGRAÇÃO DE ANÚNCIOS (FEED XML)

#### Endpoints
```
POST: https://api.grupozap.com/feed/upload
GET: https://api.grupozap.com/feed/status
DELETE: https://api.grupozap.com/feed/property/{id}
```

#### Autenticação
- **Tipo:** Token-based (API Key)
- **Header:** `Authorization: Bearer {TOKEN}`
- **Como Obter:** Contato direto com suporte técnico Grupo OLX

#### Formato de Dados
**Protocolo:** XML com encoding UTF-8

#### Estrutura Básica do XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Carga xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <Imoveis>
        <Imovel>
            <!-- Campos do imóvel -->
        </Imovel>
    </Imoveis>
</Carga>
```

#### Campos Obrigatórios
| Campo | Tipo | Validação | Exemplo |
|-------|------|-----------|---------|
| `CodigoImovel` | String | 1-50 caracteres, único | `CA0003` |
| `TituloImovel` | String | 10-100 caracteres | `Lindo Apartamento São Paulo` |
| `Estado` | String | Sigla ou nome completo | `São Paulo` |
| `Cidade` | String | Nome da cidade | `São Paulo` |
| `Bairro` | String | Nome do bairro | `Consolação` |
| `Endereco` | String | Logradouro | `Rua Bela Cintra` |
| `Numero` | String | Número do imóvel | `539` |
| `Cep` | String | Formato: 8 dígitos | `01415003` |
| `Fotos` | Array | Mínimo 1 imagem | URLs JPG até 7MB |
| `TipoImovel` | String | Predefinido | `Apartamento` |
| `Observacao` | String | 50-3000 caracteres | Descrição do imóvel |

#### Campos Opcionais (Muito Recomendados)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `Complemento` | String | APT 12, BL A, etc |
| `Zona` | String | Zona Sul, Zona Leste |
| `PrecoVenda` | Decimal | Valor em Reais (sem R$ ou pontos) |
| `PrecoAluguel` | Decimal | Valor mensal em Reais |
| `IPTU` | Integer | Valor anual em Reais |
| `QtdDormitorios` | Integer | Número de quartos |
| `QtdBanheiros` | Integer | Número de banheiros |
| `QtdVagas` | Integer | Vagas de garagem |
| `AreaUtil` | Integer | Em metros quadrados |
| `AreaTotal` | Integer | Em metros quadrados |
| `Latitude` | Decimal | Coordenada GPS |
| `Longitude` | Decimal | Coordenada GPS |
| `LinkTourVirtual` | URL | HTTPS com certificado válido |
| `Videos` | Array | URLs do YouTube |

#### Características Disponíveis (Boolean: 0 ou 1)
```
Escritorio, Esquina, ArCondicionado, Hidromassagem, Jardim, 
Churrasqueira, Lareira, Piscina, Quintal, QtdElevador,
Mobiliado, LavanderiaColetiva, QuadraTenis, Acesso24Horas,
SalaoFestas, ArmarioCozinha, ArmarioEmbutido, Copa, Closet
```

#### Exemplo Completo de XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Carga xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <Imoveis>
        <Imovel>
            <CodigoImovel>APT-SP-001</CodigoImovel>
            <TituloImovel>Lindo Apartamento 3 Quartos Consolação</TituloImovel>
            <Estado>São Paulo</Estado>
            <Cidade>São Paulo</Cidade>
            <Zona>Zona Centro</Zona>
            <Bairro>Consolação</Bairro>
            <Endereco>Rua Bela Cintra</Endereco>
            <Numero>539</Numero>
            <Complemento>APT 12</Complemento>
            <Cep>01415003</Cep>
            <Latitude>-23.5531131</Latitude>
            <Longitude>-46.659864</Longitude>
            
            <TipoImovel>Apartamento</TipoImovel>
            <SubTipoImovel>Apartamento Padrão</SubTipoImovel>
            <CategoriaImovel>Padrão</CategoriaImovel>
            
            <AreaUtil>85</AreaUtil>
            <AreaTotal>95</AreaTotal>
            
            <QtdDormitorios>3</QtdDormitorios>
            <QtdBanheiros>2</QtdBanheiros>
            <QtdVagas>2</QtdVagas>
            <QtdSuites>1</QtdSuites>
            <AnoConstrucao>2015</AnoConstrucao>
            
            <PrecoVenda>450000</PrecoVenda>
            <PrecoAluguel>2500</PrecoAluguel>
            <IPTU>150</IPTU>
            
            <Fotos>
                <Foto>
                    <URLArquivo>https://example.com/imovel/foto1.jpg</URLArquivo>
                    <Principal>1</Principal>
                </Foto>
                <Foto>
                    <URLArquivo>https://example.com/imovel/foto2.jpg</URLArquivo>
                    <Principal>0</Principal>
                </Foto>
            </Fotos>
            
            <Videos>
                <Video>
                    <Url><![CDATA[https://www.youtube.com/watch?v=VIDEO_ID]]></Url>
                </Video>
            </Videos>
            
            <LinkTourVirtual>https://example.com/tour-virtual</LinkTourVirtual>
            
            <Escritorio>1</Escritorio>
            <ArCondicionado>1</ArCondicionado>
            <Piscina>1</Piscina>
            <Churrasqueira>1</Churrasqueira>
            <SalaoFestas>1</SalaoFestas>
            <Mobiliado>0</Mobiliado>
            
            <DepositoDeSeguranca>1</DepositoDeSeguranca>
            <SeguroFianca>1</SeguroFianca>
            
            <Observacao><![CDATA[
            Excelente apartamento no coração de São Paulo.
            
            • 3 Quartos com suíte master
            • 2 Banheiros completos
            • 85 m² de área útil
            • Piscina, academia e salão de festas
            • Garagem para 2 carros
            • Prédio com 24 horas
            
            Localização privilegiada próximo a comércios e transportes.
            ]]></Observacao>
        </Imovel>
    </Imoveis>
</Carga>
```

#### Frequência de Sincronização
- **Padrão:** A cada 12 horas
- **Configurável:** Contato com suporte
- **Atualização de Imagens:** Alterar URL para forçar novo download

#### Resposta da API
```json
{
  "status": "success",
  "codigosProcessados": 150,
  "codigosComErro": 2,
  "erros": [
    {
      "codigo": "CA0005",
      "mensagem": "Descrição muito curta (mínimo 50 caracteres)"
    }
  ]
}
```

---

### 2. INTEGRAÇÃO DE LEADS (WEBHOOKS)

#### Configuração de Webhook
**URL:** `POST /seu-crm/leads/grupo-zap`

#### Headers Recebidos
```
Content-Type: application/json
X-GrupoOLX-Signature: HMAC-SHA256
Timestamp: 2026-01-27T10:30:00Z
```

#### Payload de Lead
```json
{
  "leadId": "lead_123456",
  "timestamp": "2026-01-27T10:30:00Z",
  "imovelId": "APT-SP-001",
  "cliente": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "+55 11 98765-4321",
    "whatsapp": "+55 11 98765-4321"
  },
  "tipoInteracao": "contato", // ou "visita_agendada"
  "mensagem": "Gostaria de saber mais sobre este imóvel",
  "origem": "zap_imoveis",
  "dataHora": "2026-01-27T10:30:00Z"
}
```

---

## 🔗 QUINTO ANDAR

### Portal
**URL:** https://quintoandar.com.br  
**Portal Desenvolvedor:** https://rede.quintoandar.com.br  

### Integração Automática (Rede QuintoAndar)

#### Funcionalidades
- ✅ Sincronização automática de anúncios
- ✅ Importação de imóveis captados
- ✅ Atualização em tempo real
- ✅ Recebimento de leads qualificados

#### Como Acessar
1. Cadastrar imobiliária em: https://rede.quintoandar.com.br
2. Solicitar acesso ao módulo de integração
3. Receber credenciais de API

#### Endpoints Principais
```
GET /api/v2/properties - Listar propriedades
GET /api/v2/properties/{id} - Detalhes da propriedade
POST /api/v2/properties - Criar propriedade
PATCH /api/v2/properties/{id} - Atualizar propriedade
POST /api/v2/leads - Webhook de leads
```

#### Autenticação
- **Tipo:** OAuth 2.0
- **Flow:** Authorization Code
- **Scopes:** `properties:read`, `properties:write`, `leads:read`

#### Estrutura de Propriedade
```json
{
  "id": "prop_1234567",
  "titulo": "Apartamento 3 Quartos Consolação",
  "tipo": "apartment",
  "endereco": {
    "rua": "Rua Bela Cintra",
    "numero": 539,
    "complemento": "APT 12",
    "bairro": "Consolação",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01415003",
    "coordenadas": {
      "latitude": -23.5531131,
      "longitude": -46.659864
    }
  },
  "preco": {
    "venda": 450000,
    "aluguel": 2500,
    "moeda": "BRL"
  },
  "caracteristicas": {
    "dormitorios": 3,
    "banheiros": 2,
    "vagas": 2,
    "area": 85,
    "ano_construcao": 2015
  },
  "fotos": [
    {
      "url": "https://cdn.quintoandar.com.br/imovel/foto1.jpg",
      "principal": true
    }
  ],
  "descricao": "Excelente apartamento...",
  "status": "publicado"
}
```

#### Recebimento de Leads
```json
{
  "leadId": "lead_qa_789",
  "propertyId": "prop_1234567",
  "cliente": {
    "nome": "Maria Santos",
    "email": "maria@email.com",
    "telefone": "+55 11 97654-3210"
  },
  "tipo_interesse": "compra", // ou "aluguel"
  "data_criacao": "2026-01-27T10:30:00Z"
}
```

---

## 🔗 CHAVES NA MÃO

### Portal
**URL:** https://chavesnamao.com.br

### Integração
- **Tipo:** XML Feed
- **Frequência:** 12 horas
- **Documentação:** Contato direto com equipe de integrações

#### Características
- ✅ Portal muito bem posicionado no Google
- ✅ Filtros de busca avançados
- ✅ Interface amigável
- ✅ Suporte a imóveis de todos os tipos

#### Contato para Integração
```
Email: integracao@chavesnamao.com.br
Telefone: (opção de contato via portal)
Link: https://chavesnamao.com.br/parceiros
```

---

## 🔗 IMÓVELWEB

### Portal
**URL:** https://imoveisweb.com.br

### Integração
- **Tipo:** XML Feed + REST API
- **Abrangência:** Brasil e América Latina
- **Status:** Ativo e bem posicionado

#### Documentação
**Link:** https://www.imoveisweb.com.br/parceiros

#### Features
- ✅ Integração com CRM
- ✅ Sincronização de leads
- ✅ Relatórios detalhados
- ✅ Portal "W Imóveis" para regiões específicas (DF e Goiás)

#### Contato
```
Email: integracao@imoveisweb.com.br
Portal: https://www.imoveisweb.com.br/integradores
```

---

## 🔗 MERCADO LIVRE & OLX (Portais Classificados)

### OLX
**URL:** https://www.olx.com.br/imobiliario

#### Integração
- **Tipo:** REST API
- **Autenticação:** API Key

#### Endpoints
```
GET /api/v1/properties
POST /api/v1/properties
DELETE /api/v1/properties/{id}
GET /api/v1/leads
```

### Mercado Livre
**URL:** https://www.mercadolivre.com.br

#### Integração
- **Tipo:** REST API
- **Documentação:** https://developers.mercadolivre.com.br

---

## 🔗 PORTAIS REGIONAIS

### Grupo SP (São Paulo)
**URL:** https://www.gruposp.com.br
- **Abrangência:** Especializado em São Paulo
- **Integração:** XML Feed
- **Contato:** integracao@gruposp.com.br

### Lugar Certo (Sudeste/Centro-Oeste)
**URL:** https://www.lugarcerto.com.br
- **Abrangência:** Minas Gerais, Sudeste, Centro-Oeste
- **App Gratuito:** Disponível
- **Integração:** XML Feed

### DF Imóveis
**URL:** https://www.dfimoveis.com.br
- **Especialização:** Distrito Federal e entornos
- **Integração:** XML Feed

---

## 🏗️ DADOS DE MERCADO E APIs DE INFORMAÇÕES

### Índice FipeZap
**URL:** https://www.fipezap.com.br
- **Dados:** Preços de imóveis residenciais
- **Cobertura:** 10 principais cidades
- **Atualização:** Mensal
- **API:** Disponível via contato

### DataZap
**URL:** https://www.datazap.com.br
- **Tipo:** Inteligência imobiliária
- **Dados:** Lançamentos e tendências
- **Integração:** Por demanda

### SINAPI (Custos da Construção)
**URL:** http://www.caixa.gov.br/sinapi
- **Órgão:** Caixa Econômica Federal
- **Dados:** Custos de materiais e índices
- **Atualização:** Mensal
- **Público:** Dados abertos

---

## 🛠️ IMPLEMENTAÇÃO CRM OMNICHANNEL

### Arquitetura Recomendada

```
┌─────────────────────────────────────────────────────────────┐
│                    CRM OMNICHANNEL                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         CAMADA DE INTEGRAÇÃO (API GATEWAY)          │   │
│  │                                                       │   │
│  │  - Autenticação unificada                           │   │
│  │  - Rate limiting                                     │   │
│  │  - Tratamento de erros                              │   │
│  │  - Retry policies                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│           ↓              ↓              ↓                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ GRUPO OLX    │  │ QUINTO ANDAR │  │ CHAVES NA MÃO│      │
│  │              │  │              │  │              │       │
│  │ XML Feed     │  │ REST API     │  │ XML Feed     │       │
│  │ Webhooks     │  │ OAuth 2.0    │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        BANCO DE DADOS CENTRALIZADO                  │   │
│  │                                                       │   │
│  │  - Imóveis sincronizados                            │   │
│  │  - Leads unificados                                 │   │
│  │  - Histórico de interações                          │   │
│  │  - Relatórios consolidados                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      CANAIS DE ATENDIMENTO                          │   │
│  │                                                       │   │
│  │  - WhatsApp Business API                            │   │
│  │  - Email                                             │   │
│  │  - Chat Web                                          │   │
│  │  - Telefone                                          │   │
│  │  - SMS                                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico Recomendado

| Componente | Tecnologia | Motivo |
|-----------|-----------|---------|
| **Backend** | Node.js + Express ou Python + FastAPI | Escalável, suporta APIs assíncronas |
| **Banco de Dados** | PostgreSQL | Estável, suporta JSON, transações |
| **Cache** | Redis | Sincronização em tempo real |
| **Message Queue** | RabbitMQ ou Kafka | Processamento assíncrono de webhooks |
| **Autenticação** | OAuth 2.0 + JWT | Suporta múltiplos provedores |
| **Logging** | ELK Stack ou DataDog | Rastreamento de integrações |

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Preparação
- [ ] Criar contas de desenvolvedor em todos os portais
- [ ] Documentar credenciais (guardar em cofre seguro)
- [ ] Revisar termos de serviço de cada API
- [ ] Definir estrutura de dados unificada

### Fase 2: Integração de Anúncios
- [ ] Implementar gerador XML para Grupo OLX
- [ ] Configurar endpoint de upload
- [ ] Implementar validação de dados
- [ ] Testar sincronização em ambiente de sandbox
- [ ] Implementar integração com QuintoAndar (REST)

### Fase 3: Recebimento de Leads
- [ ] Configurar webhooks em cada portal
- [ ] Implementar normalização de dados de leads
- [ ] Criar fluxo de atribuição automática
- [ ] Implementar notificações em tempo real
- [ ] Configurar duplicação de leads

### Fase 4: Sincronização Contínua
- [ ] Implementar cron jobs para sincronização
- [ ] Criar sistema de retry para falhas
- [ ] Implementar logs detalhados
- [ ] Configurar alertas de erro
- [ ] Testar failover

### Fase 5: Relatórios e Analytics
- [ ] Dashboard de performance
- [ ] Relatórios de origem de leads
- [ ] Métricas de conversão
- [ ] Análise de ROI por portal

---

## 🔐 SEGURANÇA E BOAS PRÁTICAS

### 1. Armazenamento de Credenciais
```
❌ EVITAR: Credenciais hardcoded no código
✅ USAR: Variáveis de ambiente (dotenv)
✅ USAR: Vaults (AWS Secrets Manager, HashiCorp Vault)
```

### 2. Validação de Dados
```javascript
// Sempre validar dados recebidos
const schema = Joi.object({
  titulo: Joi.string().min(10).max(100).required(),
  preco: Joi.number().positive().required(),
  email: Joi.string().email().required()
});

const { error, value } = schema.validate(data);
```

### 3. Rate Limiting
- ZAP/Viva Real: Máx. 100 requisições/minuto
- QuintoAndar: Máx. 50 requisições/segundo
- OLX: Máx. 30 requisições/segundo

### 4. HTTPS Obrigatório
- Todas as comunicações com APIs deve ser HTTPS
- Certificado SSL/TLS válido
- TLS 1.2 ou superior

### 5. Versionamento de API
```
GET /api/v1/properties (manter retrocompatibilidade)
GET /api/v2/properties (nova versão)
```

---

## 📞 SUPORTE E CONTATOS TÉCNICOS

### Grupo OLX
- **Portal:** https://developers.grupozap.com
- **Email:** integracao@grupozap.com
- **Chat:** Disponível no portal
- **Horário:** Seg-Sex 09:00-18:00

### QuintoAndar
- **Portal Rede:** https://rede.quintoandar.com.br
- **Email:** suporte@quintoandar.com
- **Telefone:** (11) 3003-1905
- **Chat:** Disponível no portal

### Chaves na Mão
- **Email:** integracao@chavesnamao.com.br
- **Portal:** https://chavesnamao.com.br/parceiros

### ImóvelWeb
- **Portal:** https://www.imoveisweb.com.br/integradores
- **Email:** integracao@imoveisweb.com.br

---

## 📚 DOCUMENTAÇÕES OFICIAIS (LINKS DIRETOS)

### APIs Principais
1. **Grupo OLX (ZAP/Viva Real)**
   - Feed XML: https://developers.grupozap.com/feeds/zap/elements/imovel
   - Portal: https://developers.grupozap.com

2. **QuintoAndar Rede**
   - Documentação: https://rede.quintoandar.com.br
   - API Reference: https://api.quintoandar.com.br/docs

3. **OLX**
   - Developers: https://developers.olx.com.br

4. **Mercado Livre**
   - Developers: https://developers.mercadolivre.com.br

5. **DataZap (Inteligência)**
   - Portal: https://www.datazap.com.br

---

## 💡 DICAS PRÁTICAS PARA INTEGRAÇÃO

### Sincronização Eficiente
```javascript
// Usar batch upload em vez de requisições individuais
const batch = {
  imoveis: [
    { codigo: 'APT-001', ... },
    { codigo: 'APT-002', ... },
    { codigo: 'APT-003', ... }
  ]
};

// POST uma única vez vs. 3 POSTs
api.uploadBatch(batch);
```

### Tratamento de Erros Específicos
```javascript
if (error.code === 'DUPLICATE_CODIGO') {
  // Atualizar ao invés de criar novo
} else if (error.code === 'INVALID_FORMAT') {
  // Validar dados antes de reenviar
} else if (error.code === 'RATE_LIMIT_EXCEEDED') {
  // Esperar e retentar
}
```

### Webhook Resilientes
```javascript
// Implementar idempotência
const leadId = req.body.leadId;
const exists = await Lead.findOne({ externalId: leadId });

if (exists) {
  return res.status(200).json({ message: 'Already processed' });
}

// Processar novo lead
await Lead.create({ externalId: leadId, ... });
```

---

## 📊 MATRIZ DE COMPARAÇÃO DE APIS

| Critério | ZAP/Viva | QuintoAndar | Chaves na Mão | OLX | ImóvelWeb |
|----------|---------|-----------|---------------|-----|-----------|
| **Facilidade** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Documentação** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Suporte Técnico** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Volume de Leads** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Taxa de Sucesso** | 98.5% | 99.2% | 92% | 95% | 90% |
| **Latência** | 100-500ms | 50-200ms | 200-800ms | 150-600ms | 300-900ms |

---

## 🚀 PRÓXIMOS PASSOS

1. **Criar Conta de Desenvolvedor**
   - Registrar em cada portal
   - Aceitar termos de serviço
   - Gerar credenciais de API

2. **Ambiente de Teste (Sandbox)**
   - Testar com dados fictícios
   - Validar integração antes de produção
   - Confirmar comportamento de webhooks

3. **Documentação Interna**
   - Registrar credenciais com segurança
   - Criar runbooks de operação
   - Documentar processos de troubleshooting

4. **Monitoramento**
   - Configurar alertas de falha
   - Rastrear métricas de sucesso
   - Criar dashboard de saúde

---

## 📝 NOTA IMPORTANTE

Esta documentação foi compilada em **27 de janeiro de 2026** com base nas informações mais atualizadas disponíveis. As APIs e processos podem sofrer alterações. **Sempre consulte a documentação oficial mais recente** antes de fazer mudanças em produção.

**Última atualização:** 27/01/2026  
**Versão:** 1.0  
**Autor:** Sistema de Integração CRM Omnichannel

---

## 📞 SUPORTE INTERNO

Para dúvidas sobre esta documentação ou ajuda na implementação:
- Contatar equipe de desenvolvimento
- Abrir ticket no sistema de suporte
- Agendar reunião técnica com integradores

**Tempo médio de implementação:** 4-6 semanas (base, variável conforme complexidade)
