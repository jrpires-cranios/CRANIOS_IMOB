import { supabase } from '../config/supabase.js';
import OpenAI from 'openai';
import { parse } from 'csv-parse/sync';
import mysql from 'mysql2/promise';
import { r2StorageService } from './r2-storage.service.js';
import { pdfGeneratorService } from './pdf-generator.service.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

interface ImportacaoConfig {
    cliente_id: string;
    tipo: 'csv' | 'mysql' | 'json';
    dados_conexao?: {
        host?: string;
        port?: number;
        database?: string;
        user?: string;
        password?: string;
    };
    csv_content?: string;
    json_content?: any;
    mapeamento?: Record<string, string>;
    validar?: boolean;
}

interface EstruturaAnalise {
    tipo: string;
    tabelas?: string[];
    campos: Record<string, string[]>;
    tipos: Record<string, string>;
    total_registros: number;
}

interface Mapeamento {
    campos: Record<string, string>;
    transformacoes: Record<string, string>;
    campos_faltantes: string[];
    confianca: number;
}

interface ValidacaoResult {
    validos: any[];
    invalidos: any[];
    avisos: string[];
    erros: string[];
}

interface ImportacaoResult {
    sucesso: boolean;
    total_importados: number;
    total_ignorados: number;
    total_fotos: number;
    total_books: number;
    tempo_ms: number;
    erros: string[];
}

/**
 * SCHEMA CRÂNIOS IMOB (para referência do LLM)
 */
const SCHEMA_CRANIOS = {
    obrigatorios: ['titulo', 'bairro', 'finalidade'],
    campos: {
        // Identificação
        referencia_externa: 'string',
        titulo: 'string (obrigatório)',
        bairro: 'string (obrigatório)',
        cidade: 'string',
        estado: 'string',

        // Financeiro
        finalidade: 'venda | locacao (obrigatório)',
        preco_venda: 'decimal',
        preco_locacao: 'decimal',
        condominio: 'decimal',
        iptu: 'decimal',

        // Características
        tipo: 'apartamento | casa | terreno | comercial',
        quartos: 'integer',
        suites: 'integer',
        banheiros: 'integer',
        vagas_garagem: 'integer',
        area_construida: 'decimal',
        area_terreno: 'decimal',

        // Descrição
        descricao: 'text',
        foto_principal: 'url',
        fotos: 'array[url]',

        // Status
        status: 'disponivel | reservado | vendido | alugado'
    }
};

export class DataImportService {
    /**
     * ANALISADOR AUTOMÁTICO DE ESTRUTURA
     */
    async analisarFonte(config: ImportacaoConfig): Promise<EstruturaAnalise> {
        console.log(`[Import] Analisando fonte: ${config.tipo}`);

        try {
            switch (config.tipo) {
                case 'csv':
                    return await this.analisarCSV(config.csv_content!);

                case 'mysql':
                    return await this.analisarMySQL(config.dados_conexao!);

                case 'json':
                    return await this.analisarJSON(config.json_content!);

                default:
                    throw new Error('Tipo de importação não suportado');
            }
        } catch (error: any) {
            console.error('[Import] Erro ao analisar fonte:', error);
            throw error;
        }
    }

    /**
     * Analisar CSV
     */
    private async analisarCSV(csvContent: string): Promise<EstruturaAnalise> {
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        if (records.length === 0) {
            throw new Error('CSV vazio ou inválido');
        }

        const campos = Object.keys(records[0]);
        const tipos: Record<string, string> = {};

        // Inferir tipos dos campos
        campos.forEach(campo => {
            const valor = records[0][campo];
            if (!isNaN(Number(valor))) {
                tipos[campo] = 'number';
            } else if (valor?.toLowerCase() === 'true' || valor?.toLowerCase() === 'false') {
                tipos[campo] = 'boolean';
            } else {
                tipos[campo] = 'string';
            }
        });

        console.log(`[Import] CSV analisado: ${records.length} registros, ${campos.length} colunas`);

        return {
            tipo: 'csv',
            campos: { imoveis: campos },
            tipos,
            total_registros: records.length
        };
    }

