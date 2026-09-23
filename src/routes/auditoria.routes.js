const express = require('express');
const auditoriaController = require('../controllers/auditoria.controller');
const { autenticar } = require('../middleware/auth.middleware');
const { autorizar } = require('../middleware/authorization.middleware');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();
router.use(autenticar);
router.get('/', autorizar('VER_AUDITORIA'), asyncHandler(auditoriaController.listar));

module.exports = router;

