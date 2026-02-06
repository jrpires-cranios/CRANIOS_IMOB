import type { Lead, CreateLeadDTO } from '../types/index.js';
export interface ServiceResult<T> {
    data: T[];
    total?: number;
}
export declare class LeadsService {
    getAll(filters?: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<ServiceResult<Lead>>;
    getById(id: string): Promise<Lead>;
    create(lead: CreateLeadDTO): Promise<Lead>;
    updateStatus(id: string, status: string): Promise<Lead>;
    delete(id: string): Promise<boolean>;
    getStats(): Promise<{
        total: number;
        novo: number;
        em_atendimento: number;
        qualificado: number;
        convertido: number;
    }>;
}
export declare const leadsService: LeadsService;
//# sourceMappingURL=leads.service.d.ts.map