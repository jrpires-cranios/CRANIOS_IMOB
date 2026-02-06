"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = exports.asyncHandler = exports.notFoundMiddleware = exports.errorMiddleware = void 0;
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ level: process.env.LOG_LEVEL || 'info' });
const errorMiddleware = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Erro interno do servidor';
    logger.error({
        err,
        method: req.method,
        url: req.url,
        statusCode,
    });
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorMiddleware = errorMiddleware;
const notFoundMiddleware = (req, res, _next) => {
    res.status(404).json({
        success: false,
        error: `Rota não encontrada: ${req.method} ${req.url}`,
    });
};
exports.notFoundMiddleware = notFoundMiddleware;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
class HttpError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.HttpError = HttpError;
//# sourceMappingURL=error.middleware.js.map