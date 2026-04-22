import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as comissaoService from './comissao.service.js';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// ===================================================================
// TIPOS
// ===================================================================
export interface SaleClosingParams {
    propertyId: string;
    leadId?: string;
    corretorId?: string;
    brokerName: string;
    brokerTelegram?: string;
    brokerCreci?: string;
    closingValue: number;
    paymentType: 'cash' | 'financing' | 'fgts' | 'trade' | 'mixed';
    paymentNotes?: string;
    commissionPct?: number;    // se não enviado, usa o resolvido
    observations?: string;
    sourceChannel?: 'web' | 'telegram';
}

// ===================================================================
// 1. Resolver parâmetros de venda com herança (imóvel → agência)
// ===================================================================
export async function resolveSaleParams(propertyId: string) {
    const { data, error } = await supabase
        .from('v_resolved_sale_params')
        .select('*')
        .eq('property_id', propertyId)
        .single();

    if (error || !data) {
        console.warn('[SaleService] Parâmetros não encontrados para imóvel:', propertyId);
        return {
            property_id: propertyId,
            resolved_commission_pct: 6.0,
            commission_is_inherited: true,
            commission_split_agency: 50,
            commission_split_broker: 50,
            allow_custom_commission: true,
            admin_fee_pct: 10.0,
            admin_fee_model: 'pct_rent',
            intermediation_model: 'pct_first_rent',
            intermediation_value: 100,
        };
    }
    return data;
}

// ===================================================================
// 2. Criar Fechamento de Venda + Notificar Gestor
// ===================================================================
export async function createSaleClosing(params: SaleClosingParams): Promise<{
    success: boolean;
    closingId?: string;
    commissionValue?: number;
    error?: string;
}> {
    try {
        // Resolve parâmetros com herança
        const resolved = await resolveSaleParams(params.propertyId);

        // Valida comissão proposta vs. permitida
        const commissionPct = (() => {
            if (params.commissionPct !== undefined) {
                // Se imobiliária não permite personalização, usa o padrão
                if (!resolved.allow_custom_commission) {
                    console.log(`[SaleService] Comissão personalizada ignorada — imobiliária não permite.`);
                    return Number(resolved.resolved_commission_pct);
                }
                return params.commissionPct;
            }
            return Number(resolved.resolved_commission_pct);
        })();

        const commissionValue = (params.closingValue * commissionPct) / 100;
        const agencySplit = Number(resolved.commission_split_agency || 50);
        const brokerSplit = Number(resolved.commission_split_broker || 50);
        const commissionAgencyValue = Math.round((commissionValue * agencySplit) / 100 * 100) / 100;
        const commissionBrokerValue = Math.round((commissionValue * brokerSplit) / 100 * 100) / 100;

        // Snapshot do valor de tabela
        const tableValue = resolved.preco_venda || 0;

        // Persiste o fechamento
        const { data: closing, error: closingError } = await supabase
            .from('sale_closings')
            .insert({
                property_id: params.propertyId,
                lead_id: params.leadId || null,
                broker_name: params.brokerName,
                broker_telegram: params.brokerTelegram,
                broker_creci: params.brokerCreci,
                closing_value: params.closingValue,
                table_value: tableValue,
                payment_type: params.paymentType,
                payment_notes: params.paymentNotes,
                commission_pct: commissionPct,
                commission_agency_value: commissionAgencyValue,
                commission_broker_value: commissionBrokerValue,
                corretor_id: params.corretorId || null,
                tenant_id: resolved.imob_tenant_id || 'rbhkwmesmvytqdfuwcie',
                observations: params.observations,
                status: 'pending_approval',
                source_channel: params.sourceChannel || 'web',
            })
            .select()
            .single();

        if (closingError || !closing) {
            console.error('[SaleService] Erro ao criar fechamento:', closingError);
            return { success: false, error: closingError?.message || 'Erro desconhecido' };
        }

        // Atualiza status do lead (se vinculado)
        if (params.leadId) {
            await supabase.from('leads').update({
                operacao_status: 'fechamento_pendente_aprovacao',
            }).eq('id', params.leadId);
        }

        // Notifica gestor via Telegram
        await notifyManagerPendingApproval(closing, resolved);

        // Registra notificação no histórico
        await logNotification(closing.id, 'telegram', 'sent',
            `Novo fechamento pendente de aprovação: ${params.brokerName} — ${formatCurrency(params.closingValue)}`
        );

        console.log(`[SaleService] ✅ Fechamento criado! ID: ${closing.id} | Comissão: ${commissionPct}% = ${formatCurrency(commissionValue)}`);

        return {
            success: true,
            closingId: closing.id,
            commissionValue,
        };

    } catch (e: any) {
        console.error('[SaleService] Erro crítico:', e);
        return { success: false, error: e.message };
    }
}

