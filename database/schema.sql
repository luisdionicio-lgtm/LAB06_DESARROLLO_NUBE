BEGIN;

CREATE TABLE IF NOT EXISTS departamentos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  descripcion VARCHAR(200),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE,
  descripcion VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS permisos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  descripcion VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permiso_id INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  rol_id INTEGER NOT NULL REFERENCES roles(id),
  departamento_id INTEGER NOT NULL REFERENCES departamentos(id),
  nivel_seguridad SMALLINT NOT NULL CHECK (nivel_seguridad BETWEEN 1 AND 5),
  pais VARCHAR(60) NOT NULL,
  tipo_contrato VARCHAR(20) NOT NULL CHECK (tipo_contrato IN ('INTERNO', 'EXTERNO')),
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(180) NOT NULL,
  descripcion TEXT NOT NULL,
  propietario_id INTEGER NOT NULL REFERENCES usuarios(id),
  departamento_id INTEGER NOT NULL REFERENCES departamentos(id),
  nivel_confidencialidad SMALLINT NOT NULL CHECK (nivel_confidencialidad BETWEEN 1 AND 5),
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'PUBLICADO', 'ARCHIVADO')),
  pais VARCHAR(60) NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS politicas (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS auditorias (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_correo VARCHAR(160),
  recurso VARCHAR(180) NOT NULL,
  accion VARCHAR(50) NOT NULL,
  resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('PERMITIDO', 'DENEGADO')),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('AUTENTICACION', 'RBAC', 'ABAC', 'RECURSO')),
  motivo TEXT NOT NULL,
  direccion_ip INET,
  ubicacion VARCHAR(60),
  dispositivo VARCHAR(40),
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_departamento ON usuarios(departamento_id);
CREATE INDEX IF NOT EXISTS idx_documentos_departamento ON documentos(departamento_id);
CREATE INDEX IF NOT EXISTS idx_documentos_propietario ON documentos(propietario_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_usuario_fecha ON auditorias(usuario_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_auditorias_resultado ON auditorias(resultado);

COMMIT;

