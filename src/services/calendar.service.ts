import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.CALCOM_API_KEY || '';
const BASE_URL = 'https://api.cal.com/v2';
const CAL_EVENT_TYPES_VERSION = '2024-06-14';
const CAL_SLOTS_VERSION = '2024-09-04';
const CAL_BOOKINGS_VERSION = '2026-02-25';

function calHeaders(apiKey: string, version: string, json = false): Record<string, string> {
    return {
        ...(json ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${apiKey}`,
        'cal-api-version': version,
    };
}

// ============================================================
// EVENT SLUGS CONFIGURADOS NO CAL.COM (ceo.cranios@gmail.com)
// ============================================================
export const CAL_EVENT_SLUGS = {
    AGENDA_CORRETOR: 'agenda-corretor',
    AGENDA_CONCIERGE: 'agenda-concierge',
    SERVICOS_REPAROS: 'servicos-e-reparos',
} as const;

// Mutable cache for event type IDs (populated via listEventTypes)
const calEventIds: Record<string, number> = {};

export type CalEventType = keyof typeof CAL_EVENT_SLUGS;

interface BookingParams {
    eventTypeId?: number;
    eventSlug?: string;
    apiKey?: string;
    start: string; // ISO Date
    name: string;
    email: string;
    notes?: string;
    location?: string;
    timeZone?: string;
    metadata?: Record<string, string>;
}

interface SlotResponse {
    [date: string]: Array<{ time: string }>;
}

export class CalendarService {
    private eventTypeCache: Record<string, number> = {};

    /**
     * Lista os tipos de evento disponíveis e faz cache dos IDs
     */
    async listEventTypes(): Promise<Array<{ id: number; slug: string; title: string; length: number }>> {
        if (!API_KEY) {
            console.warn('[CalendarService] CALCOM_API_KEY não configurada. Agenda usará horários simulados.');
            return [];
        }

        try {
            const response = await fetch(`${BASE_URL}/event-types`, {
                headers: calHeaders(API_KEY, CAL_EVENT_TYPES_VERSION),
            });
            if (!response.ok) {
                throw new Error(`Cal.com API error: ${response.status}`);
            }
            const data = await response.json() as any;
            const types: any[] = data.data || data.event_types || [];

            // Cache dos IDs por slug para usar em bookings
            for (const t of types) {
                this.eventTypeCache[t.slug] = t.id;
                calEventIds[t.slug] = t.id;
            }

            console.log('[CalendarService] ✅ Event types carregados:', types.map((t: any) => `${t.slug}(${t.id})`).join(', '));
            return types;
        } catch (error) {
            console.error('[CalendarService] Erro ao listar eventos:', error);
            return [];
        }
    }

    /**
     * Obtém o ID de um evento por slug (com cache)
     */
    private async getEventTypeId(slug: string): Promise<number | null> {
        if (this.eventTypeCache[slug]) {
            return this.eventTypeCache[slug];
        }
        await this.listEventTypes();
        return this.eventTypeCache[slug] || null;
    }

    /**
     * Verifica disponibilidade de slots para um evento
     * @param slugOrType - slug do evento ou CalEventType
     * @param date - data no formato YYYY-MM-DD
     * @param apiKeyOverride - API Key pessoal do corretor
     * @param eventTypeIdOverride - ID do evento configurado pelo corretor
     */
    async getAvailableSlots(slugOrType: string, date: string, apiKeyOverride?: string, eventTypeIdOverride?: number): Promise<string[]> {
        const slug = CAL_EVENT_SLUGS[slugOrType as CalEventType] || slugOrType;
        const eventTypeId = eventTypeIdOverride || await this.getEventTypeId(slug);
        const apiKey = apiKeyOverride || API_KEY;

        if (!apiKey) {
            console.warn('[CalendarService] API key ausente. Retornando slots simulados.');
            return this.mockSlots(date);
        }

        if (!eventTypeId) {
            console.warn('[CalendarService] Event type não encontrado para slug:', slug);
            return this.mockSlots(date);
        }

        const startTime = `${date}T00:00:00.000Z`;
        const endTime = `${date}T23:59:59.000Z`;

        try {
            const url = `${BASE_URL}/slots?eventTypeId=${eventTypeId}&start=${encodeURIComponent(startTime)}&end=${encodeURIComponent(endTime)}&timeZone=America/Sao_Paulo`;
            const response = await fetch(url, {
                headers: calHeaders(apiKey, CAL_SLOTS_VERSION),
            });

            if (!response.ok) {
                console.error('[CalendarService] Slots error:', response.status);
                return this.mockSlots(date);
            }

            const data = await response.json() as any;
            const slots: SlotResponse = data.data || data.slots || {};

            // Flatten todos os slots do dia em array de strings de hora
            const available: string[] = [];
            for (const daySlots of Object.values(slots)) {
                for (const slot of daySlots) {
                    const slotStart = (slot as any).start || (slot as any).time;
                    if (!slotStart) continue;
                    const hora = new Date(slotStart).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo',
                    });
                    available.push(hora);
                }
            }
            return available;

        } catch (error) {
            console.error('[CalendarService] Erro ao buscar slots:', error);
            return this.mockSlots(date);
        }
    }

    /**
     * Agenda uma visita com o corretor
     */
    async agendarVisitaCorretor(params: {
        nome: string;
        email: string;
        imovelId: string;
        imovelTitulo: string;
        data: string; // YYYY-MM-DD
        hora: string; // HH:MM
        observacoes?: string;
        brokerCalcomApiKey?: string;
        brokerCalcomEventTypeId?: number;
    }): Promise<{ success: boolean; bookingId?: number; bookingUrl?: string; error?: string }> {
        return this.criarBooking({
            eventSlug: 'agenda-corretor',
            eventTypeId: params.brokerCalcomEventTypeId,
            apiKey: params.brokerCalcomApiKey,
            name: params.nome,
            email: params.email,
            start: `${params.data}T${params.hora}:00-03:00`,
            timeZone: 'America/Sao_Paulo',
            notes: `Imóvel: ${params.imovelTitulo} (ID: ${params.imovelId})\n${params.observacoes || ''}`,
            metadata: { imovel_id: params.imovelId, imovel_titulo: params.imovelTitulo },
        });
    }

    /**
     * Agenda entrega de chaves (concierge)
     */
    async agendarConcierge(params: {
        nome: string;
        email: string;
        imovelId: string;
        imovelTitulo: string;
        data: string;
        hora: string;
        tipo: 'entrega' | 'devolucao';
        observacoes?: string;
    }): Promise<{ success: boolean; bookingId?: number; bookingUrl?: string; error?: string }> {
        return this.criarBooking({
            eventSlug: 'agenda-concierge',
            name: params.nome,
            email: params.email,
            start: `${params.data}T${params.hora}:00-03:00`,
            timeZone: 'America/Sao_Paulo',
            notes: `Imóvel: ${params.imovelTitulo} (ID: ${params.imovelId})\nTipo: ${params.tipo === 'entrega' ? 'Entrega de Chaves' : 'Devolução de Chaves'}\n${params.observacoes || ''}`,
            metadata: {
                imovel_id: params.imovelId,
                tipo_servico: params.tipo,
            },
        });
    }

    /**
     * Agenda serviço/reparo com prestador
     */
    async agendarServico(params: {
        nome: string;
        email: string;
        imovelId: string;
        imovelTitulo: string;
        tipoServico: string;
        data: string;
        hora: string;
        descricaoProblema?: string;
    }): Promise<{ success: boolean; bookingId?: number; bookingUrl?: string; error?: string }> {
        return this.criarBooking({
            eventSlug: 'servicos-e-reparos',
            name: params.nome,
            email: params.email,
            start: `${params.data}T${params.hora}:00-03:00`,
            timeZone: 'America/Sao_Paulo',
            notes: `Imóvel: ${params.imovelTitulo} (ID: ${params.imovelId})\nServiço: ${params.tipoServico}\n${params.descricaoProblema || ''}`,
            metadata: {
                imovel_id: params.imovelId,
                tipo_servico: params.tipoServico,
            },
        });
    }

    /**
     * Verifica se o imóvel já tem agendamento no horário (query no Supabase)
     */
    async verificarDisponibilidadeImovel(imovelId: string, data: string, hora: string): Promise<boolean> {
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
                process.env.SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY!
            );

            const dataHoraISO = `${data}T${hora}:00`;
            const { data: agendamentos, error } = await supabase
                .from('agendamentos_visitas')
                .select('id')
                .eq('imovel_id', imovelId)
                .eq('status', 'confirmado')
                .gte('data_visita', `${dataHoraISO}`)
                .lt('data_visita', `${data}T${hora.split(':')[0]}:59:00`);

            if (error) {
                console.warn('[CalendarService] Erro ao verificar disponibilidade:', error.message);
                return true; // Assume disponível em caso de erro
            }

            const disponivel = !agendamentos || agendamentos.length === 0;
            if (!disponivel) {
                console.log(`[CalendarService] Imóvel ${imovelId} já tem visita às ${hora} em ${data}`);
            }
            return disponivel;

        } catch (error) {
            console.error('[CalendarService] Erro ao consultar Supabase:', error);
            return true; // Assume disponível em caso de erro
        }
    }

    /**
     * Método central de criação de booking na Cal.com
     */
    private async criarBooking(params: BookingParams): Promise<{
        success: boolean;
        bookingId?: number;
        bookingUrl?: string;
        calBookingUid?: string;
        error?: string;
    }> {
        try {
            const slug = params.eventSlug;
            const eventTypeId = params.eventTypeId || (slug ? await this.getEventTypeId(slug) : null);
            const apiKey = params.apiKey || API_KEY;

            if (!apiKey) {
                return { success: false, error: 'CALCOM_API_KEY não configurada' };
            }

            if (!eventTypeId) {
                return { success: false, error: `Tipo de evento não encontrado: ${slug}` };
            }

            console.log(`[CalendarService] Criando booking: ${slug || eventTypeId} em ${params.start} para ${params.email} (key custom: ${!!params.apiKey})`);

            const startUtc = new Date(params.start).toISOString();
            const body = {
                eventTypeId,
                start: startUtc,
                attendee: {
                    name: params.name,
                    email: params.email,
                    timeZone: params.timeZone || 'America/Sao_Paulo',
                    language: 'pt',
                },
                bookingFieldsResponses: params.notes ? { notes: params.notes } : {},
                ...(params.location ? { location: { type: params.location } } : {}),
                metadata: params.metadata || {},
            };

            const response = await fetch(`${BASE_URL}/bookings`, {
                method: 'POST',
                headers: calHeaders(apiKey, CAL_BOOKINGS_VERSION, true),
                body: JSON.stringify(body),
            });


            const data = await response.json() as any;

            if (!response.ok) {
                console.error('[CalendarService] Erro ao criar booking:', data);
                return {
                    success: false,
                    error: data.message || `Erro ${response.status} ao criar agendamento`,
                };
            }

            const booking = data.data || data;
            console.log('[CalendarService] ✅ Booking criado:', booking.uid);

            return {
                success: true,
                bookingId: booking.id,
                calBookingUid: booking.uid,
                bookingUrl: `https://cal.com/booking/${booking.uid}`,
            };

        } catch (error: any) {
            console.error('[CalendarService] Erro ao criar booking:', error);
            return { success: false, error: 'Falha na integração com Cal.com' };
        }
    }

    /**
     * Cancela um booking existente
     */
    async cancelarBooking(bookingId: number, motivo?: string): Promise<boolean> {
        try {
            const response = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: calHeaders(API_KEY, CAL_BOOKINGS_VERSION, true),
                body: JSON.stringify({ cancellationReason: motivo || 'Cancelado pelo sistema' }),
            });
            return response.ok;
        } catch (error) {
            console.error('[CalendarService] Erro ao cancelar booking:', error);
            return false;
        }
    }

    /**
     * Slots simulados para fallback
     */
    private mockSlots(date: string): string[] {
        return ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    }
}

export const calendarService = new CalendarService();

// Inicializar e fazer cache dos event types ao iniciar o servidor
if (API_KEY) {
    calendarService.listEventTypes().catch(err => {
        console.warn('[CalendarService] Não foi possível carregar event types na inicialização:', err.message);
    });
}
