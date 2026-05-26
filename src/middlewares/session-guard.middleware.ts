import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/session.service';

/**
 * Middleware de Sessão Única Anti-Compartilhamento.
 * Intercepta requests sensíveis para certificar-se de que a sessão
 * não foi derrubada por outro login (Corretor: 1 Sessão, Gestor: 2 Sessões).
 */
export const sessionGuard = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        // Ignora endpoints não-autenticados ou públicos
        const publicPaths = [
            '/webhooks',
            '/imoveis',
            '/health',
            '/auth',
            '/tickets',
            '/sales/landing-lead',
            '/sales/checkout',
            '/sales/cecilia-chat',
            '/onboarding/submit',
            '/onboarding/secure-keys',
            '/secure/checkout',
        ];
        if (publicPaths.some(p => req.path.startsWith(p))) {
            return next();
        }

        const sessionToken = req.headers['x-session-token'] as string;

        // Se o frontend ainda não está mandando (demo anterior), podemos ignorar em rotas que não são críticas
        // Mas se é uma rota crítica (manager/corretores, etc) e implementamos Sessão Única, será obrigatório.
        if (!sessionToken) {
            // No modo de transição, podemos emitir apenas um WARNING se não quisermos quebrar áreas inacabadas
            // Porém, para a funcionalidade de Bloqueio, enviaremos 401.
            return res.status(401).json({
                success: false,
                code: 'NO_SESSION_PROVIDED',
                message: 'Token de Sessão Ausente. Acesso negado para proteção Anti-Compartilhamento.'
            });
        }

        const isValid = await sessionService.validateSession(sessionToken);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                code: 'SESSION_INVALIDATED',
                message: 'Sua conta foi acessada em outro dispositivo. Esta sessão foi encerrada por segurança.'
            });
        }

        next();
    } catch (error) {
        console.error('[SessionGuard] Erro fatal na validação de sessão:', error);
        return res.status(500).json({ success: false, message: 'Erro na validação de Sessão Única' });
    }
};
