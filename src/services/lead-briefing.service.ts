import { supabase } from '../config/supabase.js';
import { llmService } from './llm.service.js';
import { emailService } from './email.service.js';
import { telegramBotInstance } from '../bots/telegram/corretor.bot.js';

export interface Briefing {
    resumo: string;
    temperatura: string;
    persona: string;
    objecoes: string;
    abordagens: string;
}

export class LeadBriefingService {
    /**
     * Gera um briefing (dossiê) estruturado usando LLM com base no histórico do chat
     */
    async gerarBriefing(leadId: string): Promise<Briefing | null> {
        try {
            // 1. Buscar histórico completo de mensagens do lead
            const { data: historico, error } = await supabase
                .from('mensagens')
                .select('role, content, created_at')
                .eq('metadata->lead_id', leadId)
                .order('created_at', { ascending: true });

            // Se não encontrar usando metadata, tenta pelo session_id do lead
            let messagesToAnalyze = historico;
            if (error || !historico || historico.length === 0) {
                const { data: lead } = await supabase.from('leads').select('telefone').eq('id', leadId).single();
                if (lead && lead.telefone) {
                    const sessionId = `whatsapp:${lead.telefone}`;
                    const { data: hist2 } = await supabase
                        .from('mensagens')
                        .select('role, content, created_at')
                        .eq('session_id', sessionId)
                        .order('created_at', { ascending: true });
                    messagesToAnalyze = hist2;
                }
            }

            if (!messagesToAnalyze || messagesToAnalyze.length === 0) {
                console.warn(`[LeadBriefing] Sem histórico para gerar briefing do lead ${leadId}`);
                return null;
            }

            // Converter para string limpa
            const historicoStr = messagesToAnalyze.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n');

            // 2. Pedir ao LLM para analisar e extrair as seções
            const prompt = `
            Você é um gerente de vendas imobiliárias sênior analisando uma conversa de triagem entre um Agente de IA e um Lead.
            Com base nesse histórico, gere um BRIEFING ESTRUTURADO para preparar o corretor humano para a visita.

            [HISTÓRICO DA CONVERSA]
            ${historicoStr}

            [INSTRUÇÕES]
            Retorne um JSON estrito com os seguintes campos:
            - "resumo": 3 bullet points curtos resumindo o que o cliente busca (imóvel, região, orçamento).
            - "temperatura": Uma avaliação curta, ex: "🔥 QUENTE (8/10) - Responde rápido, quer fechar este mês".
            - "persona": Perfil psicológico do cliente (ex: Analítico-Pragmático, Emocional-Visionário). Crie o perfil em 1-2 frases.
            - "objecoes": As preocupações levantadas (ex: valor de entrada, localização, IPTU).
            - "abordagens": 3 dicas táticas ESTRATÉGICAS para o corretor usar na visita e fechar negócio.

            Retorne APENAS o JSON puro, sem crases Markdown (SEM \`\`\`json).
            `;

            const respostaTexto = await llmService.generateResponse({
                systemPrompt: prompt,
                userMessage: "Por favor, gere o briefing JSON agora.",
                temperature: 0.3
            });

            // Limpar possível markdown
            const jsonLimpo = respostaTexto.replace(/```json/gi, '').replace(/```/g, '').trim();
            const briefingParsed = JSON.parse(jsonLimpo) as Briefing;

            // Salvar no banco (em uma tabela hipotética ou no nota_sdr do lead)
            const briefingTexto = `
📋 BRIEFING AUTOMÁTICO
──────────────────
🌡️ TEMPERATURA: ${briefingParsed.temperatura}
🔍 PERSONA: ${briefingParsed.persona}

📝 RESUMO:
${briefingParsed.resumo}

⚠️ OBJEÇÕES:
${briefingParsed.objecoes}

🎯 ABORDAGENS:
${briefingParsed.abordagens}
            `;

            await supabase.from('leads').update({
                notas_sdr: briefingTexto
            }).eq('id', leadId);

            console.log(`[LeadBriefing] ✅ Briefing gerado e salvo para lead ${leadId}`);

            // 3. Disparar notificação por Email para o corretor
            const { data: leadAtualizado } = await supabase.from('leads').select('nome, telefone, corretor_id').eq('id', leadId).single();
            if (leadAtualizado && leadAtualizado.corretor_id) {
                const { data: corretor } = await supabase.from('corretores').select('nome, email').eq('id', leadAtualizado.corretor_id).single();
                if (corretor && corretor.email) {
                    await emailService.enviarBriefingCorretor({
                        corretorEmail: corretor.email,
                        corretorNome: corretor.nome.split(' ')[0],
                        leadNome: leadAtualizado.nome || 'Cliente',
                        leadTelefone: leadAtualizado.telefone || 'Não informado',
                        briefing: briefingParsed
                    });

                    // Notificar o corretor também via Telegram Bot se configurado
                    if (telegramBotInstance && leadAtualizado.corretor_id) {
                        try {
                            let matchScoreText = 'N/A';
                            // Apenas extrai o dado se houver no banco, mockamos do resumo ou pegamos do DB
                            telegramBotInstance.sendLeadToCorretor(leadAtualizado.corretor_id, {
                                nome: leadAtualizado.nome || 'Cliente',
                                whatsapp: leadAtualizado.telefone || 'Não informado',
                                intencao: 'Visita Agendada',
                                resumo_ia: briefingParsed.resumo,
                                match_score: matchScoreText
                            });
                        } catch (err) {
                            console.error('[LeadBriefing] Falha ao despachar para Telegram:', err);
                        }
                    }
                }
            }

            return briefingParsed;

        } catch (error: any) {
            console.error('[LeadBriefing] Erro ao gerar briefing:', error.message);
            return null;
        }
    }
}

export const leadBriefingService = new LeadBriefingService();
