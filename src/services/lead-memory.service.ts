import { SupabaseClient } from '@supabase/supabase-js';

export interface LeadProfile {
    name?: string;
    operacao?: 'comprar' | 'alugar';
    tipo_imovel?: string;
    bairros?: string[];
    quartos_min?: number;
    preco_max?: number;
    urgencia?: string;
    total_sessions: number;
    last_interaction_at: string;
    imoveis_visualizados?: string[];
}

export class LeadMemoryService {
    constructor(private supabase: SupabaseClient, private tenantId: string) { }

    // Buscar perfil existente
    async getProfile(identifier: string, channel: string): Promise<LeadProfile | null> {
        try {
            const { data, error } = await this.supabase
                .from('lead_memory')
                .select('*')
                .eq('tenant_id', this.tenantId)
                .eq('identifier', identifier)
                .eq('channel', channel)
                .eq('status', 'active')
                .single();

            if (error) {
                if (error.code !== 'PGRST116') { // PGRST116 é no rows returned
                    console.error('Erro ao buscar lead memory:', error);
                }
                return null;
            }
            return data;
        } catch (e) {
            console.error('Exception no getProfile (LeadMemory):', e);
            return null;
        }
    }

    // Criar ou atualizar memória
    async upsertProfile(identifier: string, channel: string, updates: Partial<LeadProfile>, identifierType: string = 'phone') {
        try {
            const profile = await this.getProfile(identifier, channel);
            const totalSessions = profile ? (profile.total_sessions || 1) : 1;

            // Só incrementamos session se tiver passado mais de 1h desde a última interação (heuristic)
            let newTotalSessions = totalSessions;
            if (profile && profile.last_interaction_at) {
                const lastInter = new Date(profile.last_interaction_at).getTime();
                const now = new Date().getTime();
                if (now - lastInter > 1000 * 60 * 60 * 2) { // 2 horas sem falar = nova sessão
                    newTotalSessions += 1;
                }
            }

            const { error } = await this.supabase.from('lead_memory').upsert({
                tenant_id: this.tenantId,
                identifier,
                channel,
                identifier_type: identifierType,
                ...updates,
                last_interaction_at: new Date().toISOString(),
                total_sessions: newTotalSessions,
            }, { onConflict: 'tenant_id,identifier,channel' });

            if (error) {
                console.error('Erro no upsertProfile (LeadMemory):', error);
            }
        } catch (e) {
            console.error('Exception no upsertProfile (LeadMemory):', e);
        }
    }

    // Gerar bloco de contexto para injetar no prompt da Elena
    buildContextBlock(profile: LeadProfile | null): string {
        if (!profile) return '';

        const parts: string[] = [];
        parts.push(`=== MEMORIA DO LEAD ===`);
        if (profile.name) parts.push(`Nome: ${profile.name}`);
        if (profile.operacao) parts.push(`Intencao: ${profile.operacao}`);
        if (profile.tipo_imovel) parts.push(`Tipo: ${profile.tipo_imovel}`);
        if (profile.bairros?.length) parts.push(`Bairros: ${profile.bairros.join(', ')}`);
        if (profile.quartos_min) parts.push(`Quartos minimo: ${profile.quartos_min}`);
        if (profile.preco_max) parts.push(`Orcamento maximo: R$ ${profile.preco_max.toLocaleString('pt-BR')}`);
        if (profile.urgencia) parts.push(`Urgencia: ${profile.urgencia}`);
        parts.push(`Sessoes anteriores: ${profile.total_sessions}`);
        parts.push(`Ultima visita: ${new Date(profile.last_interaction_at).toLocaleDateString('pt-BR')}`);
        parts.push(`=== FIM DA MEMORIA ===`);

        return parts.join('\n');
    }
}
