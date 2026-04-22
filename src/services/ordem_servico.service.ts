import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_TENANT = 'rbhkwmesmvytqdfuwcie';

export const ordemServicoService = {
    // PRESTADORES
    async getPrestadores(tenantId = DEFAULT_TENANT) {
        const { data, error } = await supabase
            .from('prestadores_servico')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('nome');
        if (error) throw error;
        return data;
    },

    async createPrestador(prestador: any) {
        const { data, error } = await supabase
            .from('prestadores_servico')
            .insert([{ ...prestador, tenant_id: prestador.tenant_id || DEFAULT_TENANT }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ORDENS DE SERVIÇO
    async getOrdensServico(tenantId = DEFAULT_TENANT) {
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('*, imoveis(titulo, endereco), prestadores_servico(nome)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createOrdemServico(os: any) {
        const { data, error } = await supabase
            .from('ordens_servico')
            .insert([{ ...os, tenant_id: os.tenant_id || DEFAULT_TENANT }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateStatusOS(osId: string, status: string, additionalData: any = {}) {
        const updateData: any = {
            status,
            updated_at: new Date().toISOString(),
            ...additionalData
        };

        if (status === 'concluida') {
            updateData.data_conclusao = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('ordens_servico')
            .update(updateData)
            .eq('id', osId)
            .select()
            .single();

        if (error) throw error;

        // Se a OS for marcada como 'paga', podemos futuramente gerar um lançamento financeiro de saída.
        // Por enquanto, apenas atualizamos o status.

        return data;
    }
};
