// src/services/sales-automation.service.ts
// Automação de vendas da landing page — Crânios IMOB
import axios from 'axios';
import { supabase } from '../config/supabase.js';

// ─── Configuração de planos ────────────────────────────────────────────────

const PLANO_CONFIG = {
  starter:    { mensalidade: 597,  setup: 1497, nome: 'Starter'    },
  pro:        { mensalidade: 997,  setup: 2997, nome: 'Pro'        },
  enterprise: { mensalidade: 1797, setup: 4997, nome: 'Enterprise' },
} as const;

type Plano = keyof typeof PLANO_CONFIG;

// ─── Tipos internos ────────────────────────────────────────────────────────

interface LeadData {
  nome?: string;
  imobiliaria?: string;
  email: string;
  whatsapp?: string;
  cnpj?: string;
  corretores?: string;
  plano?: string;
  roi_data?: Record<string, unknown>;
  fonte?: string;
  session_id?: string;
}

interface CheckoutData {
  plano: string;
  nome: string;
  imobiliaria: string;
  email: string;
  whatsapp: string;
  cnpj?: string;
}

// ─── Service principal ─────────────────────────────────────────────────────

export const salesAutomationService = {

  /**
   * Cria ou atualiza um lead da landing page (upsert por email).
   * Se vier roi_data, dispara e-mail de boas-vindas com o relatório.
   */
  async criarOuAtualizarLead(data: LeadData) {
    const { data: lead, error } = await supabase
      .from('landing_leads')
      .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;

    if (data.roi_data) {
      await this.enviarEmailBoasVindas(lead).catch(console.error);
    }

    return lead;
  },

  /**
   * Envia e-mail de boas-vindas com dados de ROI via Resend.
   */
  async enviarEmailBoasVindas(lead: Record<string, any>) {
    const roi = lead.roi_data || {};
    const planoNome = PLANO_CONFIG[lead.plano as Plano]?.nome || 'Pro';
    const planoMensalidade = PLANO_CONFIG[lead.plano as Plano]?.mensalidade || 997;
    const primeiroNome = lead.nome ? lead.nome.split(' ')[0] : '';

    await axios.post(
      'https://api.resend.com/emails',
      {
        from: `Cecília · Crânios IMOB <cecilia@cranios.pro>`,
        to: lead.email,
        reply_to: 'contato@cranios.pro',
        subject: `${primeiroNome ? primeiroNome + ', obrigada' : 'Obrigada'} pelo interesse! Aqui está seu relatório ROI 🚀`,
        html: gerarEmailBoasVindas(lead, roi, planoNome, planoMensalidade),
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );
  },

  /**
   * Cria um cliente no Asaas e uma cobrança de setup (PIX) e retorna a URL de pagamento.
   */
  async criarCheckout(data: CheckoutData) {
    const plano = data.plano.toLowerCase() as Plano;
    const config = PLANO_CONFIG[plano];
    if (!config) throw new Error(`Plano inválido: ${data.plano}`);

    // Upsert lead com status checkout
    const { data: lead, error: leadErr } = await supabase
      .from('landing_leads')
      .upsert({ ...data, plano, status: 'checkout', updated_at: new Date().toISOString() }, { onConflict: 'email' })
      .select()
      .single();

    if (leadErr) throw leadErr;

    // Criar customer no Asaas
    const _asaasProduction = process.env.NODE_ENV === 'production';
    const _asaasKey = _asaasProduction ? process.env.ASAAS_API_KEY! : ((process.env.ASAAS_SANDBOX || process.env.ASAAS_SANBOX) || process.env.ASAAS_API_KEY!);
    const _asaasBase = _asaasProduction ? 'https://www.asaas.com/api/v3' : 'https://sandbox.asaas.com/api/v3';
    const asaasHeaders = {
      'access_token': _asaasKey,
      'Content-Type': 'application/json',
    };

    const { data: customer } = await axios.post<{ id: string }>(
      `${_asaasBase}/customers`,
      {
        name: data.nome,
        email: data.email,
        phone: data.whatsapp?.replace(/\D/g, ''),
        cpfCnpj: data.cnpj?.replace(/\D/g, '') || undefined,
        externalReference: lead?.id,
      },
      { headers: asaasHeaders },
    );

    // Criar cobrança de setup com vencimento em 3 dias
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const { data: payment } = await axios.post<{ id: string; invoiceUrl?: string; bankSlipUrl?: string }>(
      `${_asaasBase}/payments`,
      {
        customer: customer.id,
        billingType: 'PIX',
        value: config.setup,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Setup Crânios IMOB — Plano ${config.nome}`,
        externalReference: lead?.id,
      },
      { headers: asaasHeaders },
    );

    // Salvar IDs Asaas no lead
    await supabase
      .from('landing_leads')
      .update({ asaas_customer_id: customer.id, asaas_payment_id: payment.id })
      .eq('id', lead?.id);

    console.log(`[SalesAuto] Checkout criado | lead: ${lead?.id} | payment: ${payment.id}`);

    return {
      checkout_url: payment.invoiceUrl || payment.bankSlipUrl || 'https://cranios.pro',
      payment_id: payment.id,
    };
  },

  /**
   * Envia contrato via Assinafy após confirmação de pagamento.
   */
  async enviarContrato(leadId: string) {
    const { data: lead, error } = await supabase
      .from('landing_leads')
      .select()
      .eq('id', leadId)
      .single();

    if (error || !lead) throw new Error('Lead não encontrado: ' + leadId);

    const config = PLANO_CONFIG[lead.plano as Plano] || PLANO_CONFIG.pro;
    const hoje = new Date().toLocaleDateString('pt-BR');

    const { data: doc } = await axios.post<{ id: string }>(
      'https://api.assinafy.com.br/api/v2/documents',
      {
        template_id: process.env.ASSINAFY_TEMPLATE_ID,
        signers: [
          { email: lead.email, name: lead.nome || lead.imobiliaria, role: 'Contratante' },
          { email: 'junio@cranios.pro', name: 'Júnior Pires', role: 'Contratada' },
        ],
        variables: {
          NOME_EMPRESA: lead.imobiliaria || '',
          CNPJ: lead.cnpj || '',
          NOME_RESPONSAVEL: lead.nome || '',
          EMAIL: lead.email,
          PLANO: config.nome,
          VALOR_SETUP: `R$ ${config.setup.toLocaleString('pt-BR')}`,
          VALOR_MENSALIDADE: `R$ ${config.mensalidade.toLocaleString('pt-BR')}/mês`,
          DATA_ASSINATURA: hoje,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ASSINAFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    await supabase
      .from('landing_leads')
      .update({ assinafy_document_id: doc.id, status: 'contrato_enviado' })
      .eq('id', leadId);

    console.log(`[SalesAuto] Contrato enviado | lead: ${leadId} | doc: ${doc.id}`);
  },

  /**
   * Envia kit de onboarding (e-mail com checklist + link Cal.com) após assinatura do contrato.
   */
  async enviarOnboardingKit(leadId: string) {
    const { data: lead, error } = await supabase
      .from('landing_leads')
      .select()
      .eq('id', leadId)
      .single();

    if (error || !lead) throw new Error('Lead não encontrado: ' + leadId);

    const config = PLANO_CONFIG[lead.plano as Plano] || PLANO_CONFIG.pro;
    const calcomLink = 'https://cal.com/cranios/onboarding-cranios-imob';

    // Criar tenant pré-ativo
    await supabase
      .from('clientes')
      .upsert(
        {
          email: lead.email,
          nome: lead.imobiliaria || lead.nome,
          plano: lead.plano,
          status: 'pre_ativo',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      )
      .then(undefined, console.error);

    await supabase
      .from('landing_leads')
      .update({ status: 'contrato_assinado' })
      .eq('id', leadId);

    await axios.post(
      'https://api.resend.com/emails',
      {
        from: `Crânios IMOB <${process.env.ONBOARDING_FROM_EMAIL || 'onboarding@cranios.pro'}>`,
        to: lead.email,
        subject: `Contrato assinado! Aqui está tudo para o seu onboarding 🎉`,
        html: gerarEmailOnboardingKit(lead, config, calcomLink),
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log(`[SalesAuto] Onboarding kit enviado para ${lead.email}`);
  },

  /**
   * Registra agendamento Cal.com, atualiza tabelas e dispara e-mail + Telegram CEO.
   */
  async prepararOnboarding(leadId: string, bookingData: Record<string, any>) {
    const { data: lead, error } = await supabase
      .from('landing_leads')
      .select()
      .eq('id', leadId)
      .single();

    if (error || !lead) throw new Error('Lead não encontrado: ' + leadId);

    const config = PLANO_CONFIG[lead.plano as Plano] || PLANO_CONFIG.pro;

    const bookingId = bookingData?.id || bookingData?.bookingId || bookingData?.payload?.id;
    const meetLink  = bookingData?.payload?.videoCallUrl || bookingData?.videoCallUrl || '';
    const startTime = bookingData?.payload?.startTime || bookingData?.startTime || bookingData?.start;
    const dataFmt   = startTime
      ? new Date(startTime).toLocaleDateString('pt-BR', {
          weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
        })
      : 'A confirmar';

    await supabase
      .from('landing_leads')
      .update({ calcom_booking_id: bookingId, status: 'onboarding_agendado' })
      .eq('id', leadId);

    await supabase
      .from('clientes')
      .update({ onboarding_data: startTime })
      .eq('email', lead.email)
      .then(undefined, console.error);

    // E-mail de confirmação de onboarding
    await axios.post(
      'https://api.resend.com/emails',
      {
        from: `Crânios IMOB <${process.env.ONBOARDING_FROM_EMAIL || 'onboarding@cranios.pro'}>`,
        to: lead.email,
        subject: `✅ Onboarding confirmado para ${dataFmt}`,
        html: `<div style="background:#0a0e27;color:#F1F5F9;padding:40px;font-family:Arial,sans-serif;border-radius:12px">
<h2 style="color:#22c55e">✅ Onboarding confirmado!</h2>
<p><strong>Data:</strong> ${dataFmt}</p>
${meetLink ? `<p><a href="${meetLink}" style="color:#6366f1">Entrar na videochamada</a></p>` : ''}
<p style="color:#94A3B8;font-size:13px">Não esqueça do checklist 📋</p>
</div>`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // Notificação Telegram CEO
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const msg = `🎉 Novo onboarding agendado!\n\n🏢 ${lead.imobiliaria || 'N/A'}\n📧 ${lead.email}\n📦 Plano ${config.nome}\n📅 ${dataFmt}${meetLink ? '\n🎥 ' + meetLink : ''}`;
      await axios
        .post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          { chat_id: process.env.TELEGRAM_CHAT_ID, text: msg },
        )
        .catch(console.error);
    }

    console.log(`[SalesAuto] Onboarding preparado | ${lead.email} | ${dataFmt}`);
  },
};

// ─── Helpers de e-mail ─────────────────────────────────────────────────────

function gerarEmailBoasVindas(
  lead: Record<string, any>,
  roi: Record<string, any>,
  planoNome: string,
  mensalidade: number,
): string {
  const primeiroNome = lead.nome ? lead.nome.split(' ')[0] : '';
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0e27;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
  <div style="text-align:center;margin-bottom:32px">
    <div style="font-size:28px;font-weight:800;color:#6366f1">CRÂNIOS IMOB</div>
  </div>
  <div style="background:#1E293B;border-radius:16px;padding:32px;border:1px solid rgba(99,102,241,0.2)">
    <h1 style="color:#F1F5F9;font-size:22px;margin:0 0 12px">Olá${primeiroNome ? ', ' + primeiroNome : ''}! 👋</h1>
    <p style="color:#CBD5E1;margin:0 0 24px;line-height:1.6">Obrigada por calcular o ROI da sua imobiliária com o Crânios IMOB.</p>
    ${roi.economiaAnual ? `
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">
      <div style="flex:1;min-width:130px;background:rgba(99,102,241,0.1);border-radius:12px;padding:16px;text-align:center;border:1px solid rgba(99,102,241,0.2)">
        <div style="font-size:26px;font-weight:800;color:#6366f1">R$${Math.round(roi.economiaAnual / 1000)}k</div>
        <div style="font-size:11px;color:#94A3B8;margin-top:4px">Economia Anual</div>
      </div>
      <div style="flex:1;min-width:130px;background:rgba(99,102,241,0.1);border-radius:12px;padding:16px;text-align:center;border:1px solid rgba(99,102,241,0.2)">
        <div style="font-size:26px;font-weight:800;color:#22c55e">${Math.round(roi.roi || 0)}%</div>
        <div style="font-size:11px;color:#94A3B8;margin-top:4px">ROI Anual</div>
      </div>
      <div style="flex:1;min-width:130px;background:rgba(99,102,241,0.1);border-radius:12px;padding:16px;text-align:center;border:1px solid rgba(99,102,241,0.2)">
        <div style="font-size:26px;font-weight:800;color:#f59e0b">${roi.paybackDias || 0}</div>
        <div style="font-size:11px;color:#94A3B8;margin-top:4px">Dias Payback</div>
      </div>
    </div>` : ''}
    <div style="text-align:center;margin-top:16px">
      <a href="https://cranios.pro/?plano=${lead.plano || 'pro'}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:12px;font-weight:700">🚀 Contratar Agora — ${planoNome} R$${mensalidade}/mês</a>
    </div>
  </div>
  <p style="text-align:center;color:#475569;font-size:12px;margin-top:20px">Crânios IMOB · <a href="https://cranios.pro" style="color:#6366f1">cranios.pro</a></p>
</div></body></html>`;
}

function gerarEmailOnboardingKit(
  lead: Record<string, any>,
  config: { nome: string; mensalidade: number; setup: number },
  calcomLink: string,
): string {
  const primeiroNome = lead.nome ? lead.nome.split(' ')[0] : 'Cliente';
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0e27;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
  <div style="text-align:center;margin-bottom:24px">
    <div style="font-size:28px;font-weight:800;color:#6366f1">CRÂNIOS IMOB</div>
  </div>
  <div style="background:#1E293B;border-radius:16px;padding:32px;border:1px solid rgba(99,102,241,0.2)">
    <h1 style="color:#22c55e;font-size:22px;margin:0 0 8px">🎉 Parabéns, ${primeiroNome}!</h1>
    <p style="color:#94A3B8;margin:0 0 24px">Seu contrato foi assinado. Agora é só agendar o onboarding.</p>
    <div style="text-align:center;margin-bottom:28px;padding:20px;background:rgba(99,102,241,0.05);border-radius:12px;border:1px solid rgba(99,102,241,0.2)">
      <p style="color:#CBD5E1;margin:0 0 14px;font-weight:600">📅 Agende seu onboarding de 90 minutos:</p>
      <a href="${calcomLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:12px;font-weight:700">Agendar Onboarding</a>
    </div>
    <h3 style="color:#F1F5F9;margin:0 0 14px;font-size:15px">📋 O que preparar antes do onboarding:</h3>
    <ul style="color:#CBD5E1;padding-left:20px;line-height:2;margin:0 0 20px">
      <li>Logomarca em vetor (SVG, AI ou PDF)</li>
      <li>Paleta de cores da marca (código hex)</li>
      <li>Foto dos corretores (WhatsApp ou PNG)</li>
      <li>Lista de corretores: nome + e-mail + WhatsApp</li>
      <li>Planilha de imóveis ativos (endereço, tipo, preço, fotos)</li>
      <li>CNPJ e CRECI da imobiliária</li>
      <li>Número de WhatsApp Business dedicado</li>
      <li>Acesso ao DNS do seu domínio</li>
    </ul>
    <div style="padding:14px;background:rgba(99,102,241,0.05);border-radius:8px;border-left:3px solid #6366f1">
      <p style="color:#94A3B8;margin:0;font-size:13px">Plano: <strong style="color:#a5b4fc">${config.nome}</strong> · R$${config.mensalidade}/mês · Acesso liberado após a ativação.</p>
    </div>
  </div>
  <p style="text-align:center;color:#475569;font-size:12px;margin-top:20px">Crânios IMOB · <a href="https://cranios.pro" style="color:#6366f1">cranios.pro</a></p>
</div></body></html>`;
}
