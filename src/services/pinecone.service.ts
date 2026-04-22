import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface VectorMetadata {
    text: string;
    source: string;
    agente?: string;
    tipo?: string;
    imovelId?: string;
    cliente_id?: string;
    timestamp?: number;
}

export class PineconeService {
    private client: Pinecone;
    private indexName: string;
    private isReady: boolean = false;

    constructor() {
        const apiKey = process.env.PINECONE_API_KEY || '';
        this.indexName = process.env.PINECONE_INDEX_NAME || 'cranios-imob-knowledge';

        if (!apiKey) {
            console.warn('[Pinecone] ⚠️ PINECONE_API_KEY não configurada. RAG desabilitado.');
        } else {
            this.client = new Pinecone({ apiKey });
            this.isReady = true;
            console.log(`[Pinecone] ✅ Initialized. Index: ${this.indexName}`);
        }
    }

    /**
     * Criar embedding usando OpenAI text-embedding-3-small (1536 dims, mais econômico)
     */
    private async createEmbedding(text: string): Promise<number[]> {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('[Pinecone] OPENAI_API_KEY não configurada — embedding não disponível');
            return new Array(1536).fill(0);
        }

        try {
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text.substring(0, 8000), // Limitar para não exceder tokens
                encoding_format: 'float',
                dimensions: 1024,
            });
            return response.data[0].embedding;
        } catch (error: any) {
            console.error('[Pinecone] Erro ao gerar embedding:', error.message);
            return new Array(1536).fill(0);
        }
    }

    /**
     * Upsert documento na base vetorial
     */
    async upsertDocument(
        id: string,
        text: string,
        metadata: VectorMetadata,
        namespace?: string
    ): Promise<void> {
        if (!this.isReady) return;

        try {
            const index = this.client.index(this.indexName);
            const embedding = await this.createEmbedding(text);

            // Pinecone SDK format
            await index.namespace(namespace || 'default').upsert({
                records: [{
                    id,
                    values: embedding,
                    metadata: { ...metadata, text: text.substring(0, 1000), timestamp: Date.now() },
                }]
            });



            console.log(`[Pinecone] ✅ Documento inserido: ${id} (ns: ${namespace || 'default'})`);
        } catch (error: any) {
            console.error('[Pinecone] Erro ao inserir documento:', error.message);
        }
    }

    /**
     * Upsert em lote (para população de bases de conhecimento)
     */
    async upsertBatch(
        docs: Array<{ id: string; text: string; metadata: VectorMetadata }>,
        namespace: string
    ): Promise<void> {
        if (!this.isReady) return;
        console.log(`[Pinecone] Populando namespace '${namespace}' com ${docs.length} documentos...`);

        for (const doc of docs) {
            await this.upsertDocument(doc.id, doc.text, doc.metadata, namespace);
            await new Promise(r => setTimeout(r, 200)); // Rate limit OpenAI embeddings
        }
        console.log(`[Pinecone] ✅ Namespace '${namespace}' populado com sucesso.`);
    }

    /**
     * Buscar documentos similares (RAG)
     */
    async query(
        queryText: string,
        topK: number = 5,
        namespace?: string,
        filter?: Record<string, any>
    ): Promise<any[]> {
        if (!this.isReady) return [];

        try {
            const index = this.client.index(this.indexName);
            const embedding = await this.createEmbedding(queryText);

            const results = await index.namespace(namespace || 'default').query({
                vector: embedding,
                topK,
                includeMetadata: true,
                filter
            });

            const matches = results.matches || [];
            console.log(`[Pinecone] Encontrados ${matches.length} documentos (ns: ${namespace})`);
            return matches;
        } catch (error: any) {
            console.error('[Pinecone] Erro na busca:', error.message);
            return [];
        }
    }

    /**
     * ========================================================
     * BUSCA POR AGENTE — usa namespace do cliente quando disponível
     * Formato do namespace: {agente}_{tipo}_{cliente_id} ou {agente}_{tipo} (global)
     * ========================================================
     */

    async buscarContextoAgente(
        agente: string,
        tipo: string,
        pergunta: string,
        clienteId?: string
    ): Promise<string> {
        // Primeiro tenta namespace específico do cliente
        if (clienteId) {
            const nsCliente = `${agente}_${tipo}_${clienteId}`;
            const resultsCliente = await this.query(pergunta, 3, nsCliente);
            if (resultsCliente.length > 0) {
                return this.formatarContexto(resultsCliente);
            }
        }

        // Fallback para namespace global
        const nsGlobal = `${agente}_${tipo}`;
        const results = await this.query(pergunta, 3, nsGlobal, {
            agente,
            tipo
        });
        return this.formatarContexto(results);
    }

    async buscarContextoRicardo(pergunta: string, tipoNegocio: 'vendas' | 'locacao', clienteId?: string): Promise<string> {
        return this.buscarContextoAgente('ricardo', tipoNegocio, pergunta, clienteId);
    }

    async buscarContextoBruna(pergunta: string, clienteId?: string): Promise<string> {
        return this.buscarContextoAgente('bruna', 'juridico', pergunta, clienteId);
    }

    async buscarContextoLucas(pergunta: string, clienteId?: string): Promise<string> {
        return this.buscarContextoAgente('lucas', 'financeiro', pergunta, clienteId);
    }

    async buscarContextoAmanda(pergunta: string, clienteId?: string): Promise<string> {
        return this.buscarContextoAgente('amanda', 'qualificacao', pergunta, clienteId);
    }

    async buscarContextoGabriel(pergunta: string, clienteId?: string): Promise<string> {
        return this.buscarContextoAgente('gabriel', 'lancamentos', pergunta, clienteId);
    }

    /**
     * Criar RAG completo para um novo cliente (onboarding)
     * Copia a base global e adiciona configurações específicas do cliente
     */
    async inicializarRAGCliente(clienteId: string, config: {
        nomeAgentes: Record<string, string>;
        instrucoes?: Record<string, string>;
        contextoImobiliaria?: string;
    }): Promise<void> {
        console.log(`[Pinecone] Inicializando RAG para cliente: ${clienteId}`);

        // Para cada agente, cria um namespace específico do cliente
        const agentes = [
            { namespace: 'vendas', tipo: 'vendas' },
            { namespace: 'locacao', tipo: 'locacao' },
            { namespace: 'juridico', tipo: 'juridico' },
            { namespace: 'financeiro', tipo: 'financeiro' },
        ];

        for (const { namespace, tipo } of agentes) {
            const nomeAgente = config.nomeAgentes[tipo] || tipo;
            const instrucao = config.instrucoes?.[tipo] || '';
            const nsCliente = `${tipo}_${clienteId}`;

            // Documento de identidade do agente personalizado
            await this.upsertDocument(
                `identity_${tipo}_${clienteId}`,
                `Você é ${nomeAgente}, agente especializado em ${tipo} da imobiliária.
                ${instrucao}
                ${config.contextoImobiliaria || ''}`,
                {
                    text: `Identidade do agente ${nomeAgente}`,
                    source: 'onboarding_config',
                    agente: nomeAgente,
                    tipo,
                    cliente_id: clienteId,
                },
                nsCliente
            );
        }

        console.log(`[Pinecone] ✅ RAG do cliente ${clienteId} inicializado.`);
    }

    /**
     * Popular base de conhecimento de um agente (via texto livre ou array de docs)
     */
    async popularBaseConhecimento(
        agente: string,
        tipo: string,
        documentos: Array<{ titulo: string; conteudo: string }>,
        clienteId?: string
    ): Promise<{ total: number; erro?: string }> {
        const namespace = clienteId ? `${agente}_${tipo}_${clienteId}` : `${agente}_${tipo}`;

        try {
            const docs = documentos.map((doc, i) => ({
                id: `${agente}_${tipo}_${clienteId || 'global'}_${i}_${Date.now()}`,
                text: `${doc.titulo}\n\n${doc.conteudo}`,
                metadata: {
                    text: doc.titulo,
                    source: doc.titulo,
                    agente,
                    tipo,
                    cliente_id: clienteId,
                } as VectorMetadata,
            }));

            await this.upsertBatch(docs, namespace);
            return { total: docs.length };
        } catch (error: any) {
            return { total: 0, erro: error.message };
        }
    }

    /**
     * Formatar resultados em contexto para LLM
     */
    private formatarContexto(results: any[]): string {
        if (!results || results.length === 0) return '';

        const relevant = results.filter(m => (m.score || 0) > 0.65);
        if (relevant.length === 0) return '';

        let contexto = '\n--- CONHECIMENTO RELEVANTE ---\n';
        for (const match of relevant) {
            const meta = match.metadata as VectorMetadata;
            contexto += `\n[Fonte: ${meta.source}]\n${meta.text}\n`;
        }
        return contexto;
    }

    /**
     * Deletar namespace (reset do agente de um cliente)
     */
    async deleteNamespace(namespace: string): Promise<void> {
        if (!this.isReady) return;
        try {
            const index = this.client.index(this.indexName);
            await index.namespace(namespace).deleteAll();
            console.log(`[Pinecone] ✅ Namespace deletado: ${namespace}`);
        } catch (error: any) {
            console.error('[Pinecone] Erro ao deletar namespace:', error.message);
        }
    }
}

export const pineconeService = new PineconeService();
