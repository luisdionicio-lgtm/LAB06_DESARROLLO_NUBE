const authorizationService = require('../services/authorization.service');
const auditService = require('../services/audit.service');
const asyncHandler = require('../utils/async-handler');

function nombreRecurso(req, recurso) {
  if (recurso?.id) return `documento-${recurso.id}`;
  return req.baseUrl.replace('/api', '').replace('/', '') || req.originalUrl;
}

function autorizar(accion, cargarRecurso) {
  return asyncHandler(async (req, res, next) => {
    const accionResuelta = typeof accion === 'function' ? accion(req) : accion;
    const recurso = cargarRecurso ? await cargarRecurso(req) : null;
    if (cargarRecurso && !recurso) {
      await auditService.registrar({
        usuario: req.usuario,
        recurso: `documento-${req.params.id}`,
        accion: accionResuelta,
        resultado: 'DENEGADO',
        tipo: 'RECURSO',
        motivo: 'Documento no encontrado',
        entorno: req.entorno,
      });
      return res.status(404).json({ error: true, message: 'Documento no encontrado' });
    }

    const decision = await authorizationService.evaluar({
      usuario: req.usuario,
      recurso,
      accion: accionResuelta,
      entorno: req.entorno,
    });

    await auditService.registrar({
      usuario: req.usuario,
      recurso: nombreRecurso(req, recurso),
      accion: accionResuelta,
      resultado: decision.autorizado ? 'PERMITIDO' : 'DENEGADO',
      tipo: decision.tipo,
      motivo: decision.motivo,
      entorno: req.entorno,
    });

    if (!decision.autorizado) {
      return res.status(403).json({
        error: true,
        autorizado: false,
        tipo: decision.tipo,
        politica: decision.politica,
        message: decision.motivo,
      });
    }

    req.recurso = recurso;
    req.decisionAutorizacion = decision;
    next();
  });
}

module.exports = { autorizar };
