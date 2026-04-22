import { supabase } from '../config/supabase.js';

interface AgendarVisitaData {
    imovelId: string;
    leadId: string;
    dataVisita: string; // YYYY-MM-DD
    horarioInicio: string; // HH:MM
    horarioFim: string; // HH:MM
    responsavelTipo?: 'corretor' | 'concierge';
    responsavelId?: string;
    responsavelNome?: string;
    notas?: string;
}

export class VisitSchedulingService {
    /**
     * Verifica conflitos de horário para evitar marcar 2 visitas no mesmo horário
     */
    async verificarConflitos(imovelId: string, dataVisita: string, horarioInicio: string, horarioFim: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('agendamentos_visitas')
            .select('id')
            .eq('imovel_id', imovelId)
            .eq('data_visita', dataVisita)
            .or(`horario_inicio.lte.${horarioInicio},horario_fim.gte.${horarioFim}`)
            .eq('status', 'agendado'); // Apenas visitas agendadas contam

        if (error) {
            console.error('[VisitScheduling] Erro ao verificar conflitos:', error);
            return false;
        }

        return data && data.length > 0;
    }

    /**
     * Agendar visita (NÃO bloqueia o imóvel)
     */
    async agendarVisita(dados: AgendarVisitaData) {
        // 1. Verificar conflitos de horário
        const temConflito = await this.verificarConflitos(
            dados.imovelId,
            dados.dataVisita,
            dados.horarioInicio,
            dados.horarioFim
        );

        if (temConflito) {
            throw new Error('Já existe uma visita agendada para este horário');
        }

        // 2. Criar agendamento
        const { data, error } = await supabase
            .from('agendamentos_visitas')
            .insert({
                imovel_id: dados.imovelId,
                lead_id: dados.leadId,
                data_visita: dados.dataVisita,
                horario_inicio: dados.horarioInicio,
                horario_fim: dados.horarioFim,
                responsavel_tipo: dados.responsavelTipo || 'corretor',
                responsavel_id: dados.responsavelId,
                responsavel_nome: dados.responsavelNome,
                notas: dados.notas,
                status: 'agendado',
                origem: 'whatsapp'
            })
            .select()
            .single();

        if (error) {
            console.error('[VisitScheduling] Erro ao agendar visita:', error);
            throw new Error('Falha ao agendar visita');
        }

        console.log(`[VisitScheduling] ✅ Visita agendada: ${dados.dataVisita} às ${dados.horarioInicio}`);
        return data;
    }

    /**
     * Marcar visita como realizada
     */
    async marcarComoRealizada(visitaId: string) {
        const { data, error } = await supabase
            .from('agendamentos_visitas')
            .update({ status: 'realizado' })
            .eq('id', visitaId)
            .select()
            .single();

        if (error) {
            console.error('[VisitScheduling] Erro ao marcar como realizada:', error);
            throw new Error('Falha ao atualizar status');
        }

        return data;
    }

    /**
     * Buscar visitas de um lead
     */
    async buscarVisitasLead(leadId: string) {
        const { data, error } = await supabase
            .from('agendamentos_visitas')
            .select('*, imoveis(titulo, bairro, foto_principal)')
            .eq('lead_id', leadId)
            .order('data_visita', { ascending: false });

        if (error) {
            console.error('[VisitScheduling] Erro ao buscar visitas:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Buscar visitas de um imóvel
     */
    async buscarVisitasImovel(imovelId: string, status?: string) {
        let query = supabase
            .from('agendamentos_visitas')
            .select('*, leads(nome, whatsapp)')
            .eq('imovel_id', imovelId);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('data_visita', { ascending: true });

        if (error) {
            console.error('[VisitScheduling] Erro ao buscar visitas do imóvel:', error);
            return [];
        }

        return data || [];
    }
}

export const visitSchedulingService = new VisitSchedulingService();
