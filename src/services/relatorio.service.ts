import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_TENANT = 'rbhkwmesmvytqdfuwcie';

export const relatorioService = {
    /**
     * Gera Relatório Financeiro (Receitas x Despesas)
     */
    async getDadosFinanceiros(tenantId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('financeiro_lancamentos')
            .select('*')
            .eq('tenant_id', tenantId)
            .gte('data_vencimento', startDate)
            .lte('data_vencimento', endDate)
            .order('data_vencimento', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Exporta para CSV (Excel-compatible)
     */
    async exportToCSV(data: any[], columns: string[]) {
        if (!data || data.length === 0) return "";
        const header = columns.join(';');
        const rows = data.map(item =>
            columns.map(col => {
                const val = item[col];
                if (typeof val === 'number') return val.toString().replace('.', ',');
                return `"${val || ''}"`;
            }).join(';')
        );
        return [header, ...rows].join('\n');
    },

    /**
     * Gera PDF usando Puppeteer
     */
    async generatePDF(htmlContent: string) {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });
        await browser.close();
        return pdf;
    },

    /**
     * Template de Relatório Financeiro HTML
     */
    renderRelatorioFinanceiroHTML(data: any[], tenantName: string, startDate: string, endDate: string) {
        const totalReceitas = data.filter(d => d.tipo === 'receita').reduce((acc, curr) => acc + Number(curr.valor), 0);
        const totalDespesas = data.filter(d => d.tipo === 'despesa').reduce((acc, curr) => acc + Number(curr.valor), 0);
        const saldo = totalReceitas - totalDespesas;

        const templateSource = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: sans-serif; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                .summary { display: flex; justify-content: space-around; margin: 30px 0; background: #f9f9f9; padding: 20px; border-radius: 10px; }
                .summary-item { text-align: center; }
                .summary-item .value { font-size: 20px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #f4f4f4; text-align: left; padding: 10px; font-size: 12px; }
                td { border-bottom: 1px solid #eee; padding: 10px; font-size: 11px; }
                .receita { color: green; font-weight: bold; }
                .despesa { color: red; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório Financeiro Executivo</h1>
                <p>\${tenantName} | Período: \${startDate} até \${endDate}</p>
            </div>
            <div class="summary">
                <div class="summary-item">
                    <div class="label">Total Receitas</div>
                    <div class="value receita">R$ \${totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Total Despesas</div>
                    <div class="value despesa">R$ \${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Saldo Líquido</div>
                    <div class="value" style="color: \${saldo >= 0 ? 'blue' : 'orange'}">R$ \${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>DATA</th>
                        <th>CATEGORIA</th>
                        <th>DESCRIÇÃO</th>
                        <th>TIPO</th>
                        <th>VALOR</th>
                        <th>STATUS</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each data}}
                    <tr>
                        <td>{{data_vencimento}}</td>
                        <td>{{categoria}}</td>
                        <td>{{descricao}}</td>
                        <td class="{{tipo}}">{{tipo}}</td>
                        <td class="{{tipo}}">R$ {{valor}}</td>
                        <td>{{status}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </body>
        </html>
        `;
        const template = Handlebars.compile(templateSource);
        return template({ data, tenantName, startDate, endDate, totalReceitas, totalDespesas, saldo });
    }
};