    /**
     * Analisar MySQL
     */
    private async analisarMySQL(conexao: any): Promise<EstruturaAnalise> {
        const connection = await mysql.createConnection(conexao);

        try {
            // Listar tabelas
            const [tables] = await connection.query('SHOW TABLES');
            const tabelas = (tables as any[]).map(t => Object.values(t)[0] as string);

            console.log(`[Import] MySQL conectado: ${tabelas.length} tabelas encontradas`);

            // Analisar campos de cada tabela
            const campos: Record<string, string[]> = {};
            const tipos: Record<string, string> = {};

            for (const tabela of tabelas) {
                const [columns] = await connection.query(`DESCRIBE ${tabela}`);
                campos[tabela] = (columns as any[]).map(c => c.Field);

                (columns as any[]).forEach(c => {
                    tipos[`${tabela}.${c.Field}`] = c.Type;
                });
            }

            // Contar registros da tabela principal (geralmente 'imoveis')
            const tabelaPrincipal = tabelas.find(t =>
                t.toLowerCase().includes('imovel') ||
                t.toLowerCase().includes('imovel')
            ) || tabelas[0];

            const [count] = await connection.query(`SELECT COUNT(*) as total FROM ${tabelaPrincipal}`);
            const total = (count as any[])[0].total;

            return {
                tipo: 'mysql',
                tabelas,
                campos,
                tipos,
                total_registros: total
            };

        } finally {
            await connection.end();
        }
    }

    /**
     * Analisar JSON
     */
    private async analisarJSON(jsonContent: any): Promise<EstruturaAnalise> {
        const dados = Array.isArray(jsonContent) ? jsonContent : [jsonContent];

        if (dados.length === 0) {
            throw new Error('JSON vazio');
        }

        const campos = Object.keys(dados[0]);
        const tipos: Record<string, string> = {};

        campos.forEach(campo => {
            tipos[campo] = typeof dados[0][campo];
        });

        return {
            tipo: 'json',
            campos: { imoveis: campos },
            tipos,
            total_registros: dados.length
        };
    }

