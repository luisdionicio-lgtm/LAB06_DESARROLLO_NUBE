const ACCIONES_DOCUMENTO = new Set([
  'CREAR_DOCUMENTO',
  'CONSULTAR_DOCUMENTO',
  'MODIFICAR_DOCUMENTO',
  'ELIMINAR_DOCUMENTO',
  'APROBAR_DOCUMENTO',
]);

const rolesConAreaRestringida = new Set(['GERENTE', 'SUPERVISOR', 'EMPLEADO']);

function permitir(codigo) {
  return { cumple: true, codigo };
}

function denegar(codigo, motivo) {
  return { cumple: false, codigo, motivo };
}

const politicas = [
  {
    codigo: 'ESTADO_USUARIO',
    aplica: () => true,
    evaluar: ({ usuario }) => usuario.estado === 'ACTIVO'
      ? permitir('ESTADO_USUARIO')
      : denegar('ESTADO_USUARIO', 'El usuario esta inactivo o suspendido'),
  },
  {
    codigo: 'DEPARTAMENTO',
    aplica: ({ accion, recurso, usuario }) => Boolean(recurso)
      && ACCIONES_DOCUMENTO.has(accion)
      && rolesConAreaRestringida.has(usuario.rol),
    evaluar: ({ usuario, recurso }) => usuario.departamento === recurso.departamento
      ? permitir('DEPARTAMENTO')
      : denegar('DEPARTAMENTO', 'El documento pertenece a otro departamento'),
  },
  {
    codigo: 'NIVEL_SEGURIDAD',
    aplica: ({ accion, recurso }) => Boolean(recurso) && ACCIONES_DOCUMENTO.has(accion),
    evaluar: ({ usuario, recurso }) => Number(usuario.nivel_seguridad) >= Number(recurso.nivel_confidencialidad)
      ? permitir('NIVEL_SEGURIDAD')
      : denegar('NIVEL_SEGURIDAD', 'Nivel de seguridad insuficiente'),
  },
  {
    codigo: 'PROPIEDAD',
    aplica: ({ accion, recurso, usuario }) => accion === 'MODIFICAR_DOCUMENTO'
      && Boolean(recurso)
      && usuario.rol === 'EMPLEADO',
    evaluar: ({ usuario, recurso }) => Number(usuario.id) === Number(recurso.propietario)
      ? permitir('PROPIEDAD')
      : denegar('PROPIEDAD', 'El empleado solo puede modificar documentos de su propiedad'),
  },
  {
    codigo: 'HORARIO',
    aplica: ({ accion, recurso }) => accion === 'CONSULTAR_DOCUMENTO'
      && Number(recurso?.nivel_confidencialidad) >= 4,
    evaluar: ({ entorno }) => {
      const hora = entorno.hora;
      return hora >= '08:00' && hora <= '18:00'
        ? permitir('HORARIO')
        : denegar('HORARIO', 'Los documentos altamente confidenciales solo se consultan entre 08:00 y 18:00');
    },
  },
  {
    codigo: 'PAIS',
    aplica: ({ accion, recurso }) => Boolean(recurso) && ACCIONES_DOCUMENTO.has(accion),
    evaluar: ({ usuario, recurso, entorno }) => {
      if (usuario.pais !== recurso.pais) {
        return denegar('PAIS', 'El pais del usuario no coincide con el pais del documento');
      }
      if (entorno.ubicacion && entorno.ubicacion !== recurso.pais) {
        return denegar('PAIS', 'La ubicacion de la solicitud no coincide con el pais del documento');
      }
      return permitir('PAIS');
    },
  },
  {
    codigo: 'DISPOSITIVO',
    aplica: ({ accion, recurso }) => accion === 'CONSULTAR_DOCUMENTO'
      && Number(recurso?.nivel_confidencialidad) >= 4,
    evaluar: ({ entorno }) => entorno.dispositivo === 'CORPORATIVO'
      ? permitir('DISPOSITIVO')
      : denegar('DISPOSITIVO', 'Los documentos confidenciales requieren un dispositivo corporativo'),
  },
  {
    codigo: 'INVITADOS',
    aplica: ({ accion, recurso, usuario }) => accion === 'CONSULTAR_DOCUMENTO'
      && Boolean(recurso)
      && usuario.rol === 'INVITADO',
    evaluar: ({ usuario, recurso }) => (
      usuario.tipo_contrato === 'EXTERNO'
      && Number(recurso.nivel_confidencialidad) <= 1
      && recurso.estado === 'PUBLICADO'
    )
      ? permitir('INVITADOS')
      : denegar('INVITADOS', 'Los invitados solo acceden a documentos publicados de nivel 1'),
  },
];

module.exports = { politicas };

