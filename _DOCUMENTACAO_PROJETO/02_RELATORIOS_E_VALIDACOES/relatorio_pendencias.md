# Relatório de Pendências - Crânios IMOB CRM

Fiz uma varredura completa no código (Frontend, Backend e Scripts) buscando por `TODOs`, funções mockadas, itens incompletos e configurações hardcoded. 

Aqui está o resumo do que **falta implementar** ou **ajustar** para concluirmos a plataforma 100%:

## 1. Agentes IA e Base de Conhecimento (RAG)
* **Integração com Pinecone (RAG):** Como você mencionou, falta toda a configuração e ingestão de dados no Pinecone para que agentes como Bruna (Jurídico) e Lucas (Financeiro) busquem informações reais da base de conhecimento da imobiliária.
* **Bairros Hardcoded (Elena/Ricardo):** No arquivo `chat_agent.ts`, a lista de bairros válidos de Aracaju (e a associação de "praia" ou "bairro nobre") está *hardcoded* no código. O ideal seria isso vir do banco de dados (tabela de bairros/cidades) para o sistema funcionar em qualquer região do Brasil sem precisar alterar o código.
* **Fallback de Busca:** Ainda no `chat_agent.ts`, se a busca exata falhar, o agente pega 5 imóveis aleatórios do banco. Seria interessante melhorar essa lógica de imóveis similares.

## 2. Roteamento de Leads (Routing Service vs Roleta)
* **Dados Mockados (`routing.service.ts`):** O algoritmo antigo de roteamento baseado em peso (`RoutingService`) possui um array mockado no código (`CORRETORES_DB`).
* **Nota:** O sistema atual já parece estar utilizando a versão nova `RoletaService` (no arquivo `roleta.service.ts`), que puxa os dados reais do Supabase. Porém, o arquivo antigo mockado ainda existe no projeto e pode causar confusão.

## 3. Importação de Dados e Migração (Data Import Service)
* **Fotos no Cloudflare R2:** Na rotina de importação de imóveis via CSV/JSON (`data-import.service.ts`), existe um `TODO` informando que falta fazer o download assíncrono das URLs de foto antigas e fazer o upload nativo para o seu Cloudflare R2. Hoje os imóveis importados ficam apontando para a URL original da foto.
* **Geração de PDF (Books):** Na mesma rotina de importação, existe um `TODO` para gerar automaticamente o Book PDF de todos os imóveis recém-importados em background.

## 4. Onboarding de Clientes e Emails
* **Disparo Automático de Boas-Vindas:** Em `onboarding.service.ts`, há um `TODO` na função `enviarEmailBoasVindas` indicando que a integração com o Resend para o email transacional principal de Onboarding (quando cadastra uma imobiliária nova) ainda não está 100% amarrada ali dentro (embora o Resend já esteja funcionando no painel do Gesto/Corretor).

## 5. Próximos Passos Sugeridos
1. **Limpeza de Código:** Remover o arquivo `routing.service.ts` se a `RoletaService` for a oficial.
2. **Integração Pinecone:** Iniciar o trabalho de *ingestion* (leitura dos PDFs e inserção no banco vetorial).
3. **Migração de Midia:** Finalizar a rotina de mover fotos de imóveis externos para o R2 no momento do Import.

A arquitetura geral está muito sólida e a maioria das partes críticas (Supabase, Chat, R2, Lançamentos, Cal.com) está rodando com dados reais!
