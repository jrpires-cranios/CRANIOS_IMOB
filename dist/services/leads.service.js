"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadsService = exports.LeadsService = void 0;
const supabase_js_1 = require("../config/supabase.js");
class LeadsService {
    async getAll(filters) {
        let query = supabase_js_1.supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });
        if (filters?.status) {
            query = query.eq('status', filters.status);
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
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return data;
    }
    async create(lead) {
        const { data, error } = await supabase_js_1.supabase
            .from('leads')
            .insert([{
                ...lead,
                status: 'novo',
            }])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateStatus(id, status) {
        const { data, error } = await supabase_js_1.supabase
            .from('leads')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async delete(id) {
        const { error } = await supabase_js_1.supabase
            .from('leads')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return true;
    }
    async getStats() {
        const { data, error } = await supabase_js_1.supabase
            .from('leads')
            .select('status');
        if (error)
            throw error;
        const stats = {
            total: data.length,
            novo: 0,
            em_atendimento: 0,
            qualificado: 0,
            convertido: 0,
        };
        data.forEach((lead) => {
            const status = lead.status;
            if (status in stats && status !== 'total') {
                stats[status]++;
            }
        });
        return stats;
    }
}
exports.LeadsService = LeadsService;
exports.leadsService = new LeadsService();
//# sourceMappingURL=leads.service.js.map