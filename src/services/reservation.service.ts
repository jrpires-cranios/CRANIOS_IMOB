import { supabase } from '../config/supabase.js';

export class ReservationService {

    /**
     * Verifica se um imóvel está disponível para visita/reserva
     */
    async checkAvailability(imovelId: string): Promise<{ available: boolean, reservation?: any }> {
        try {
            // Verifica se há reserva ativa e não expirada
            const { data, error } = await supabase
                .from('reservas')
                .select('*')
                .eq('imovel_id', imovelId)
                .eq('status', 'ativa')
                .gt('expires_at', new Date().toISOString())
                .single();

            if (data) {
                return { available: false, reservation: data };
            }

            return { available: true };

        } catch (e) {
            console.error('[ReservationService] Erro ao checar disponibilidade (tabela existe?):', e);
            // Fallback: Se der erro (ex: tabela não existe), assume disponível para não travar
            return { available: true };
        }
    }

    /**
     * Tenta criar uma reserva de 48h
     */
    async createReservation(imovelId: string, leadId: string): Promise<{ success: boolean, message: string }> {
        const status = await this.checkAvailability(imovelId);

        if (!status.available) {
            // Adiciona na fila
            await this.addToWaitingList(imovelId, leadId);
            return { success: false, message: 'Imóvel reservado. Você entrou na fila de espera.' };
        }

        // Cria reserva de 48h
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        const { error } = await supabase
            .from('reservas')
            .insert({
                imovel_id: imovelId,
                lead_id: leadId,
                status: 'ativa',
                expires_at: expiresAt.toISOString()
            });

        if (error) {
            console.error('[ReservationService] Erro ao criar reserva:', error);
            return { success: false, message: 'Erro ao processar reserva.' };
        }

        return { success: true, message: 'Reserva temporária (48h) realizada com sucesso!' };
    }

    /**
     * Adiciona lead à fila de espera
     */
    async addToWaitingList(imovelId: string, leadId: string) {
        try {
            await supabase
                .from('fila_espera')
                .insert({
                    imovel_id: imovelId,
                    lead_id: leadId,
                    status: 'aguardando'
                });
            console.log(`[ReservationService] Lead ${leadId} adicionado à fila do imóvel ${imovelId}`);
        } catch (e) {
            console.error('[ReservationService] Erro ao adicionar na fila:', e);
        }
    }

    /**
     * Notifica o próximo da fila quando o imóvel libera
     */
    async notifyWaitingList(imovelId: string) {
        console.log(`[ReservationService] Verificando fila para imóvel ${imovelId}...`);

        const { data: firstInLine } = await supabase
            .from('fila_espera')
            .select('*')
            .eq('imovel_id', imovelId)
            .eq('status', 'aguardando')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        if (firstInLine) {
            console.log(`[ReservationService] 🔔 NOTIFICANDO LEAD ${firstInLine.lead_id}: O imóvel liberou!`);
            // Aqui entraria a integração com Whatsapp/Email
            // mock:
            // whatsappService.send(firstInLine.lead_id, "O imóvel X liberou! Quer agendar?");

            // Atualiza status na fila
            await supabase
                .from('fila_espera')
                .update({ status: 'notificado', notified_at: new Date().toISOString() })
                .eq('id', firstInLine.id);
        } else {
            console.log('[ReservationService] Fila vazia.');
        }
    }
}

export const reservationService = new ReservationService();
