/**
 * WhatsApp Service — Crânios IMOB
 * Provider: UazAPI
 *
 * Variáveis de ambiente necessárias no .env:
 * UAZAPI_BASE_URL=https://api.uazapi.com  (URL base do servidor UazAPI)
 * UAZAPI_TOKEN=seu_token_aqui
 * UAZAPI_INSTANCE=nome_da_instancia
 */

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class WhatsAppService {
  private baseUrl: string;
  private token: string;
  private instance: string;

  constructor() {
    this.baseUrl = (process.env.UAZAPI_BASE_URL || '').replace(/\/$/, '');
    this.token = process.env.UAZAPI_TOKEN || '';
    this.instance = process.env.UAZAPI_INSTANCE || '';
  }

  isConfigured(): boolean {
    return !!(this.baseUrl && this.token && this.instance);
  }

  async sendText(to: string, message: string): Promise<WhatsAppResponse> {
    if (!this.isConfigured()) {
      console.warn('[WhatsApp] UazAPI não configurado. Verifique UAZAPI_BASE_URL, UAZAPI_TOKEN e UAZAPI_INSTANCE no .env');
      return { success: false, error: 'WhatsApp não configurado' };
    }

    const phone = to.replace(/\D/g, '');

    try {
      const url = `${this.baseUrl}/message/sendText/${this.instance}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.token,
        },
        body: JSON.stringify({ number: phone, text: message }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[WhatsApp] Erro HTTP ${response.status}:`, errText);
        return { success: false, error: `HTTP ${response.status}: ${errText}` };
      }

      const data = await response.json() as any;
      return { success: true, messageId: data?.key?.id || data?.messageId };
    } catch (error: any) {
      console.error('[WhatsApp] Erro ao enviar:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendLeadWelcome(lead: { nome: string; telefone: string; imobiliariaNome: string }): Promise<WhatsAppResponse> {
    const message = `Olá ${lead.nome}! 👋\n\nSou Elena, assistente virtual da *${lead.imobiliariaNome}*.\n\nVi que você tem interesse em nossos imóveis. Posso te ajudar a encontrar o imóvel perfeito!\n\nPode me contar o que está buscando? 🏡`;
    return this.sendText(lead.telefone, message);
  }

  async sendLeadReactivation(lead: { nome: string; telefone: string; diasInativo: number; imobiliariaNome: string }): Promise<WhatsAppResponse> {
    const message = `Oi ${lead.nome}! 😊\n\nFaz ${lead.diasInativo} dias que não nos falamos!\n\nA *${lead.imobiliariaNome}* tem novidades quentinhas no mercado imobiliário.\n\nAinda está procurando seu imóvel ideal? Posso te mostrar as melhores opções do momento! 🏠✨`;
    return this.sendText(lead.telefone, message);
  }

  async sendVisitConfirmation(data: {
    leadNome: string;
    leadTelefone: string;
    imovelTitulo: string;
    dataVisita: string;
    horaVisita: string;
    corretorNome: string;
  }): Promise<WhatsAppResponse> {
    const message = `✅ *Visita Confirmada!*\n\n🏠 *Imóvel:* ${data.imovelTitulo}\n📅 *Data:* ${data.dataVisita}\n⏰ *Hora:* ${data.horaVisita}\n👤 *Corretor:* ${data.corretorNome}\n\nQualquer dúvida, responda esta mensagem! 😊`;
    return this.sendText(data.leadTelefone, message);
  }

  /**
   * Envia mensagem de voz (áudio PTT) via UazAPI
   * Usado para espelhamento: se cliente enviou áudio, Elena responde com áudio
   *
   * @param to     Número no formato 5511999999999
   * @param audio  Buffer OGG_OPUS gerado pelo TTS
   */
  async sendAudio(to: string, audio: Buffer): Promise<WhatsAppResponse> {
    if (!this.isConfigured()) {
      return { success: false, error: 'WhatsApp não configurado' };
    }

    const phone = to.replace(/\D/g, '');
    const base64 = audio.toString('base64');

    try {
      // UazAPI: POST /message/sendAudio/{instance}
      // body: { number, audio (base64 data URI), ptt: true }
      const url = `${this.baseUrl}/message/sendAudio/${this.instance}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.token,
        },
        body: JSON.stringify({
          number: phone,
          audio: `data:audio/ogg;base64,${base64}`,
          ptt: true,  // aparece como mensagem de voz (bolhinha de áudio)
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[WhatsApp] sendAudio erro HTTP ${response.status}:`, errText);
        return { success: false, error: `HTTP ${response.status}: ${errText}` };
      }

      const data = await response.json() as any;
      return { success: true, messageId: data?.key?.id || data?.messageId };
    } catch (error: any) {
      console.error('[WhatsApp] Erro ao enviar áudio:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendProposal(data: {
    leadNome: string;
    leadTelefone: string;
    imovelTitulo: string;
    valor: number;
    linkProposta?: string;
  }): Promise<WhatsAppResponse> {
    const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.valor);
    const link = data.linkProposta ? `\n\n🔗 Ver proposta completa: ${data.linkProposta}` : '';
    const message = `📄 *Proposta Enviada!*\n\nOlá ${data.leadNome}!\n\nPreparamos uma proposta especial para:\n🏠 *${data.imovelTitulo}*\n💰 *Valor:* ${valorFormatado}${link}\n\nQualquer dúvida, fale comigo! 😊`;
    return this.sendText(data.leadTelefone, message);
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
