import type { Imovel, CreateImovelDTO } from '../types/index.js';
export interface ServiceResult<T> {
    data: T[];
    total?: number;
}
export declare class ImoveisService {
    getAll(filters?: {
        tipo?: string;
        finalidade?: string;
        cidade?: string;
        quartos_min?: number;
        preco_min?: number;
        preco_max?: number;
        limit?: number;
        offset?: number;
    }): Promise<ServiceResult<Imovel>>;
    getById(id: string): Promise<Imovel>;
    getDestaque(limit?: number): Promise<Imovel[]>;
    create(imovel: CreateImovelDTO): Promise<Imovel>;
    update(id: string, updates: Partial<CreateImovelDTO>): Promise<Imovel>;
    delete(id: string): Promise<boolean>;
    search(query: string, limit?: number): Promise<Imovel[]>;
}
export declare const imoveisService: ImoveisService;
//# sourceMappingURL=imoveis.service.d.ts.map