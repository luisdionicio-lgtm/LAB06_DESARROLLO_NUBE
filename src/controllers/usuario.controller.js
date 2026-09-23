const bcrypt = require('bcryptjs');
const usuarioRepository = require('../repositories/usuario.repository');
const HttpError = require('../utils/http-error');
const {
  ESTADOS_USUARIO,
  TIPOS_CONTRATO,
  textoRequerido,
  correoValido,
  enteroEnRango,
  enumerado,
} = require('../utils/validaciones');

function normalizarBase(body, parcial = false) {
  const datos = {};
  const asignar = (campo, fn) => {
    if (!parcial || body[campo] !== undefined) datos[campo] = fn(body[campo]);
  };
  asignar('nombre', (v) => textoRequerido(v, 'nombre'));
  asignar('correo', correoValido);
  asignar('nivel_seguridad', (v) => enteroEnRango(v, 'nivel_seguridad', 1, 5));
  asignar('pais', (v) => textoRequerido(v, 'pais').toUpperCase());
  asignar('tipo_contrato', (v) => enumerado(v, 'tipo_contrato', TIPOS_CONTRATO));
  asignar('estado', (v) => enumerado(v, 'estado', ESTADOS_USUARIO));
  return datos;
}

async function resolverCatalogos(body, datos, parcial = false) {
  const debeResolver = !parcial || body.rol !== undefined || body.departamento !== undefined;
  if (!debeResolver) return;

  let rol = body.rol;
  let departamento = body.departamento;
  if (parcial && (!rol || !departamento)) {
    const actual = await usuarioRepository.buscarPorId(body.id_actual);
    rol ||= actual.rol;
    departamento ||= actual.departamento;
  }
  rol = textoRequerido(rol, 'rol').toUpperCase();
  departamento = textoRequerido(departamento, 'departamento').toUpperCase();
  const ids = await usuarioRepository.resolverRolYDepartamento(rol, departamento);
  if (!ids) throw new HttpError(400, 'El rol o departamento no existe');
  if (!parcial || body.rol !== undefined) datos.rol_id = ids.rol_id;
  if (!parcial || body.departamento !== undefined) datos.departamento_id = ids.departamento_id;
}

async function listar(req, res) {
  const usuarios = (await usuarioRepository.listar()).map(usuarioRepository.sinPassword);
  res.json({ total: usuarios.length, usuarios });
}

async function obtener(req, res) {
  const usuario = await usuarioRepository.buscarPorId(req.params.id);
  if (!usuario) throw new HttpError(404, 'Usuario no encontrado');
  res.json({ usuario: usuarioRepository.sinPassword(usuario) });
}

async function crear(req, res) {
  const datos = normalizarBase(req.body);
  const password = textoRequerido(req.body.password, 'password');
  if (password.length < 8) throw new HttpError(400, 'La password debe tener al menos 8 caracteres');
  await resolverCatalogos(req.body, datos);
  datos.password_hash = await bcrypt.hash(password, 10);
  const usuario = await usuarioRepository.crear(datos);
  res.status(201).json({ message: 'Usuario creado', usuario: usuarioRepository.sinPassword(usuario) });
}

async function actualizar(req, res) {
  const actual = await usuarioRepository.buscarPorId(req.params.id);
  if (!actual) throw new HttpError(404, 'Usuario no encontrado');
  const body = { ...req.body, id_actual: req.params.id };
  const datos = normalizarBase(body, true);
  await resolverCatalogos(body, datos, true);
  if (body.password !== undefined) {
    const password = textoRequerido(body.password, 'password');
    if (password.length < 8) throw new HttpError(400, 'La password debe tener al menos 8 caracteres');
    datos.password_hash = await bcrypt.hash(password, 10);
  }
  const usuario = await usuarioRepository.actualizar(req.params.id, datos);
  res.json({ message: 'Usuario actualizado', usuario: usuarioRepository.sinPassword(usuario) });
}

async function cambiarEstado(req, res) {
  const actual = await usuarioRepository.buscarPorId(req.params.id);
  if (!actual) throw new HttpError(404, 'Usuario no encontrado');
  const estado = enumerado(req.body.estado, 'estado', ESTADOS_USUARIO);
  const usuario = await usuarioRepository.actualizar(req.params.id, { estado });
  res.json({ message: 'Estado actualizado', usuario: usuarioRepository.sinPassword(usuario) });
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstado };

