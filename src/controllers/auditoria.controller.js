const auditoriaRepository = require('../repositories/auditoria.repository');
const HttpError = require('../utils/http-error');

async function listar(req, res) {
  const limite = req.query.limite === undefined ? 100 : Number(req.query.limite);
  if (!Number.isInteger(limite) || limite < 1 || limite > 500) {
    throw new HttpError(400, 'limite debe ser un entero entre 1 y 500');
  }
  const resultado = req.query.resultado?.toUpperCase();
  if (resultado && !['PERMITIDO', 'DENEGADO'].includes(resultado)) {
    throw new HttpError(400, 'resultado debe ser PERMITIDO o DENEGADO');
  }
  const usuario_id = req.query.usuario_id ? Number(req.query.usuario_id) : undefined;
  if (usuario_id !== undefined && !Number.isInteger(usuario_id)) {
    throw new HttpError(400, 'usuario_id debe ser un entero');
  }
  const auditorias = await auditoriaRepository.listar({ limite, resultado, usuario_id });
  res.json({ total: auditorias.length, auditorias });
}

module.exports = { listar };