// ===================================================================
// 3. Aprovar Fechamento → Dispara cadeia pós-aprovação
// ===================================================================
export async function approveSaleClosing(closingId: string, approverName: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const { data: closing, error } = await supabase
            .from('sale_closings')
            .update({
                status: 'approved',
                approved_by: approverName,
                approved_at: new Date().toISOString(),
            })
            .eq('id', closingId)
            .select(`*, imoveis(titulo, endereco, bairro)`)
            .single();

        if (error || !closing) {
            return { success: false, error: error?.message || 'Fechamento não encontrado' };
        }

        // Atualiza status do lead
        if (closing.lead_id) {
            await supabase.from('leads').update({
                operacao_status: 'venda_aprovada',
            }).eq('id', closing.lead_id);
        }

        // Notifica corretor sobre aprovação
        await logNotification(closingId, 'telegram', 'sent',
            `✅ Seu fechamento foi APROVADO pelo gestor ${approverName}! Aguardando documentação do cliente.`
        );

        // Gera comissão (M3)
        try {
            await comissaoService.processarComissaoVenda(closing);
        } catch (ec) {
            console.error('[SaleService] Erro ao gerar comissão:', ec);
        }

        // Dispara cadeia pós-aprovação
        await triggerPostSaleApprovalChain(closing);

        console.log(`[SaleService] ✅ Fechamento ${closingId} aprovado por ${approverName}`);
        return { success: true };

    } catch (e: any) {
        console.error('[SaleService] Erro na aprovação:', e);
        return { success: false, error: e.message };
    }
}

// ===================================================================
// 4. Rejeitar Fechamento
// ===================================================================
export async function rejectSaleClosing(closingId: string, reason: string, rejectorName: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const { error } = await supabase
            .from('sale_closings')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                rejection_at: new Date().toISOString(),
            })
            .eq('id', closingId);

        if (error) return { success: false, error: error.message };

        // Log da rejeição
        await logNotification(closingId, 'telegram', 'sent',
            `❌ Fechamento rejeitado por ${rejectorName}. Motivo: ${reason}`
        );

        console.log(`[SaleService] Fechamento ${closingId} rejeitado. Motivo: ${reason}`);
        return { success: true };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ===================================================================
// 5. Cadeia Automática Pós-Aprovação
// ===================================================================
async function triggerPostSaleApprovalChain(closing: any) {
    const imovelTitulo = closing.imoveis?.titulo || 'Imóvel';
    const closingValue = formatCurrency(closing.closing_value);

    // 5a. Notifica Agente Jurídico (vai gerar minuta do contrato)
    const briefing = `
🏠 *VENDA APROVADA — BRIEFING JURÍDICO*

📋 *Fechamento ID:* ${closing.id.substring(0, 8)}
🏡 *Imóvel:* ${imovelTitulo} — ${closing.imoveis?.endereco || ''}
💰 *Valor:* ${closingValue}
📄 *Pagamento:* ${formatPaymentType(closing.payment_type)} ${closing.payment_notes ? `— ${closing.payment_notes}` : ''}
👤 *Corretor:* ${closing.broker_name} ${closing.broker_creci ? `(CRECI: ${closing.broker_creci})` : ''}
💼 *Comissão:* ${closing.commission_pct}% = ${formatCurrency(closing.commission_value)}
${closing.observations ? `📝 Obs: ${closing.observations}` : ''}

✅ *Status: APROVADO* — Prosseguir com minuta do contrato.
    `.trim();

    // Envia para o Telegram do responsável por contratos de venda (se configurado)
    try {
        const { data: agency } = await supabase
            .from('v_resolved_sale_params')
            .select('sales_contract_telegram, sales_contract_email')
            .eq('property_id', closing.property_id)
            .single();

        if (agency?.sales_contract_telegram && process.env.TELEGRAM_BOT_TOKEN) {
            const chatId = agency.sales_contract_telegram;
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: briefing,
                parse_mode: 'Markdown',
            }).catch(e => console.warn('[SaleService Telegram] Falha ao notificar responsável:', e.message));

            await logNotification(closing.id, 'telegram', 'sent', briefing);
        }

        // 5b. E-mail com briefing para o responsável
        if (agency?.sales_contract_email && process.env.RESEND_API_KEY) {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: process.env.RESEND_FROM || 'contratos@cranios.pro',
                to: agency.sales_contract_email,
                subject: `🏠 Venda Aprovada — ${imovelTitulo} | ${closingValue}`,
                html: `<pre style="font-family:monospace">${briefing}</pre>`,
            });
            await logNotification(closing.id, 'email', 'sent', `Briefing enviado para ${agency.sales_contract_email}`);
        }
    } catch (e: any) {
        console.error('[SaleService] Erro na cadeia pós-aprovação:', e.message);
    }

    // 5c. Gera contrato via Assinafy (se houver dados suficientes do lead)
    if (closing.lead_id && process.env.ASSINAFY_EMAIL) {
        await generateSaleContract(closing, imovelTitulo, closingValue);
    }

    // 5d. Atualiza status para docs_requested
    await supabase.from('sale_closings')
        .update({ status: 'docs_requested' })
        .eq('id', closing.id);
}

