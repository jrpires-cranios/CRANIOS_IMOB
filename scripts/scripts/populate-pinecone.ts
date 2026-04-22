import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente antes de importar o pineconeService
dotenv.config();

import { pineconeService } from '../src/services/pinecone.service.js';

const RAG_BASE_DIR = path.join(process.cwd(), 'Pinecone_rag_base');

// Mapeamento de arquivo para namespace
const getNamespace = (filename: string): string => {
    if (filename.includes('00_base_geral')) return 'geral';
    if (filename.includes('elena')) return 'elena';
    if (filename.includes('ricardo')) return 'ricardo';
    if (filename.includes('amanda')) return 'amanda';
    if (filename.includes('carlos')) return 'carlos';
    if (filename.includes('lucas')) return 'lucas';
    if (filename.includes('bruna')) return 'bruna';
    if (filename.includes('gabriel')) return 'gabriel';
    if (filename.includes('marina')) return 'marina';
    if (filename.includes('roberto')) return 'roberto';
    return 'geral';
};

const chunkText = (text: string): string[] => {
    // Basic chunking splitting by headers
    const chunks = text.split(/\n## |\n### /);
    return chunks.map(chunk => chunk.trim()).filter(chunk => chunk.length > 0);
};

const run = async () => {
    console.log('--- Iniciando Ingestão no Pinecone ---');
    try {
        const files = fs.readdirSync(RAG_BASE_DIR).filter(file => file.endsWith('.md') && file !== 'INDEXING_GUIDE.md');

        for (const file of files) {
            const namespace = getNamespace(file);
            const content = fs.readFileSync(path.join(RAG_BASE_DIR, file), 'utf-8');
            const chunks = chunkText(content);

            console.log(`Processando ${file} -> Namespace: ${namespace} (${chunks.length} chunks)`);

            const docs = chunks.map((chunk, index) => ({
                id: `${namespace}_chunk_${index}_${Date.now()}`,
                text: chunk.substring(0, 8000), // Limit text length
                metadata: {
                    text: chunk.substring(0, 1000),
                    source: file,
                    agente: namespace
                }
            }));

            if (docs.length > 0) {
                // Upsert em batch para este namespace
                await pineconeService.upsertBatch(docs, namespace);
                console.log(`✅ ${file} indexado com sucesso no namespace ${namespace}.`);
            }
        }

        console.log('--- Ingestão Concluída ---');
        process.exit(0);
    } catch (error) {
        console.error('Erro na ingestão:', error);
        process.exit(1);
    }
};

run();