    /**
     * GERADOR DE MAPEAMENTO COM LLM
     */
    async gerarMapeamento(estrutura: EstruturaAnalise): Promise<Mapeamento> {
        console.log('[Import] Gerando mapeamento com IA...');

        const prompt = `Você é um especialista em migração de dados imobiliários.

ESTRUTURA ORIGINAL:
${JSON.stringify(estrutura, null, 2)}

SCHEMA DESTINO (Crânios IMOB):
${JSON.stringify(SCHEMA_CRANIOS, null, 2)}

TAREFA:
1. Identifique quais campos do sistema original correspondem ao schema Crânios IMOB
2. Sugira transformações necessárias (ex: "VENDA" → "venda", "R$ 450.000,00" → 450000)
3. Identifique campos que faltam
4. Calcule confiança do mapeamento (0-1)

REGRAS:
- Campos obrigatórios: titulo, bairro, finalidade
- finalidade deve ser "venda" ou "locacao" (minúsculas)
- Preços devem ser números, sem formatação
- Se campo não existe no original, marcar como null

RETORNE APENAS JSON VÁLIDO:
{
  "campos": {
    "campo_original": "campo_destino",
    "outro_campo": "outro_destino"
  },
  "transformacoes": {
    "preco": "remover_formatacao_moeda",
    "finalidade": "lowercase"
  },
  "campos_faltantes": ["campo1", "campo2"],
  "confianca": 0.95
}`;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Você é um assistente de migração de dados. Retorne apenas JSON válido.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' }
            });

            const resultado = JSON.parse(response.choices[0].message.content || '{}');

            console.log(`[Import] ✅ Mapeamento gerado (confiança: ${resultado.confianca})`);

            return resultado as Mapeamento;

        } catch (error: any) {
            console.error('[Import] Erro ao gerar mapeamento:', error);
            throw new Error('Falha ao gerar mapeamento com IA');
        }
    }

    /**
     * VALIDADOR DE DADOS
     */
    async validarDados(dados: any[], mapeamento: Mapeamento): Promise<ValidacaoResult> {
        console.log(`[Import] Validando ${dados.length} registros...`);

        const validos: any[] = [];
        const invalidos: any[] = [];
        const avisos: string[] = [];
        const erros: string[] = [];

        for (let i = 0; i < dados.length; i++) {
            const registro = dados[i];
            const errosRegistro: string[] = [];

            // Aplicar mapeamento
            const registroMapeado: any = {};

            for (const [campoOriginal, campoDestino] of Object.entries(mapeamento.campos)) {
                let valor = registro[campoOriginal];

                // Aplicar transformações
                const transformacao = mapeamento.transformacoes[campoOriginal];
                if (transformacao === 'remover_formatacao_moeda') {
                    valor = this.limparValorMonetario(valor);
                } else if (transformacao === 'lowercase') {
                    valor = valor?.toLowerCase();
                }

                registroMapeado[campoDestino] = valor;
            }

            // Validar campos obrigatórios
            if (!registroMapeado.titulo) {
                errosRegistro.push(`Linha ${i + 1}: Título obrigatório`);
            }
            if (!registroMapeado.bairro) {
                errosRegistro.push(`Linha ${i + 1}: Bairro obrigatório`);
            }
            if (!registroMapeado.finalidade) {
                errosRegistro.push(`Linha ${i + 1}: Finalidade obrigatória`);
            }

            // Validar finalidade
            if (registroMapeado.finalidade && !['venda', 'locacao'].includes(registroMapeado.finalidade)) {
                errosRegistro.push(`Linha ${i + 1}: Finalidade inválida (deve ser "venda" ou "locacao")`);
            }

            // Validar preço
            const preco = registroMapeado.finalidade === 'venda'
                ? registroMapeado.preco_venda
                : registroMapeado.preco_locacao;

            if (!preco || Number(preco) <= 0) {
                errosRegistro.push(`Linha ${i + 1}: Preço inválido ou ausente`);
            }

            // Classificar
            if (errosRegistro.length > 0) {
                invalidos.push({ ...registroMapeado, __erros: errosRegistro });
                erros.push(...errosRegistro);
            } else {
                validos.push(registroMapeado);
            }

            // Avisos (não bloqueantes)
            if (!registroMapeado.foto_principal) {
                avisos.push(`Linha ${i + 1}: Sem foto principal`);
            }
            if (!registroMapeado.descricao) {
                avisos.push(`Linha ${i + 1}: Sem descrição`);
            }
        }

        console.log(`[Import] ✅ ${validos.length} válidos, ❌ ${invalidos.length} inválidos`);

        return {
            validos,
            invalidos,
            avisos,
            erros
        };
    }

    /**
     * EXECUTAR IMPORTAÇÃO
     */
    async executarImportacao(
        clienteId: string,
        validados: ValidacaoResult
    ): Promise<ImportacaoResult> {
        console.log(`[Import] Executando importação para cliente ${clienteId}...`);

        const inicio = Date.now();
        let totalFotos = 0;
        let totalBooks = 0;

        try {
            // Preparar dados para inserção
            const dadosParaInserir = validados.validos.map(v => ({
                ...v,
                cliente_id: clienteId,
                created_at: new Date().toISOString()
            }));

            // Inserir em lote no Supabase
            const { data, error } = await supabase
                .from('imoveis')
                .insert(dadosParaInserir)
                .select();

            if (error) {
                console.error('[Import] Erro ao inserir dados:', error);
                throw new Error(`Falha na importação: ${error.message}`);
            }

            console.log(`[Import] ✅ ${data.length} imóveis importados`);

            // Dispara migração de fotos e geração de PDFs em background
            // Não fazemos await aqui para não travar o backend/usuário
            this.processarPosImportacaoEmBackground(data, clienteId).catch(err => {
                console.error('[Import] Erro fatal no background worker:', err);
            });

            const tempo = Date.now() - inicio;

            return {
                sucesso: true,
                total_importados: data.length,
                total_ignorados: validados.invalidos.length,
                total_fotos: totalFotos,
                total_books: totalBooks,
                tempo_ms: tempo,
                erros: validados.erros
            };

        } catch (error: any) {
            console.error('[Import] Erro na importação:', error);

            return {
                sucesso: false,
                total_importados: 0,
                total_ignorados: validados.invalidos.length,
                total_fotos: 0,
                total_books: 0,
                tempo_ms: Date.now() - inicio,
                erros: [error.message, ...validados.erros]
            };
        }
    }

    /**
     * WORKER DE BACKGROUND PARA FOTOS E PDFs
     * Permite ao front-end continuar operando enquanto as imagens são copiadas de URLs de terceiros.
     */
    private async processarPosImportacaoEmBackground(imoveisSalvos: any[], clienteId: string) {
        console.log(`[Import-BG] Iniciando rotina em background para ${imoveisSalvos.length} imóveis...`);

        // Puxar informações básicas do cliente para o layout do PDF
        const { data: cliente } = await supabase.from('clientes').select('*').eq('id', clienteId).single();
        const clienteConfig = cliente ? {
            nome: cliente.nome || 'Imobiliária',
            logo_url: cliente.logo_url,
            telefone: cliente.telefone || cliente.whatsapp,
            email: cliente.email
        } : { nome: 'Imobiliária Local' };

        for (const imovel of imoveisSalvos) {
            try {
                let atualizouFotoPrincipal = false;
                let novaFotoPrincipalUrl = imovel.foto_principal;

                // 1. Migrar Foto Principal para a nuvem própria
                if (novaFotoPrincipalUrl && novaFotoPrincipalUrl.startsWith('http') && !novaFotoPrincipalUrl.includes('r2.dev')) {
                    console.log(`[Import-BG] Migrando foto principal do imóvel: ${imovel.id}`);
                    const filename = `main_${Date.now()}.jpg`;
                    const destinationPath = `clientes/${clienteId}/imoveis/${imovel.id}/fotos/${filename}`;

                    const urlMigrada = await r2StorageService.migrateFromExternalUrl(novaFotoPrincipalUrl, destinationPath);
                    novaFotoPrincipalUrl = urlMigrada;
                    atualizouFotoPrincipal = true;
                }

                // TODO Opcional de Melhoria 2.0: Migrar as URLs de 'fotos' (galeria) também, 
                // se quiser não depender do S3 do antigo gestor de CRM

                // Atualizar banco do imóvel se mudou foto
                if (atualizouFotoPrincipal) {
                    await supabase.from('imoveis').update({ foto_principal: novaFotoPrincipalUrl }).eq('id', imovel.id);
                    imovel.foto_principal = novaFotoPrincipalUrl; // Atualiza pro gerador de PDF
                }

                // 2. Gerar Book PDF Automático
                console.log(`[Import-BG] Gerando Book PDF assíncrono para imóvel: ${imovel.id}`);
                await pdfGeneratorService.gerarBookImovel({ imovelData: imovel, clienteConfig, r2StorageService });

            } catch (error: any) {
                console.error(`[Import-BG] Erro ao processar imóvel ${imovel.id} no background:`, error.message);
                // Continua o loop ignorando o imóvel pifado
            }
        }

        console.log(`[Import-BG] ✅ Finalizada rotina de pós-importação background para cliente: ${clienteId}`);
    }

    /**
     * HELPERS
     */
    private limparValorMonetario(valor: any): number {
        if (typeof valor === 'number') return valor;
        if (!valor) return 0;

        // Remove R$, pontos, vírgulas
        const limpo = valor
            .toString()
            .replace(/R\$/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim();

        return parseFloat(limpo) || 0;
    }
}

export const dataImportService = new DataImportService();