// ===================================================================
// 6. Gerar contrato de venda via Assinafy
// ===================================================================
async function generateSaleContract(closing: any, imovelTitulo: string, closingValue: string) {
    try {
        // Busca dados do lead
        const { data: lead } = await supabase.from('leads').select('nome, email, telefone').eq('id', closing.lead_id).single();
        if (!lead?.email) return;

        const loginRes = await axios.post('https://api.assinafy.com.br/login', {
            email: process.env.ASSINAFY_EMAIL,
            password: process.env.ASSINAFY_PASSWORD,
        });
        const token = loginRes.data.token;

        const FormData = require('form-data');
        const form = new FormData();
        const contractText = `PROMESSA DE COMPRA E VENDA\n\nComprador: ${lead.nome}\nImóvel: ${imovelTitulo}\nValor: ${closingValue}\nPagamento: ${formatPaymentType(closing.payment_type)}\nComissão Corretor: ${closing.commission_pct}%`;
        form.append('file', Buffer.from(contractText), { filename: `contrato_venda_${lead.nome.replace(/\s/g, '_')}.pdf` });
        form.append('name', `Promessa de Compra e Venda — ${imovelTitulo}`);
        form.append('signers', JSON.stringify([
            { email: lead.email, name: lead.nome, role: 'sign' },
            { email: process.env.RESEND_FROM?.split('<')[1]?.replace('>', '') || 'contratos@cranios.pro', name: 'Imobiliária', role: 'sign' },
        ]));

        const docRes = await axios.post('https://api.assinafy.com.br/documents', form, {
            headers: { 'Authorization': `Bearer ${token}`, ...form.getHeaders() },
        });
        const docId = docRes.data?.id;

        if (docId) {
            await supabase.from('sale_closings').update({ assinafy_document_id: docId, status: 'contract_sent' }).eq('id', closing.id);
            await logNotification(closing.id, 'email', 'sent', `Contrato enviado via Assinafy: ${docId}`);
        }
    } catch (e: any) {
        console.error('[SaleService Assinafy] Erro:', e.message);
    }
}

// ===================================================================
// 7. Notificar Gestor sobre Fechamento Pendente
// ===================================================================
async function notifyManagerPendingApproval(closing: any, resolved: any) {
    const msg = `
🔔 *NOVO FECHAMENTO AGUARDANDO APROVAÇÃO*

🏡 *Imóvel:* ${resolved.titulo || closing.property_id?.substring(0, 8)}
👤 *Corretor:* ${closing.broker_name}
💰 *Valor:* ${formatCurrency(closing.closing_value)} ${resolved.preco_venda && resolved.preco_venda !== closing.closing_value ? `(tabela: ${formatCurrency(resolved.preco_venda)})` : ''}
📄 *Pagamento:* ${formatPaymentType(closing.payment_type)}
💼 *Comissão:* ${closing.commission_pct}% = ${formatCurrency(closing.closing_value * closing.commission_pct / 100)}
${closing.observations ? `📝 Obs: ${closing.observations}` : ''}

⏳ *Responda:*
✅ \`aprovar ${closing.id.substring(0, 8)}\`
❌ \`rejeitar ${closing.id.substring(0, 8)} [motivo]\`
    `.trim();

    if (process.env.TELEGRAM_BOT_TOKEN && process.env.CEO_TELEGRAM_CHAT_ID) {
        try {
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.CEO_TELEGRAM_CHAT_ID,
                text: msg,
                parse_mode: 'Markdown',
            });
        } catch (e: any) {
            console.warn('[SaleService] Falha ao notificar gestor:', e.message);
        }
    } else {
        console.log('[SaleService - Simulado] Mensagem gestor:', msg);
    }
}

// ===================================================================
// 8. Buscar fechamentos com filtros
// ===================================================================
export async function getSaleClosings(filters: {
    status?: string;
    propertyId?: string;
    limit?: number;
} = {}) {
    let query = supabase
        .from('sale_closings')
        .select(`
            *,
            imoveis(titulo, endereco, bairro, fotos, preco_venda),
            leads(nome, email, telefone)
        `)
        .order('created_at', { ascending: false })
        .limit(filters.limit || 50);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.propertyId) query = query.eq('property_id', filters.propertyId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

// ===================================================================
// 9. Atualizar status de fechamento
// ===================================================================
export async function updateClosingStatus(closingId: string, status: string, extra: Record<string, any> = {}) {
    const { error } = await supabase
        .from('sale_closings')
        .update({ status, ...extra })
        .eq('id', closingId);
    if (error) throw error;
}

// ===================================================================
// 10. Registrar notificação no histórico
// ===================================================================
async function logNotification(closingId: string, channel: string, direction: string, message: string) {
    try {
        await supabase.from('closing_notifications').insert({
            closing_id: closingId,
            channel,
            direction,
            message: message.substring(0, 1000), // trunca para não exceder limite
        });
    } catch (e) {
        // Silently fail notification logs
    }
}

// ===================================================================
// HELPERS
// ===================================================================
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatPaymentType(type: string): string {
    const map: Record<string, string> = {
        cash: 'À Vista',
        financing: 'Financiamento',
        fgts: 'FGTS',
        trade: 'Permuta',
        mixed: 'Misto',
    };
    return map[type] || type;
}
