const { pool } = require('../config/db');

async function crear(registro) {
  const ip = registro.entorno?.direccion_ip;
  await pool.query(
    `INSERT INTO auditorias
       (usuario_id, usuario_correo, recurso, accion, resultado, tipo, motivo,
        direccion_ip, ubicacion, dispositivo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NULLIF($8, '')::inet,$9,$10)`,
    [
      registro.usuario?.id || null,
      registro.usuario?.correo || registro.usuario_correo || null,
      registro.recurso,
      registro.accion,
      registro.resultado,
      registro.tipo,
      registro.motivo,
      ip && ip !== '::1' ? ip.replace('::ffff:', '') : '127.0.0.1',
      registro.entorno?.ubicacion || null,
      registro.entorno?.dispositivo || null,
    ],
  );
}

async function listar({ limite = 100, resultado, usuario_id } = {}) {
  const condiciones = [];
  const valores = [];
  if (resultado) {
    valores.push(resultado);
    condiciones.push(`a.resultado = $${valores.length}`);
  }
  if (usuario_id) {
    valores.push(usuario_id);
    condiciones.push(`a.usuario_id = $${valores.length}`);
  }
  valores.push(limite);
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT a.id, a.usuario_id, a.usuario_correo, a.recurso, a.accion,
            a.resultado, a.tipo, a.motivo, a.direccion_ip, a.ubicacion,
            a.dispositivo, a.fecha
     FROM auditorias a
     ${where}
     ORDER BY a.fecha DESC
     LIMIT $${valores.length}`,
    valores,
  );
  return rows;
}

module.exports = { crear, listar };

