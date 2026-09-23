const express = require('express');
const documentoController = require('../controllers/documento.controller');
const { autenticar } = require('../middleware/auth.middleware');
const { autorizar } = require('../middleware/authorization.middleware');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();
router.use(autenticar);

router.get('/', autorizar('CONSULTAR_DOCUMENTO'), asyncHandler(documentoController.listar));
router.get('/:id', autorizar('CONSULTAR_DOCUMENTO', documentoController.recursoPorId), asyncHandler(documentoController.obtener));
router.post('/', autorizar('CREAR_DOCUMENTO', documentoController.recursoParaCrear), asyncHandler(documentoController.crear));
router.put('/:id', autorizar('MODIFICAR_DOCUMENTO', documentoController.recursoParaActualizar), asyncHandler(documentoController.actualizar));
router.delete('/:id', autorizar('ELIMINAR_DOCUMENTO', documentoController.recursoPorId), asyncHandler(documentoController.eliminar));
router.post('/:id/aprobar', autorizar('APROBAR_DOCUMENTO', documentoController.recursoPorId), asyncHandler(documentoController.aprobar));

module.exports = router;

