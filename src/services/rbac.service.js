const { pool } = require('../config/db');

async function tienePermiso(rol, accion) {
  const { rowCount } = await pool.query(
    `SELECT 1
     FROM roles r
     JOIN rol_permisos rp ON rp.rol_id = r.id
     JOIN permisos p ON p.id = rp.permiso_id
     WHERE r.nombre = $1 AND p.codigo = $2`,
    [rol, accion],
  );
  return rowCount > 0;
}

async function evaluar(usuario, accion) {
  const permitido = await tienePermiso(usuario.rol, accion);
  return permitido
    ? { autorizado: true, tipo: 'RBAC', motivo: `El rol ${usuario.rol} tiene el permiso ${accion}` }
    : { autorizado: false, tipo: 'RBAC', motivo: `El rol ${usuario.rol} no tiene permiso para ${accion.toLowerCase().replaceAll('_', ' ')}` };
}

module.exports = { tienePermiso, evaluar };

