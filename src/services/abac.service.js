const { politicas } = require('../policies/abac.policies');

function evaluar(usuario, recurso, accion, entorno) {
  const contexto = { usuario, recurso, accion, entorno };
  const evaluadas = [];

  for (const politica of politicas) {
    if (!politica.aplica(contexto)) continue;
    const resultado = politica.evaluar(contexto);
    evaluadas.push(resultado.codigo);
    if (!resultado.cumple) {
      return {
        autorizado: false,
        tipo: 'ABAC',
        politica: resultado.codigo,
        motivo: resultado.motivo,
        politicas_evaluadas: evaluadas,
      };
    }
  }

  return {
    autorizado: true,
    tipo: 'ABAC',
    motivo: 'Las politicas ABAC aplicables fueron satisfechas',
    politicas_evaluadas: evaluadas,
  };
}

module.exports = { evaluar };

