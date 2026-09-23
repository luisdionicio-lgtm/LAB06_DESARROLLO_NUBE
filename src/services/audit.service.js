const auditoriaRepository = require('../repositories/auditoria.repository');

async function registrar(registro) {
  try {
    await auditoriaRepository.crear(registro);
  } catch (error) {
    console.error('No se pudo registrar la auditoria:', error.message);
    throw error;
  }
}

module.exports = { registrar };

