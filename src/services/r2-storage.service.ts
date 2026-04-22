import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class R2StorageService {
    private client: S3Client;
    private bucketName: string;
    private publicDomain: string;

    constructor(bucketNameOverride?: string) {
        const accountId = process.env.R2_ACCOUNT_ID || '';
        const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
        this.bucketName = bucketNameOverride || process.env.R2_BUCKET_NAME || 'cranios-imob';
        this.publicDomain = process.env.R2_PUBLIC_DOMAIN || `https://pub-${accountId}.r2.dev`;

        // Cloudflare R2 usa S3-compatible API
        this.client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId,
                secretAccessKey
            }
        });

        console.log(`[R2Storage] Initialized with bucket: ${this.bucketName}`);
    }

    /**
     * Retorna instância do serviço apontando para o bucket de um cliente específico
     * Uso: R2StorageService.forCliente('nome-imobiliaria')
     */
    static forCliente(bucketName: string): R2StorageService {
        return new R2StorageService(bucketName);
    }

    /**
     * Upload de arquivo para R2
     * Estrutura: clientes/{clienteId}/imoveis/{imovelId}/{tipo}/{filename}
     */
    async upload(
        buffer: Buffer,
        path: string,
        contentType: string = 'application/octet-stream'
    ): Promise<string> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: path,
                Body: buffer,
                ContentType: contentType,
                // Tornar público para leitura
                ACL: 'public-read'
            });

            await this.client.send(command);

            const publicUrl = `${this.publicDomain}/${path}`;
            console.log(`[R2Storage] ✅ Upload concluído: ${publicUrl}`);

            return publicUrl;
        } catch (error: any) {
            console.error('[R2Storage] Erro no upload:', error);
            throw new Error(`Falha no upload para R2: ${error.message}`);
        }
    }

    /**
     * Upload de PDF do imóvel
     */
    async uploadPropertyPDF(
        pdfBuffer: Buffer,
        imovelId: string,
        clienteId: string = 'default'
    ): Promise<string> {
        const timestamp = Date.now();
        const path = `clientes/${clienteId}/imoveis/${imovelId}/pdfs/book_${timestamp}.pdf`;
        return this.upload(pdfBuffer, path, 'application/pdf');
    }

    /**
     * Upload de foto de imóvel
     */
    async uploadPropertyPhoto(
        imageBuffer: Buffer,
        imovelId: string,
        filename: string,
        clienteId: string = 'default'
    ): Promise<string> {
        const path = `clientes/${clienteId}/imoveis/${imovelId}/fotos/${filename}`;
        const contentType = this.getContentType(filename);
        return this.upload(imageBuffer, path, contentType);
    }

    /**
     * Upload de foto de vistoria
     */
    async uploadInspectionPhoto(
        imageBuffer: Buffer,
        vistoriaId: string,
        filename: string,
        clienteId: string = 'default'
    ): Promise<string> {
        const path = `clientes/${clienteId}/vistorias/${vistoriaId}/${filename}`;
        const contentType = this.getContentType(filename);
        return this.upload(imageBuffer, path, contentType);
    }

    /**
     * Gerar URL assinada (para uploads diretos do frontend)
     */
    async getSignedUploadUrl(path: string, expiresIn: number = 3600): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: path
        });

        const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
        return signedUrl;
    }

    /**
     * Deletar arquivo
     */
    async delete(path: string): Promise<void> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: path
            });

            await this.client.send(command);
            console.log(`[R2Storage] ✅ Arquivo deletado: ${path}`);
        } catch (error: any) {
            console.error('[R2Storage] Erro ao deletar:', error);
            throw new Error(`Falha ao deletar de R2: ${error.message}`);
        }
    }

    /**
     * Verificar se arquivo existe
     */
    async exists(path: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: path
            });

            await this.client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === 'NotFound') {
                return false;
            }
            throw error;
        }
    }

    /**
     * Determinar Content-Type pelo nome do arquivo
     */
    private getContentType(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        const types: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'pdf': 'application/pdf',
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo'
        };

        return types[ext || ''] || 'application/octet-stream';
    }

    /**
     * Listar arquivos de uma pasta do bucket
     * Ex: listFiles('Lançamentos/') retorna todos os PDFs da pasta
     */
    async listFiles(prefix: string = '', maxResults: number = 100, bucketOverride?: string): Promise<Array<{
        key: string;
        nome: string;
        tamanho: number;
        ultimaModificacao: Date;
        tipo: string;
        urlAssinada?: string;
    }>> {
        try {
            const command = new ListObjectsV2Command({
                Bucket: bucketOverride || this.bucketName,
                Prefix: prefix,
                MaxKeys: maxResults,
            });

            const response = await this.client.send(command);
            const arquivos = response.Contents || [];

            return arquivos
                .filter(obj => obj.Key && !obj.Key.endsWith('/')) // excluir pastas
                .map(obj => {
                    const nomeCompleto = obj.Key || '';
                    const nome = nomeCompleto.split('/').pop() || nomeCompleto;
                    const ext = nome.split('.').pop()?.toLowerCase() || '';
                    return {
                        key: nomeCompleto,
                        nome,
                        tamanho: obj.Size || 0,
                        ultimaModificacao: obj.LastModified || new Date(),
                        tipo: ext,
                    };
                });
        } catch (error: any) {
            console.error('[R2Storage] Erro ao listar arquivos:', error.message);
            return [];
        }
    }

    /**
     * Gerar URL assinada para DOWNLOAD (compartilhar PDFs via chat/email)
     * @param path - Caminho do arquivo no bucket (ex: "Lançamentos/book_torre_verde.pdf")
     * @param expiresIn - Expiração em segundos (padrão: 7 dias = 604800)
     * @param nomeDownload - Nome sugerido ao fazer download
     */
    async getSignedDownloadUrl(
        path: string,
        expiresIn: number = 604800,
        nomeDownload?: string,
        bucketOverride?: string
    ): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: bucketOverride || this.bucketName,
            Key: path,
            ResponseContentDisposition: nomeDownload
                ? `attachment; filename="${encodeURIComponent(nomeDownload)}"`
                : 'inline',
            ResponseContentType: 'application/pdf',
        });

        const url = await getSignedUrl(this.client, command, { expiresIn });
        console.log(`[R2Storage] ✅ URL de download gerada para: ${path} (expira em ${expiresIn / 3600}h)`);
        return url;
    }

    /**
     * Listar PDFs de Lançamentos com URLs assinadas prontas para compartilhar
     */
    async listarLancamentos(clienteId?: string, bucketName?: string): Promise<Array<{
        nome: string;
        urlDownload: string;
        tamanhoMB: string;
        key: string;
    }>> {
        // Tenta pasta personalizada do cliente primeiro, depois a global
        const prefixos = clienteId
            ? [`clientes/${clienteId}/Lançamentos/`, `Lançamentos/`]
            : [`Lançamentos/`];

        const bucket = bucketName || this.bucketName;
        for (const prefix of prefixos) {
            const arquivos = await this.listFiles(prefix, 100, bucket);
            const pdfs = arquivos.filter(a => a.tipo === 'pdf');

            if (pdfs.length > 0) {
                const resultado = await Promise.all(
                    pdfs.map(async (pdf) => ({
                        nome: pdf.nome.replace('.pdf', '').replace(/_/g, ' '),
                        key: pdf.key,
                        urlDownload: await this.getSignedDownloadUrl(pdf.key, 604800, pdf.nome, bucket),
                        tamanhoMB: (pdf.tamanho / 1024 / 1024).toFixed(1) + ' MB',
                    }))
                );
                console.log(`[R2Storage] ✅ ${resultado.length} PDFs em '${prefix}' (bucket: ${bucket})`);
                return resultado;
            }
        }

        return [];
    }

    /**
     * URL pública de um arquivo (para buckets com acesso público ativado)
     */
    getPublicUrl(path: string): string {
        return `${this.publicDomain}/${path}`;
    }

    /**
     * Migrar arquivos de uma URL pública qualquer externa para o R2 (helper para importação de imóveis)
     */
    async migrateFromExternalUrl(externalUrl: string, destinationPath: string): Promise<string> {
        try {
            const response = await fetch(externalUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch from external URL: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = response.headers.get('content-type') || 'application/octet-stream';

            return await this.upload(buffer, destinationPath, contentType);
        } catch (error: any) {
            console.error(`[R2Storage] Erro ao migrar da URL ${externalUrl}:`, error.message);
            throw error;
        }
    }
}

export const r2StorageService = new R2StorageService();
