"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const imoveis_controller_js_1 = require("../controllers/imoveis.controller.js");
const router = (0, express_1.Router)();
// Public routes
router.get('/search', imoveis_controller_js_1.searchImoveis);
router.get('/destaque', imoveis_controller_js_1.getImoveisDestaque);
router.get('/:id', imoveis_controller_js_1.getImovelById);
router.get('/', imoveis_controller_js_1.getAllImoveis);
// Protected routes (require auth)
router.post('/', (req, res, next) => {
    req.user = req.user;
    next();
}, imoveis_controller_js_1.createImovel);
router.put('/:id', (req, res, next) => {
    req.user = req.user;
    next();
}, imoveis_controller_js_1.updateImovel);
router.delete('/:id', (req, res, next) => {
    req.user = req.user;
    next();
}, imoveis_controller_js_1.deleteImovel);
exports.default = router;
//# sourceMappingURL=imoveis.routes.js.map