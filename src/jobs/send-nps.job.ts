import { supabase } from '../config/supabase.js';

/**
 * Job para enviar pesquisa de NPS 48 horas após uma visita agendada/reservada.
 */
export async function sendNpsSurveys(tenantId: string = 'DEFAULT_TENANT') {
    try {
        console.log(`[AutoNPS] Iniciando varredura para NPS...`);

        // Simulando que 'reservations' guarda o histórico de reservas / visitas. 
        // Vamos varrer reservas com status ativo que ocorreram ~48h atrás.
        const limitStart = new Date(Date.now() - 50 * 3600 * 1000).toISOString();
        const limitEnd = new Date(Date.now() - 46 * 3600 * 1000).toISOString();

        const { data: reservas } = await supabase.from('reservations')
            .select('id, imovel_id, user_email, created_at')
            .gte('created_at', limitStart)
            .lte('created_at', limitEnd);

        if (!reservas || reservas.length === 0) {
            console.log(`[AutoNPS] Nenhuma visita completou 48h hoje.`);
            return;
        }

        console.log(`[AutoNPS] Encontramos ${reservas.length} visitas elegíveis para NPS.`);

        for (const res of reservas) {
            // Verifica se o lead existe. Na versão real seria cruzamento com user_email = lead.identifier
            const { data: lead } = await supabase.from('lead_memory').select('id, name, phone').eq('identifier', res.user_email).single();
            if (!lead || !lead.phone) continue;

            const { data: imovel } = await supabase.from('imoveis').select('titulo').eq('id', res.imovel_id).single();
            const imovelNome = imovel?.titulo || 'Imóvel';

            // Checa se já disparamos
            const { data: npsSent } = await supabase.from('nps_responses')
                .select('id').eq('reservation_id', res.id).single();

            if (npsSent) continue;

            const name = lead.name?.split(' ')[0] || 'Olá';
            const msg = `Nossa IA não para de trabalhar por você! 🚀\n\n${name}, faz 48h que você manifestou interesse / visitou o ${imovelNome}.\n\nPara nos ajudar a melhorar o nível das nossas Inteligências Artificiais e dos nossos Agentes, de 0 a 10, que nota você dá para o atendimento da nossa equipe?\n\n(Basta responder com o número!)`;

            console.log(`\n>>>>>>>> MENSAGEM WHATSAPP ENVIADA (SIMULADO - NPS) PARA ${lead.phone}:\n${msg}\n`);

            // EM PRODUÇÃO: chamada à API do WhatsApp 
            // await wppService.sendText(lead.phone, msg);

            // Grava na tabela com status PENDING (Aguardando resposta da nota)
            await supabase.from('nps_responses').insert({
                tenant_id: tenantId,
                lead_id: lead.id,
                imovel_id: res.imovel_id,
                reservation_id: res.id,
                status: 'pending'
            });
        }
    } catch (e) {
        console.error('[AutoNPS] Erro no Job:', e);
    }
}
