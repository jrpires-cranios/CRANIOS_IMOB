interface DifyChatContext {
    sessionId: string;
    message: string;
    inputs?: Record<string, any>;
}

interface DifyChatResult {
    answer: string;
    conversationId?: string;
    messageId?: string;
}

class DifyCeciliaService {
    private baseUrl: string;
    private apiKey: string;

    constructor() {
        this.baseUrl = (process.env.DIFY_CECILIA_BASE_URL || 'https://api.dify.ai/v1').replace(/\/$/, '');
        this.apiKey = process.env.DIFY_CECILIA_API_KEY || '';
    }

    isConfigured(): boolean {
        return Boolean(this.baseUrl && this.apiKey);
    }

    async sendMessage({ sessionId, message, inputs = {} }: DifyChatContext): Promise<DifyChatResult | null> {
        if (!this.isConfigured()) return null;

        const response = await fetch(`${this.baseUrl}/chat-messages`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs,
                query: message,
                response_mode: 'blocking',
                user: sessionId,
            }),
        });

        const data = await response.json() as any;

        if (!response.ok) {
            const error = data?.message || data?.error || `Dify HTTP ${response.status}`;
            throw new Error(error);
        }

        return {
            answer: data.answer || data.data?.answer || '',
            conversationId: data.conversation_id,
            messageId: data.message_id,
        };
    }
}

export const difyCeciliaService = new DifyCeciliaService();
