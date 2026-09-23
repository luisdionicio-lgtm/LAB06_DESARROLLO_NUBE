const { pool } = require('../config/db');

const SELECT_DOCUMENTO = `
  SELECT doc.id, doc.titulo, doc.descripcion, doc.propietario_id AS propietario,
         doc.nivel_confidencialidad, doc.estado, doc.pais,
         doc.fecha_creacion, doc.actualizado_en,
         dep.id AS departamento_id, dep.nombre AS departamento,
         u.nombre AS propietario_nombre, u.correo AS propietario_correo
  FROM documentos doc
  JOIN departamentos dep ON dep.id = doc.departamento_id
  JOIN usuarios u ON u.id = doc.propietario_id`;

async function buscarPorId(id) {
  const { rows } = await pool.query(`${SELECT_DOCUMENTO} WHERE doc.id = $1`, [id]);
  return rows[0] || null;
}

async function listar() {
  const { rows } = await pool.query(`${SELECT_DOCUMENTO} ORDER BY doc.id`);
  return rows;
}

async function resolverDepartamento(nombre) {
  const { rows } = await pool.query('SELECT id, nombre FROM departamentos WHERE nombre = $1', [nombre]);
  return rows[0] || null;
}

async function crear(datos) {
  const { rows } = await pool.query(
    `INSERT INTO documentos
       (titulo, descripcion, propietario_id, departamento_id, nivel_confidencialidad, estado, pais)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id`,
    [
      datos.titulo, datos.descripcion, datos.propietario_id, datos.departamento_id,
      datos.nivel_confidencialidad, datos.estado, datos.pais,
    ],
  );
  return buscarPorId(rows[0].id);
}

async function actualizar(id, datos) {
  const campos = [];
  const valores = [];
  const agregar = (campo, valor) => {
    valores.push(valor);
    campos.push(`${campo} = $${valores.length}`);
  };

  for (const campo of ['titulo', 'descripcion', 'nivel_confidencialidad', 'estado', 'pais']) {
    if (datos[campo] !== undefined) agregar(campo, datos[campo]);
  }
  if (datos.departamento_id !== undefined) agregar('departamento_id', datos.departamento_id);

  if (!campos.length) return buscarPorId(id);
  valores.push(id);
  await pool.query(
    `UPDATE documentos SET ${campos.join(', ')}, actualizado_en = NOW() WHERE id = $${valores.length}`,
    valores,
  );
  return buscarPorId(id);
}

async function aprobar(id) {
  await pool.query(
    `UPDATE documentos SET estado = 'APROBADO', actualizado_en = NOW() WHERE id = $1`,
    [id],
  );
  return buscarPorId(id);
}

async function eliminar(id) {
  const { rowCount } = await pool.query('DELETE FROM documentos WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { buscarPorId, listar, resolverDepartamento, crear, actualizar, aprobar, eliminar };

