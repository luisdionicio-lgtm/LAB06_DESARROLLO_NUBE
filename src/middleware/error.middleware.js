function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: true, message: 'Ruta no encontrada' });
}

function manejarError(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.code === '23505') {
    return res.status(409).json({ error: true, message: 'Ya existe un registro con esos datos unicos' });
  }
  if (error.code === '23503' || error.code === '23514' || error.code === '22P02') {
    return res.status(400).json({ error: true, message: 'Los datos enviados no son validos' });
  }

  const status = Number(error.status) || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({
    error: true,
    message: status >= 500 ? 'Ocurrio un error interno' : error.message,
    ...(error.detalles ? { detalles: error.detalles } : {}),
  });
}

module.exports = { rutaNoEncontrada, manejarError };

