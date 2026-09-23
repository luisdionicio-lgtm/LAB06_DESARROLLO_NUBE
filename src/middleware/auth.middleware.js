const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuario.repository');
const auditService = require('../services/audit.service');
const asyncHandler = require('../utils/async-handler');

function entornoDesde(req) {
  const ahora = new Date();
  const horaPrueba = req.get('x-hora-prueba');
  const hora = /^([01]\d|2[0-3]):[0-5]\d$/.test(horaPrueba || '')
    ? horaPrueba
    : new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(ahora);

  return {
    fecha: ahora.toISOString(),
    hora,
    direccion_ip: req.ip,
    ubicacion: req.get('x-ubicacion')?.trim().toUpperCase() || null,
    dispositivo: req.get('x-dispositivo')?.trim().toUpperCase() || null,
  };
}

const autenticar = asyncHandler(async (req, res, next) => {
  const encabezado = req.get('authorization') || '';
  const [tipo, token] = encabezado.split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: true, message: 'Se requiere un token Bearer' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: true, message: 'Token invalido o expirado' });
  }

  const usuario = await usuarioRepository.buscarPorId(payload.id);
  if (!usuario) {
    return res.status(401).json({ error: true, message: 'El usuario del token ya no existe' });
  }

  req.usuario = usuario;
  req.entorno = entornoDesde(req);

  if (usuario.estado !== 'ACTIVO') {
    await auditService.registrar({
      usuario,
      recurso: req.originalUrl,
      accion: req.method,
      resultado: 'DENEGADO',
      tipo: 'ABAC',
      motivo: 'El usuario esta inactivo o suspendido',
      entorno: req.entorno,
    });
    return res.status(403).json({
      error: true,
      autorizado: false,
      tipo: 'ABAC',
      message: 'El usuario esta inactivo o suspendido',
    });
  }

  next();
});

module.exports = { autenticar, entornoDesde };

