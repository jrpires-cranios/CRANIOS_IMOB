# Tarefas Manuais do Junior - Cranios IMOB

Data: 2026-05-26

Este documento lista tarefas que dependem de acesso, decisao comercial, paineis externos, pagamento, 2FA ou permissao do proprietario. Elas aceleram o fechamento do projeto e evitam bloqueios tecnicos.

## 1. GitHub

### Obrigatorio

1. Garantir que a conta correta tenha permissao de escrita no repositorio:
   `jrpires-cranios/CRANIOS_IMOB`

2. Resolver o erro anterior:
   `Permission to jrpires-cranios/CRANIOS_IMOB.git denied to VitaFlowia`

3. Escolher uma das opcoes:
   - adicionar a conta atual como collaborator/admin;
   - trocar o remote para uma conta com permissao;
   - criar novo repo oficial e apontar Coolify para ele.

### Informar para execucao

- URL final do repo.
- Branch final de deploy.
- Se usara repo atual ou novo repo limpo.

## 2. Coolify

### Obrigatorio

1. Confirmar que a app usa Build Pack: `Dockerfile`.
2. Porta interna: `3000`.
3. Healthcheck: `/api/health`.
4. Desabilitar build-time para segredos.
5. Confirmar dominio provisiorio ou real.

### Variaveis essenciais no Coolify

Configurar como runtime:

- `NODE_ENV=production`
- `PORT=3000`
- `HOST=0.0.0.0`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `OPENAI_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME=cranios-imob-knowledge`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_DOMAIN` ou `R2_PUBLIC_URL`
- `UAZAPI_BASE_URL`
- `UAZAPI_TOKEN`
- `UAZAPI_INSTANCE`
- `RESEND_API_KEY`
- `ASAAS_SANDBOX`
- `ASAAS_WEBHOOK_TOKEN`
- `ASSINAFY_API_KEY`
- `ASSINAFY_TEMPLATE_ID`
- `CALCOM_API_KEY`
- `CALCOM_ONBOARDING_URL`
- `JWT_SECRET`
- `MASTER_KEY_HASH`
- `CORS_ORIGIN`
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
- `PUPPETEER_ARGS=--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage`

## 3. Supabase

### Como conferir se `imoveis` tem dados

No painel:

1. Abra Supabase.
2. Va em `Table Editor`.
3. Clique na tabela `imoveis`.
4. Veja se aparecem linhas.
5. Ou abra `SQL Editor` e rode:

```sql
select count(*) as total from public.imoveis;
```

Para ver amostra:

```sql
select id, titulo, finalidade, tipo, bairro, cidade, estado, book_pdf_url, foto_principal
from public.imoveis
order by created_at desc
limit 10;
```

Resultado ja confirmado via API local:

- `imoveis` tem `91` registros.
- Os 5 lancamentos recentes estao sem fotos e sem `book_pdf_url`.
- `clientes.uazapi_instance_id` foi criada e verificada em 2026-05-26.

### Obrigatorio

1. Confirmar se coluna `uazapi_instance_id` existe em `clientes`.
   - Status: ja existe apos migration `database/migrations_safe/20260526_add_uazapi_instance_id_clientes.sql`.
2. Confirmar se `book_pdf_url`, `foto_principal` e `fotos` existem em `imoveis`.
3. Confirmar se as migrations foram aplicadas no projeto certo:
   project ref visivel no print: `rbhkwmesmvytqdfuwcie`.

## 4. Pinecone

### Obrigatorio

1. Confirmar indice:
   `cranios-imob-knowledge`

2. Confirmar dimensao:
   `1024`

3. Nao recriar indice sem backup/reingestao.

4. Se decidir migrar para 1536 no futuro, sera necessario:
   - criar novo indice;
   - reingerir documentos;
   - atualizar env;
   - testar query.

Decisao atual recomendada:

- Manter `1024`, pois o indice real ja esta populado.

## 5. Cloudflare R2

### Obrigatorio

1. Confirmar bucket:
   `cranios-imob`

2. Confirmar pasta:
   `Lançamentos/`

3. Confirmar se os 5 PDFs existem:
   - Book-Barra-Garden-1.pdf
   - LUXO-Lindenberg-Vista-Brooklin.pdf
   - Residencial Hildebrando-131.pdf
   - Residencial Luciano Friedheim.pdf
   - Urbano_1060.pdf

4. Confirmar dominio publico R2 ou estrategia de URL assinada.

## 6. UazAPI

### Obrigatorio

1. Webhook configurado:

```text
https://api.cranios.pro/api/webhooks/uazapi
```

2. Webhook habilitado no painel.
3. Evento de mensagem recebida ativado.
4. Confirmar `UAZAPI_BASE_URL`.
5. Confirmar `UAZAPI_TOKEN`.
6. Confirmar `UAZAPI_INSTANCE`.
7. Informar o `instanceId` real recebido no webhook para cadastrar em:
   `clientes.uazapi_instance_id`.

### Teste manual

Depois do deploy:

1. Enviar mensagem de texto para o WhatsApp conectado.
2. Enviar audio curto.
3. Verificar se o sistema responde.
4. Verificar logs no Coolify sem expor token.

## 7. Asaas Sandbox

### Obrigatorio

1. Confirmar chave sandbox atual.
2. Configurar webhook no painel Asaas sandbox:

```text
https://api.cranios.pro/api/webhooks/asaas
```

3. Configurar token de webhook e copiar para:
   `ASAAS_WEBHOOK_TOKEN`

4. Fazer pagamento PIX sandbox.
5. Verificar status em `landing_leads`.

### Producao

Somente pegar chave de producao depois de:

- sandbox aprovado;
- contrato aprovado;
- onboarding testado.

## 8. Assinafy

### Obrigatorio

1. Confirmar `ASSINAFY_API_KEY`.
2. Confirmar `ASSINAFY_TEMPLATE_ID`.
   - Status informado: ja existe template de contrato pronto para Cranios IMOB.
3. Confirmar campos variaveis do template:
   - `NOME_EMPRESA`
   - `CNPJ`
   - `NOME_RESPONSAVEL`
   - `EMAIL`
   - `PLANO`
   - `VALOR_SETUP`
   - `VALOR_MENSALIDADE`
   - `DATA_ASSINATURA`

4. Configurar webhook:

```text
https://api.cranios.pro/api/webhooks/assinafy
```

## 9. Cal.com

### Obrigatorio

1. Confirmar link publico do onboarding.
   - Status informado: calendario especifico de onboarding sera configurado.
2. Definir env:
   `CALCOM_ONBOARDING_URL`

3. Configurar webhook:

```text
https://api.cranios.pro/api/webhooks/calcom
```

4. Fazer agendamento teste.

## 10. Resend/E-mail

### Obrigatorio

1. Confirmar dominio remetente.
2. Confirmar `RESEND_API_KEY`.
3. Confirmar e-mails:
   - onboard: `setup@cranios.pro`
   - atendimento/comercial: `ola@cranios.pro`
   - suporte/SAC: `suporte@cranios.pro`

4. Enviar e-mail teste.

## 11. Landing Page

### Obrigatorio

1. Confirmar onde sera deployada:
   - recomendado para simplicidade inicial: Netlify;
   - alternativa: Cloudflare Pages.

2. Configurar API:

```html
<script>
  window.CRANIOS_API_BASE = "https://api.imob.cranios.pro";
