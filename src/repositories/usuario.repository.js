const { pool } = require('../config/db');

const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.correo, u.password_hash, u.nivel_seguridad,
         u.pais, u.tipo_contrato, u.estado, u.creado_en, u.actualizado_en,
         r.id AS rol_id, r.nombre AS rol,
         d.id AS departamento_id, d.nombre AS departamento
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
  JOIN departamentos d ON d.id = u.departamento_id`;

async function buscarPorId(id) {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.id = $1`, [id]);
  return rows[0] || null;
}

async function buscarPorCorreo(correo) {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.correo = $1`, [correo]);
  return rows[0] || null;
}

async function listar() {
  const { rows } = await pool.query(`${SELECT_USUARIO} ORDER BY u.id`);
  return rows;
}

async function resolverRolYDepartamento(rol, departamento) {
  const { rows } = await pool.query(
    `SELECT r.id AS rol_id, d.id AS departamento_id
     FROM roles r CROSS JOIN departamentos d
     WHERE r.nombre = $1 AND d.nombre = $2`,
    [rol, departamento],
  );
  return rows[0] || null;
}

async function crear(datos) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios
       (nombre, correo, password_hash, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [
      datos.nombre, datos.correo, datos.password_hash, datos.rol_id,
      datos.departamento_id, datos.nivel_seguridad, datos.pais,
      datos.tipo_contrato, datos.estado,
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

  for (const campo of ['nombre', 'correo', 'nivel_seguridad', 'pais', 'tipo_contrato', 'estado']) {
    if (datos[campo] !== undefined) agregar(campo, datos[campo]);
  }
  if (datos.password_hash !== undefined) agregar('password_hash', datos.password_hash);
  if (datos.rol_id !== undefined) agregar('rol_id', datos.rol_id);
  if (datos.departamento_id !== undefined) agregar('departamento_id', datos.departamento_id);

  if (!campos.length) return buscarPorId(id);
  valores.push(id);
  await pool.query(
    `UPDATE usuarios SET ${campos.join(', ')}, actualizado_en = NOW() WHERE id = $${valores.length}`,
    valores,
  );
  return buscarPorId(id);
}

function sinPassword(usuario) {
  if (!usuario) return usuario;
  const { password_hash: omitido, ...seguro } = usuario;
  return seguro;
}

module.exports = {
  buscarPorId,
  buscarPorCorreo,
  listar,
  resolverRolYDepartamento,
  crear,
  actualizar,
  sinPassword,
};

