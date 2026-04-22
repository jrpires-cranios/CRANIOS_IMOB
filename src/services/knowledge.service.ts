import fs from 'fs';
import path from 'path';
// import pdf from 'pdf-parse';
import { llmService } from './llm.service.js';

interface Documento {
    id: string;
    nome: string;
    conteudo: string;
    tipo: 'PDF' | 'TXT' | 'DOCX';
}

export class KnowledgeService {
    private documentos: Documento[] = [];
    private basePath: string;

    constructor() {
        this.basePath = path.join(process.cwd(), 'knowledge_base');
        // Cria diretório se não existir
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }

        // Carrega documentos iniciais (simulados por enquanto)
        this.carregarBaseConhecimento();
    }

    /**
     * Carrega documentos da pasta knowledge_base
     */
    async carregarBaseConhecimento() {
        console.log('[KnowledgeService] Carregando base de conhecimento...');

        // Aqui adicionaríamos lógica para ler PDFs reais
        // Por enquanto, vamos adicionar conhecimento "hardcoded" sobre políticas da empresa

        this.adicionarDocumentoManual('politica_locacao.txt', `
      POLÍTICA DE LOCAÇÃO CRÂNIOS IMOB
      
      1. DOCUMENTAÇÃO NECESSÁRIA (PESSOA FÍSICA):
      - RG e CPF (ou CNH)
      - Comprovante de Residência atualizado
      - Comprovante de Renda (3 últimos holerites ou IR)
      - Ficha Cadastral preenchida
      
      2. GARANTIAS ACEITAS:
      - Caução: 3x o valor do aluguel (depositado em conta poupança). Devolvido no final corrigido.
      - Seguro Fiança: Porto Aletr, Tokio Marine. Valor aprox. 1.5 a 2 aluguéis/ano (parcelado).
      - Fiador: Imóvel quitado no mesmo estado.
      - Título de Capitalização: Mínimo 6x o valor do pacote.
      
      3. ANÁLISE DE CRÉDITO:
      - Não pode ter restrições SPC/Serasa.
      - Renda compatível: Aluguel + Encargos não pode ultrapassar 30% da renda bruta familiar.
    `);

        this.adicionarDocumentoManual('politica_vendas.txt', `
      POLÍTICA DE VENDAS E COMISSÃO
      
      1. RESERVA DE IMÓVEL:
      - Sinal mínimo de 10% para reservar e tirar de venda.
      
      2. FINANCIAMENTO:
      - Trabalhamos com correspondentes Caixa, Itaú, Bradesco e Santander.
      - Uso de FGTS permitido para imóvel até R$ 1.5M na primeira aquisição.
      
      3. VISITAS:
      - Apenas acompanhadas por corretor credenciado.
      - Chaves ficam no cofre da agência ou com portaria (mediante autorização).
    `);
    }

    private adicionarDocumentoManual(nome: string, conteudo: string) {
        this.documentos.push({
            id: nome,
            nome,
            conteudo,
            tipo: 'TXT'
        });
    }

    /**
     * Busca trechos relevantes na base de conhecimento (RAG Simplificado)
     */
    async buscarContexto(consulta: string): Promise<string> {
        const termos = consulta.toLowerCase().split(' ');
        let contextoRelevante = "";

        // Busca muito simples por palavras-chave (em produção usaríamos embeddings/vetores)
        for (const doc of this.documentos) {
            let pontuacao = 0;
            for (const termo of termos) {
                if (termo.length > 3 && doc.conteudo.toLowerCase().includes(termo)) {
                    pontuacao++;
                }
            }

            if (pontuacao > 0) {
                contextoRelevante += `\n--- FONTE: ${doc.nome} ---\n${doc.conteudo}\n`;
            }
        }

        if (!contextoRelevante) {
            return "";
        }

        return `USE ESTAS INFORMAÇÕES OFICIAIS DA EMPRESA PARA RESPONDER:\n${contextoRelevante}`;
    }

    /**
     * Pergunta direta ao "Cérebro" sobre a base de conhecimento
     */
    async perguntar(pergunta: string): Promise<string> {
        const contexto = await this.buscarContexto(pergunta);
        if (!contexto) return "Não encontrei informações sobre isso na nossa base de conhecimento.";

        return await llmService.generateResponse({
            systemPrompt: "Você é um assistente que responde perguntas sobre regras da imobiliária. Use APENAS o contexto fornecido.",
            userMessage: `Contexto: ${contexto}\n\nPergunta: ${pergunta}`
        });
    }
}

export const knowledgeService = new KnowledgeService();
