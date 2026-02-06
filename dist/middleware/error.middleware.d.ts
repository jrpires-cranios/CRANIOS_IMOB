import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export declare const errorMiddleware: (err: AppError, req: Request, res: Response, _next: NextFunction) => void;
export declare const notFoundMiddleware: (req: Request, res: Response, _next: NextFunction) => void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => void;
export declare class HttpError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
//# sourceMappingURL=error.middleware.d.ts.map