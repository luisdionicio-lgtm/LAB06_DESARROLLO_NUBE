const express = require('express');
const authController = require('../controllers/auth.controller');
const { autenticar } = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();

router.post('/login', asyncHandler(authController.login));
router.post('/logout', autenticar, asyncHandler(authController.logout));

module.exports = router;

