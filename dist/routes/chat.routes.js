"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_js_1 = require("../controllers/chat.controller.js");
const router = (0, express_1.Router)();
// All chat routes are public (session-based)
router.post('/message', chat_controller_js_1.sendMessage);
router.get('/history/:sessionId', chat_controller_js_1.getHistory);
router.get('/conversa/:sessionId', chat_controller_js_1.getConversa);
router.delete('/conversa/:sessionId', chat_controller_js_1.deleteConversa);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map