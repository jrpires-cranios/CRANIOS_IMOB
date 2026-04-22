import { supabase } from '../config/supabase.js';

export class SlaService {

    /**
     * Registrar a realização de um evento (como 'primeiro_contato', etc)
     */
    static async registrarEventoRealizado(leadId: string, evento: string, corretorId: string) {
        try {
            // Find the pending SLA event
            const { data, error } = await supabase
                .from('lead_sla_events')
                .select('*')
                .eq('lead_id', leadId)
                .eq('evento', evento)
                .eq('sla_status', 'pendente')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('[SlaService] Erro ao buscar evento SLA:', error);
                return;
            }

            if (data) {
                const now = new Date();
                const createdAt = new Date(data.created_at);
                const limitMinutes = data.sla_limite_min || 15;
                const limitDate = new Date(createdAt.getTime() + limitMinutes * 60000);

                let status = 'ok';
                if (now > limitDate) {
                    status = 'violado';
                    // We can deduct IQC asynchronously
                    this.penalizarIqc(corretorId, 2.0, `Violação SLA: ${evento} atrasado para lead ${leadId}`);
                } else if (now.getTime() > createdAt.getTime() + (limitMinutes * 60000 * 0.75)) {
                    status = 'atencao';
                }

                await supabase.from('lead_sla_events')
                    .update({ realizado_em: now.toISOString(), sla_status: status })
                    .eq('id', data.id);
            }

        } catch (err) {
            console.error('[SlaService] Erro em registrarEventoRealizado:', err);
        }
    }

    /**
     * Re-calculo de IQC baseado em uma penalidade de Violação SLA
     */
    private static async penalizarIqc(corretorId: string, quantidade: number, motivo: string) {
        const { data } = await supabase.from('corretores_config').select('iqc, iqc_override').eq('corretor_id', corretorId).single();
        if (data && !data.iqc_override) {
            const val = Math.max(0, parseFloat((data.iqc - quantidade).toString()));
            await supabase.from('corretores_config').update({ iqc: val }).eq('corretor_id', corretorId);
            console.log(`[SlaService] IQC do corretor ${corretorId} penalizado em ${quantidade}. Motivo: ${motivo}`);
        }
    }
}
