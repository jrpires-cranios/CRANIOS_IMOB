import { supabase } from '../config/supabase.js';
import { chatAgent } from '../agents/chat_agent.js'; // Usa o modelo configurado no projeto (GPT-4o / GPT-4o-mini)
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const leadReactivationService = {
    /**
     * Gera uma mensagem utilizando o histórico do lead para sugerir o melhor hook
     */
    async generateMessage(leadId: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            // Busca o Lead
            const { data: lead, error: leadErr } = await supabase
                .from('leads')
                .select('*')
                .eq('id', leadId)
                .single();
            
            if (leadErr || !lead) return { success: false, error: 'Lead não encontrado.' };

            // Se for chat automatizado, buscar o histórico
            let chatHistory = '';
            if (lead.session_id) {
                const { data: mensagens } = await supabase
                    .from('mensagens')
                    .select('role, content')
                    .eq('session_id', lead.session_id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                
                if (mensagens && mensagens.length > 0) {
                    chatHistory = mensagens.reverse().map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
                }
            }

            const prompt = `
Você é Elena, a corretora digital da Crânios IMOB. Seu trabalho agora é reativar um cliente (Lead) cujo interesse deu uma "esfriada" (está parado no funil sem avanços).
Sua meta é escrever UMA MENSAGEM CURTA de whatsapp, amigável, humanizada, que desperte a curiosidade do cliente novamente. 

NOME DO LEAD: ${lead.nome || 'Cliente'}
EMAIL: ${lead.email || '-'}
URGÊNCIA MARCADA QUANDO ENTROU: ${lead.urgencia || '-'}

Último histórico de conversa que tivemos com ele (foco apenas no que ele pediu):
${chatHistory ? chatHistory : 'Não há histórico documentado.'}

Padrão de escrita:
- Comece de forma casual: "Oi Eduardo, tudo bem? Aqui é a equipe da..."
- Diga que encontrou algo que combina com ele ou que lembrou dele.
- Seja breve. Devolva apenas o texto final a ser preenchido na caixa de texto do gestor (não coloque aspas ou prefixos).
`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
            });

            const aiMessage = completion.choices[0]?.message?.content?.trim();

            return { success: true, message: aiMessage };
        } catch (e: any) {
            console.error('[ReactivationService] Erro gerando mensagem:', e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Envia e registra a mensagem
     */
    async sendAndLog(leadId: string, tenantId: string, corretorId: string | null, text: string) {
        try {
            // Insere o log
            const { data, error } = await supabase
                .from('reactivation_log')
                .insert([{
                    tenant_id: tenantId,
                    lead_id: leadId,
                    corretor_id: corretorId,
                    mensagem_original: text,
                    mensagem_enviada: text
                }])
                .select()
                .single();

            if (error) throw error;

            // Retira a flag de "risco vermelho", zerando o score
            await supabase
                .from('leads')
                .update({ risk_score: 0, last_status_change: new Date().toISOString() })
                .eq('id', leadId);

            return { success: true, logId: data.id };
        } catch (e: any) {
            console.error('[ReactivationService] Erro ao enviar log:', e);
            return { success: false, error: e.message };
        }
    }
};
