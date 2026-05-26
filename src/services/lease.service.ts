import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as financeiroService from './financeiro.service.js';
import * as comissaoService from './comissao.service.js';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// =======================================================
// TIPOS
// =======================================================
export interface LeaseCreateParams {
    propertyId: string;
    leadId: string;
    corretorId?: string;
    tenantId?: string;
    inquilinoNome: string;
    inquilinoCpf?: string;
    inquilinoEmail: string;
    inquilinoTelefone?: string;
    fiadorNome?: string;
    fiadorCpf?: string;
    fiadorEmail?: string;
    monthlyRent: number;
    caucaoValue?: number;
    startDate: string; // YYYY-MM-DD
    // Override opcional — se não informado, usa parâmetros herdados da view v_resolved_lease_params
    durationMonths?: number;
    billingType?: string; // 'BOLETO' | 'PIX' | 'CREDIT_CARD'
}

// =======================================================
// 1. Resolver parâmetros do contrato com herança (Imóvel → Tenant → Default)
// =======================================================
export async function resolveLeaseParams(propertyId: string) {
    const { data, error } = await supabase
        .from('v_resolved_lease_params')
        .select('*')
        .eq('property_id', propertyId)
        .single();

    if (error) {
        console.error('[LeaseService] Erro ao resolver parâmetros:', error);
        // Retorna defaults seguros do sistema
        return {
            lease_duration_months: 30,
            penalty_type: 'months_rent',
            penalty_value: 3,
            penalty_proportional: true,
            penalty_grace_months: 0,
            adjustment_index: 'igpm',
            notice_days_before: 30,
        };
    }
    return data;
}

// =======================================================
// 2. Criar Cliente no Asaas
// =======================================================
async function createAsaasCustomer(nome: string, email: string, cpf?: string, telefone?: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    const asaasKey = isProduction ? process.env.ASAAS_API_KEY : (process.env.ASAAS_SANDBOX || process.env.ASAAS_SANBOX);
    const asaasBase = isProduction ? 'https://www.asaas.com/api/v3' : 'https://sandbox.asaas.com/api/v3';
    if (!asaasKey) {
        console.log('[Asaas (Simulado)] Cliente criado:', email);
        return 'cus_simulated_' + Math.random().toString(36).substr(2, 9);
    }

    try {
        const res = await axios.post(`${asaasBase}/customers`, {
            name: nome,
            email,
            cpfCnpj: cpf?.replace(/\D/g, '') || undefined,
            mobilePhone: telefone?.replace(/\D/g, '') || undefined,
        }, {
            headers: { 'access_token': asaasKey }
        });
        return res.data.id;
    } catch (e: any) {
        console.error('[Asaas Customer Error]', e?.response?.data || e.message);
        return null;
    }
}

