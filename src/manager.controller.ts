import { Express, Request, Response } from 'express';
import { supabase } from './config/supabase.js';
import { LeadRouterService } from './services/lead_router.service.js';

export function registerManagerRoutes(app: Express) {

    // ========== CONFIGURAÇÃO DE CORRETORES (ROLETA) ==========

    /**
     * GET /api/manager/corretores
     * Lista todos os corretores e suas configurações da roleta inteligente
     */
    app.get('/api/manager/corretores', async (req: Request, res: Response) => {
        try {
            const { data, error } = await supabase
                .from('corretores_config')
                .select('*, corretores(*)');

            if (error) throw error;
            res.json({ success: true, corretores: data });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    /**
     * POST /api/manager/corretores
     * Inicializa a configuração de um corretor na roleta
     */
    app.post('/api/manager/corretores', async (req: Request, res: Response) => {
        try {
            const { corretor_id, peso_roleta = 1, tipos_imovel = [], bairros = [] } = req.body;
            if (!corretor_id) return res.status(400).json({ success: false, error: 'corretor_id obrigatório' });

            const { data, error } = await supabase.from('corretores_config').insert([{
                corretor_id, peso_roleta, tipos_imovel, bairros, status: 'ativo'
            }]).select().single();

            if (error) throw error;
            res.json({ success: true, config: data });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    /**
     * PUT /api/manager/corretores/:id
     * Atualiza dados como peso, férias, limite de leads, etc.
     */
    app.put('/api/manager/corretores/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const { data, error } = await supabase
                .from('corretores_config')
                .update(updates)
                .eq('id', id)
                .select().single();

            if (error) throw error;
            res.json({ success: true, config: data });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    /**
     * POST /api/manager/corretores/:id/override-iqc
     * Override manual do IQC pelo Gerente.
     */
    app.post('/api/manager/corretores/:id/override-iqc', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { iqc, motivo } = req.body;
            if (iqc === undefined || !motivo) return res.status(400).json({ success: false, error: 'iqc e motivo obrigatórios' });

            const { data, error } = await supabase
                .from('corretores_config')
                .update({ iqc, iqc_override: true, iqc_motivo: motivo })
                .eq('id', id)
                .select().single();

            if (error) throw error;
            res.json({ success: true, config: data });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // ========== DASHBOARD & KPIs ==========

    app.get('/api/manager/dashboard/overview', async (req: Request, res: Response) => {
        try {
            // Count recently assigned leads
            const { count: leadsSema, error: err1 } = await supabase
                .from('lead_distribution_log')
                .select('*', { count: 'exact', head: true })
                .gte('atribuido_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

            // Count recent SLA Violations
            const { count: slaViolations, error: err2 } = await supabase
                .from('lead_sla_events')
                .select('*', { count: 'exact', head: true })
                .eq('sla_status', 'violado')
                .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

            // Average IQC
            const { data: configs } = await supabase.from('corretores_config').select('iqc').eq('status', 'ativo');
            let avgIqc = 0;
            if (configs && configs.length > 0) {
                avgIqc = configs.reduce((acc, curr) => acc + Number(curr.iqc), 0) / configs.length;
            }

            res.json({
                success: true,
                stats: {
                    leadsAtribuidos7d: leadsSema || 0,
                    slaViolaes7d: slaViolations || 0,
                    mediaIqcAtivos: avgIqc.toFixed(2)
                }
            });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // ========== LEAD BRIEFING (LLM) ==========

    /**
     * GET /api/leads/:id/briefing
     * Chama LLM para ler o histórico do chat do lead e fornecer um briefing para o corretor.
     */
    app.get('/api/leads/:id/briefing', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            // Usually we'd call llm.service here to analyze "mensagens" table up to this point.
            // As a mock for the API structure requirement:
            const briefing = {
                resumo: "Cliente demonstrou interesse em imóveis de 2 quartos no bairro Jardins.",
                perfil_financeiro: "Orçamento até R$450k",
                preferencias: ["2 quartos", "Jardins", "Varanda"],
                objecoes_mapeadas: ["Acha a taxa de condomínio cara em opções antigas"],
                melhor_abordagem: "Focar em apartamentos mais novos ou com condomínio otimizado.",
                pontos_atencao: ["Cliente quer mudar até mês que vem"],
                score_dificuldade: 65,
                temperatura: "quente",
                urgencia: "imediata"
            };

            res.json({ success: true, briefing });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // ========== MANUAL DISTRIBUTE ==========

    /**
     * POST /api/leads/distribute
     * Trigger manual de distribuição para testar o Router.
     */
    app.post('/api/leads/distribute', async (req: Request, res: Response) => {
        try {
            const leadData = req.body; // mock do lead
            const broker = await LeadRouterService.distribuir(leadData);

            res.json({ success: true, corretor_atribuido: broker });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

}
