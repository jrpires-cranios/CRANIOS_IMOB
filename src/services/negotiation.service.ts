import { supabase } from '../config/supabase.js';

interface NegociacaoData {
    imovelId: string;
    leadId: string;
    corretorId?: string;
    tipo: 'locacao' | 'venda';
    valorProposta: number;
}

export class NegotiationService {
    /**
     * Gera código único para negociação
     */
    private gerarCodigo(): string {
        const data = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `NEG-${data}-${random}`;
    }

    /**
     * Inicia nova negociação e BLOQUEIA o imóvel por 48h
     */
    async iniciarNegociacao(data: NegociacaoData) {
        const codigo = this.gerarCodigo();
        const bloqueioInicio = new Date();
        const bloqueioExpira = new Date(bloqueioInicio.getTime() + 48 * 60 * 60 * 1000); // 48h

        const { data: negociacao, error } = await supabase
            .from('negociacoes')
            .insert({
                codigo,
                imovel_id: data.imovelId,
                lead_id: data.leadId,
                corretor_id: data.corretorId,
                tipo: data.tipo,
                status: 'proposta',
                valor_proposta: data.valorProposta,
                bloqueio_inicio: bloqueioInicio.toISOString(),
                bloqueio_expira: bloqueioExpira.toISOString(),
                imovel_bloqueado: true
            })
            .select()
            .single();

        if (error) {
            console.error('[NegotiationService] Erro ao criar negociação:', error);
            throw new Error('Falha ao iniciar negociação');
        }

        console.log(`[NegotiationService] ✅ Negociação ${codigo} criada, imóvel bloqueado até ${bloqueioExpira.toISOString()}`);

        return negociacao;
    }

    /**
     * Verifica se imóvel está bloqueado
     */
    async isImovelBloqueado(imovelId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('negociacoes')
            .select('id, codigo, bloqueio_expira')
            .eq('imovel_id', imovelId)
            .eq('imovel_bloqueado', true)
            .gte('bloqueio_expira', new Date().toISOString())
            .single();

        if (error || !data) return false;

        console.log(`[NegotiationService] Imóvel ${imovelId} bloqueado pela negociação ${data.codigo}`);
        return true;
    }

    /**
     * Atualiza status da negociação
     */
    async atualizarStatus(negociacaoId: string, novoStatus: string, dados?: any) {
        const { data, error } = await supabase
            .from('negociacoes')
            .update({ status: novoStatus, ...dados })
            .eq('id', negociacaoId)
            .select()
            .single();

        if (error) {
            console.error('[NegotiationService] Erro ao atualizar status:', error);
            throw new Error('Falha ao atualizar status');
        }

        return data;
    }

    /**
     * Finaliza negociação e LIBERA o imóvel
     */
    async finalizarNegociacao(negociacaoId: string, statusFinal: 'concluido' | 'cancelado') {
        const { data, error } = await supabase
            .from('negociacoes')
            .update({
                status: statusFinal,
                imovel_bloqueado: false
            })
            .eq('id', negociacaoId)
            .select()
            .single();

        if (error) {
            console.error('[NegotiationService] Erro ao finalizar:', error);
            throw new Error('Falha ao finalizar negociação');
        }

        console.log(`[NegotiationService] ✅ Negociação ${data.codigo} finalizada como ${statusFinal}, imóvel liberado`);
        return data;
    }

    /**
     * Libera imóveis com bloqueio expirado (CRON JOB)
     */
    async liberarImoveisExpirados() {
        const { data, error } = await supabase
            .from('negociacoes')
            .update({ imovel_bloqueado: false, status: 'cancelado' })
            .eq('imovel_bloqueado', true)
            .lt('bloqueio_expira', new Date().toISOString())
            .select();

        if (error) {
            console.error('[NegotiationService] Erro ao liberar imóveis expirados:', error);
            return [];
        }

        if (data && data.length > 0) {
            console.log(`[NegotiationService] 🔓 Liberados ${data.length} imóveis com bloqueio expirado`);
        }

        return data;
    }

    /**
     * Busca negociação pelo código (para cliente mencionar no chat)
     */
    async buscarPorCodigo(codigo: string) {
        const { data, error } = await supabase
            .from('negociacoes')
            .select('*, leads(nome, whatsapp), imoveis(titulo, bairro)')
            .eq('codigo', codigo.toUpperCase())
            .single();

        if (error || !data) {
            return null;
        }

        return data;
    }

    /**
     * Adiciona dados de pagamento Asaas
     */
    async adicionarDadosAsaas(negociacaoId: string, dados: {
        asaas_customer_id?: string;
        asaas_subscription_id?: string;
        asaas_payment_id?: string;
        link_pagamento_caução?: string;
        link_pagamento_entrada?: string;
    }) {
        const { data, error } = await supabase
            .from('negociacoes')
            .update(dados)
            .eq('id', negociacaoId)
            .select()
            .single();

        if (error) {
            console.error('[NegotiationService] Erro ao adicionar dados Asaas:', error);
            throw new Error('Falha ao salvar dados de pagamento');
        }

        return data;
    }
}

export const negotiationService = new NegotiationService();
