import { supabase } from '../config/supabase.js';

export interface VisitFeedbackData {
    agendamento_id: string;
    corretor_id: string;
    tenant_id: string;
    lead_id: string;
    system_briefing_score?: number;
    system_satisfaction_score?: number;
    client_reaction?: 'amou' | 'gostou' | 'indiferente' | 'nao_gostou';
    closing_probability?: number;
    next_step?: 'vai_pensar' | 'ver_outro' | 'deu_data' | 'fechamento' | 'desistiu';
    followup_date?: string;
    objections?: string;
    objection_category?: string;
}

export class VisitFeedbackService {
    /**
     * Salva ou atualiza um feedback de visita no banco de dados.
     */
    async saveFeedback(data: VisitFeedbackData) {
        try {
            // Verifica se ja existe um feedback parcial para este agendamento
            const { data: existing } = await supabase
                .from('visit_feedback')
                .select('*')
                .eq('agendamento_id', data.agendamento_id)
                .single();

            if (existing) {
                const { error, data: updated } = await supabase
                    .from('visit_feedback')
                    .update({ ...data })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                await this.processTriggers(updated);
                return { success: true, feedback: updated };
            } else {
                const { error, data: inserted } = await supabase
                    .from('visit_feedback')
                    .insert([data])
                    .select()
                    .single();

                if (error) throw error;
                await this.processTriggers(inserted);
                return { success: true, feedback: inserted };
            }
        } catch (error: any) {
            console.error('[VisitFeedbackService] Erro ao salvar feedback:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Processa os gatilhos automáticos baseados nas respostas do corretor (M5b).
     */
    private async processTriggers(feedback: any) {
        if (!feedback) return;

        console.log(`[VisitFeedbackService] Processando gatilhos para lead ${feedback.lead_id}`);

        // Gatilho: Se a probabilidade de fechamento for >= 8, marca como quente
        if (feedback.closing_probability !== undefined && feedback.closing_probability >= 8) {
            await supabase
                .from('leads')
                .update({ observacoes: 'Probabilidade de fechamento alta (>= 8)' }) // ou outro campo equivalente
                .eq('id', feedback.lead_id);
        }

        // Gatilho: Se a probabilidade for <= 3, aumenta o risco no pipeline
        if (feedback.closing_probability !== undefined && feedback.closing_probability <= 3) {
            await supabase
                .from('leads')
                .update({ observacoes: 'Risco - Probabilidade baixa (<= 3)' })
                .eq('id', feedback.lead_id);
        }

        // Gatilhos do "next_step"
        if (feedback.next_step) {
            let statusToUpdate = '';
            let operacaoStatusToUpdate = '';
            
            if (feedback.next_step === 'vai_pensar') {
                statusToUpdate = 'em_andamento';
            } else if (feedback.next_step === 'fechamento') {
                statusToUpdate = 'negociacao';
                operacaoStatusToUpdate = 'fechamento_iniciado';
            } else if (feedback.next_step === 'desistiu') {
                statusToUpdate = 'descartado';
            }

            if (statusToUpdate || operacaoStatusToUpdate) {
                const updateData: any = {};
                if (statusToUpdate) updateData.status = statusToUpdate;
                if (operacaoStatusToUpdate) updateData.operacao_status = operacaoStatusToUpdate;

                await supabase
                    .from('leads')
                    .update(updateData)
                    .eq('id', feedback.lead_id);
            }
        }
    }
}

export const visitFeedbackService = new VisitFeedbackService();
