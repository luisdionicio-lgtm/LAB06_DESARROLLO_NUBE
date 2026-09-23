BEGIN;

INSERT INTO departamentos (id, nombre, descripcion) VALUES
  (1, 'FINANZAS', 'Gestion financiera y presupuestaria'),
  (2, 'RRHH', 'Gestion de personas'),
  (3, 'SISTEMAS', 'Tecnologia y soporte'),
  (4, 'LEGAL', 'Asuntos legales y cumplimiento')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion;

INSERT INTO roles (id, nombre, descripcion) VALUES
  (1, 'ADMINISTRADOR', 'Administra usuarios, roles y configuraciones'),
  (2, 'GERENTE', 'Supervisa documentos de su area'),
  (3, 'SUPERVISOR', 'Revisa y aprueba documentos'),
  (4, 'EMPLEADO', 'Crea y consulta documentos de su area'),
  (5, 'AUDITOR', 'Consulta documentos y registros de auditoria'),
  (6, 'INVITADO', 'Acceso temporal a documentos publicos')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion;

INSERT INTO permisos (id, codigo, descripcion) VALUES
  (1, 'CREAR_DOCUMENTO', 'Crear documentos'),
  (2, 'CONSULTAR_DOCUMENTO', 'Consultar documentos'),
  (3, 'MODIFICAR_DOCUMENTO', 'Modificar documentos'),
  (4, 'ELIMINAR_DOCUMENTO', 'Eliminar documentos'),
  (5, 'APROBAR_DOCUMENTO', 'Aprobar documentos'),
  (6, 'VER_AUDITORIA', 'Consultar registros de auditoria'),
  (7, 'GESTIONAR_USUARIOS', 'Crear y modificar usuarios'),
  (8, 'ASIGNAR_ROLES', 'Asignar roles a usuarios')
ON CONFLICT (id) DO UPDATE SET codigo = EXCLUDED.codigo, descripcion = EXCLUDED.descripcion;

INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
  (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),
  (2,1),(2,2),(2,3),(2,4),(2,5),(2,6),
  (3,1),(3,2),(3,3),(3,5),
  (4,1),(4,2),(4,3),
  (5,2),(5,6),
  (6,2)
ON CONFLICT DO NOTHING;

INSERT INTO politicas (id, codigo, nombre, descripcion) VALUES
  (1, 'ESTADO_USUARIO', 'Estado del usuario', 'El usuario debe estar ACTIVO'),
  (2, 'DEPARTAMENTO', 'Departamento', 'El acceso operativo se limita al departamento del usuario'),
  (3, 'NIVEL_SEGURIDAD', 'Nivel de seguridad', 'El nivel del usuario debe cubrir la confidencialidad del documento'),
  (4, 'PROPIEDAD', 'Propiedad', 'Un empleado solo modifica documentos propios'),
  (5, 'HORARIO', 'Horario', 'Documentos de nivel 4 o 5 se consultan entre 08:00 y 18:00'),
  (6, 'PAIS', 'Pais', 'Usuario y ubicacion deben coincidir con el pais del documento'),
  (7, 'DISPOSITIVO', 'Dispositivo', 'Documentos de nivel 4 o 5 requieren dispositivo corporativo'),
  (8, 'INVITADOS', 'Invitados', 'Invitado externo solo accede a documentos publicados de nivel 1')
ON CONFLICT (id) DO UPDATE SET codigo = EXCLUDED.codigo, nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion;

-- Todos los usuarios de demostracion usan la clave: Demo1234!
INSERT INTO usuarios
  (id, nombre, correo, password_hash, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado)
