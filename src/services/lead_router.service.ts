import { supabase } from '../config/supabase.js';
import type { Lead, CorretorConfig, RouletteState } from '../types.js';

export class LeadRouterService {

    /**
     * Entry point to distribute a newly qualified lead.
     */
    static async distribuir(leadData: any) {
        try {
            console.log(`[LeadRouter] Iniciando roteamento para lead: ${leadData.id}`);

            // 1. Load active brokers configured
            const { data: configs, error: configError } = await supabase
                .from('corretores_config')
                .select('*, corretores(*)')
                .in('status', ['ativo']) // basic active filter
                .is('ferias_inicio', null) // rough check, actual checked in JS
                .is('ferias_fim', null);

            if (configError) throw configError;

            // Optional: fallback to regular active brokers if corretores_config is empty
            // But we assume the imob has at least 1 config.

            let elegiveis = this.filtrarCorretores(configs || [], leadData);

            if (elegiveis.length === 0) {
                console.log(`[LeadRouter] Nenhum corretor elegível para o lead ${leadData.id}. Vai para fila de espera.`);
                await this.logDistribution(leadData, null, 'Nenhum corretor elegível', []);
                return null;
            }

            // At this point we have eligible brokers. We need to choose the best based on Roulette+IQC.
            const brokerChosen = await this.aplicarRoleta(elegiveis);

            if (brokerChosen) {
                console.log(`[LeadRouter] Corretor selecionado: ${brokerChosen.corretor_id} para lead ${leadData.id}`);
                // Update the lead with the corretor_id
                await supabase.from('leads').update({ corretor_id: brokerChosen.corretor_id }).eq('id', leadData.id);

                // Track start of SLA
                await supabase.from('lead_sla_events').insert({
                    lead_id: leadData.id,
                    corretor_id: brokerChosen.corretor_id,
                    evento: 'primeiro_contato',
                    sla_limite_min: leadData.temperatura === 'quente' ? 15 : 120,
                    sla_status: 'pendente'
                });

                await this.logDistribution(leadData, brokerChosen.corretor_id, 'Seleção via roleta', elegiveis.map(e => e.corretor_id));
                return brokerChosen;
            }

            return null;

        } catch (error) {
            console.error('[LeadRouter] Erro ao distribuir lead:', error);
            throw error;
        }
    }

    /**
     * Filtrar corretor para Lançamento Específico.
     */
    static async filtrarCorretoresPorLancamento(lancamentoId: string) {
        const { data: configs, error } = await supabase
            .from('corretores_config')
            .select('*')
            .eq('status', 'ativo')
            .contains('lancamentos', [lancamentoId]);

        if (error || !configs) return [];
        return configs;
    }

    private static filtrarCorretores(configs: any[], leadData: any): any[] {
        return configs.filter(config => {
            // Check status real (vacation could be set manually)
            if (config.ferias_inicio && config.ferias_fim) {
                const now = new Date();
                const start = new Date(config.ferias_inicio);
                const end = new Date(config.ferias_fim);
                if (now >= start && now <= end) return false;
            }

            // Tipo de Imovel filter
            if (config.tipos_imovel && config.tipos_imovel.length > 0 && leadData.tipo_imovel) {
                if (!config.tipos_imovel.includes(leadData.tipo_imovel)) return false;
            }

            // Faixa de valor
            if (leadData.faixa_valor) {
                const valor = parseFloat(leadData.faixa_valor);
                if (!isNaN(valor)) {
                    if (config.valor_min && valor < config.valor_min) return false;
                    if (config.valor_max && valor > config.valor_max) return false;
                }
            }

            // IQC Filter based on temperature
            if (leadData.temperatura === 'quente') {
                if (config.iqc < 75) return false; // Senior required
            } else if (leadData.temperatura === 'morno') {
                if (config.iqc < 45) return false; // Pleno required
            }

            return true;
        });
    }

    private static async aplicarRoleta(elegiveis: any[]): Promise<any | null> {
        // Fetch current states
        const { data: states, error } = await supabase
            .from('roulette_state')
            .select('*')
            .in('corretor_id', elegiveis.map(e => e.corretor_id));

        if (error) {
            console.error('[LeadRouter] Error fetching roulette states', error);
            return null;
        }

        let stateMap: { [key: string]: any } = {};
        states?.forEach(s => stateMap[s.corretor_id] = s);

        // Populate missing states
        for (const broker of elegiveis) {
            if (!stateMap[broker.corretor_id]) {
                const newState = { corretor_id: broker.corretor_id, creditos: broker.peso_roleta, total_recebidos: 0 };
                // we inserts missing lazily, but just represent for now
                stateMap[broker.corretor_id] = newState;
            }
        }

        // Find the eligible with highest creditos proportional to pesor_roleta? Wait: "Find the corretor with highest (creditos_atuais / peso)" or just highest creditos.
        // Usually: highest creditos_atuais wins. 
        // Example: Joao(3), Maria(2).
        // 1. Joao(3), Maria(2). Winner Joao. Joao goes to 2.
        // 2. Joao(2), Maria(2). Tie breaker by iqc or last assigned. Winner Maria (if older). Maria goes to 1.

        let chosen: any = null;
        let highest = -1;

        for (const broker of elegiveis) {
            const state = stateMap[broker.corretor_id];
            if (state.creditos > highest) {
                highest = state.creditos;
                chosen = broker;
            } else if (state.creditos === highest) {
                // Tie breaker: older ultimo_lead_at
                const stateAt = state.ultimo_lead_at ? new Date(state.ultimo_lead_at).getTime() : 0;
                const chosenAt = stateMap[chosen.corretor_id].ultimo_lead_at ? new Date(stateMap[chosen.corretor_id].ultimo_lead_at).getTime() : 0;
                if (stateAt < chosenAt) {
                    chosen = broker;
                }
            }
        }

        if (chosen) {
            let state = stateMap[chosen.corretor_id];
            state.creditos -= 1;
            state.total_recebidos += 1;
            state.ultimo_lead_at = new Date().toISOString();

            // if this choice makes everyone 0, we reset everyone.
            const allZero = elegiveis.every(e => {
                const s = stateMap[e.corretor_id];
                return s.creditos <= 0; // considering the recent minus 1
            });

            if (allZero) {
                for (const b of elegiveis) {
                    stateMap[b.corretor_id].creditos = b.peso_roleta;
                }
            }

            // Persist the specific state Update
            await this.upsertRouletteState(stateMap[chosen.corretor_id]);

            // if we reset, persist others as well
            if (allZero) {
                for (const b of elegiveis) {
                    if (b.corretor_id !== chosen.corretor_id) {
                        await this.upsertRouletteState(stateMap[b.corretor_id]);
                    }
                }
            }

            return chosen;
        }

        return null; // Should not happen
    }

    private static async upsertRouletteState(state: any) {
        await supabase.from('roulette_state').upsert({
            corretor_id: state.corretor_id,
            creditos: state.creditos,
            total_recebidos: state.total_recebidos,
            ultimo_lead_at: state.ultimo_lead_at
        }, { onConflict: 'corretor_id' });
    }

    private static async logDistribution(leadData: any, corretorId: string | null, motivo: string, elegiveisIds: string[]) {
        await supabase.from('lead_distribution_log').insert({
            lead_id: leadData.id,
            corretor_id: corretorId,
            temperatura: leadData.temperatura,
            score_dificuldade: leadData.score_dificuldade,
            motivo_escolha: JSON.stringify({ motivo }),
            corretores_elegiveis: elegiveisIds,
            status: corretorId ? 'atribuido' : 'espera'
        });
    }

}
