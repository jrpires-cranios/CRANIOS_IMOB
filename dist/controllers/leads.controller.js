"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeadStats = exports.deleteLead = exports.updateLeadStatus = exports.createLead = exports.getLeadById = exports.getAllLeads = void 0;
const leads_service_js_1 = require("../services/leads.service.js");
const error_middleware_js_1 = require("../middleware/error.middleware.js");
exports.getAllLeads = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { status, limit, offset } = req.query;
    const result = await leads_service_js_1.leadsService.getAll({
        status: status,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
    });
    res.json({
        success: true,
        data: result.data,
        total: result.total,
    });
});
exports.getLeadById = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const lead = await leads_service_js_1.leadsService.getById(id);
    if (!lead) {
        res.status(404).json({ success: false, error: 'Lead não encontrado' });
        return;
    }
    res.json({ success: true, data: lead });
});
exports.createLead = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const lead = await leads_service_js_1.leadsService.create(req.body);
    res.status(201).json({ success: true, data: lead });
});
exports.updateLeadStatus = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const lead = await leads_service_js_1.leadsService.updateStatus(id, status);
    res.json({ success: true, data: lead });
});
exports.deleteLead = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await leads_service_js_1.leadsService.delete(id);
    res.json({ success: true, message: 'Lead removido' });
});
exports.getLeadStats = (0, error_middleware_js_1.asyncHandler)(async (_req, res) => {
    const stats = await leads_service_js_1.leadsService.getStats();
    res.json({ success: true, data: stats });
});
//# sourceMappingURL=leads.controller.js.map