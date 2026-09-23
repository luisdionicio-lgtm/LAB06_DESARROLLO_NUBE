const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuario.repository');
const auditService = require('../services/audit.service');
const { correoValido, textoRequerido } = require('../utils/validaciones');
const { entornoDesde } = require('../middleware/auth.middleware');

async function login(req, res) {
  const correo = correoValido(req.body.correo);
  const password = textoRequerido(req.body.password, 'password');
  const entorno = entornoDesde(req);
  const usuario = await usuarioRepository.buscarPorCorreo(correo);

  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    await auditService.registrar({
      usuario: usuario || null,
      usuario_correo: correo,
      recurso: 'auth-login',
      accion: 'LOGIN',
      resultado: 'DENEGADO',
      tipo: 'AUTENTICACION',
      motivo: 'Credenciales invalidas',
      entorno,
    });
    return res.status(401).json({ error: true, message: 'Credenciales invalidas' });
  }

  if (usuario.estado !== 'ACTIVO') {
    await auditService.registrar({
      usuario,
      recurso: 'auth-login',
      accion: 'LOGIN',
      resultado: 'DENEGADO',
      tipo: 'ABAC',
      motivo: 'El usuario esta inactivo o suspendido',
      entorno,
    });
    return res.status(403).json({
      error: true,
      autorizado: false,
      tipo: 'ABAC',
      message: 'El usuario esta inactivo o suspendido',
    });
  }

  const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });
  await auditService.registrar({
    usuario,
    recurso: 'auth-login',
    accion: 'LOGIN',
    resultado: 'PERMITIDO',
    tipo: 'AUTENTICACION',
    motivo: 'Autenticacion correcta',
    entorno,
  });

  return res.json({ token, usuario: usuarioRepository.sinPassword(usuario) });
}

async function logout(req, res) {
  await auditService.registrar({
    usuario: req.usuario,
    recurso: 'auth-logout',
    accion: 'LOGOUT',
    resultado: 'PERMITIDO',
    tipo: 'AUTENTICACION',
    motivo: 'Cierre de sesion; el cliente debe descartar el JWT',
    entorno: req.entorno,
  });
  res.json({ message: 'Sesion cerrada. Descarta el token en el cliente.' });
}

module.exports = { login, logout };

