import { supabase } from '../config/supabase.js';
import { leadService } from './lead.service.js';
import { llmService } from './llm.service.js';

export interface CorretorRoleta {
    id: string;
    nome: string;
    calcom_api_key: string | null;
    calcom_username: string | null;
    calcom_event_type_id: number | null;
    peso_roleta: number;
    total_leads_recebidos: number;
}

export class RoletaService {
    /**
     * Retorna o próximo corretor da roleta usando lógica round-robin ponderada.
     * Considera corretores ativos, na_roleta, e com peso > 0.
     * Opcionalmente pode excluir corretores da busca (ex: se já verificamos que ele não tem agenda livre)
     */
    async proximoCorretorDisponivel(clienteId?: string, excluirCorretoresIds: string[] = []): Promise<CorretorRoleta | null> {
        try {
            // 1. Buscar todos os corretores ativos e elegíveis para a roleta
            let query = supabase
                .from('corretores')
                .select('id, nome, calcom_api_key, calcom_username, calcom_event_type_id, peso_roleta, total_leads_recebidos')
                .eq('ativo', true)
                .eq('na_roleta', true)
                .gt('peso_roleta', 0);

            if (clienteId) {
                query = query.eq('cliente_id', clienteId);
            }

            const { data: corretores, error } = await query;

            if (error || !corretores || corretores.length === 0) {
                console.warn('[RoletaService] Nenhum corretor elegível na roleta. Tente configurar ou convidar corretores.');
                return null;
            }

            // Filtrar excluídos
            let elegiveis = corretores;
            if (excluirCorretoresIds.length > 0) {
                elegiveis = corretores.filter(c => !excluirCorretoresIds.includes(c.id));
            }

            if (elegiveis.length === 0) return null;

            // 2. Lógica simplificada de roleta ponderada:
            // Quem tem menos (total_leads_recebidos / peso_roleta) é o próximo.
            elegiveis.sort((a, b) => {
                const ratioA = a.total_leads_recebidos / a.peso_roleta;
                const ratioB = b.total_leads_recebidos / b.peso_roleta;

                if (ratioA === ratioB) {
                    // Empate: prioriza quem tem peso maior, se igual, ordem aleatória para balancear
                    if (b.peso_roleta !== a.peso_roleta) {
                        return b.peso_roleta - a.peso_roleta;
                    }
                    return Math.random() - 0.5;
                }
                return ratioA - ratioB;
            });

            return elegiveis[0];

        } catch (error: any) {
            console.error('[RoletaService] Erro ao processar roleta:', error);
            return null;
        }
    }

    /**
     * Registra que o lead foi atribuído a um corretor e incrementa o lead_count
     */
    async atribuirLeadCorretor(leadId: string, corretorId: string, clienteId?: string) {
        try {
            // Registrar em roleta_leads
            await supabase.from('roleta_leads').insert({
                lead_id: leadId,
                corretor_id: corretorId,
                cliente_id: clienteId || null,
                status: 'atribuido'
            });

            // Gerar Briefing Tático do Lead usando o Histórico
            const historico = await leadService.getGlobalHistory(leadId, 30); // Puxa até 30 mensagens de contexto
            const briefing = await llmService.gerarBriefingDoLead(historico);

            // Atualiza Lead com o corretor ID E o Briefing em JSON (serão lidos pelo dashboard e email)
            const payloadLead: any = { corretor_id: corretorId };
            if (briefing) {
                // Guarda a análise tática na coluna JSON 'historico_analise' ou apenas num TEXT 'observacoes' formatado
                payloadLead.observacoes = `=== BRIEFING DO LEAD DA I.A. ===\n🔥 Temperatura: ${briefing.temperatura}\n🎯 Probabilidade de Fechar: ${briefing.probabilidade_fechamento}%\n\n📋 Resumo: ${briefing.resumo}\n\n💡 Dicas: \n- ${briefing.dicas_abordagem?.join('\n- ')}`;
            }

            // Atualizar lead
            await supabase.from('leads').update(payloadLead).eq('id', leadId);

            // Incrementar contador do corretor para a próxima roleta (Round-Robin Ponderado)
            const { data: current } = await supabase.from('corretores').select('total_leads_recebidos').eq('id', corretorId).single();
            const total = current ? current.total_leads_recebidos + 1 : 1;
            await supabase.from('corretores').update({ total_leads_recebidos: total }).eq('id', corretorId);

            console.log(`[RoletaService] 🎯 Lead ${leadId} atribuído ao corretor ${corretorId}`);
        } catch (error: any) {
            console.error('[RoletaService] Erro ao atribuir lead:', error.message);
        }
    }
}

export const roletaService = new RoletaService();
