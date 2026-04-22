import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const MASTER_KEY_HASH = process.env.MASTER_KEY_HASH || '$2b$10$EpI3.o4B7f3G2eK4wL2w0u5g9hR7k9lP3rT4yQ8fX1vC5cN7mU6eO'; // Fallback hash for demo (password: CraniosMaster!)
const JWT_SECRET = process.env.JWT_SECRET || 'cranios-super-secret-master-key-2026';

export class MasterAccessService {

    /**
     * Valida a senha mestre provida pelo Super Admin.
     */
    async authenticateMaster(password: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, MASTER_KEY_HASH);
        } catch (error) {
            console.error('[MasterAccess] Erro ao validar bcrypt:', error);
            return false;
        }
    }

    /**
     * Gera um Token JWT temporário com permissões de 'IMPERSONATION'
     */
    generateImpersonationToken(adminId: string, targetTenantId: string, targetUserId?: string): string {
        const payload = {
            admin_id: adminId,
            target_tenant_id: targetTenantId,
            ...(targetUserId && { target_user_id: targetUserId }),
            scope: 'IMPERSONATION'
        };

        // Token de curta duração para segurança (ex: 2 horas)
        return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
    }

    /**
     * Registra o evento de impersonation na trilha de auditoria.
     */
    async logAccess(adminId: string, targetTenantId: string, action: string, ipAddress: string, targetUserId?: string): Promise<void> {
        const { error } = await supabase
            .from('master_access_log')
            .insert({
                admin_id: adminId,
                target_tenant_id: targetTenantId,
                target_user_id: targetUserId || null,
                action: action,
                ip_address: ipAddress
            });

        if (error) {
            console.error('[MasterAccess] Ocorreu um erro ao gravar trilha de auditoria:', error);
            // Em sistemas críticos, falhas de log de segurança podem até impedir o acesso.
            // Aqui vamos apenas reportar.
        }
    }

    /**
     * Valida o token de impersonation enviado num request.
     */
    verifyImpersonationToken(token: string): any {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            if (decoded.scope !== 'IMPERSONATION') {
                throw new Error('Invalid token scope');
            }
            return decoded;
        } catch (error) {
            return null;
        }
    }
}

export const masterAccessService = new MasterAccessService();
