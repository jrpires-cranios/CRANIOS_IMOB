import cron from 'node-cron';
import { supabase } from '../config/supabase.js';

class RiskCalculatorJob {
    /**
     * Inicia o job que roda a cada 6 horas
     */
    start() {
        console.log('[RiskCalculatorJob] Job de Cálculo de Risco agendado (0 */6 * * *).');
        cron.schedule('0 */6 * * *', async () => {
            console.log(`[RiskCalculatorJob] Rodando rotina de cálculo de risco...`);
            await this.recalculateAllRisks();
        });
    }

    /**
     * Recalcula o score de todos os leads ativos
     */
    async recalculateAllRisks() {
        try {
            // Busca apenas leads que não foram concluídos/descartados
            // Assumimos que a tabela 'leads' tem um campo 'status'
            const { data: leads, error } = await supabase
                .from('leads')
                .select('id, tenant_id, status, created_at, urgencia, last_status_change, updated_at')
                .not('status', 'in', '("convertido", "descartado")');

            if (error) {
                console.error('[RiskCalculatorJob] Erro ao buscar leads:', error);
                return;
            }

            if (!leads || leads.length === 0) return;

            console.log(`[RiskCalculatorJob] Avaliando risco para ${leads.length} leads ativos...`);

            for (const lead of leads) {
                const riskScore = await this.calculateScore(lead);
                
                // Atualiza o banco de forma silenciosa para não re-triggar hooks desnecessários
                await supabase
                    .from('leads')
                    .update({ risk_score: riskScore })
                    .eq('id', lead.id);
            }

            console.log(`[RiskCalculatorJob] Rotina concluída com sucesso.`);
        } catch (error) {
            console.error('[RiskCalculatorJob] Erro não tratado durante a rotina:', error);
        }
    }

    /**
     * Regras de Score
     * 1. Dias sem interação: 0-7d=0, 8-14=10, 15-21=20, 22-30=30, >30=35
     * 2. Stage parado sem avanço (desde last_status_change): >15 dias = +25 pts
     * 3. Dossiê enviado sem rersposta e Faltou visita seriam checados via interações. (A simplificar pela falta de histórico completo aqui)
     * 4. Urgencia alta + tempo longo: +5 pts
     */
    async calculateScore(lead: any): Promise<number> {
        let score = 0;
        const now = new Date();
        
        // 1. Dias sem interação (usando updated_at como proxy para última interação)
        const lastInteraction = lead.updated_at ? new Date(lead.updated_at) : new Date(lead.created_at);
        const daysSinceInteraction = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 3600 * 24));
        
        if (daysSinceInteraction >= 30) score += 35;
        else if (daysSinceInteraction >= 22) score += 30;
        else if (daysSinceInteraction >= 15) score += 20;
        else if (daysSinceInteraction >= 8) score += 10;

        // 2. Parado no mesmo stage
        const lastStatus = lead.last_status_change ? new Date(lead.last_status_change) : new Date(lead.created_at);
        const daysInStatus = Math.floor((now.getTime() - lastStatus.getTime()) / (1000 * 3600 * 24));
        if (daysInStatus > 15) {
            score += 25;
        }

        // 4. Urgência Alta (quente/muito quente) + mais de 21 dias no pipeline
        const totalDaysInPipeline = Math.floor((now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 3600 * 24));
        if (lead.urgencia === 'alta' && totalDaysInPipeline >= 21) {
            score += 5;
        }

        return Math.min(100, score);
    }
}

export const riskCalculatorJob = new RiskCalculatorJob();
