"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversa = exports.getConversa = exports.getHistory = exports.sendMessage = void 0;
const chat_service_js_1 = require("../services/chat.service.js");
const error_middleware_js_1 = require("../middleware/error.middleware.js");
exports.sendMessage = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { sessionId, message, userData } = req.body;
    if (!sessionId || !message) {
        throw new error_middleware_js_1.HttpError('sessionId e message são obrigatórios', 400);
    }
    // Save user message
    await chat_service_js_1.chatService.saveMessage(sessionId, 'user', message);
    // Update user data if provided
    if (userData) {
        await chat_service_js_1.chatService.getOrCreateConversa(sessionId, userData);
    }
    // TODO: Integrate with AI agent for response
    // For now, return a simple acknowledgment
    const response = {
        success: true,
        data: {
            sessionId,
            message: 'Mensagem recebida. Processando...',
        },
    };
    res.json(response);
});
exports.getHistory = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const { limit } = req.query;
    if (!sessionId) {
        throw new error_middleware_js_1.HttpError('sessionId é obrigatório', 400);
    }
    const messages = await chat_service_js_1.chatService.getHistory(sessionId, Number(limit) || 50);
    res.json({ success: true, data: messages });
});
exports.getConversa = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) {
        throw new error_middleware_js_1.HttpError('sessionId é obrigatório', 400);
    }
    const result = await chat_service_js_1.chatService.getConversaWithMessages(sessionId);
    res.json({ success: true, data: result });
});
exports.deleteConversa = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    await chat_service_js_1.chatService.deleteConversa(sessionId);
    res.json({ success: true, message: 'Conversa removida' });
});
//# sourceMappingURL=chat.controller.js.map