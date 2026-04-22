import { supabase } from '../config/supabase.js';

export class LeadService {

    /**
     * Encontra um lead pelo telefone/whatsapp ou cria novo.
     * Gera um Short ID (ex: C-1234) se for novo.
     * Resiliente: se falhar, retorna lead fictício para não travar o chat.
     */
    async findOrCreate(whatsapp: string, nome?: string): Promise<{ lead: any, isNew: boolean }> {
        try {
            // Tenta encontrar pelo whatsapp
            const { data: existingLead, error: findError } = await supabase
                .from('leads')
                .select('*')
                .eq('whatsapp', whatsapp)
                .single();

            if (existingLead && !findError) {
                // Se já existe e temos o nome novo, atualiza
                if (nome && (!existingLead.nome || existingLead.nome === 'Cliente')) {
                    await this.updateName(existingLead.id, nome);
                    existingLead.nome = nome;
                }
                return { lead: existingLead, isNew: false };
            }

            // Se não existe, cria novo
            const shortId = await this.generateShortId();
            const newLead = {
                whatsapp,
                nome: nome || 'Cliente',
                short_id: shortId,
                status: 'novo',
            };

            const { data: createdLead, error } = await supabase
                .from('leads')
                .insert(newLead)
                .select()
                .single();

            if (error) {
                console.error('[LeadService] Erro ao criar lead:', error);
                // Retorna lead fallback para não travar
                return { lead: { ...newLead, id: 'temp-' + Date.now(), short_id: shortId }, isNew: true };
            }

            return { lead: createdLead, isNew: true };

        } catch (e) {
            console.error('[LeadService] Erro inesperado:', e);
            // Fallback resiliente - NUNCA trava o chat
            return {
                lead: {
                    id: 'temp-' + Date.now(),
                    whatsapp,
                    nome: nome || 'Cliente',
                    short_id: 'C-TEMP',
                },
                isNew: true
            };
        }
    }

    /**
     * Atualiza o nome do lead
     */
    async updateName(leadId: string, nome: string) {
        try {
            await supabase
                .from('leads')
                .update({ nome })
                .eq('id', leadId);
        } catch (e) {
            console.warn('[LeadService] Erro ao atualizar nome:', e);
        }
    }

    /**
     * Gera ID curto único (ex: C-A1B2)
     */
    private async generateShortId(): Promise<string> {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `C-${result}`;
    }

    /**
     * Recupera HISTÓRICO GLOBAL do lead (todas as sessões)
     * Resiliente: retorna array vazio se falhar.
     */
    async getGlobalHistory(leadId: string, limit = 10): Promise<{ role: string, content: string }[]> {
        try {
            // Se for um lead temporário, sem histórico
            if (leadId.startsWith('temp-')) return [];

            const { data: lead } = await supabase.from('leads').select('whatsapp').eq('id', leadId).single();
            if (!lead) return [];

            // Busca por session_id igual ao whatsapp
            const { data: msgs } = await supabase
                .from('mensagens')
                .select('role, content, created_at')
                .eq('session_id', lead.whatsapp)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (msgs && msgs.length > 0) {
                return msgs.map(m => ({
                    role: m.role === 'user' ? 'user' : 'assistant',
                    content: m.content
                })).reverse();
            }

            return [];
        } catch (e) {
            console.warn('[LeadService] Erro ao buscar histórico:', e);
            return [];
        }
    }
}

export const leadService = new LeadService();
