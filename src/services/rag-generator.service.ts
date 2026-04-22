import { pineconeService } from './pinecone.service.js';

interface TenantOnboardingData {
    company: any;
    market: any;
    brand: any;
    agents: any;
    infra: any;
    integrations: any;
}

const AGENTS_BASE = [
    { key: "ELENA", role: "Recepcionista Digital" },
    { key: "RICARDO", role: "Consultor de Imóveis" },
    { key: "AMANDA", role: "Especialista em Qualificação" },
    { key: "CARLOS", role: "Coordenador de Agendas" },
    { key: "LUCAS", role: "Consultor Financeiro" },
    { key: "BRUNA", role: "Jurídico e Contratos" },
    { key: "GABRIEL", role: "Especialista em Lançamentos" },
    { key: "MARINA", role: "Depto. Financeiro" },
    { key: "ROBERTO", role: "Coordenador de Serviços" },
];

export class RAGGeneratorService {

    /**
     * Engine Principal: Gerar RAG por Tenant e inserir no Pinecone
     */
    async generateTenantRAG(tenantId: string, slug: string, data: TenantOnboardingData): Promise<void> {
        console.log(`[RAG Generator] Iniciando engine para o tenant ${slug}...`);

        const { company, market, brand, agents } = data;

        // 1. Variáveis Globais da Marca/Imobiliária
        const globalVars = {
            IMOBILIARIA_NOME: company.name || 'Imobiliária',
            IMOBILIARIA_SLOGAN: brand.slogan || '',
            IMOBILIARIA_CRECI: company.creci || '',
            IMOBILIARIA_SITE: company.site || '',
            CIDADE_PRINCIPAL: market.city || '',
            ESTADO: market.state || '',
            BAIRROS_PRINCIPAIS: (market.neighborhoods || '').split(',').join(', '),
            TIPOS_IMOVEL: (market.propertyTypes || []).join(', '),
            TOM_GLOBAL: brand.globalTone || 'Consultivo',
            PERSONALIDADE_MARCA: brand.personality || '',
        };

        // 2. Para cada Agente Ativo
        for (const [agentKey, agentConfig] of Object.entries(agents)) {
            if (!(agentConfig as any).enabled) continue;

            const baseAgent = AGENTS_BASE.find(a => a.key === agentKey);
            const agentName = (agentConfig as any).name || (baseAgent?.role.split(' ')[0]) || agentKey;
            const agentTone = (agentConfig as any).tone || globalVars.TOM_GLOBAL;
            const customObs = (agentConfig as any).customObs || '';

            // 3. Montar Base Markdown (O "Template Engine")
            const markdown = this.applyVariables(globalVars, agentKey, baseAgent?.role || '', agentName, agentTone, customObs);

            // 4. Chunking (dividir o Markdown em parágrafos/chunks menores se precisar, 
            // no momento vamos indexar o arquivo base como um único bloco rico de identidade, e depois mais chunks de FAQ)
            const namespace = `${slug}:${agentKey.toLowerCase()}`;
            console.log(`[RAG Generator] Indexando namespace: ${namespace}`);

            // Insert in Pinecone
            await pineconeService.upsertDocument(
                `base_${agentKey.toLowerCase()}_${tenantId}`,
                markdown,
                {
                    text: `Base Identity RAG for ${agentName}`,
                    source: `rag_engine_${slug}`,
                    agente: agentKey,
                    tipo: 'identity',
                    cliente_id: tenantId,
                },
                namespace
            );

            // Rate Limit Protection
            await new Promise(r => setTimeout(r, 500));
        }

        // 5. Indexar base Geral do Tenant
        const generalNamespace = `${slug}:geral`;
        const generalMarkdown = `Base de conhecimento geral da ${globalVars.IMOBILIARIA_NOME}.
            Nós atuamos em ${globalVars.CIDADE_PRINCIPAL}-${globalVars.ESTADO}.
            Bairros de foco: ${globalVars.BAIRROS_PRINCIPAIS}
            Tipos de imóvel que trabalhamos: ${globalVars.TIPOS_IMOVEL}
            CRECI Oficial: ${globalVars.IMOBILIARIA_CRECI}
            Nossa personalidade de marca: ${globalVars.PERSONALIDADE_MARCA}`;

        await pineconeService.upsertDocument(
            `base_geral_${tenantId}`,
            generalMarkdown,
            {
                text: `General Context RAG for ${globalVars.IMOBILIARIA_NOME}`,
                source: `rag_engine_${slug}`,
                tipo: 'general',
                cliente_id: tenantId,
            },
            generalNamespace
        );

        console.log(`[RAG Generator] ✅ Pipeline RAG concluído para ${slug}.`);
    }

    /**
     * Aplica variáveis transformando em um Contexto Rico RAG (Pinecone Formato Markdown)
     */
    private applyVariables(globals: any, agentKey: string, role: string, name: string, tone: string, obs: string): string {
        return `# ${name} — ${role}
## RAG Gerado Automaticamente · ${globals.IMOBILIARIA_NOME}

**Imobiliária:** ${globals.IMOBILIARIA_NOME}
**Cidade Principal:** ${globals.CIDADE_PRINCIPAL} (${globals.ESTADO})
**Bairros de Atuação:** ${globals.BAIRROS_PRINCIPAIS}
**Especialidade em Imóveis:** ${globals.TIPOS_IMOVEL}

---

## IDENTIDADE E PERSONA

**Nome:** ${name}
**Cargo:** ${role}
**Tom de Voz:** ${tone}
**Empresa:** ${globals.IMOBILIARIA_NOME}

${obs ? `**Observações Personalizadas:**\n${obs}\n` : ""}

## ABERTURA E APRESENTAÇÃO
Você deve sempre se apresentar de maneira orgânica usando o seu tom de voz de "${tone}". 
Você trabalha para a ${globals.IMOBILIARIA_NOME}.
${globals.IMOBILIARIA_SLOGAN ? `Você deve viver através do lema da empresa: "${globals.IMOBILIARIA_SLOGAN}"` : ""}

## CONTEXTO E INSTRUÇÕES GLOBAIS DA MARCA
${globals.PERSONALIDADE_MARCA}

## REGRAS DE CANAL DE ATENDIMENTO
Atue sempre de forma rápida, eficiente e resolutiva, capturando o nome do cliente no primeiro ponto de contato e direcionando para as próximas instâncias se a intenção dele escapar do seu escopo (${role}).
`;
    }
}

export const ragGeneratorService = new RAGGeneratorService();
