import { Request, Response, NextFunction } from 'express';
import type { AuthPayload } from '../types/index.js';
export interface AuthRequest extends Request {
    user?: AuthPayload;
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const optionalAuthMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const adminMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map