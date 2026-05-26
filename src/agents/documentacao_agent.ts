import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '')
);

/**
 * Agente de Documentação (Legal/Contratual)
 * Verifica documentação, conecta com cartórios, valida contratos
 */
export class DocumentacaoAgent {
  /**
   * Verifica documentação de um cliente
   */
  async verificarDocumentacao(params: {
    lead_id: string;
    imovel_id?: string;
  }) {
    try {
      console.log('[DocumentacaoAgent] Verificando documentação:', params);

      // Na prática, isso se conectaria com APIs de cartórios
      // Por enquanto, simulamos o processo
      const documentos_requeridos = [
        {
          tipo: 'RG',
          descritor: 'Documento de identidade',
          status: 'pendente',
          validade: null,
          obrigatorio: true,
        },
        {
          tipo: 'CPF',
          descritor: 'Cadastro de Pessoa Física',
          status: 'pendente',
          validade: null,
          obrigatorio: true,
        },
        {
          tipo: 'Comprovante de Renda',
          descritor: 'Extrato de 3 meses',
          status: 'pendente',
          validade: 'Últimos 90 dias',
          obrigatorio: true,
        },
        {
          tipo: 'Certidão de Casamento',
          descritor: 'Se casado(a)',
          status: 'pendente',
          validade: null,
          obrigatorio: false,
        },
        {
          tipo: 'Comprovante de Residência',
          descritor: 'Conta de luz ou telefone',
          status: 'pendente',
          validade: 'Últimos 3 meses',
          obrigatorio: true,
        },
      ];

      // Simula verificação no Sistema de Registro de Imóveis (SRI)
      const sri_status = await this.consultarSRI(params.imovel_id);

      console.log('[DocumentacaoAgent] Documentação verificada');

      return {
        success: true,
        documentos: documentos_requeridos,
        total_pendentes: documentos_requeridos.filter(d => d.obrigatorio && d.status === 'pendente').length,
        sri_status,
        mensagem: `Identifiquei ${documentos_requeridos.filter(d => d.obrigatorio).length} documentos obrigatórios. Vou te ajudar a preparar tudo.`,
      };
    } catch (error) {
      console.error('[DocumentacaoAgent] Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        documentos: [],
        total_pendentes: 0,
        sri_status: null,
      };
    }
  }

  /**
   * Consulta o Sistema de Registro de Imóveis (SRI)
   * Verifica se o imóvel está legalmente disponível
   */
  private async consultarSRI(imovel_id?: string) {
    try {
      if (!imovel_id) {
        return {
          disponivel: false,
          motivo: 'Imóvel não especificado',
        };
      }

      // Na prática, isso se conectaria à API do SRI
      // Por enquanto, simulamos
      const { data: imovel } = await supabase
        .from('imoveis')
        .select('disponivel, finalidade, tipo')
        .eq('id', imovel_id)
        .single();

      if (!imovel) {
        return {
          disponivel: false,
          motivo: 'Imóvel não encontrado',
        };
      }

      // Simula verificação no SRI
      // Na prática, isso verificaria:
      // - Matrícula válida
      // - Sem pendências
      // - Proprietário cadastrado
      // - Sem ônus
      const sri_status = imovel.disponivel ? {
        disponivel: true,
        matricula: this.gerarMatricula(imovel_id),
        proprietario: 'Verificado',
        pendencias: [],
        motivo: null,
      } : {
        disponivel: false,
        motivo: 'Imóvel indisponível',
      };

      console.log('[DocumentacaoAgent] SRI status:', sri_status);

      return sri_status;
    } catch (error) {
      console.error('[DocumentacaoAgent] Erro SRI:', error);
      return {
        disponivel: false,
        motivo: 'Erro ao consultar SRI',
      };
    }
  }

  /**
   * Gera número de matrícula simulado
   */
  private gerarMatricula(imovel_id: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CRN-${timestamp}-${random}`;
  }

  /**
   * Valida contrato antes da assinatura
   */
  async validarContrato(params: {
    lead_id: string;
    imovel_id: string;
    tipo_financiamento: 'caixa' | 'bradesco' | 'itau' | 'santander' | 'bancoDoBrasil' | 'particular';
    condicoes: any;
  }) {
    try {
      console.log('[DocumentacaoAgent] Validando contrato:', params);

      // Na prática, isso se conectaria com o sistema do banco
      // Por enquanto, simulamos validações
      const validacoes = [];

      // Validação básica
      if (!params.lead_id) {
        validacoes.push({
          tipo: 'erro',
          mensagem: 'Cliente não identificado',
        });
      }

      if (!params.imovel_id) {
        validacoes.push({
          tipo: 'erro',
          mensagem: 'Imóvel não identificado',
        });
      }

      // Validação SRI
      const sri_status = await this.consultarSRI(params.imovel_id);
      if (!sri_status.disponivel) {
        validacoes.push({
          tipo: 'aviso',
          mensagem: sri_status.motivo || 'Imóvel com pendências',
        });
      }

      // Validação de condição
      if (params.condicoes && !params.condicoes.aceita_termos) {
        validacoes.push({
          tipo: 'aviso',
          mensagem: 'É necessário aceitar os termos do contrato',
        });
      }

      // Simula validação do banco (se aplicável)
      if (params.tipo_financiamento !== 'particular') {
        const validacao_banco = await this.validarPreAprovacao(params);
        if (!validacao_banco.aprovado) {
          validacoes.push({
            tipo: 'erro',
            mensagem: validacao_banco.mensagem,
          });
        }
      }

      const aprovado = validacoes.every(v => v.tipo !== 'erro');

      console.log('[DocumentacaoAgent] Contrato validado:', aprovado);

      return {
        success: aprovado,
        validacoes,
        mensagem: aprovado
          ? '✅ Contrato validado com sucesso! Tudo certo para assinatura.'
          : '⚠️ Contrato precisa de revisões antes da assinatura.',
        acoes_recomendadas: aprovado
          ? ['Agendar assinatura', 'Enviar cópia digital', 'Preparar chaves']
          : validacoes.map(v => v.mensagem),
      };
    } catch (error) {
      console.error('[DocumentacaoAgent] Erro ao validar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        validacoes: [],
      };
    }
  }

  /**
   * Valida pré-aprovação de financiamento
   */
  private async validarPreAprovacao(params: any): Promise<{
    aprovado: boolean;
    mensagem: string;
  }> {
    // Simula pré-aprovação
    const bancos_com_pre_aprovacao = ['caixa', 'bradesco'];

    if (params.tipo_financiamento in bancos_com_pre_aprovacao) {
      return {
        aprovado: true,
        mensagem: `Pré-aprovação disponível no banco ${this.formatarNomeBanco(params.tipo_financiamento)}`,
      };
    }

    return {
      aprovado: false,
      mensagem: 'Pré-aprovação não disponível para este banco',
    };
  }

  /**
   * Formata nome do banco
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

export const documentacaoAgent = new DocumentacaoAgent();
