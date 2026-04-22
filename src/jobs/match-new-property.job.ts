import { supabase } from '../config/supabase.js';
import { calculateMatchScore } from '../services/match-score.service.js';
import { pdfGeneratorService } from '../services/pdf-generator.service.js';
import { r2StorageService } from '../services/r2-storage.service.js';
import { LeadMemoryService } from '../services/lead-memory.service.js';

/**
 * Disparado sempre que um novo imóvel é cadastrado.
 * Busca os leads interessados e tenta mandar uma mensagem passiva.
 */
export async function matchNewProperty(imovelId: string, tenantId: string = 'DEFAULT_TENANT') {
    try {
        console.log(`[ProactiveAlert] Iniciando job para o novo imóvel ${imovelId}`);

        // 1. Pega dados completos do Imóvel
        const { data: imovel } = await supabase.from('imoveis').select('*').eq('id', imovelId).single();
        if (!imovel) return;

        // 2. Busca Leads Compatíveis nos últimos 90 dias com Telefone WhatsApp
        const limitDate = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();

        const { data: leads } = await supabase.from('lead_memory')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
            .not('phone', 'is', null) // Têm número
            .gte('last_interaction_at', limitDate);

        if (!leads || leads.length === 0) {
            console.log(`[ProactiveAlert] Nenhum lead apto para receber este imóvel.`);
            return;
        }

        // 3. Filtrar e Calcular Scores
        const threshold = 60; // Só enviamos pra quem tem 60% ou mais de match
        const toNotify = [];

        for (const lead of leads) {
            const imovelCompat: any = {
                tipo: imovel.tipo || 'casa',
                finalidade: imovel.finalidade,
                bairro: imovel.bairro,
                preco: (imovel.finalidade === 'venda' ? imovel.preco_venda : imovel.preco_locacao) || 0,
                quartos: imovel.quartos
            };
            const matchScore = calculateMatchScore(imovelCompat, lead);
            if (matchScore.score >= threshold) {
                toNotify.push({ lead, matchScore });
            }
        }

        console.log(`[ProactiveAlert] ${toNotify.length} leads qualificados acima de ${threshold}%`);

        // 4. Enviar Msg para cada Lead
        for (const item of toNotify) {
            await sendPropertyAlert(item.lead, imovel, item.matchScore, tenantId);
        }

    } catch (e) {
        console.error('[ProactiveAlert] Erro grave:', e);
    }
}

async function sendPropertyAlert(lead: any, imovel: any, matchScore: any, tenantId: string) {
    try {
        // Checa se JÁ ENVIAMOS esse imóvel pra esse peão (evita duplo spam)
        const { data: existing } = await supabase.from('property_alerts_log')
            .select('id').eq('lead_id', lead.id).eq('imovel_id', imovel.id).single();

        if (existing) return;

        // Tenta gerar/pegar o link do dossiê
        let dossieUrl = null;
        try {
            dossieUrl = await pdfGeneratorService.obterOuGerarPDF(imovel.id, { nome: 'Crânios IMOB' }, r2StorageService, lead.identifier);
        } catch (e) { }

        const primeiroNome = lead.name?.split(' ')[0] ?? 'Olá';
        const operacaoLabel = imovel.finalidade === 'locacao' ? 'para alugar' : 'à venda';
        const precoNum = imovel.finalidade === 'venda' ? imovel.preco_venda : imovel.preco_locacao;
        const precoFormatado = Number(precoNum || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const message = `🏡 *${primeiroNome}, encontramos algo para você!*\n\nAcabou de entrar um imóvel que combina muito com o que você conversou com a gente há poucos dias:\n\n📍 *${imovel.titulo}*\n${imovel.bairro} · ${imovel.quartos > 0 ? imovel.quartos + ' quartos · ' : ''}${imovel.area_construida || imovel.area_total || 0}m²\n${precoFormatado} ${operacaoLabel}\n\n📊 *Compatibilidade com o seu perfil: ${matchScore.percentage}*\n\nQuer ver as fotos e o Dossiê completo?\nResponda SIM aqui ou acesse:\n🔗 ${dossieUrl || 'Solicite abaixo :)'}\n\n— *Crânios IMOB*`;

        console.log(`\n>>>>>>>> MENSAGEM WHATSAPP ENVIADA (SIMULADO) PARA ${lead.phone}:\n${message}\n`);

        // EM PRODUCAO: Aqui entraria uma chamada real via Meta API, Twilio, ZAPI, Evolution.
        // await wppService.sendText(lead.phone, message);

        // Registrar Log no Banco de Dados pra ele não receber de novo
        await supabase.from('property_alerts_log').insert({
            tenant_id: tenantId,
            lead_id: lead.id,
            imovel_id: imovel.id,
            channel: 'whatsapp',
            match_score: matchScore.score
        });

    } catch (err) {
        console.error(`[ProactiveAlert] Erro ao enviar pro lead ${lead.id}`, err);
    }
}
