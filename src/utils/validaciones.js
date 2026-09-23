const HttpError = require('./http-error');

const ESTADOS_USUARIO = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];
const TIPOS_CONTRATO = ['INTERNO', 'EXTERNO'];
const ESTADOS_DOCUMENTO = ['PENDIENTE', 'APROBADO', 'PUBLICADO', 'ARCHIVADO'];

function textoRequerido(valor, campo) {
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new HttpError(400, `El campo ${campo} es obligatorio`);
  }
  return valor.trim();
}

function correoValido(correo) {
  const normalizado = textoRequerido(correo, 'correo').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado)) {
    throw new HttpError(400, 'El correo no tiene un formato valido');
  }
  return normalizado;
}

function enteroEnRango(valor, campo, minimo, maximo) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
    throw new HttpError(400, `${campo} debe ser un entero entre ${minimo} y ${maximo}`);
  }
  return numero;
}

function enumerado(valor, campo, permitidos) {
  const normalizado = textoRequerido(valor, campo).toUpperCase();
  if (!permitidos.includes(normalizado)) {
    throw new HttpError(400, `${campo} debe ser uno de: ${permitidos.join(', ')}`);
  }
  return normalizado;
}

module.exports = {
  ESTADOS_USUARIO,
  TIPOS_CONTRATO,
  ESTADOS_DOCUMENTO,
  textoRequerido,
  correoValido,
  enteroEnRango,
  enumerado,
};

