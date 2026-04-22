export interface PortalImovel {
    id: string;
    tenant_id: string;
    titulo?: string;
    descricao?: string;
    tipo?: string;
    valor_venda?: number;
    valor_aluguel?: number;
    quartos?: number;
    banheiros?: number;
    suites?: number;
    vagas?: number;
    area_util?: number;
    cep?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    fotos?: string[];
    caracteristicas?: string[];
    status?: string;
    [key: string]: any;
}

export interface PortalPublishResult {
    externalId: string;
    url: string;
}

export interface PortalAdapter {
    portalName: string;
    publish(imovel: PortalImovel, credentials: any, config?: any): Promise<PortalPublishResult>;
    update(externalId: string, changes: Partial<PortalImovel>, credentials: any, config?: any): Promise<void>;
    unpublish(externalId: string, credentials: any, config?: any): Promise<void>;
    syncStatus(externalId: string, credentials: any, config?: any): Promise<'published' | 'paused' | 'unpublished' | 'error'>;
}
