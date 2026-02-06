"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const auth_service_js_1 = require("../services/auth.service.js");
const error_middleware_js_1 = require("../middleware/error.middleware.js");
exports.register = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { email, password, nome } = req.body;
    if (!email || !password || !nome) {
        throw new error_middleware_js_1.HttpError('Email, senha e nome são obrigatórios', 400);
    }
    try {
        const result = await auth_service_js_1.authService.register(email, password, nome);
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        if (error instanceof Error) {
            throw new error_middleware_js_1.HttpError(error.message, 400);
        }
        throw error;
    }
});
exports.login = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new error_middleware_js_1.HttpError('Email e senha são obrigatórios', 400);
    }
    try {
        const result = await auth_service_js_1.authService.login(email, password);
        res.json({ success: true, data: result });
    }
    catch (error) {
        if (error instanceof Error) {
            throw new error_middleware_js_1.HttpError(error.message, 401);
        }
        throw error;
    }
});
exports.getProfile = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new error_middleware_js_1.HttpError('Não autenticado', 401);
    }
    const profile = await auth_service_js_1.authService.getProfile(req.user.userId);
    res.json({ success: true, data: profile });
});
//# sourceMappingURL=auth.controller.js.map