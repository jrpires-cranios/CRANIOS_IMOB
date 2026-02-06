"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImovel = exports.updateImovel = exports.createImovel = exports.searchImoveis = exports.getImoveisDestaque = exports.getImovelById = exports.getAllImoveis = void 0;
const imoveis_service_js_1 = require("../services/imoveis.service.js");
const error_middleware_js_1 = require("../middleware/error.middleware.js");
exports.getAllImoveis = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { tipo, finalidade, cidade, quartos_min, preco_min, preco_max, limit, offset } = req.query;
    const result = await imoveis_service_js_1.imoveisService.getAll({
        tipo: tipo,
        finalidade: finalidade,
        cidade: cidade,
        quartos_min: quartos_min ? Number(quartos_min) : undefined,
        preco_min: preco_min ? Number(preco_min) : undefined,
        preco_max: preco_max ? Number(preco_max) : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
    });
    res.json({
        success: true,
        data: result.data,
        total: result.total,
        limit: Number(limit) || 20,
        offset: Number(offset) || 0,
    });
});
exports.getImovelById = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const imovel = await imoveis_service_js_1.imoveisService.getById(id);
    if (!imovel) {
        res.status(404).json({ success: false, error: 'Imóvel não encontrado' });
        return;
    }
    res.json({ success: true, data: imovel });
});
exports.getImoveisDestaque = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { limit } = req.query;
    const imoveis = await imoveis_service_js_1.imoveisService.getDestaque(Number(limit) || 6);
    res.json({ success: true, data: imoveis });
});
exports.searchImoveis = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { q, limit } = req.query;
    if (!q) {
        res.status(400).json({ success: false, error: 'Query de busca obrigatória' });
        return;
    }
    const imoveis = await imoveis_service_js_1.imoveisService.search(q, Number(limit) || 10);
    res.json({ success: true, data: imoveis });
});
exports.createImovel = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const imovel = await imoveis_service_js_1.imoveisService.create(req.body);
    res.status(201).json({ success: true, data: imovel });
});
exports.updateImovel = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const imovel = await imoveis_service_js_1.imoveisService.update(id, req.body);
    res.json({ success: true, data: imovel });
});
exports.deleteImovel = (0, error_middleware_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await imoveis_service_js_1.imoveisService.delete(id);
    res.json({ success: true, message: 'Imóvel removido' });
});
//# sourceMappingURL=imoveis.controller.js.map