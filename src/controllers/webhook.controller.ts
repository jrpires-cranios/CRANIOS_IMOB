import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import * as automation from '../services/automation.service';
import { salesAutomationService } from '../services/sales-automation.service.js';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// POST /api/webhooks/asaas
export const handleAsaasWebhook = async (req: Request, res: Response) => {
    // Always respond to webhooks in < 5 seconds.
    res.status(200).json({ received: true });

    const token = req.headers['asaas-access-token'];
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    // Basic token check. If empty or dev, ignore token
    if (expectedToken && token !== expectedToken) {
        console.error('Asaas Webhook: Invalid token.');
        return;
    }

    const { event, payment } = req.body;
    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') return;

    try {
        const asaasCustId = payment.customer;
        const paymentValue = payment.value;
        const paymentMethod = payment.billingType;
        const clientName = payment.description || 'Cliente';
        const clientEmail = payment.customerEmail || 'novo@cliente.com'; // Requires full query usually, simulating here

        console.log(`[Webhook Asaas] Pagamento recebido: ${asaasCustId}`);

        // Fluxo novo da landing: o checkout grava o landing_lead.id em externalReference.
        // Quando ele existe, evitamos cair no pipeline antigo com e-mail simulado.
        if (payment?.externalReference) {
            const { data: landingLead } = await supabase
                .from('landing_leads')
                .select()
                .eq('id', payment.externalReference)
                .maybeSingle();

            if (landingLead) {
                await supabase
                    .from('landing_leads')
                    .update({
                        status: 'pagamento_confirmado',
                        asaas_payment_id: payment.id || landingLead.asaas_payment_id,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', landingLead.id);

                await salesAutomationService.enviarContrato(landingLead.id).catch(console.error);
                await automation.telegram.notifyCEO(`💰 *PAGAMENTO LANDING CONFIRMADO* - R$ ${paymentValue}\nCliente: ${landingLead.imobiliaria || landingLead.nome} (${landingLead.email})\n\nContrato Assinafy em processamento.`);
                return;
            }
        }

        // Cria/Atualiza no Pipeline
        const { data: client, error: clientErr } = await supabase.from('client_pipeline')
            .upsert({ email: clientEmail, name: clientName, asaas_customer_id: asaasCustId, plan_value: paymentValue, status: 'PAGAMENTO_CONFIRMADO' })
            .select().single();

        if (clientErr) throw clientErr;

        // Etapa 1: Login Provisionado
        const tempPass = await automation.createProvisionalLogin(clientEmail, clientName);

        // Etapa 2: Cobrança Recorrente 12x
        await automation.createRecurringSubscription(asaasCustId, paymentValue, paymentMethod);

        // Etapa 3: Contrato via Assinafy (CEO + CLiente)
        const docId = await automation.generateContractAssinafy(clientEmail, clientName, client?.tenant_slug || client.id);
        if (docId) {
            await supabase.from('client_pipeline').update({ assinafy_document_id: docId, contract_sent_at: new Date() }).eq('id', client.id);
        }

        // Etapa 4: Email de boas vindas
        if (tempPass) {
            await automation.mail.sendWelcome(clientEmail, clientName, tempPass);
        }

        await automation.telegram.notifyCEO(`💰 *NOVO PAGAMENTO* - R$ ${paymentValue}\nCliente: ${clientName} (${clientEmail})\n\nCredenciais e contrato em processamento!`);

    } catch (e: any) {
        console.error('[Webook Asaas Error] Pipeline:', e);
    }
};


// POST /api/webhooks/assinafy
export const handleAssinafyWebhook = async (req: Request, res: Response) => {
    res.status(200).json({ received: true });

    const { event, document_id } = req.body;

    if (event !== 'document.signed') return;
    console.log(`[Webhook Assinafy] Documento assinado: ${document_id}`);

    try {
        const docId = req.body?.document?.id || req.body?.id || document_id;

        // 1. Fetch from Pipeline
        const { data: client } = await supabase.from('client_pipeline').select().eq('assinafy_document_id', document_id).maybeSingle();
        if (client) {
            // 2. Download and upload PDF (Simulated Assinafy / Supabase bucket implementation)
            const pdfData = await automation.downloadAssinafyPDF(document_id);
            const path = `contratos/${client.id}/contract_signed.pdf`;

            // Upload storage (service API)
            await supabase.storage.from('cranios-imob').upload(path, pdfData, { contentType: 'application/pdf', upsert: true });

            // 3. Update Pipeline
            await supabase.from('client_pipeline').update({
                contract_storage_path: path,
                contract_signed_at: new Date(),
                status: 'CONTRATO_ASSINADO',
                secure_form_token: JSON.stringify({ exp: Date.now() + 86400000, id: client.id }) // Token 24h
            }).eq('id', client.id);

            // 4. Send email unlocking Onboard Cal.com & Secure API Form url
            const safeUrl = `https://cranios-imob.com/secure-keys?token=${Buffer.from(client.id).toString('base64')}`;
            await automation.mail.sendOnboardingUnlock(client.email, client.name, safeUrl);

            await automation.telegram.notifyCEO(`✍️ *Contrato Assinado!*\nCliente: ${client.name}\n\nO link de Agendamento Cal.com e o Forms Seguro de API Keys já foram liberados para a imobiliária!`);
        }

        // Landing Lead: se o documento assinado estiver vinculado a um landing_lead, enviar onboarding kit
        if (docId) {
            const { data: ll } = await supabase
                .from('landing_leads')
                .select()
                .eq('assinafy_document_id', docId)
                .maybeSingle();
            if (ll) {
                await salesAutomationService.enviarOnboardingKit(ll.id).catch(console.error);
            }
        }

    } catch (error) {
        console.error('[Webook Assinafy Error]:', error);
    }
};


// POST /api/webhooks/calcom
export const handleCalcomWebhook = async (req: Request, res: Response) => {
    res.status(200).json({ received: true });

    const { triggerEvent, payload } = req.body;
    if (triggerEvent !== 'BOOKING_CREATED') return;

    const email = payload?.attendees?.[0]?.email;
    const startTime = payload?.startTime;

    console.log(`[Webhook Cal.com] Evento: ${email} agendou para ${startTime}`);

    if (email) {
        await supabase.from('client_pipeline').update({
            status: 'ONBOARD_AGENDADO',
            onboard_scheduled_at: startTime
        }).eq('email', email);

        await automation.telegram.notifyCEO(`📅 *REUNIÃO ONBOARD AGENDADA!*\nData: ${new Date(startTime).toLocaleString('pt-BR')}\nE-mail vinculado: ${email}`);

        // Landing Lead: se o e-mail do attendee estiver vinculado a um landing_lead, preparar onboarding
        const attendeeEmail = payload?.attendees?.[0]?.email || req.body?.attendee?.email;
        if (attendeeEmail) {
            const { data: ll } = await supabase
                .from('landing_leads')
                .select()
                .eq('email', attendeeEmail)
                .maybeSingle();
            if (ll) {
                await salesAutomationService.prepararOnboarding(ll.id, payload || req.body).catch(console.error);
            }
        }
    }
};