// =======================================================
// 3. Criar Cobrança de Caução (Pix ou Boleto)
// =======================================================
async function createCaucaoCharge(customerId: string, value: number, billingType: string = 'PIX') {
    const isProduction = process.env.NODE_ENV === 'production';
    const asaasKey = isProduction ? process.env.ASAAS_API_KEY : (process.env.ASAAS_SANDBOX || process.env.ASAAS_SANBOX);
    const asaasBase = isProduction ? 'https://www.asaas.com/api/v3' : 'https://sandbox.asaas.com/api/v3';
    if (!asaasKey) {
        console.log(`[Asaas (Simulado)] Cobrança de caução R$ ${value} gerada.`);
        return 'pay_simulated_caucao_' + Math.random().toString(36).substr(2, 9);
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 dias para pagar o caução

    try {
        const res = await axios.post(`${asaasBase}/payments`, {
            customer: customerId,
            billingType,
            value,
            dueDate: dueDate.toISOString().split('T')[0],
            description: 'Caução — Contrato de Locação',
        }, {
            headers: { 'access_token': asaasKey }
        });
        return res.data.id;
    } catch (e: any) {
        console.error('[Asaas Caucao Error]', e?.response?.data || e.message);
        return null;
    }
}

// =======================================================
// 4. Criar Assinatura Recorrente DINÂMICA (duração configurável)
// =======================================================
async function createLeaseRecurringSubscription(
    customerId: string,
    monthlyRent: number,
    durationMonths: number,
    billingType: string = 'BOLETO',
    startDate: string
) {
    const isProduction = process.env.NODE_ENV === 'production';
    const asaasKey = isProduction ? process.env.ASAAS_API_KEY : (process.env.ASAAS_SANDBOX || process.env.ASAAS_SANBOX);
    const asaasBase = isProduction ? 'https://www.asaas.com/api/v3' : 'https://sandbox.asaas.com/api/v3';
    if (!asaasKey) {
        console.log(`[Asaas (Simulado)] Assinatura de ${durationMonths} meses criada. Valor: R$ ${monthlyRent}/mês.`);
        return 'sub_simulated_' + Math.random().toString(36).substr(2, 9);
    }

    // Data do primeiro vencimento (1 mês após início)
    const firstDue = new Date(startDate);
    firstDue.setMonth(firstDue.getMonth() + 1);

    try {
        const res = await axios.post(`${asaasBase}/subscriptions`, {
            customer: customerId,
            billingType,
            value: monthlyRent,
            nextDueDate: firstDue.toISOString().split('T')[0],
            cycle: 'MONTHLY',
            maxPayments: durationMonths,   // ← Dinâmico: 12, 24, 30 meses conforme contrato
            description: `Aluguel Mensal — Contrato de Locação (${durationMonths} meses)`,
            fine: { value: 2 },            // 2% de multa por atraso
            interest: { value: 1 },        // 1% ao mês de juros
        }, {
            headers: { 'access_token': asaasKey }
        });
        return res.data.id;
    } catch (e: any) {
        console.error('[Asaas Subscription Error]', e?.response?.data || e.message);
        return null;
    }
}

// =======================================================
// 5. Gerar Contrato de Locação via Assinafy
// =======================================================
async function generateLeaseContract(params: {
    inquilinoNome: string;
    inquilinoEmail: string;
    fiadorNome?: string;
    fiadorEmail?: string;
    propertyTitulo: string;
    monthlyRent: number;
    durationMonths: number;
    startDate: string;
    endDate: string;
    adjustmentIndex: string;
    penaltyInfo: string;
}) {
    if (!process.env.ASSINAFY_EMAIL) {
        console.log('[Assinafy (Simulado)] Contrato de locação gerado e enviado para assinatura.');
        return 'doc_simulated_' + Math.random().toString(36).substr(2, 9);
    }

    try {
        const loginRes = await axios.post('https://api.assinafy.com.br/login', {
            email: process.env.ASSINAFY_EMAIL,
            password: process.env.ASSINAFY_PASSWORD
        });
        const token = loginRes.data.token;

        const FormData = require('form-data');
        const form = new FormData();

        // Template do contrato com variáveis preenchidas
        const contractText = `CONTRATO DE LOCAÇÃO RESIDENCIAL\n\nLocatário: ${params.inquilinoNome}\nImóvel: ${params.propertyTitulo}\nValor Mensal: R$ ${params.monthlyRent.toFixed(2)}\nDuração: ${params.durationMonths} meses\nInício: ${params.startDate} | Término: ${params.endDate}\nReajuste: Anual pelo ${params.adjustmentIndex.toUpperCase()}\n${params.penaltyInfo}`;
        const mockPdfBuffer = Buffer.from(contractText);

        form.append('file', mockPdfBuffer, { filename: `contrato_locacao_${params.inquilinoNome.replace(/\s/g, '_')}.pdf` });
        form.append('name', `Contrato de Locação — ${params.propertyTitulo}`);

        const signers: any[] = [
            { email: params.inquilinoEmail, name: params.inquilinoNome, role: 'sign' },
            { email: process.env.RESEND_FROM?.split('<')[1]?.replace('>', '') || 'contrato@cranios.pro', name: 'Imobiliária', role: 'sign' }
        ];
        if (params.fiadorEmail && params.fiadorNome) {
            signers.push({ email: params.fiadorEmail, name: params.fiadorNome, role: 'sign' });
        }
        form.append('signers', JSON.stringify(signers));

        const docRes = await axios.post('https://api.assinafy.com.br/documents', form, {
            headers: { 'Authorization': `Bearer ${token}`, ...form.getHeaders() }
        });
        return docRes.data?.id || docRes.data?.document_id;
    } catch (e: any) {
        console.error('[Assinafy Lease Error]', e?.response?.data || e.message);
        return null;
    }
}

// =======================================================
// 6. ORQUESTRADOR PRINCIPAL — Criar contrato completo de locação
// =======================================================
export async function createCompleteLease(params: LeaseCreateParams): Promise<{
    success: boolean;
    leaseId?: string;
    asaasSubscriptionId?: string;
    assinafyDocumentId?: string;
    error?: string;
}> {
    try {
        // 1. Resolve parâmetros com herança
        const resolved = await resolveLeaseParams(params.propertyId);
        const durationMonths = params.durationMonths || resolved.lease_duration_months || 30;
        const caucaoValue = params.caucaoValue || (params.monthlyRent * 2); // 2x aluguel default

        // 2. Calcula datas
        const startDate = new Date(params.startDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // 3. Cria cliente no Asaas
        const asaasCustomerId = await createAsaasCustomer(
            params.inquilinoNome,
            params.inquilinoEmail,
            params.inquilinoCpf,
            params.inquilinoTelefone
        );

        // 4. Caução (Pix)
        if (caucaoValue > 0 && asaasCustomerId) {
            await createCaucaoCharge(asaasCustomerId, caucaoValue, 'PIX');
        }

        // 5. Assinatura recorrente (duração dinâmica do contrato)
        const subscriptionId = asaasCustomerId
            ? await createLeaseRecurringSubscription(
                asaasCustomerId,
                params.monthlyRent,
                durationMonths,
                params.billingType || 'BOLETO',
                params.startDate
            )
            : 'sub_simulated';

        // 6. Calcula penalidade para o contrato
        const penaltyInfo = resolved.penalty_type === 'months_rent'
            ? `Multa por saída antecipada: ${resolved.penalty_value} aluguel(eis). ${resolved.penalty_proportional ? 'Proporcional ao período restante.' : ''}`
            : `Multa por saída antecipada: ${resolved.penalty_value}% do valor total do contrato.`;

        // 7. Busca dados do imóvel para o contrato
        const { data: imovel } = await supabase.from('imoveis').select('titulo').eq('id', params.propertyId).single();

        // 8. Gera contrato Assinafy
        const assinafyDocId = await generateLeaseContract({
            inquilinoNome: params.inquilinoNome,
            inquilinoEmail: params.inquilinoEmail,
            fiadorNome: params.fiadorNome,
            fiadorEmail: params.fiadorEmail,
            propertyTitulo: imovel?.titulo || 'Imóvel',
            monthlyRent: params.monthlyRent,
            durationMonths,
            startDate: params.startDate,
            endDate: endDate.toISOString().split('T')[0],
            adjustmentIndex: resolved.adjustment_index || 'igpm',
            penaltyInfo,
        });

        // 9. Persiste o contrato na tabela leases (trigger gera os avisos de reajuste automaticamente)
        const { data: lease, error: leaseError } = await supabase.from('leases').insert({
            tenant_id: params.tenantId,
            property_id: params.propertyId,
            lead_id: params.leadId,
            inquilino_nome: params.inquilinoNome,
            inquilino_cpf: params.inquilinoCpf,
            inquilino_email: params.inquilinoEmail,
            inquilino_telefone: params.inquilinoTelefone,
            fiador_nome: params.fiadorNome,
            fiador_cpf: params.fiadorCpf,
            fiador_email: params.fiadorEmail,
            monthly_rent: params.monthlyRent,
            caucao_value: caucaoValue,
            start_date: params.startDate,
            end_date: endDate.toISOString().split('T')[0],
            duration_months: durationMonths,
            // Parâmetros resolvidos (snapshot para o contrato)
            resolved_adjustment_index: resolved.adjustment_index || 'igpm',
            resolved_penalty_type: resolved.penalty_type || 'months_rent',
            resolved_penalty_value: resolved.penalty_value || 3,
            resolved_penalty_proportional: resolved.penalty_proportional ?? true,
            resolved_penalty_grace_months: resolved.penalty_grace_months || 0,
            resolved_notice_days: resolved.notice_days_before || 30,
            status: 'active',
            asaas_subscription_id: subscriptionId,
            assinafy_document_id: assinafyDocId,
        }).select().single();

        if (leaseError) {
            console.error('[LeaseService] Erro ao inserir lease:', leaseError);
            return { success: false, error: leaseError.message };
        }

        // 10. Atualiza o lead com status de locação ativa
        await supabase.from('leads').update({
            operacao_status: 'aluguel_ativo',
            asaas_customer_id: asaasCustomerId,
            assinafy_document_id: assinafyDocId,
        }).eq('id', params.leadId);

        console.log(`[LeaseService] ✅ Contrato criado! ID: ${lease.id} | Duração: ${durationMonths}m | Assinatura: ${subscriptionId}`);

        // 11. GERA RECORRÊNCIA FINANCEIRA (M2)
        try {
            const { data: imovelERP } = await supabase
                .from('imoveis')
                .select('proprietario_id, taxa_administracao_pct, valor_seguro_incendio, valor_taxa_lixo')
                .eq('id', params.propertyId)
                .single();

            if (imovelERP && imovelERP.proprietario_id) {
                await financeiroService.gerarRecorrenciaContrato(
                    params.tenantId || 'rbhkwmesmvytqdfuwcie',
                    lease.id,
                    {
                        imovel_id: params.propertyId,
                        proprietario_id: imovelERP.proprietario_id,
                        data_inicio: params.startDate,
                        meses: durationMonths,
                        valor_aluguel: params.monthlyRent,
                        valor_iptu: (resolved as any).valor_iptu || 0, // Fallback do parâmetro resolvido
                        valor_seguro: Number(imovelERP.valor_seguro_incendio) || 0,
                        valor_taxa_lixo: Number(imovelERP.valor_taxa_lixo) || 0,
                        taxa_adm_pct: Number(imovelERP.taxa_administracao_pct) || 0
                    }
                );
                console.log(`[LeaseService] 💰 Recorrência financeira gerada para ${durationMonths} meses.`);
            }
        } catch (efin) {
            console.error('[LeaseService] Erro ao gerar financeiro:', efin);
            // Não bloqueia o contrato se o financeiro falhar, apenas loga
        }

        // 12. GERA COMISSÃO DE INTERMEDIAÇÃO (M3)
        try {
            // Busca o corretor vinculado ao lead se não enviado
            let finalCorretorId = params.corretorId;
            if (!finalCorretorId && params.leadId) {
                const { data: lead } = await supabase.from('leads').select('corretor_id').eq('id', params.leadId).single();
                finalCorretorId = lead?.corretor_id;
            }

            if (finalCorretorId) {
                await comissaoService.processarComissaoLocacaoIntermediacao(lease, finalCorretorId);
                console.log(`[LeaseService] 🎖️ Comissão de intermediação gerada para o corretor ${finalCorretorId}.`);
            }
        } catch (ecom) {
            console.error('[LeaseService] Erro ao gerar comissão:', ecom);
        }

        return {
            success: true,
            leaseId: lease.id,
            asaasSubscriptionId: subscriptionId,
            assinafyDocumentId: assinafyDocId,
        };

    } catch (e: any) {
        console.error('[LeaseService] Erro crítico:', e);
        return { success: false, error: e.message };
    }
}

// =======================================================
// 7. Buscar índice financeiro mais recente (para avisos de reajuste)
// =======================================================
export async function getLatestIndex(indexType: 'igpm' | 'ipca' | 'inpc'): Promise<number> {
    const { data } = await supabase
        .from('financial_indices')
        .select('variation_pct')
        .eq('index_type', indexType)
        .order('reference_month', { ascending: false })
        .limit(1)
        .single();

    return data?.variation_pct || 4.5; // fallback de 4.5% caso sem dados
}

// =======================================================
// 8. Sincronizar índices financeiros (IBGE/FGV) — chamado mensalmente
// =======================================================
export async function syncFinancialIndices() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const yyyymm = `${lastMonth.getFullYear()}${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const firstDay = `${lastMonth.toISOString().split('T')[0].substr(0, 7)}-01`;

    console.log(`[FinancialIndices] Sincronizando índices do mês ${yyyymm}...`);

    const results: { index_type: string; variation_pct: number; reference_month: string }[] = [];

    // IPCA — API IBGE (gratuita, sem auth)
    try {
        const res = await axios.get(
            `https://servicodados.ibge.gov.br/api/v3/agregados/7060/periodos/${yyyymm}/variaveis/2266?localidades=N1[all]`,
            { timeout: 10000 }
        );
        const valor = res.data?.[0]?.resultados?.[0]?.series?.[0]?.serie?.[yyyymm];
        if (valor) {
            results.push({ index_type: 'ipca', variation_pct: parseFloat(valor), reference_month: firstDay });
            console.log(`[FinancialIndices] IPCA ${yyyymm}: ${valor}%`);
        }
    } catch (e) {
        console.warn('[FinancialIndices] Erro ao buscar IPCA:', (e as any).message);
    }

    // INPC — API IBGE (código 7063)
    try {
        const res = await axios.get(
            `https://servicodados.ibge.gov.br/api/v3/agregados/7063/periodos/${yyyymm}/variaveis/2289?localidades=N1[all]`,
            { timeout: 10000 }
        );
        const valor = res.data?.[0]?.resultados?.[0]?.series?.[0]?.serie?.[yyyymm];
        if (valor) {
            results.push({ index_type: 'inpc', variation_pct: parseFloat(valor), reference_month: firstDay });
            console.log(`[FinancialIndices] INPC ${yyyymm}: ${valor}%`);
        }
    } catch (e) {
        console.warn('[FinancialIndices] Erro ao buscar INPC:', (e as any).message);
    }

    // IGP-M — Fallback simulado (real: requer API key do Cálculo Jurídico)
    // Em prod: POST https://indices.calculojuridico.com.br/v1/index com { index_kind: 'igpm', ... }
    const igpmSimulado = 0.32 + Math.random() * 0.5;
    results.push({ index_type: 'igpm', variation_pct: parseFloat(igpmSimulado.toFixed(4)), reference_month: firstDay });
    console.log(`[FinancialIndices] IGP-M ${yyyymm}: ${igpmSimulado.toFixed(4)}% (simulado)`);

    // Salva no banco (upsert)
    if (results.length > 0) {
        const { error } = await supabase
            .from('financial_indices')
            .upsert(results, { onConflict: 'index_type,reference_month' });
        if (error) console.error('[FinancialIndices] Erro no upsert:', error);
        else console.log(`[FinancialIndices] ${results.length} índices salvos no banco.`);
    }

    return results;
}
