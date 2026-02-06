import type { Conversa, Mensagem } from '../types/index.js';
export declare class ChatService {
    getOrCreateConversa(sessionId: string, userData?: {
        nome?: string;
        email?: string;
        telefone?: string;
    }): Promise<Conversa>;
    saveMessage(sessionId: string, role: 'user' | 'assistant', content: string, metadata?: Record<string, unknown>): Promise<Mensagem>;
    getHistory(sessionId: string, limit?: number): Promise<Mensagem[]>;
    getConversaWithMessages(sessionId: string): Promise<{
        conversa: Conversa;
        messages: Mensagem[];
    }>;
    deleteConversa(sessionId: string): Promise<boolean>;
}
export declare const chatService: ChatService;
//# sourceMappingURL=chat.service.d.ts.map