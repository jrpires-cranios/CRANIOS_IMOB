import { createClient } from '@supabase/supabase-js';
import type { Imovel, Lead } from '../types.js';

const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaGt3bWVzbXZ5dHFkZnV3Y2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ0ODUsImV4cCI6MjA4NTM5MDQ4NX0.vHffPyFGC99OhYpfeGihf59oGhIguVwKfQagySAyTck'
);

/**
 * Taxas de Juros (Tabela de Financiamento)
 * Fonte: Banco Central (2025)
 */
const TAXAS_JUROS = {
  caixa: { residencial: 10.75, consignado: 2.50 },
  bradesco: { residencial: 11.25, consignado: 2.10 },
  itau: { residencial: 10.90, consignado: 2.05 },
  santander: { residencial: 11.00, consignado: 2.15 },
  bancoDoBrasil: { residencial: 11.15, consignado: 2.20 },
};

/**
 * Agente de Financiamento (Bancário/Imobiliário)
 * Calcula financiamento, simula parcelas, conecta com bancos
 */
export class FinanciamentoAgent {
  /**
   * Simula financiamento residencial
   */
  async simularFinanciamento(params: {
    valor_imovel: number;
    valor_entrada: number;
    prazo_anos: number;
    sistema_amortizacao: 'SAC' | 'Price Table' | 'SACRE' | 'Price';
    tipo_juros: 'residencial' | 'consignado';
    banco?: string;
  }) {
    try {
      console.log('[FinanciamentoAgent] Simulando financiamento:', params);

      const { valor_imovel, valor_entrada, prazo_anos, sistema_amortizacao, tipo_juros, banco } = params;

      // Valor financiado
      const valor_financiado = valor_imovel - valor_entrada;
      const prazo_meses = prazo_anos * 12;

      // Taxa de juros
      const bancos = ['caixa', 'bradesco', 'itau', 'santander', 'bancoDoBrasil'];
      const bancos_simular = banco ? [banco] : bancos;

      const simulacoes = [];

      for (const nome_banco of bancos_simular) {
        const taxa = TAXAS_JUROS[nome_banco as keyof typeof TAXAS_JUROS]?.[tipo_juros] || 10.90;
        const taxa_mensal = taxa / 100 / 12;

        let parcela: number;
        let juros_total: number;
        let custo_efetivo_total: number;

        if (sistema_amortizacao === 'Price Table') {
          // Tabela Price (Sistema Francês)
          parcela = valor_financiado * (taxa_mensal * Math.pow(1 + taxa_mensal, prazo_meses)) / (Math.pow(1 + taxa_mensal, prazo_meses) - 1);
          juros_total = parcela * prazo_meses - valor_financiado;
        } else if (sistema_amortizacao === 'SAC') {
          // Sistema de Amortização Constante (SAC)
          const amortizacao_constante = valor_financiado / prazo_meses;
          const juros_primeira = valor_financiado * taxa_mensal;
          parcela = amortizacao_constante + juros_primeira;
          juros_total = (valor_entrada + juros_primeira) * prazo_meses - valor_financiado;
        } else if (sistema_amortizacao === 'SACRE') {
          // SACRE (Sistema de Amortização Crescente) — raro no Brasil
          const amortizacao_crescente = 2 * valor_financiado / (prazo_meses * (prazo_meses + 1));
          parcela = amortizacao_crescente * (1 + taxa_mensal * prazo_meses) / prazo_meses;
          juros_total = parcela * prazo_meses - valor_financiado;
        } else {
          // Price Table (padrão)
          parcela = valor_financiado * (taxa_mensal * Math.pow(1 + taxa_mensal, prazo_meses)) / (Math.pow(1 + taxa_mensal, prazo_meses) - 1);
          juros_total = parcela * prazo_meses - valor_financiado;
        }

        const custo_efetivo = ((parcela * prazo_meses) + valor_entrada) / valor_imovel * 100;

        simulacoes.push({
          banco: this.formatarNomeBanco(nome_banco),
          sistema_amortizacao,
          taxa_anual: taxa.toFixed(2) + '%',
          parcela_mensal: parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          valor_financiado: valor_financiado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          juros_total: juros_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          custo_efetivo: custo_efetivo.toFixed(2) + '%',
          entrada: valor_entrada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          imovel_total: valor_imovel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        });
      }

      // Ordena por custo efetivo (menor é melhor)
      simulacoes.sort((a, b) => parseFloat(a.custo_efetivo) - parseFloat(b.custo_efetivo));

      console.log('[FinanciamentoAgent] Simulações:', simulacoes.length);

      return {
        success: true,
        simulacoes: simulacoes,
        melhor_opcao: simulacoes[0],
        params_fornecidos: params,
      };
    } catch (error) {
      console.error('[FinanciamentoAgent] Erro ao simular:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        simulacoes: [],
      };
    }
  }

  /**
   * Compara opções de financiamento entre bancos
   */
  async compararFinanciamentos(params: {
    valor_imovel: number;
    valor_entrada: number;
    prazo_anos: number;
  }) {
    try {
      console.log('[FinanciamentoAgent] Comparando financiamentos:', params);

      const sistemas = ['Price Table', 'SAC'];
      const comparacao = [];

      for (const sistema of sistemas) {
        const resultado = await this.simularFinanciamento({
          ...params,
          sistema_amortizacao: sistema as 'SAC' | 'Price Table' | 'SACRE' | 'Price',
          tipo_juros: 'residencial',
        });

        if (resultado.success) {
          comparacao.push({
            sistema,
            melhor_banco: resultado.melhor_opcao.banco,
            parcela_menor: resultado.melhor_opcao.parcela_mensal,
            custo_efetivo: resultado.melhor_opcao.custo_efetivo,
          });
        }
      }

      console.log('[FinanciamentoAgent] Comparação:', comparacao);

      return {
        success: true,
        comparacao,
        recomendacao: `O melhor custo é ${comparacao[0].sistema === 'Price Table' ? 'Price Table' : 'SAC'} com ${comparacao[0].melhor_banco}, com parcela de ${comparacao[0].parcela_menor}`,
      };
    } catch (error) {
      console.error('[FinanciamentoAgent] Erro ao comparar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        comparacao: [],
      };
    }
  }

  /**
   * Formata nome do banco para exibição
   */
  private formatarNomeBanco(banco: string): string {
    const nomes = {
      caixa: 'Caixa Econômica Federal',
      bradesco: 'Banco Bradesco',
      itau: 'Banco Itaú',
      santander: 'Banco Santander',
      bancoDoBrasil: 'Banco do Brasil',
    };
    return nomes[banco as keyof typeof nomes] || banco;
  }
}

export const financiamentoAgent = new FinanciamentoAgent();
