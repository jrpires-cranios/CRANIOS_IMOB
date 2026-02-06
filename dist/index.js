"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const index_js_1 = __importDefault(require("./routes/index.js"));
const error_middleware_js_1 = require("./middleware/error.middleware.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)());
// CORS
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
app.use((0, cors_1.default)({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        success: false,
        error: 'Muitas requisões. Tente novamente mais tarde.',
    },
});
app.use('/api', limiter);
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// API Routes
app.use('/api', index_js_1.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Crânios IMOB API',
        version: '1.0.0',
        status: 'running',
        docs: '/api/health',
    });
});
// Error handling
app.use(error_middleware_js_1.notFoundMiddleware);
app.use(error_middleware_js_1.errorMiddleware);
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
exports.default = app;
//# sourceMappingURL=index.js.map