import { supabase } from '../config/supabase.js';
import { emailService } from '../services/email.service.js';

export class BiReportJob {
    private isRunning = false;

    // Inicia o loop de validação do cronjob
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('[BI Report Job] Iniciado. Verificará cronograma de relatórios.');

        // Verifica a cada hora
        setInterval(async () => {
            const now = new Date();
            // Toda segunda-feira às 08:00 AM
            if (now.getDay() === 1 && now.getHours() === 8) {
                await this.runWeeklyReport();
            }
        }, 1000 * 60 * 60);
    }

    async runWeeklyReport() {
        try {
            console.log('[BI Report Job] Iniciando geração de Relatórios Executivos Semanais...');

            // Busca todos os clientes ativos
            const { data: clientes } = await supabase.from('clientes').select('*').eq('ativo', true);
            if (!clientes) return;

            for (const cliente of clientes) {
                // Aqui entraria a geração do PDF real com o Puppeteer chamando uma URL do painel
                // Mas vamos simplificar enviando um e-mail HTML rico de BI

                // Busca KPIs
                const { count: leads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('cliente_id', cliente.id);
                const { count: agendamentos } = await supabase.from('mensagens').select('*', { count: 'exact', head: true }).ilike('metadata->>intencao', 'AGENDAMENTO');

                const htmlTemplate = `
                    <h2>Resumo Semanal: Business Intelligence</h2>
                    <p>Olá, ${cliente.nome}. Aqui está o seu relatório executivo da semana.</p>
                    <table border="1" style="border-collapse: collapse; width: 100%; border-color: #eee;">
                        <tr><td style="padding: 10px;">Leads Capturados</td><td style="padding: 10px;">${leads || 0}</td></tr>
                        <tr><td style="padding: 10px;">Agendamentos (IA)</td><td style="padding: 10px;">${agendamentos || 0}</td></tr>
                        <tr><td style="padding: 10px;">Velocidade Média Venda</td><td style="padding: 10px;">Em cálculo...</td></tr>
                    </table>
                    <br/>
                    <a href="https://craniosimob.com/dashboard?tab=bi" style="background: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Baixar PDF Completo</a>
                `;

                if (cliente.email) {
                    await emailService.enviarEmail(
                        cliente.email,
                        `[Crânios IMOB] Relatório Executivo Semanal`,
                        htmlTemplate
                    );
                    console.log(`[BI Report Job] Relatório enviado para ${cliente.email}`);
                }
            }
        } catch (e) {
            console.error('[BI Report Job] Erro ao enviar relatórios:', e);
        }
    }
}

export const biReportJob = new BiReportJob();
