"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_js_1 = __importDefault(require("./auth.routes.js"));
const imoveis_routes_js_1 = __importDefault(require("./imoveis.routes.js"));
const leads_routes_js_1 = __importDefault(require("./leads.routes.js"));
const chat_routes_js_1 = __importDefault(require("./chat.routes.js"));
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
    });
});
// API info endpoint
router.get('/', (_req, res) => {
    res.json({
        name: 'Crânios IMOB API',
        version: '1.0.0',
        description: 'Backend API for multi-tenant real estate SaaS',
        endpoints: {
            auth: '/api/auth',
            imoveis: '/api/imoveis',
            leads: '/api/leads',
            chat: '/api/chat',
            health: '/api/health',
        },
    });
});
// Mount route modules
router.use('/auth', auth_routes_js_1.default);
router.use('/imoveis', imoveis_routes_js_1.default);
router.use('/leads', leads_routes_js_1.default);
router.use('/chat', chat_routes_js_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map