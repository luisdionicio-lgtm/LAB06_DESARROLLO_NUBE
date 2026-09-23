const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluar } = require('../src/services/abac.service');

const usuario = {
  id: 4,
  rol: 'EMPLEADO',
  departamento: 'FINANZAS',
  nivel_seguridad: 3,
  pais: 'PERU',
  tipo_contrato: 'INTERNO',
  estado: 'ACTIVO',
};

const documento = {
  id: 10,
  propietario: 4,
  departamento: 'FINANZAS',
  nivel_confidencialidad: 3,
  pais: 'PERU',
  estado: 'PUBLICADO',
};

const entorno = { hora: '10:00', ubicacion: 'PERU', dispositivo: 'CORPORATIVO' };

test('permite cuando todas las politicas aplicables se cumplen', () => {
  assert.equal(evaluar(usuario, documento, 'CONSULTAR_DOCUMENTO', entorno).autorizado, true);
});

test('deniega usuario inactivo', () => {
  const resultado = evaluar({ ...usuario, estado: 'INACTIVO' }, documento, 'CONSULTAR_DOCUMENTO', entorno);
  assert.equal(resultado.politica, 'ESTADO_USUARIO');
});

test('deniega departamento diferente', () => {
  const resultado = evaluar(usuario, { ...documento, departamento: 'RRHH' }, 'CONSULTAR_DOCUMENTO', entorno);
  assert.equal(resultado.politica, 'DEPARTAMENTO');
});

test('deniega nivel insuficiente', () => {
  const resultado = evaluar(usuario, { ...documento, nivel_confidencialidad: 4 }, 'CONSULTAR_DOCUMENTO', entorno);
  assert.equal(resultado.politica, 'NIVEL_SEGURIDAD');
});

test('deniega modificacion de documento ajeno al empleado', () => {
  const resultado = evaluar(usuario, { ...documento, propietario: 7 }, 'MODIFICAR_DOCUMENTO', entorno);
  assert.equal(resultado.politica, 'PROPIEDAD');
});

test('deniega documento confidencial fuera del horario', () => {
  const resultado = evaluar(
    { ...usuario, nivel_seguridad: 5 },
    { ...documento, nivel_confidencialidad: 4 },
    'CONSULTAR_DOCUMENTO',
    { ...entorno, hora: '20:00' },
  );
  assert.equal(resultado.politica, 'HORARIO');
});

test('deniega pais o ubicacion diferente', () => {
  const resultado = evaluar(usuario, documento, 'CONSULTAR_DOCUMENTO', { ...entorno, ubicacion: 'CHILE' });
  assert.equal(resultado.politica, 'PAIS');
});

test('deniega dispositivo personal para alta confidencialidad', () => {
  const resultado = evaluar(
    { ...usuario, nivel_seguridad: 5 },
    { ...documento, nivel_confidencialidad: 4 },
    'CONSULTAR_DOCUMENTO',
    { ...entorno, dispositivo: 'PERSONAL' },
  );
  assert.equal(resultado.politica, 'DISPOSITIVO');
});

test('invitado solo accede a publicado nivel uno', () => {
  const invitado = { ...usuario, rol: 'INVITADO', nivel_seguridad: 1, tipo_contrato: 'EXTERNO' };
  assert.equal(evaluar(invitado, { ...documento, nivel_confidencialidad: 1 }, 'CONSULTAR_DOCUMENTO', entorno).autorizado, true);
  const denegado = evaluar(invitado, { ...documento, nivel_confidencialidad: 1, estado: 'PENDIENTE' }, 'CONSULTAR_DOCUMENTO', entorno);
  assert.equal(denegado.politica, 'INVITADOS');
});

