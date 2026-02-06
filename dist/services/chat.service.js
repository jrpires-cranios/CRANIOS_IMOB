"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const supabase_js_1 = require("../config/supabase.js");
class ChatService {
    async getOrCreateConversa(sessionId, userData) {
        // Try to find existing conversa
        const { data: existing } = await supabase_js_1.supabase
            .from('conversas')
            .select('*')
            .eq('session_id', sessionId)
            .maybeSingle();
        if (existing) {
            // Update user data if provided
            if (userData && (userData.nome || userData.email || userData.telefone)) {
                const { data: updated } = await supabase_js_1.supabase
                    .from('conversas')
                    .update({
                    ...userData,
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', existing.id)
                    .select()
                    .maybeSingle();
                return updated;
            }
            return existing;
        }
        // Create new conversa
        const { data, error } = await supabase_js_1.supabase
            .from('conversas')
            .insert([{
                session_id: sessionId,
                ...userData,
            }])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async saveMessage(sessionId, role, content, metadata) {
        // Ensure conversa exists
        const conversa = await this.getOrCreateConversa(sessionId);
        const { data, error } = await supabase_js_1.supabase
            .from('mensagens')
            .insert([{
                conversa_id: conversa.id,
                session_id: sessionId,
                role,
                content,
                metadata,
            }])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async getHistory(sessionId, limit = 50) {
        const { data, error } = await supabase_js_1.supabase
            .from('mensagens')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(limit);
        if (error)
            throw error;
        return data;
    }
    async getConversaWithMessages(sessionId) {
        const conversa = await this.getOrCreateConversa(sessionId);
        const messages = await this.getHistory(sessionId);
        return {
            conversa,
            messages,
        };
    }
    async deleteConversa(sessionId) {
        // Messages will be deleted via CASCADE
        const { error } = await supabase_js_1.supabase
            .from('conversas')
            .delete()
            .eq('session_id', sessionId);
        if (error)
            throw error;
        return true;
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
//# sourceMappingURL=chat.service.js.map