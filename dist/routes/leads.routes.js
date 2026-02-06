"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leads_controller_js_1 = require("../controllers/leads.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Public route - create lead (from contact form)
router.post('/', leads_controller_js_1.createLead);
// Protected routes
router.get('/', auth_middleware_js_1.authMiddleware, leads_controller_js_1.getAllLeads);
router.get('/stats', auth_middleware_js_1.authMiddleware, leads_controller_js_1.getLeadStats);
router.get('/:id', auth_middleware_js_1.authMiddleware, leads_controller_js_1.getLeadById);
router.patch('/:id/status', auth_middleware_js_1.authMiddleware, leads_controller_js_1.updateLeadStatus);
router.delete('/:id', auth_middleware_js_1.authMiddleware, leads_controller_js_1.deleteLead);
exports.default = router;
//# sourceMappingURL=leads.routes.js.map