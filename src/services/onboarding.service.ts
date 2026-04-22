import { S3Client, CreateBucketCommand, DeleteBucketCommand, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '../config/supabase.js';
import { emailService } from './email.service.js';

interface NomeAgentes {
    vendas?: string;
    locacao?: string;
    juridico?: string;
    atendimento?: string;
    concierge?: string;
    vistorias?: string;
    financeiro?: string;
    sdr?: string;
    [key: string]: string | undefined;
}

interface ClienteData {
    nome: string;
    slug?: string;
    razao_social?: string;
    cnpj?: string;
    email: string;
    telefone?: string;
    whatsapp?: string;
    website?: string;
    logo_url?: string;
    cor_primaria?: string;
    cor_secundaria?: string;
    plano?: 'trial' | 'basico' | 'profissional' | 'enterprise';
    trial_dias?: number;
    // Personalização dos agentes
    nomeAgentes?: NomeAgentes;
    instrucoes?: Record<string, string>;  // Ex: { vendas: 'Foque em lançamentos...' }
    funcoes?: string[];                    // Ex: ['vendas', 'locacao', 'juridico']
    endereco?: Record<string, string>;
}

interface ClienteBranding {
    logo_url?: string;
    cor_primaria: string;
    cor_secundaria: string;
    nome: string;
    telefone?: string;
    email: string;
    website?: string;
}

export class OnboardingService {
    private r2Client: S3Client;
    private accountId: string;

    constructor() {
        this.accountId = process.env.R2_ACCOUNT_ID || '';
        const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';

        this.r2Client = new S3Client({
            region: 'auto',
            endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId,
                secretAccessKey
            }
        });
    }

    /**
     * ONBOARDING COMPLETO DE NOVO CLIENTE
     */
    async onboardCliente(data: ClienteData): Promise<any> {
        console.log(`[Onboarding] Iniciando onboarding: ${data.nome}`);

        try {
            // 1. Gerar slug se não fornecido
            const slug = data.slug || this.generateSlug(data.nome);
            const bucketName = slug;

            // 2. Criar bucket R2
            console.log(`[Onboarding] Criando bucket: ${bucketName}`);
            await this.createClientBucket(bucketName);

            // 3. Criar estrutura de pastas no bucket
            console.log(`[Onboarding] Criando estrutura de pastas...`);
            await this.setupBucketFolders(bucketName);

            // 4. Calcular trial_expira_em se plano trial
            const trialExpiraEm = data.plano === 'trial' && data.trial_dias
                ? new Date(Date.now() + data.trial_dias * 24 * 60 * 60 * 1000).toISOString()
                : null;

            // 5. Inserir cliente no Supabase
            const { data: cliente, error } = await supabase
                .from('clientes')
                .insert({
                    nome: data.nome,
                    slug,
                    razao_social: data.razao_social,
                    cnpj: data.cnpj,
                    email: data.email,
                    telefone: data.telefone,
                    whatsapp: data.whatsapp,
                    website: data.website,
                    logo_url: data.logo_url,
                    cor_primaria: data.cor_primaria || '#667eea',
                    cor_secundaria: data.cor_secundaria || '#764ba2',
                    bucket_name: bucketName,
                    bucket_url: `https://pub-${this.accountId}.r2.dev/${bucketName}`,
                    bucket_created_at: new Date().toISOString(),
                    plano: data.plano || 'trial',
                    trial_expira_em: trialExpiraEm,
                    status: 'ativo'
                })
                .select()
                .single();

            if (error) {
                console.error('[Onboarding] Erro ao criar cliente:', error);
                // Tentar reverter bucket criado
                await this.deleteClientBucket(bucketName);
                throw new Error(`Falha ao criar cliente: ${error.message}`);
            }

            console.log(`[Onboarding] ✅ Cliente criado: ${cliente.id} (${cliente.slug})`);
            console.log(`[Onboarding] ✅ Bucket: ${bucketName}`);
            console.log(`[Onboarding] ✅ URL: ${cliente.bucket_url}`);

            // 6. Enviar email de boas-vindas via Resend
            if (process.env.RESEND_API_KEY) {
                const nomeAgentesData: any = data.nomeAgentes || {};
                emailService.enviarWelcomeOnboarding({
                    nome: cliente.nome,
                    email: cliente.email,
                    slug: cliente.slug,
                    plano: cliente.plano,
                    nomeAgentes: {
                        vendas: nomeAgentesData.vendas,
                        juridico: nomeAgentesData.juridico,
                        atendimento: nomeAgentesData.atendimento,
                        concierge: nomeAgentesData.concierge,
                        vistorias: nomeAgentesData.vistorias
                    },
                    trialDias: data.trial_dias || 14,
                }).catch(err => console.error('[Onboarding] Erro ao enviar welcome email:', err.message));
            }

            return {
                success: true,
                slug,
                nomeAgentes: data.nomeAgentes,
                cliente
            };

        } catch (error: any) {
            console.error('[Onboarding] Erro no onboarding:', error);
            throw error;
        }
    }

    /**
     * Criar bucket R2 isolado para o cliente
     */
    async createClientBucket(bucketName: string): Promise<void> {
        try {
            const command = new CreateBucketCommand({
                Bucket: bucketName
            });

            await this.r2Client.send(command);
            console.log(`[Onboarding] ✅ Bucket criado: ${bucketName}`);
        } catch (error: any) {
            // Se bucket já existe, não é erro crítico
            if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
                console.log(`[Onboarding] ⚠️ Bucket ${bucketName} já existe, usando existente`);
                return;
            }
            console.error('[Onboarding] Erro ao criar bucket:', error);
            throw new Error(`Falha ao criar bucket R2: ${error.message}`);
        }
    }

    /**
     * Criar estrutura de pastas no bucket
     */
    async setupBucketFolders(bucketName: string): Promise<void> {
        const folders = ['Lançamentos/', 'Vendas/', 'Locação/'];

        for (const folder of folders) {
            try {
                // Criar "pasta" com arquivo .keep vazio
                const command = new PutObjectCommand({
                    Bucket: bucketName,
                    Key: `${folder}.keep`,
                    Body: Buffer.from(''),
                    ContentType: 'text/plain'
                });

                await this.r2Client.send(command);
                console.log(`[Onboarding] ✅ Pasta criada: ${folder}`);
            } catch (error: any) {
                console.error(`[Onboarding] Erro ao criar pasta ${folder}:`, error.message);
            }
        }
    }

    /**
     * Deletar bucket do cliente (offboarding)
     */
    async deleteClientBucket(bucketName: string): Promise<void> {
        try {
            const command = new DeleteBucketCommand({
                Bucket: bucketName
            });

            await this.r2Client.send(command);
            console.log(`[Onboarding] ✅ Bucket deletado: ${bucketName}`);
        } catch (error: any) {
            console.error('[Onboarding] Erro ao deletar bucket:', error);
            throw new Error(`Falha ao deletar bucket: ${error.message}`);
        }
    }

    /**
     * Offboarding completo de cliente
     */
    async offboardCliente(clienteId: string): Promise<void> {
        console.log(`[Onboarding] Iniciando offboarding: ${clienteId}`);

        try {
            // 1. Buscar dados do cliente
            const { data: cliente, error } = await supabase
                .from('clientes')
                .select('*')
                .eq('id', clienteId)
                .single();

            if (error || !cliente) {
                throw new Error('Cliente não encontrado');
            }

            // 2. Marcar como cancelado (não deletar dados imediatamente)
            await supabase
                .from('clientes')
                .update({ status: 'cancelado' })
                .eq('id', clienteId);

            // 3. OPCIONAL: Deletar bucket (WARNING: irreversível!)
            // await this.deleteClientBucket(cliente.bucket_name);

            console.log(`[Onboarding] ✅ Offboarding concluído: ${cliente.nome}`);
        } catch (error: any) {
            console.error('[Onboarding] Erro no offboarding:', error);
            throw error;
        }
    }

    /**
     * Obter branding do cliente para PDFs
     */
    async getClienteBranding(clienteId: string): Promise<ClienteBranding> {
        const { data: cliente, error } = await supabase
            .from('clientes')
            .select('nome, logo_url, cor_primaria, cor_secundaria, telefone, email, website')
            .eq('id', clienteId)
            .single();

        if (error || !cliente) {
            throw new Error('Cliente não encontrado');
        }

        return {
            nome: cliente.nome,
            logo_url: cliente.logo_url,
            cor_primaria: cliente.cor_primaria || '#667eea',
            cor_secundaria: cliente.cor_secundaria || '#764ba2',
            telefone: cliente.telefone,
            email: cliente.email,
            website: cliente.website
        };
    }

    /**
     * Listar todos buckets de clientes
     */
    async listClientBuckets(): Promise<string[]> {
        try {
            const command = new ListBucketsCommand({});
            const response = await this.r2Client.send(command);

            return response.Buckets?.map(b => b.Name || '') || [];
        } catch (error: any) {
            console.error('[Onboarding] Erro ao listar buckets:', error);
            return [];
        }
    }

    /**
     * Atualizar storage usado de um cliente
     */
    async updateStorageUsage(clienteId: string, storageGb: number): Promise<void> {
        await supabase
            .from('clientes')
            .update({ storage_usado_gb: storageGb })
            .eq('id', clienteId);
    }

    /**
     * Gerar slug a partir do nome
     */
    private generateSlug(nome: string): string {
        return nome
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''); // Remove hífens do início/fim
    }

    /**
     * Obsoleto: Substituído pela chamada direta ao emailService
     */
    private async sendWelcomeEmail(cliente: any): Promise<void> {
        console.log(`[Onboarding] sendWelcomeEmail obsoleto. Usar emailService.`);
    }
}

export const onboardingService = new OnboardingService();
