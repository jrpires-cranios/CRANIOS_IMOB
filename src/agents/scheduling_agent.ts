import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '')
);

/**
 * Agente de Agendamento e Follow-up
 * Gerencia agendamentos de visitas e follow-ups automáticos
 */
export class SchedulingAgent {
  /**
   * Marcar visita agendada
   */
  async agendarVisita(params: {
    lead_id: string;
    imovel_id: string;
    data: string;
    horario: string;
    observacoes?: string;
  }) {
    try {
      console.log('[SchedulingAgent] Agendando visita:', params);

      const { data, error } = await supabase
        .from('agendamentos')
        .insert([{
          lead_id: params.lead_id,
          imovel_id: params.imovel_id,
          data: params.data,
          horario: params.horario,
          observacoes: params.observacoes || '',
          status: 'agendado',
          tipo: 'visita',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao agendar visita: ${error.message}`);
      }

      // Atualiza status do lead
      await supabase
        .from('leads')
        .update({ status: 'agendamento' })
        .eq('id', params.lead_id);

      console.log('[SchedulingAgent] Visita agendada com sucesso');

      return {
        success: true,
        agendamento: data,
        mensagem: 'Visita agendada com sucesso!',
      };
    } catch (error) {
      console.error('[SchedulingAgent] Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        mensagem: 'Não foi possível agendar a visita',
      };
    }
  }

  /**
   * Reagendar visita
   */
  async reagendarVisita(agendamento_id: string, novaData: string, novoHorario: string) {
    try {
      console.log('[SchedulingAgent] Reagendando visita:', agendamento_id);

      const { data, error } = await supabase
        .from('agendamentos')
        .update({
          data: novaData,
          horario: novoHorario,
          status: 'agendado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', agendamento_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao reagendar: ${error.message}`);
      }

      console.log('[SchedulingAgent] Visita reagendada com sucesso');

      return {
        success: true,
        agendamento: data,
        mensagem: 'Visita reagendada com sucesso!',
      };
    } catch (error) {
      console.error('[SchedulingAgent] Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        mensagem: 'Não foi possível reagendar a visita',
      };
    }
  }

  /**
   * Cancelar agendamento
   */
  async cancelarVisita(agendamento_id: string, motivo: string) {
    try {
      console.log('[SchedulingAgent] Cancelando visita:', agendamento_id);

      const { data, error } = await supabase
        .from('agendamentos')
        .update({
          status: 'cancelado',
          motivo_cancelamento: motivo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agendamento_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao cancelar: ${error.message}`);
      }

      // Recupera lead_id para atualizar status
      const { data: agendamento } = await supabase
        .from('agendamentos')
        .select('lead_id')
        .eq('id', agendamento_id)
        .single();

      await supabase
        .from('leads')
        .update({ status: 'novo' })
        .eq('id', agendamento.lead_id);

      console.log('[SchedulingAgent] Visita cancelada com sucesso');

      return {
        success: true,
        agendamento: data,
        mensagem: 'Agendamento cancelado com sucesso',
      };
    } catch (error) {
      console.error('[SchedulingAgent] Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        mensagem: 'Não foi possível cancelar o agendamento',
      };
    }
  }

  /**
   * Realizar follow-up automático
   */
  async followUp(lead_id: string, tipo: 'email' | 'whatsapp' | 'sms') {
    try {
      console.log('[SchedulingAgent] Realizando follow-up:', lead_id, tipo);

      // Busca dados do lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .single();

      if (leadError || !lead) {
        throw new Error('Lead não encontrado');
      }

      // Cria registro de follow-up
      const { data, error } = await supabase
        .from('follow_ups')
        .insert([{
          lead_id,
          tipo,
          mensagem: `Lembrete de ${tipo === 'email' ? 'visita' : tipo} sobre imóveis`,
          data_envio: new Date().toISOString(),
          status: 'enviado',
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao registrar follow-up: ${error.message}`);
      }

      // Atualiza último follow-up do lead
      await supabase
        .from('leads')
        .update({
          ultimo_followup: new Date().toISOString(),
        })
        .eq('id', lead_id);

      console.log('[SchedulingAgent] Follow-up registrado:', tipo);

      return {
        success: true,
        followup: data,
        mensagem: 'Follow-up registrado com sucesso',
      };
    } catch (error) {
      console.error('[SchedulingAgent] Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        mensagem: 'Não foi possível registrar o follow-up',
      };
    }
  }

  /**
   * Lista agendamentos de um lead
   */
  async listarAgendamentos(lead_id: string) {
    try {
      console.log('[SchedulingAgent] Listando agendamentos do lead:', lead_id);

      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('lead_id', lead_id)
        .order('data', { ascending: false })
        .order('horario', { ascending: false });

      if (error) {
        throw new Error(`Erro ao listar agendamentos: ${error.message}`);
      }

      console.log('[SchedulingAgent] Agendamentos:', data.length);

      return {
        success: true,
        agendamentos: data,
        total: data.length,
      };
    } catch (error) {
      console.error('[SchedulingAgent] Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        agendamentos: [],
        total: 0,
      };
    }
  }
}

export const schedulingAgent = new SchedulingAgent();
