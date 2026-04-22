import cron from 'node-cron';
import { supabase } from '../config/supabase.js';
import { telegramBotInstance } from '../bots/telegram/corretor.bot.js';

export class FeedbackSurveyJob {
    /**
     * Inicia o cron job para varrer agendamentos realizados há mais de 1 hora
     * e dispara a mensagem no Telegram do corretor.
     */
    start() {
        console.log('[FeedbackSurveyJob] Job agendado (roda a cada 15 minutos)');
        // Rodar a cada 15 minutos
        cron.schedule('*/15 * * * *', async () => {
            console.log('[FeedbackSurveyJob] Executando varredura de agendamentos finalizados...');
            await this.processPendingFeedbacks();
        });
    }

    private async processPendingFeedbacks() {
        try {
            // Busca visitas que ocorreram hoje, que estao no status 'confirmada' ou 'realizada'
            // mas que ainda nao tem feedback preenchido (left join com visit_feedback)
            // Para simplificar, vamos buscar agendamentos das ultimas 2 horas
            const oneHourAgoOptions = new Date(Date.now() - 60 * 60 * 1000);
            const dataStr = oneHourAgoOptions.toISOString().split('T')[0];
            // Hora no formato HH:mm - simplificando com a hora atual 1h atras
            const hourStr = `${oneHourAgoOptions.getHours().toString().padStart(2, '0')}:${oneHourAgoOptions.getMinutes().toString().padStart(2, '0')}`;

            const { data: agendamentos, error } = await supabase
                .from('agendamentos_visitas')
                .select(`
                    id, 
                    corretor_id, 
                    lead_id, 
                    cliente_id, 
                    data_visita, 
                    hora_visita, 
                    status,
                    leads ( nome )
                `)
                .eq('data_visita', dataStr)
                .lte('hora_visita', hourStr)
                .neq('status', 'cancelada');

            if (error) {
                console.error('[FeedbackSurveyJob] Erro ao buscar agendamentos:', error.message);
                return;
            }

            if (!agendamentos || agendamentos.length === 0) {
                console.log('[FeedbackSurveyJob] Nenhum agendamento pendente de feedback.');
                return;
            }

            // Verifica para cada agendamento se ja tem feedback
            for (const agenda of agendamentos) {
                const { data: feedback } = await supabase
                    .from('visit_feedback')
                    .select('id')
                    .eq('agendamento_id', agenda.id)
                    .single();

                if (!feedback && agenda.corretor_id) {
                    await this.dispatchTelegramSurvey(agenda);
                }
            }

        } catch (error) {
            console.error('[FeedbackSurveyJob] Erro inesperado:', error);
        }
    }

    private async dispatchTelegramSurvey(agenda: any) {
        if (!telegramBotInstance) {
            console.warn('[FeedbackSurveyJob] Instancia do Telegram Bot não está inicializada.');
            return;
        }

        try {
            // Verifica o telegram_id do corretor
            const { data: corretor } = await supabase
                .from('corretores')
                .select('telegram_id, nome')
                .eq('id', agenda.corretor_id)
                .single();

            if (!corretor || !corretor.telegram_id) {
                console.log(`[FeedbackSurveyJob] Corretor ${agenda.corretor_id} nao possui telegram_id registrado.`);
                return;
            }

            const leadName = agenda.leads?.nome || 'Cliente';

            telegramBotInstance.triggerFeedbackFlow(
                corretor.telegram_id, 
                agenda.id, 
                leadName, 
                agenda.corretor_id, 
                agenda.cliente_id, 
                agenda.lead_id
            );

        } catch (error) {
            console.error(`[FeedbackSurveyJob] Erro enviando survey para agendamento ${agenda.id}:`, error);
        }
    }
}

export const feedbackSurveyJob = new FeedbackSurveyJob();
