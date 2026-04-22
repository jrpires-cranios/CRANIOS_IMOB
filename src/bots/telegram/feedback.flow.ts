import { Telegraf, Markup } from 'telegraf';
import { visitFeedbackService } from '../../services/visit-feedback.service.js';

interface FeedbackState {
    step: number;
    agendamentoId: string;
    leadName: string;
    corretorId: string;
    clienteId: string;
    leadId: string;
    
    // Respostas
    systemBriefingScore?: number;
    systemSatisfactionScore?: number;
    clientReaction?: 'amou' | 'gostou' | 'indiferente' | 'nao_gostou';
    closingProbability?: number;
    nextStep?: 'vai_pensar' | 'ver_outro' | 'deu_data' | 'fechamento' | 'desistiu';
    followupDate?: string;
}

// Mapa in-memory simples para o fluxo (substitui session-middleware para evitar dependencias extras)
// Chave: chatId (ou userId)
const userStates = new Map<string, FeedbackState>();

export function setupFeedbackFlow(bot: Telegraf) {
    
    // Recebe e processa todos os textos para quem está no fluxo
    bot.on('text', async (ctx, next) => {
        const userId = ctx.from.id.toString();
        const state = userStates.get(userId);

        if (!state) return next();

        try {
            const text = ctx.message.text.trim();

            switch (state.step) {
                case 1:
                    // Espera nota do briefing
                    const briefingScore = parseInt(text, 10);
                    if (isNaN(briefingScore) || briefingScore < 0 || briefingScore > 5) {
                        return ctx.reply('Por favor, digite um número de 0 a 5.');
                    }
                    state.systemBriefingScore = briefingScore;
                    state.step = 2;
                    userStates.set(userId, state);
                    return ctx.reply('Excelente. E qual sua satisfação geral com o sistema CRM da Crânios até agora? (0 a 5)', Markup.forceReply());

                case 2:
                    const satScore = parseInt(text, 10);
                    if (isNaN(satScore) || satScore < 0 || satScore > 5) {
                        return ctx.reply('Por favor, digite um número de 0 a 5.');
                    }
                    state.systemSatisfactionScore = satScore;
                    state.step = 3;
                    userStates.set(userId, state);
                    return ctx.reply(`Entendido! Agora sobre a visita com ${state.leadName}:\nQual foi a reação do cliente?`, Markup.inlineKeyboard([
                        [Markup.button.callback('Amou o imóvel', 'reacao_amou'), Markup.button.callback('Gostou', 'reacao_gostou')],
                        [Markup.button.callback('Indiferente', 'reacao_indiferente'), Markup.button.callback('Não gostou', 'reacao_nao_gostou')]
                    ]));

                case 4:
                    // Espera probabilidade de fechamento (0-10) numérico
                    const prob = parseInt(text, 10);
                    if (isNaN(prob) || prob < 0 || prob > 10) {
                        return ctx.reply('Por favor, digite um número de 0 a 10.');
                    }
                    state.closingProbability = prob;
                    state.step = 5;
                    userStates.set(userId, state);
                    return ctx.reply('Qual é o próximo passo com este cliente?', Markup.inlineKeyboard([
                        [Markup.button.callback('Vai pensar', 'next_vai_pensar'), Markup.button.callback('Ver outro', 'next_ver_outro')],
                        [Markup.button.callback('Deu uma data', 'next_deu_data'), Markup.button.callback('Fechar negócio!', 'next_fechamento')],
                        [Markup.button.callback('Desistiu', 'next_desistiu')]
                    ]));

                default:
                    return next();
            }
        } catch (err) {
            console.error('[Feedback Flow] Erro:', err);
            return ctx.reply('Ocorreu um erro no processamento da sua resposta.');
        }
    });

    // Handle Callback Queries (botões inline)
    bot.on('callback_query', async (ctx, next) => {
        const userId = ctx.from.id.toString();
        const state = userStates.get(userId);

        if (!state) return next();

        try {
            // @ts-ignore
            const data = ctx.callbackQuery.data;

            if (state.step === 3 && data.startsWith('reacao_')) {
                state.clientReaction = data.replace('reacao_', '') as any;
                state.step = 4;
                userStates.set(userId, state);
                await ctx.answerCbQuery();
                await ctx.deleteMessage();
                return ctx.reply('Legal. De 0 a 10, qual você acha que é a probabilidade dele fechar esse negócio?', Markup.forceReply());
            }

            if (state.step === 5 && data.startsWith('next_')) {
                state.nextStep = data.replace('next_', '') as any;
                await ctx.answerCbQuery();
                await ctx.deleteMessage();

                // Finaliza o fluxo e salva
                await visitFeedbackService.saveFeedback({
                    agendamento_id: state.agendamentoId,
                    corretor_id: state.corretorId,
                    tenant_id: state.clienteId, // tenant_id = cliente_id na maioria desse schema
                    lead_id: state.leadId,
                    system_briefing_score: state.systemBriefingScore,
                    system_satisfaction_score: state.systemSatisfactionScore,
                    client_reaction: state.clientReaction,
                    closing_probability: state.closingProbability,
                    next_step: state.nextStep
                });

                userStates.delete(userId);
                return ctx.reply('✅ Feedback registrado com sucesso! Atualizei o CRM com essas informações. Bom trabalho!');
            }

            return next();
        } catch (err) {
            console.error('[Feedback Flow] Erro callback:', err);
            await ctx.answerCbQuery('Ocorreu um erro.');
        }
    });
}

export function startFeedbackSurvey(
    bot: Telegraf,
    telegramId: string, 
    agendamentoId: string, 
    leadName: string, 
    corretorId: string, 
    clienteId: string, 
    leadId: string
) {
    userStates.set(telegramId, {
        step: 1,
        agendamentoId,
        leadName,
        corretorId,
        clienteId,
        leadId
    });

    const msg = `Olá! Vi que sua visita com ${leadName} foi realizada agora há pouco.\n\n` +
                `Para ajudar a refinar nossa Inteligência Artificial, de 0 a 5, quão útil foi o briefing enviado antes da visita?`;
    
    bot.telegram.sendMessage(telegramId, msg, {
        reply_markup: {
            force_reply: true
        }
    });
}
