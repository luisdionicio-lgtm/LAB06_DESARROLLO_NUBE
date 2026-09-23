const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CLAVE = 'Demo1234!';

const resultados = [];

async function solicitud(ruta, { metodo = 'GET', token, body, headers = {} } = {}) {
  const respuesta = await fetch(`${BASE_URL}${ruta}`, {
    method: metodo,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const datos = await respuesta.json();
  return { status: respuesta.status, datos };
}

async function login(correo) {
  const respuesta = await solicitud('/auth/login', {
    metodo: 'POST',
    body: { correo, password: CLAVE },
  });
  if (respuesta.status !== 200) throw new Error(`No se pudo autenticar ${correo}`);
  return respuesta.datos.token;
}

function comprobar(numero, nombre, respuesta, status, detalle) {
  const correcto = respuesta.status === status && (!detalle || detalle(respuesta.datos));
  resultados.push({ numero, nombre, correcto, status: respuesta.status });
  if (!correcto) {
    throw new Error(`Caso ${numero} fallo: ${JSON.stringify(respuesta.datos)}`);
  }
}

const contexto = { 'x-ubicacion': 'PERU', 'x-dispositivo': 'CORPORATIVO', 'x-hora-prueba': '10:00' };

async function ejecutar() {
  const tokens = {
    admin: await login('admin@securedocs.com'),
    gerente: await login('gerente@securedocs.com'),
    supervisor: await login('supervisor@securedocs.com'),
    empleado: await login('empleado@securedocs.com'),
    empleado2: await login('empleado2@securedocs.com'),
    auditor: await login('auditor@securedocs.com'),
    invitado: await login('invitado@securedocs.com'),
  };

  comprobar(1, 'Empleado consulta documento de su area', await solicitud('/documentos/2', { token: tokens.empleado, headers: contexto }), 200);
  comprobar(2, 'Empleado consulta documento de otra area', await solicitud('/documentos/3', { token: tokens.empleado, headers: contexto }), 403, (d) => d.tipo === 'ABAC');

  const creadoSupervisor = await solicitud('/documentos', {
    metodo: 'POST', token: tokens.supervisor, headers: contexto,
    body: { titulo: 'Documento para aprobar', descripcion: 'Creado por la verificacion automatica', departamento: 'FINANZAS', nivel_confidencialidad: 3, pais: 'PERU' },
  });
  comprobar(3, 'Supervisor aprueba documento de su area', await solicitud(`/documentos/${creadoSupervisor.datos.documento.id}/aprobar`, { metodo: 'POST', token: tokens.supervisor, headers: contexto }), 200);
  comprobar(4, 'Empleado intenta aprobar documento', await solicitud('/documentos/2/aprobar', { metodo: 'POST', token: tokens.empleado, headers: contexto }), 403, (d) => d.tipo === 'RBAC');
  comprobar(5, 'Usuario nivel 2 consulta documento nivel 4', await solicitud('/documentos/4', { token: tokens.empleado, headers: contexto }), 403, (d) => d.politica === 'NIVEL_SEGURIDAD');

  const temporal = await solicitud('/documentos', {
    metodo: 'POST', token: tokens.gerente, headers: contexto,
    body: { titulo: 'Temporal', descripcion: 'Se elimina durante el caso seis', departamento: 'FINANZAS', nivel_confidencialidad: 1, pais: 'PERU' },
  });
  comprobar(6, 'Gerente elimina documento', await solicitud(`/documentos/${temporal.datos.documento.id}`, { metodo: 'DELETE', token: tokens.gerente, headers: contexto }), 200);
  comprobar(7, 'Auditor intenta modificar documento', await solicitud('/documentos/1', { metodo: 'PUT', token: tokens.auditor, headers: contexto, body: { titulo: 'Cambio no permitido' } }), 403, (d) => d.tipo === 'RBAC');
  comprobar(8, 'Usuario inactivo intenta acceder', await solicitud('/auth/login', { metodo: 'POST', body: { correo: 'inactivo@securedocs.com', password: CLAVE } }), 403, (d) => d.tipo === 'ABAC');
  comprobar(9, 'Documento confidencial fuera de horario', await solicitud('/documentos/4', { token: tokens.admin, headers: { ...contexto, 'x-hora-prueba': '20:00' } }), 403, (d) => d.politica === 'HORARIO');
  comprobar(10, 'Documento nivel 5 desde dispositivo personal', await solicitud('/documentos/5', { token: tokens.admin, headers: { ...contexto, 'x-dispositivo': 'PERSONAL' } }), 403, (d) => d.politica === 'DISPOSITIVO');
  comprobar(11, 'Invitado accede a documento publico', await solicitud('/documentos/1', { token: tokens.invitado, headers: contexto }), 200);
  comprobar(12, 'Invitado accede a documento confidencial', await solicitud('/documentos/4', { token: tokens.invitado, headers: contexto }), 403, (d) => d.tipo === 'ABAC');
  comprobar(13, 'Administrador crea documento', await solicitud('/documentos', {
    metodo: 'POST', token: tokens.admin, headers: contexto,
    body: { titulo: 'Documento del administrador', descripcion: 'Caso adicional trece', departamento: 'LEGAL', nivel_confidencialidad: 5, pais: 'PERU' },
  }), 201);

  const ajeno = await solicitud('/documentos', {
    metodo: 'POST', token: tokens.empleado2, headers: contexto,
    body: { titulo: 'Documento ajeno dinamico', descripcion: 'Caso adicional catorce', departamento: 'FINANZAS', nivel_confidencialidad: 2, pais: 'PERU' },
  });
  comprobar(14, 'Empleado modifica documento ajeno', await solicitud(`/documentos/${ajeno.datos.documento.id}`, { metodo: 'PUT', token: tokens.empleado, headers: contexto, body: { titulo: 'Intento indebido' } }), 403, (d) => d.politica === 'PROPIEDAD');
  comprobar(15, 'Supervisor nivel 4 consulta documento nivel 3', await solicitud('/documentos/9', { token: tokens.supervisor, headers: contexto }), 200);
  comprobar(16, 'Usuario de Peru consulta documento de otro pais', await solicitud('/documentos/6', { token: tokens.admin, headers: { ...contexto, 'x-ubicacion': 'CHILE' } }), 403, (d) => d.politica === 'PAIS');
  comprobar(17, 'Auditor consulta auditoria', await solicitud('/auditoria?limite=50', { token: tokens.auditor, headers: contexto }), 200);

  console.table(resultados);
  console.log(`\n${resultados.length} de ${resultados.length} casos completados correctamente.`);
}

ejecutar().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

