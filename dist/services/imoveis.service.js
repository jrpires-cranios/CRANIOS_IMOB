"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imoveisService = exports.ImoveisService = void 0;
const supabase_js_1 = require("../config/supabase.js");
class ImoveisService {
    async getAll(filters) {
        let query = supabase_js_1.supabase
            .from('imoveis')
            .select('*', { count: 'exact' })
            .eq('disponivel', true)
            .order('destaque', { ascending: false })
            .order('created_at', { ascending: false });
        if (filters?.tipo) {
            query = query.eq('tipo', filters.tipo);
        }
        if (filters?.finalidade) {
            query = query.eq('finalidade', filters.finalidade);
        }
        if (filters?.cidade) {
            query = query.ilike('cidade', `%${filters.cidade}%`);
        }
        if (filters?.quartos_min) {
            query = query.gte('quartos', filters.quartos_min);
        }
        if (filters?.preco_min) {
            query = query.gte('preco_venda', filters.preco_min);
        }
        if (filters?.preco_max) {
            query = query.lte('preco_venda', filters.preco_max);
        }
        const limit = filters?.limit || 20;
        const offset = filters?.offset || 0;
        query = query.range(offset, offset + limit - 1);
        const { data, error, count } = await query;
        if (error)
            throw error;
        return { data: data, total: count || 0 };
    }
    async getById(id) {
        const { data, error } = await supabase_js_1.supabase
            .from('imoveis')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return data;
    }
    async getDestaque(limit = 6) {
        const { data, error } = await supabase_js_1.supabase
            .from('imoveis')
            .select('*')
            .eq('disponivel', true)
            .eq('destaque', true)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error)
            throw error;
        return data;
    }
    async create(imovel) {
        const { data, error } = await supabase_js_1.supabase
            .from('imoveis')
            .insert([{
                ...imovel,
                cidade: imovel.cidade || 'Salvador',
                estado: imovel.estado || 'BA',
                disponivel: true,
                destaque: false,
            }])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async update(id, updates) {
        const { data, error } = await supabase_js_1.supabase
            .from('imoveis')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async delete(id) {
        const { error } = await supabase_js_1.supabase
            .from('imoveis')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return true;
    }
    async search(query, limit = 10) {
        const { data, error } = await supabase_js_1.supabase
            .from('imoveis')
            .select('*')
            .eq('disponivel', true)
            .or(`titulo.ilike.%${query}%,descricao.ilike.%${query}%,bairro.ilike.%${query}%,endereco.ilike.%${query}%`)
            .order('destaque', { ascending: false })
            .limit(limit);
        if (error)
            throw error;
        return data;
    }
}
exports.ImoveisService = ImoveisService;
exports.imoveisService = new ImoveisService();
//# sourceMappingURL=imoveis.service.js.map