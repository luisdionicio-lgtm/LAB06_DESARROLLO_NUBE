const rbacService = require('./rbac.service');
const abacService = require('./abac.service');

async function evaluar({ usuario, recurso = null, accion, entorno }) {
  if (usuario.estado !== 'ACTIVO') {
    return { autorizado: false, tipo: 'ABAC', politica: 'ESTADO_USUARIO', motivo: 'El usuario esta inactivo o suspendido' };
  }

  const rbac = await rbacService.evaluar(usuario, accion);
  if (!rbac.autorizado) return rbac;

  return abacService.evaluar(usuario, recurso, accion, entorno);
}

module.exports = { evaluar, evaluarABAC: abacService.evaluar };

