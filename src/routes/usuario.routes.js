const express = require('express');
const usuarioController = require('../controllers/usuario.controller');
const { autenticar } = require('../middleware/auth.middleware');
const { autorizar } = require('../middleware/authorization.middleware');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();
router.use(autenticar);

router.get('/', autorizar('GESTIONAR_USUARIOS'), asyncHandler(usuarioController.listar));
router.get('/:id', autorizar('GESTIONAR_USUARIOS'), asyncHandler(usuarioController.obtener));
router.post('/', autorizar((req) => req.body.rol ? 'ASIGNAR_ROLES' : 'GESTIONAR_USUARIOS'), asyncHandler(usuarioController.crear));
router.put('/:id', autorizar((req) => req.body.rol ? 'ASIGNAR_ROLES' : 'GESTIONAR_USUARIOS'), asyncHandler(usuarioController.actualizar));
router.patch('/:id/estado', autorizar('GESTIONAR_USUARIOS'), asyncHandler(usuarioController.cambiarEstado));

module.exports = router;

