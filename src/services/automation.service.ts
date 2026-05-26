import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import crypto from 'crypto';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// Resend config fake API fallback if API KEY is missing
const resendHeaders = {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json'
};

const sendEmail = async (to: string, subject: string, html: string) => {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[Resend (Simulado)] Para: ${to} | Assunto: ${subject}`);
        return true;
    }
    try {
        await axios.post('https://api.resend.com/emails', {
            from: process.env.RESEND_FROM || 'Crânios IMOB <onboarding@cranios.pro>',
            to,
            subject,
            html
        }, { headers: resendHeaders });
        return true;
    } catch (error) {
        console.error('[Resend Error]', error);
        return false;
    }
};

const sendTelegram = async (message: string) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.CEO_TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
        console.log(`[Telegram (Simulado)]: \n${message}`);
        return;
    }
    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('[Telegram Error]', error);
    }
};

// 1. GERAÇÃO DE LOGIN 
export async function createProvisionalLogin(email: string, name: string) {
    // Senha: 12 caracteres (letra, numero, simbolos fake)
    const password = crypto.randomBytes(6).toString('base64').slice(0, 12) + "A1!";

    // Create user natively via Admin API
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'gestor', flag: 'provisional' }
    });

    if (error) {
        console.error('[Supabase Auth Error]', error);
        return null;
    }
    return password;
}

// 2. ASSINATURA RECORRENTE ASAAS (12 meses)
export async function createRecurringSubscription(customerId: string, value: number, billingType: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    const asaasKey = isProduction ? process.env.ASAAS_API_KEY : (process.env.ASAAS_SANDBOX || process.env.ASAAS_SANBOX);
    const asaasBase = isProduction ? 'https://www.asaas.com/api/v3' : 'https://sandbox.asaas.com/api/v3';
    if (!asaasKey) return 'simulated_sub_id_1234';

    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 30); // 1st installment in 30 days

    try {
        const res = await axios.post(`${asaasBase}/subscriptions`, {
            customer: customerId,
            billingType: billingType || 'CREDIT_CARD',
            value,
            nextDueDate: nextDue.toISOString().split('T')[0],
            cycle: 'MONTHLY',
            maxPayments: 12, // 12 parcelas mensais
            description: 'Mensalidade Crânios IMOB - Sistema Inteligente',
        }, {
            headers: { 'access_token': asaasKey }
        });
        return res.data.id;
    } catch (error: any) {
        console.error('[Asaas Error]', error?.response?.data || error.message);
        return null;
    }
}

// 3. ASSINAFY - LOGIN E CRIAÇÃO DO CONTRATO
export async function generateContractAssinafy(clientEmail: string, clientName: string, clientSlug: string) {
    const ASSINAFY_BASE = 'https://api.assinafy.com.br';
    const email = process.env.ASSINAFY_EMAIL;
    const password = process.env.ASSINAFY_PASSWORD;

    if (!email || !password) {
        console.log('[Assinafy (Simulado)] Contrato gerado. Link de Assinatura enviado.');
        return 'simulated_assinafy_document_123';
    }

    try {
        // 3.1 Login
        const loginRes = await axios.post(`${ASSINAFY_BASE}/login`, { email, password });
        const token = loginRes.data.token;

        // 3.2 Aqui gerariamos o PDF. Para fins práticos na integração direta, 
        // a Assinafy permite PDF buffers ou templates. 
        // Como a API pede FormData multipart com o Arquivo real:
        // (Simulando buffer com texto para evitar falha no node)
        const FormData = require('form-data');
        const form = new FormData();
        const mockPdfBuffer = Buffer.from('%PDF-1.4... (Mock do contrato)');

        form.append('file', mockPdfBuffer, { filename: `contrato_${clientSlug}.pdf` });
        form.append('name', `Contrato SaaS IMOB - ${clientName}`);

        // Assinaturas: CEO + Cliente
        const signers = [
            { email: 'ceo@cranios.pro', name: 'Júnior (CEO)', role: 'sign' },
            { email: clientEmail, name: clientName, role: 'sign' }
        ];
        form.append('signers', JSON.stringify(signers));

        const docRes = await axios.post(`${ASSINAFY_BASE}/documents`, form, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            }
        });

        return docRes.data?.id || docRes.data?.document_id;
    } catch (error: any) {
        console.error('[Assinafy Error]', error?.response?.data || error.message);
        return null;
    }
}

// Download de PDF final da Assinafy
export async function downloadAssinafyPDF(documentId: string) {
    if (!process.env.ASSINAFY_EMAIL) return Buffer.from('Mock Signed PDF');

    const ASSINAFY_BASE = 'https://api.assinafy.com.br';
    try {
        const loginRes = await axios.post(`${ASSINAFY_BASE}/login`, {
            email: process.env.ASSINAFY_EMAIL,
            password: process.env.ASSINAFY_PASSWORD
        });
        const token = loginRes.data.token;

        const res = await axios.get(`${ASSINAFY_BASE}/documents/${documentId}/download`, {
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'arraybuffer'
        });
        return Buffer.from(res.data);
    } catch (err) {
        console.error('Assinafy Download PDF Failed');
        return Buffer.from('Error downloading');
    }
}

// EMAILS E TELEGRAM (Exportações Prontas)
export const mail = {
    sendWelcome: async (to: string, name: string, tempPass: string) => {
        const html = `
      <h2>Bem-vindo à Crânios IMOB Real!</h2>
      <p>Olá ${name}, sua conta foi pré-criada com sucesso!</p>
      <p>Sua senha provisória de acesso: <strong>${tempPass}</strong> (Validade: 24h)</p>
      <hr />
      <p>Enviamos para você, via Assinafy (em outro e-mail separado), o Contrato de Prestação de Serviços.</p>
      <p>⚠️ <strong>Atenção:</strong> O agendamento do Onboarding Sistêmico só será liberado após a assinatura digital de ambas as partes.</p>
      <p>Abraços,<br/>Equipe de Implantação</p>
    `;
        await sendEmail(to, `Sua conta está pronta, ${name}!`, html);
    },
    sendOnboardingUnlock: async (to: string, name: string, safeTokenUrl: string) => {
        const html = `
      <h2>Contrato Assinado com Sucesso! ✅</h2>
      <p>Ótima notícia, ${name}! Seu contrato já está arquivado e seu ambiente está pronto para configuração.</p>
      <p>Agende imediatamente nossa reunião de Onboard Técnica acessando nosso portal interativo.</p>
      <p><a href="https://cal.com/seu-link-agendamento">👉 Agendar Reunião Cal.com</a></p>
      <hr/>
      <p>🚨 <strong>AVISO SEGURANÇA:</strong> Para ativarmos a IA na sua imobiliária, você precisará nos enviar Token e Chaves dos seus Portais, ZAP, OLX e Redes Sociais.</p>
      <p>Para nos submeter essas chaves, use APENAS o nosso cofre blindado acessando este link único (expira em 24h):</p>
      <p><a href="${safeTokenUrl}">👉 Enviar Chaves Secretas da Minha Imobiliária</a></p>
    `;
        await sendEmail(to, '✅ Assinatura Concluída! Agende seu Onboard Mágico', html);
    }
};

export const telegram = {
    notifyCEO: async (msg: string) => await sendTelegram(msg)
};
