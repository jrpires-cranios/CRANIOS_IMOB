import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

console.log(`[SessionService] INSTANTIATED. Key length: ${supabaseKey.length}`);
if (supabaseKey) {
    console.log(`[SessionService] Key prefix: ${supabaseKey.substring(0, 10)}...`);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('[SessionService] CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_KEY missing in ENV!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export class SessionGuardError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SessionGuardError';
    }
}

export class SessionService {
    /**
     * Registra uma nova sessão para o usuário, respeitando o limite do seu papel (role).
     * @param userId UUID do usuário
     * @param role 'gestor', 'corretor' ou 'admin'
     * @param ipAddress IP da requisição
     * @param deviceFingerprint Assinatura do dispositivo (User-Agent)
     */
    async registerSession(userId: string, role: string, ipAddress: string, deviceFingerprint: string): Promise<string> {
        // Enforce Limits
        const limitMap: Record<string, number> = {
            'gestor': 5, // Aumentado para homologação (Original: 2)
            'corretor': 1,
            'admin': 10
        };
        const maxSessions = limitMap[role] || 1;

        // Fetch current sessions
        const { data: currentSessions, error: fetchError } = await supabase
            .from('sessions_v2')
            .select('id, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }); // Oldest first

        if (fetchError) {
            console.error('[SessionService] Erro ao buscar sessões:', JSON.stringify(fetchError, null, 2));
            throw new Error('Erro ao gerenciar sessão ativa.');
        }

        // Se o número de sessões for >= limite, deleta as mais antigas
        if (currentSessions && currentSessions.length >= maxSessions) {
            const sessionsToDelete = currentSessions.length - maxSessions + 1; // +1 para abrir espaço p/ nova
            const idsToDelete = currentSessions.slice(0, sessionsToDelete).map(s => s.id);

            const { error } = await supabase
                .from('sessions_v2')
                .delete()
                .in('id', idsToDelete);

            console.log(`[SessionService] ${sessionsToDelete} sessões antigas removidas para o usuário ${userId}`);
        }

        // Generate strong session token
        const token = crypto.randomBytes(32).toString('hex');

        // Insert new session
        const { error: insertError } = await supabase
            .from('sessions_v2')
            .insert({
                user_id: userId,
                role: role,
                session_token: token,
                ip_address: ipAddress || 'unknown',
                device_fingerprint: deviceFingerprint || 'unknown'
            });

        if (insertError) {
            console.error('[SessionService] Erro na inserção da sessão:', insertError);
            throw new Error('Falha ao registrar sessão.');
        }

        return token;
    }

    /**
     * Valida se uma sessão existe e está ativa no banco, atualizando o last_active_at.
     */
    async validateSession(token: string): Promise<boolean> {
        if (!token) return false;

        const { data, error } = await supabase
            .from('sessions_v2')
            .select('id')
            .eq('session_token', token)
            .single();

        if (error || !data) {
            return false; // Sessão inválida ou foi derrubada
        }

        // Update heartbeat (Fire and forget, para n atrasar request)
        supabase.from('sessions_v2')
            .update({ last_active_at: new Date().toISOString() })
            .eq('session_token', token)
            .then();

        return true;
    }

    /**
     * Encerra (deleta) uma sessão ativa.
     */
    async invalidateSession(token: string): Promise<void> {
        await supabase
            .from('sessions_v2')
            .delete()
            .eq('session_token', token);
    }
}

export const sessionService = new SessionService();
