import { supabase } from '../config/supabase.js';

export const PLAN_LIMITS = {
    starter: { corretores: 3, leads_mes: 200 },
    pro: { corretores: 8, leads_mes: 600 },
    enterprise: { corretores: 999, leads_mes: 99999 }
} as const;

type PlanType = keyof typeof PLAN_LIMITS;

export class PlanLimitError extends Error {
    public code: string;
    public details: any;

    constructor(details: { code: string; message: string; upgrade_url: string; limit: number; current: number }) {
        super(details.message);
        this.name = 'PlanLimitError';
        this.code = details.code;
        this.details = details;
    }
}

export class PlanLimitsService {
    /**
     * Verifica se o tenant já atingiu o limite de corretores permitidos no plano atual.
     * Dispara um PlanLimitError caso o limite seja ultrapassado.
     * @param tenantId ID do cliente/tenant
     */
    async checkCorretorLimit(tenantId: string): Promise<void> {
        // 1. Busca os dados do plano (assumindo que "clientes" atua como tenant aqui em alguns fluxos ou "tenants" no banco)
        // No nosso sistema, tenants englobam dados globais de plano.
        let { data: tenant, error } = await supabase
            .from('tenants')
            .select('plano')
            .eq('id', tenantId)
            .single();

        if (error || !tenant) {
            // Fallback: Tenta buscar pelo "clientes" (legado) ou assume plano 'starter'
            tenant = { plano: 'starter' };
        }

        const plano = (tenant.plano as PlanType) || 'starter';
        const limit = PLAN_LIMITS[plano]?.corretores || PLAN_LIMITS.starter.corretores;

        // 2. Conta os corretores ativos
        const { count, error: countError } = await supabase
            .from('corretores')
            .select('id', { count: 'exact', head: true })
            .eq('cliente_id', tenantId);

        if (countError) {
            console.warn('[PlanLimits] Não foi possível contar corretores:', countError);
            return;
        }

        const currentCount = count || 0;

        // 3. Verifica limite
        if (currentCount >= limit) {
            throw new PlanLimitError({
                code: 'CORRETOR_LIMIT_REACHED',
                message: `Seu plano (${plano.toUpperCase()}) permite até ${limit} corretores.`,
                upgrade_url: `/settings/upgrade`, // URL no frontend para fazer upgrade
                limit: limit,
                current: currentCount
            });
        }
    }

    /**
     * Verifica limites gerais (leads, etc)
     */
    async checkLeadLimit(tenantId: string): Promise<boolean> {
        // A implementar logica de limite mensal de leads
        return true;
    }
}

export const planLimitsService = new PlanLimitsService();