</script>
```

3. Confirmar botoes de checkout.
4. Testar ROI/lead/Cecilia.

## 12. Dominio e DNS

### Obrigatorio

Apontar:

- `imob.cranios.pro` para o app principal.
- `api.imob.cranios.pro` para a API do produto IMOB.
- `real.cranios.pro` como sugestao de landing page comercial.
- subdominios de clientes no padrao `nomeimobiliaria.cranios.pro` quando usar dominio Cranios.

Se backend e frontend estiverem no mesmo container:

- `api.cranios.pro` pode apontar para o mesmo recurso, mas CORS e rotas precisam estar corretos.

## 13. Segredos

### Obrigatorio

Rotacionar qualquer segredo que ja foi commitado ou exposto:

- Supabase service role.
- Asaas.
- Assinafy.
- UazAPI.
- Resend.
- OpenAI/OpenRouter.
- R2.
- Pinecone.

Prioridade maxima:

1. Supabase service role.
2. Asaas producao quando for criada.
3. UazAPI token.

## 14. Dados Visuais dos Lancamentos

Os 5 lancamentos existem no Supabase, mas sem fotos e sem Book PDF.

Para ficarem bonitos na demo, providenciar:

- foto capa de cada lancamento;
- fotos internas ou imagens do book;
- valores ou faixas de preco;
- descricao comercial final.

## 15. Decisoes Que Voce Precisa Tomar

1. Repo final sera o atual ou novo repo limpo?
   - Decisao informada: repo atual.
2. Dominio final do app sera `app.cranios.pro`?
   - Decisao informada: `imob.cranios.pro`.
3. Dominio final da API sera `api.cranios.pro`?
   - Recomendacao alinhada: `api.imob.cranios.pro`.
4. Cecilia sera nativa no backend ou Dify real?
   - Decisao informada: Dify.
   - Codigo preparado para `DIFY_CECILIA_BASE_URL` e `DIFY_CECILIA_API_KEY`.
5. Publicacao em OLX/ZAP/VivaReal sera prometida agora ou marcada como fase 2?
   - Decisao informada: fase 2, com documentacao robusta.
6. Primeiro cliente pago tera quais limites de plano?
   - Decisao: depende do plano; revisar documentos/landing.
7. Quais dados minimos voce quer exigir no onboarding?
   - Decisao: onboarding completo com dados da empresa, paleta, logo, personas, nomes e agentes.

## 16. Checklist Manual Rapido

Antes do deploy:

- [ ] GitHub com permissao correta.
- [ ] Coolify apontando para repo/branch certa.
- [ ] Variaveis runtime no Coolify.
- [ ] Pinecone 1024 confirmado.
- [ ] R2 bucket e dominio confirmados.
- [ ] UazAPI webhook habilitado.
- [ ] Asaas sandbox webhook habilitado.
- [ ] Assinafy template confirmado.
- [ ] Cal.com webhook confirmado.
- [ ] DNS provisiorio ou real apontado.

Depois do deploy:

- [ ] Abrir `/api/health`.
- [ ] Abrir app.
- [ ] Testar landing lead.
- [ ] Testar checkout sandbox.
- [ ] Enviar WhatsApp texto.
- [ ] Enviar WhatsApp audio.
- [ ] Cadastrar imovel com fotos.
- [ ] Gerar Book PDF.
- [ ] Ver lead no CRM.
