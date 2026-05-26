import { createClient } from '@supabase/supabase-js';
import type { Imovel } from '../types.js';
import { emoji } from '../utils/emoji.js';

const supabase = createClient(
  'https://rbhkwmesmvytqdfuwcie.supabase.co',
  (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '')
);

/**
 * Configuração DocuSign (para produção)
 * IMPORTANTE: Em produção, usar chaves reais do DocuSign Developer Sandbox
 */
const DOCUMIND_CONFIG = {
  // Em produção, usar URLs reais do DocuSign
  baseUrl: 'https://demo.docusign.net/restapi',
  accountId: process.env.DOCUMIND_ACCOUNT_ID || 'demo-account-id',

  // Token de acesso (Em produção: OAuth2 flow)
  accessToken: process.env.DOCUMIND_ACCESS_TOKEN || 'demo-access-token',
};

/**
 * Agente de Assinatura Virtual (DocuSign)
 * Gera contratos, envia para assinatura virtual, gerencia status
 */
export class DocuSignAgent {
  /**
   * Cria contrato de compra e venda
   */
  async criarContrato(params: {
    lead_id: string;
    imovel_id: string;
    valor_imovel: number;
    tipo_financiamento: 'caixa' | 'bradesco' | 'itau' | 'santander' | 'bancoDoBrasil' | 'particular';
    valor_entrada?: number;
    valor_financiado?: number;
    data_assinatura?: string;
  }) {
    try {
      console.log('[DocuSignAgent] Criando contrato:', params);

      // Na prática, isso se conectaria à API do DocuSign
      // Por enquanto, simulamos o processo

      // 1. Busca dados do lead e imóvel
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', params.lead_id)
        .single();

      const { data: imovel } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', params.imovel_id)
        .single();

      if (!lead || !imovel) {
        throw new Error('Lead ou imóvel não encontrado');
      }

      // 2. Gera texto do contrato com LGPD
      const contratoTexto = this.gerarTextoContrato({
        lead: lead,
        imovel: imovel,
        financeiro: {
          valor_imovel: params.valor_imovel,
          tipo_financiamento: params.tipo_financiamento,
          valor_entrada: params.valor_entrada,
          valor_financiado: params.valor_financiado,
        },
      });

      // 3. Cria registro do contrato
      const { data: contrato } = await supabase
        .from('contratos')
        .insert([{
          lead_id: params.lead_id,
          imovel_id: params.imovel_id,
          valor_imovel: params.valor_imovel,
          tipo_financiamento: params.tipo_financiamento,
          valor_entrada: params.valor_entrada,
          valor_financiado: params.valor_financiado,
          texto: contratoTexto,
          status: 'pendente_assinatura',
          tipo: 'compra_venda',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      console.log('[DocuSignAgent] Contrato criado:', contrato.id);

      return {
        success: true,
        contrato: {
          id: contrato.id,
          texto: contratoTexto,
          link_assinatura: `https://demo.docusign.net/contracts/${contrato.id}/sign`,
          data_assinatura: params.data_assinatura || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        mensagem: 'Contrato gerado com sucesso! Pronto para assinar.',
      };
    } catch (error) {
      console.error('[DocuSignAgent] Erro ao criar contrato:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        contrato: null,
      };
    }
  }

  /**
   * Envia contrato para assinatura virtual
   */
  async enviarParaAssinatura(params: {
    contrato_id: string;
    lead_email: string;
    lead_nome: string;
    data_assinatura?: string;
  }) {
    try {
      console.log('[DocuSignAgent] Enviando para assinatura:', params);

      // Na prática, isso se conectaria à API do DocuSign para criar envelope
      // Por enquanto, simulamos

      // Atualiza status do contrato
      const { data: contrato } = await supabase
        .from('contratos')
        .update({
          status: 'enviado_assinatura',
          data_envio: new Date().toISOString(),
          link_assinatura: `https://demo.docusign.net/contracts/${params.contrato_id}/sign`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.contrato_id)
        .select()
        .single();

      // Gera mensagem de envio
      const mensagem = this.gerarMensagemEnvio({
        lead_nome: params.lead_nome,
        link_assinatura: contrato.link_assinatura || '',
        data_assinatura: params.data_assinatura || '',
      });

      console.log('[DocuSignAgent] Contrato enviado para assinatura');

      return {
        success: true,
        contrato,
        mensagem,
      };
    } catch (error) {
      console.error('[DocuSignAgent] Erro ao enviar para assinatura:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        mensagem: 'Não foi possível enviar o contrato para assinatura.',
      };
    }
  }

  /**
   * Verifica status da assinatura
   */
  async verificarStatusAssinatura(contrato_id: string) {
    try {
      console.log('[DocuSignAgent] Verificando status:', contrato_id);

      // Na prática, isso se conectaria à API do DocuSign
      // Por enquanto, simulamos status

      const { data: contrato } = await supabase
        .from('contratos')
        .select('*')
        .eq('id', contrato_id)
        .single();

      if (!contrato) {
        throw new Error('Contrato não encontrado');
      }

      // Simula verificação de status
      const statusAtual = contrato.status === 'enviado_assinatura'
        ? 'em_assinatura'
        : contrato.status === 'em_assinatura'
          ? 'assinado'
          : contrato.status;

      return {
        success: true,
        contrato,
        status: statusAtual,
        mensagem: this.gerarMensagemStatus(statusAtual),
      };
    } catch (error) {
      console.error('[DocuSignAgent] Erro ao verificar status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        contrato: null,
        status: 'desconhecido',
      };
    }
  }

  /**
   * Gera texto do contrato com LGPD
   */
  private gerarTextoContrato(params: {
    lead: any;
    imovel: Imovel;
    financeiro: any;
  }): string {
    const { lead, imovel, financeiro } = params;
    const hoje = new Date();

    // Texto de LGPD
    const lgpdTexto = `
═══════════════════════════════════════════════════════════════════════════════
                   DECLARAÇÃO DE PROTEÇÃO DE DADOS - LGPD
                   LEI 13.709/2018 E 13.853/2018
═══════════════════════════════════════════════════════════════════════════════

Ao prosseguir com este processo, você concorda com o tratamento de seus 
dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD). 

1. COLETA DE DADOS:
   • Coletamos apenas dados estritamente necessários para a transação imobiliária
   • Seus dados são: nome completo, CPF/CNPJ, email, telefone, endereço, dados 
     financeiros e informações de renda
   • Dados coletados via formulários, documentos digitais e durante a assinatura 
     virtual deste contrato

2. FINALIDADE:
   • Gestão do processo de compra e venda do imóvel
   • Validação de documentação e capacidade financeira
   • Comunicação sobre o processo, agendamentos e andamento da transação
   • Cumprimento de obrigações legais e fiscais (emissão de notas, recibo, etc.)

3. BASE LEGAL:
   • Legítimo interesse: Processamento de transação imobiliária com seu consentimento
   • Consentimento: Ao fornecer seus dados, você autoriza seu tratamento
   • Necessidade: Dados necessários para validação de documento e financiamento

4. DIREITOS DO TITULAR (Você):
   • Acesso: Tem direito de saber quais dados temos sobre você a qualquer momento
   • Correção: Pode solicitar correção de dados incompletos ou inexatos
   • Eliminação: Após conclusão da transação (ou a qualquer momento), pode pedir a 
     exclusão dos seus dados (exceto documentos legais exigidos por lei)
   • Portabilidade: Pode solicitar transferência de seus dados para outro 
     serviço
   • Oposição: Pode se opor ao tratamento de dados com finalidade de marketing

5. SEGURANÇA E CONFIDENCIALIDADE:
   🔒 Seus dados são protegidos com criptografia (SSL/TLS) em todo processo
   🔒 Apenas pessoas autorizadas (corretores, advogados, banco) têm acesso
   🔒 Nunca compartilhamos seus dados com terceiros sem sua autorização
   🔒 Seus dados são armazenados em conformidade com a LGPD e legislação brasileira

6. RETENÇÃO DE DADOS:
   • Documentos pessoais: 10 anos após conclusão da transação (exigido por lei)
   • Dados de contato: Enquanto você for cliente da Crânios IMOB (ou até solicitação de exclusão)
   • Dados financeiros: 5 anos após a transação (exigido por lei)

7. COMPARTILHAMENTO:
   • Compartilhamos com: Banco financiador (apenas se houver financiamento), 
     Cartório (registro do imóvel), Advogado (elaboração de escritura)
   • Nunca compartilhamos para: Marketing, terceiros sem autorização, finalidades não 
     relacionadas à transação

8. RESPONSABILIDADE:
   • A Crânios IMOB é responsável pela segurança dos dados enquanto estiverem sob nossa guarda
   • Em caso de vazamento, informaremos você em até 72h e tomaremos medidas corretivas
   • Você pode entrar em contato a qualquer momento para exercer seus direitos LGPD:
     📧 lgpd@cranios-imob.com

═══════════════════════════════════════════════════════════════════════════════
                      CONSENTIMENTO DO TITULAR
═══════════════════════════════════════════════════════════════════════════════

Declaro ter lido e compreendido a Política de Privacidade acima e autorizo a 
Crânios IMOB o tratamento dos meus dados pessoais para as finalidades descritas.

Estou ciente de que posso retirar este consentimento a qualquer momento, sem 
afetar os dados já tratados com base no consentimento anterior (quando aplicável).

Data: ${hoje.toLocaleDateString('pt-BR')}
Assinatura (eletrônica): ${lead.nome}

═══════════════════════════════════════════════════════════════════════════════
`;

    // Texto do contrato
    const contratoTexto = `
═══════════════════════════════════════════════════════════════════════════════
               CONTRATO DE COMPRA E VENDA DE IMÓVEL
               CRÂNIOS IMOB - CORRETOR DE IMÓVEIS
═══════════════════════════════════════════════════════════════════════════════
                        ${hoje.toLocaleDateString('pt-BR')}

DOS CONTRATANTES:

1. DO COMPRADOR (VOCÊ):
   Nome Completo: ${lead.nome || '_____________________'}
   CPF/CNPJ: ${lead.cpf || '_____________________'}
   Email: ${lead.email || '_____________________'}
   Telefone: ${lead.telefone || '_____________________'}
   Endereço: ${lead.endereco || '_____________________'}
   Bairro: ${lead.bairro || '_____________________'}
   Cidade: ${lead.cidade || 'Salvador'}
   Estado: ${lead.estado || 'BA'}
   CEP: ${lead.cep || '_____________________'}

2. DO VENDEDOR (PROPRIETÁRIO DO IMÓVEL):
   Nome Completo: ${imovel.proprietario || '_____________________'}
   CPF/CNPJ: ${imovel.cpf_proprietario || '_____________________'}
   Email: ${imovel.email_proprietario || '_____________________'}
   Telefone: ${imovel.telefone_proprietario || '_____________________'}
   Endereço do Imóvel: ${imovel.endereco || '_____________________'}
   Bairro: ${imovel.bairro || '_____________________'}
   Cidade: ${imovel.cidade || 'Salvador'}
   Estado: ${imovel.estado || 'BA'}
   CEP: ${imovel.cep || '_____________________'}

DO IMÓVEL:

Tipo: ${imovel.tipo}
Finalidade: ${imovel.finalidade}
Área Total: ${imovel.area_total}m²
Área Construída: ${imovel.area_construida}m²}
Quartos: ${imovel.quartos || 0}
Suítes: ${imovel.suites || 0}
Banheiros: ${imovel.banheiros || 0}
Vagas de Garagem: ${imovel.vagas_garagem || 0}
Matrícula: ${imovel.matricula || '_____________________'}

DAS CONDIÇÕES DA VENDA:

3. PREÇO:
   Valor do Imóvel: R$ ${financeiro.valor_imovel.toLocaleString('pt-BR')}
   Valor da Entrada: R$ ${(financeiro.valor_entrada || 0).toLocaleString('pt-BR')}
   Valor Financiado: R$ ${(financeiro.valor_financiado || 0).toLocaleString('pt-BR')}
   Forma de Pagamento: ${financeiro.tipo_financiamento === 'particular' ? 'À vista' : 'Financiado'}

${financeiro.tipo_financiamento !== 'particular' ? `4. FINANCIAMENTO:
   Instituição Financeira: ${financeiro.tipo_financiamento}
   Valor Financiado: R$ ${(financeiro.valor_financiado || 0).toLocaleString('pt-BR')}
   Sistema de Amortização: Price Table
   Taxa de Juros: Será informado pela instituição financeira
   Prazo: A ser definido pela instituição financeira` : ''}

DAS OBRIGAÇÕES:

5. DO COMPRADOR:
   a) Pagamento do preço conforme estabelecido na cláusula 3.
   b) Assinar a escritura definitiva de compra e venda em cartório.
   c) Custear todas as despesas referentes à lavratura e registro da escritura.
   d) Arcar com o ITPD (Imposto sobre Transmissão de Bens Imóveis).
   e) Arcar com as taxas e emolumentos cartorários.
   f) Arcar com as taxas notariais e de registro.

6. DO VENDEDOR:
   a) Entregar o imóvel no estado em que se encontra (usado/sem uso), salvo estipulação em contrário.
   b) Garantir que o imóvel não tem ônus reais não declarados.
   c) Apresentar os documentos necessários para a lavratura.
   d) Assinar a escritura definitiva de compra e venda em cartório.
   e) Arcar com as taxas e emolumentos cartorários.
   f) Arcar com as taxas notariais e de registro.

DAS DISPOSIÇÕES GERAIS:

7. DAS PARTES:
   a) O presente contrato passa a reger as partes, seus herdeiros e sucessores a qualquer título.
   b) As partes declaram que têm plena capacidade civil para contratar.
   c) O objeto deste contrato é o imóvel descrito na cláusula "DO IMÓVEL".
   d) As partes reconhecem a validade jurídica deste contrato.

8. DO FORO:
   a) Os contratos de compra e venda de imóveis podem ser firmados eletronicamente com validação jurídica.
   b) A assinatura digital tem a mesma validade jurídica que a assinatura manual.
   c) O comprador e o vendedor concordam em assinar este contrato digitalmente.

9. DA RESCISÃO:
   a) O presente contrato pode ser rescindido por mútuo acordo entre as partes.
   b) Em caso de rescisão injustificada, a parte que rescinde deve indenizar a outra parte.
   c) A rescisão deve ser comunicada por escrito com 30 dias de antecedência.

DAS DISPOSIÇÕES FINAIS:

10. DO FORO:
    a) As partes eleguem o foro da comarca de Salvador, Bahia, para dirimir qualquer dúvida ou conflito.
    b) As partes renunciam a qualquer outro foro, por mais privilegiado que seja.
    c) As partes comprometem-se a resolver qualquer conflito de forma amigável antes de recorrer ao judiciário.

${lgpdTexto}

E POR ESTE CONTRATO, AS PARTES TÊM JUSTO E CONTRATO QUE:
   O comprador pagará o preço estabelecido e assumirá a posse do imóvel.
   O vendedor entregará o imóvel e garantirá a propriedade legal.
   Ambos as partes cumprirão suas obrigações conforme estabelecido.

E ASSINAM, DIGITALMENTE, PARA TODOS OS FINS DE DIREITO.

Salvador, ${hoje.toLocaleDateString('pt-BR')}.

_________________________________________
   COMPRADOR (Assinatura Digital)

_________________________________________
   VENDEDOR (Assinatura Digital)

_________________________________________
   CORRETOR (Assinatura Digital)
   Crânios IMOB
   Registro CRECI/BA: 00.000 (simulado)
`;

    return contratoTexto;
  }

  /**
   * Gera mensagem de envio para assinatura
   */
  private gerarMensagemEnvio(params: {
    lead_nome: string;
    link_assinatura: string;
    data_assinatura: string;
  }): string {
    const dataFormatada = params.data_assinatura
      ? new Date(params.data_assinatura).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : 'a definir';

    return `Olá, ${params.lead_nome}! ${emoji('✍️')}

Seu contrato está pronto para assinar. ${emoji('📄')}

${emoji('🔗')} Link de assinatura: ${params.link_assinatura}
${emoji('📅')} Data da assinatura: ${dataFormatada}

Para assinar:
${emoji('1)')} Clique no link acima
${emoji('2)')} Revise o contrato com atenção
${emoji('3)')} Confirme seus dados pessoais
${emoji('4)')} Assine digitalmente
${emoji('5)')} Você receberá uma cópia por email

${emoji('🔒')} SEUS DADOS ESTÃO SEGUROS
${emoji('🛡️')} Seus dados pessoais são protegidos pela LGPD.
${emoji('🔐')} Seus dados são armazenados de forma segura.
${emoji('🔑')} Apenas as pessoas necessárias têm acesso.
${emoji('📞')} Em caso de dúvida, pode entrar em contato: lgpd@cranios-imob.com

${emoji('⚠️')} IMPORTANTE
${emoji('📌')} Assine até a data ${dataFormatada} para garantir o imóvel.
${emoji('📌')} Após assinar, você receberá a cópia final por email.
${emoji('📌')} Caso tenha dúvidas, entre em contato com a Crânios IMOB.

Fico à disposição para ajudar você com qualquer dúvida. ${emoji('🤔')}

Atenciosamente,
Bruna Costa
Analista de Documentação
Crânios IMOB
${emoji('🏠')}`;
  }

  /**
   * Gera mensagem de status
   */
  private gerarMensagemStatus(status: string): string {
    const mensagens: Record<string, string> = {
      'pendente_assinatura': '⏳ Contrato aguardando envio para assinatura.',
      'enviado_assinatura': '📤 Contrato enviado! Aguardando sua assinatura.',
      'em_assinatura': '✍️ Contrato está sendo assinado. Acompanhe pelo link.',
      'assinado': '✅ Contrato assinado! Você receberá a cópia final por email.',
      'cancelado': '❌ Contrato cancelado. Entre em contato para mais informações.',
      'concluido': '✅ Transação concluída! Obrigado por escolher a Crânios IMOB.',
    };
    return mensagens[status] || 'Status desconhecido.';
  }
}

export const documindAgent = new DocuSignAgent();
