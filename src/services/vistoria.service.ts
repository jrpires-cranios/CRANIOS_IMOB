import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_TENANT = 'rbhkwmesmvytqdfuwcie';

export const vistoriaService = {
    // VISTORIAS
    async getVistorias(tenantId = DEFAULT_TENANT) {
        const { data, error } = await supabase
            .from('vistorias')
            .select('*, imoveis(titulo, endereco), corretores(nome)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getVistoriaById(id: string) {
        const { data: vistoria, error: vError } = await supabase
            .from('vistorias')
            .select('*, imoveis(titulo, endereco), corretores(nome)')
            .eq('id', id)
            .single();
        if (vError) throw vError;

        const { data: itens, error: iError } = await supabase
            .from('vistoria_itens')
            .select('*')
            .eq('vistoria_id', id)
            .order('created_at');
        if (iError) throw iError;

        return { ...vistoria, itens };
    },

    async createVistoria(vistoria: any) {
        const { data, error } = await supabase
            .from('vistorias')
            .insert([{ ...vistoria, tenant_id: vistoria.tenant_id || DEFAULT_TENANT }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateVistoria(id: string, updates: any) {
        const { data, error } = await supabase
            .from('vistorias')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ITENS DA VISTORIA
    async upsertVistoriaItem(item: any) {
        const { data, error } = await supabase
            .from('vistoria_itens')
            .upsert([item])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteVistoriaItem(id: string) {
        const { error } = await supabase
            .from('vistoria_itens')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // AÇÕES ESPECIAIS
    async concluirVistoria(id: string) {
        return this.updateVistoria(id, { status: 'concluida', data_vistoria: new Date().toISOString() });
    }
};