VALUES
  (1, 'Administrador SecureDocs', 'admin@securedocs.com', '$2b$10$9YzTw3KjcBpxn/QCSa6nIeGZMh4.l6jwvTs/lP3PqJ6k4zjeNlTwO', 1, 1, 5, 'PERU', 'INTERNO', 'ACTIVO'),
  (2, 'Gerente Finanzas', 'gerente@securedocs.com', '$2b$10$9YzTw3KjcBpxn/QCSa6nIeGZMh4.l6jwvTs/lP3PqJ6k4zjeNlTwO', 2, 1, 5, 'PERU', 'INTERNO', 'ACTIVO'),
  (3, 'Supervisor Finanzas', 'supervisor@securedocs.com', '$2b$10$9YzTw3KjcBpxn/QCSa6nIeGZMh4.l6jwvTs/lP3PqJ6k4zjeNlTwO', 3, 1, 4, 'PERU', 'INTERNO', 'ACTIVO'),
  (4, 'Empleado Finanzas', 'empleado@securedocs.com', '$2b$10$9YzTw3KjcBpxn/QCSa6nIeGZMh4.l6jwvTs/lP3PqJ6k4zjeNlTwO', 4, 1, 2, 'PERU', 'INTERNO', 'ACTIVO'),
  (5, 'Auditor Corporativo', 'auditor@securedocs.com', '$2b$10$9YzTw3KjcBpxn/QCSa6nIeGZMh4.l6jwvTs/lP3PqJ6k4zjeNlTwO', 5, 4, 5, 'PERU', 'INTERNO', 'ACTIVO'),
  (6, 'Invitado Externo', 'invitado@securedocs.com', '$2b$10$9YzTw3KjcBpxn/QCSa6nIeGZMh4.l6jwvTs/lP3PqJ6k4zjeNlTwO', 6, 1, 1, 'PERU', 'EXTERNO', 'ACTIVO'),
  (7, 'Segundo Empleado', 'empleado2@securedocs.com', '$2b$10$9YzTw3KjcBpxn/QCSa6nIeGZMh4.l6jwvTs/lP3PqJ6k4zjeNlTwO', 4, 1, 3, 'PERU', 'INTERNO', 'ACTIVO'),
  (8, 'Usuario Inactivo', 'inactivo@securedocs.com', '$2b$10$9YzTw3KjcBpxn/QCSa6nIeGZMh4.l6jwvTs/lP3PqJ6k4zjeNlTwO', 4, 2, 2, 'PERU', 'INTERNO', 'INACTIVO'),
  (9, 'Empleado Recursos Humanos', 'rrhh@securedocs.com', '$2b$10$9YzTw3KjcBpxn/QCSa6nIeGZMh4.l6jwvTs/lP3PqJ6k4zjeNlTwO', 4, 2, 2, 'PERU', 'INTERNO', 'ACTIVO')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  correo = EXCLUDED.correo,
  password_hash = EXCLUDED.password_hash,
  rol_id = EXCLUDED.rol_id,
  departamento_id = EXCLUDED.departamento_id,
  nivel_seguridad = EXCLUDED.nivel_seguridad,
  pais = EXCLUDED.pais,
  tipo_contrato = EXCLUDED.tipo_contrato,
  estado = EXCLUDED.estado;

INSERT INTO documentos
  (id, titulo, descripcion, propietario_id, departamento_id, nivel_confidencialidad, estado, pais)
VALUES
  (1, 'Comunicado publico', 'Documento publico para colaboradores e invitados', 4, 1, 1, 'PUBLICADO', 'PERU'),
  (2, 'Presupuesto operativo', 'Presupuesto pendiente de aprobacion', 4, 1, 2, 'PENDIENTE', 'PERU'),
  (3, 'Politica de contratacion', 'Documento interno de Recursos Humanos', 9, 2, 2, 'APROBADO', 'PERU'),
  (4, 'Proyeccion financiera confidencial', 'Informacion financiera altamente confidencial', 3, 1, 4, 'APROBADO', 'PERU'),
  (5, 'Plan estrategico secreto', 'Documento de maxima confidencialidad', 2, 1, 5, 'PUBLICADO', 'PERU'),
  (6, 'Operacion regional Chile', 'Documento correspondiente a operaciones en Chile', 2, 1, 2, 'APROBADO', 'CHILE'),
  (7, 'Informe de otro empleado', 'Documento para comprobar la politica de propiedad', 7, 1, 2, 'PENDIENTE', 'PERU'),
  (8, 'Documento temporal eliminable', 'Documento reservado para la prueba de eliminacion', 2, 1, 1, 'PENDIENTE', 'PERU'),
  (9, 'Reporte de riesgo nivel tres', 'Documento para validar nivel de seguridad del supervisor', 3, 1, 3, 'APROBADO', 'PERU')
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descripcion = EXCLUDED.descripcion,
  propietario_id = EXCLUDED.propietario_id,
  departamento_id = EXCLUDED.departamento_id,
  nivel_confidencialidad = EXCLUDED.nivel_confidencialidad,
  estado = EXCLUDED.estado,
  pais = EXCLUDED.pais;

SELECT setval('departamentos_id_seq', GREATEST((SELECT MAX(id) FROM departamentos), 1));
SELECT setval('roles_id_seq', GREATEST((SELECT MAX(id) FROM roles), 1));
SELECT setval('permisos_id_seq', GREATEST((SELECT MAX(id) FROM permisos), 1));
SELECT setval('politicas_id_seq', GREATEST((SELECT MAX(id) FROM politicas), 1));
SELECT setval('usuarios_id_seq', GREATEST((SELECT MAX(id) FROM usuarios), 1));
SELECT setval('documentos_id_seq', GREATEST((SELECT MAX(id) FROM documentos), 1));

COMMIT;

