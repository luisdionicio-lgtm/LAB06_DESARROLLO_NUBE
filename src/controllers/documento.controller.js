const documentoRepository = require('../repositories/documento.repository');
const authorizationService = require('../services/authorization.service');
const HttpError = require('../utils/http-error');
const {
  textoRequerido,
  enteroEnRango,
} = require('../utils/validaciones');

function normalizarDocumento(body, parcial = false) {
  const datos = {};
  const asignar = (campo, fn) => {
    if (!parcial || body[campo] !== undefined) datos[campo] = fn(body[campo]);
  };
  asignar('titulo', (v) => textoRequerido(v, 'titulo'));
  asignar('descripcion', (v) => textoRequerido(v, 'descripcion'));
  asignar('departamento', (v) => textoRequerido(v, 'departamento').toUpperCase());
  asignar('nivel_confidencialidad', (v) => enteroEnRango(v, 'nivel_confidencialidad', 1, 5));
  asignar('pais', (v) => textoRequerido(v, 'pais').toUpperCase());
  return datos;
}

async function recursoParaCrear(req) {
  const datos = normalizarDocumento(req.body);
  return {
    ...datos,
    propietario: req.usuario.id,
    estado: 'PENDIENTE',
  };
}

async function recursoPorId(req) {
  return documentoRepository.buscarPorId(req.params.id);
}

async function recursoParaActualizar(req) {
  const actual = await documentoRepository.buscarPorId(req.params.id);
  if (!actual) return null;
  return { ...actual, ...normalizarDocumento(req.body, true) };
}

async function listar(req, res) {
  const todos = await documentoRepository.listar();
  const documentos = todos.filter((documento) => authorizationService.evaluarABAC(
    req.usuario,
    documento,
    'CONSULTAR_DOCUMENTO',
    req.entorno,
  ).autorizado);
  res.json({ total: documentos.length, documentos });
}

async function obtener(req, res) {
  res.json({ documento: req.recurso });
}

async function crear(req, res) {
  const datos = normalizarDocumento(req.body);
  const departamento = await documentoRepository.resolverDepartamento(datos.departamento);
  if (!departamento) throw new HttpError(400, 'El departamento no existe');
  const documento = await documentoRepository.crear({
    ...datos,
    propietario_id: req.usuario.id,
    departamento_id: departamento.id,
    estado: 'PENDIENTE',
  });
  res.status(201).json({ message: 'Documento creado', documento });
}

async function actualizar(req, res) {
  const datos = normalizarDocumento(req.body, true);
  if (!Object.keys(datos).length) throw new HttpError(400, 'No se enviaron campos actualizables');
  if (datos.departamento) {
    const departamento = await documentoRepository.resolverDepartamento(datos.departamento);
    if (!departamento) throw new HttpError(400, 'El departamento no existe');
    datos.departamento_id = departamento.id;
    delete datos.departamento;
  }
  const documento = await documentoRepository.actualizar(req.params.id, datos);
  res.json({ message: 'Documento actualizado', documento });
}

async function eliminar(req, res) {
  await documentoRepository.eliminar(req.params.id);
  res.json({ message: 'Documento eliminado' });
}

async function aprobar(req, res) {
  if (req.recurso.estado !== 'PENDIENTE') {
    throw new HttpError(409, 'Solo se pueden aprobar documentos pendientes');
  }
  const documento = await documentoRepository.aprobar(req.params.id);
  res.json({ message: 'Documento aprobado', documento });
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  aprobar,
  recursoParaCrear,
  recursoPorId,
  recursoParaActualizar,
};

