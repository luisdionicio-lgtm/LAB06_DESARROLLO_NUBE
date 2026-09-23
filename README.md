# SecureDocs

SecureDocs es una API REST para gestionar documentos internos de TechCorp S.A. Aplica autenticación JWT, permisos basados en roles RBAC, políticas basadas en atributos ABAC y auditoría de decisiones permitidas y denegadas.

## Objetivo

Demostrar que un permiso asignado por rol no es suficiente por sí solo. Una operación se autoriza únicamente cuando el usuario está autenticado, RBAC permite la acción y todas las políticas ABAC aplicables se cumplen.

## Tecnologías utilizadas

- Node.js 22 y Express 5
- PostgreSQL 18
- JWT y bcryptjs
- Docker Desktop y Docker Compose
- Postman
- Pruebas nativas de Node.js

## Arquitectura

```text
Postman -> Express -> JWT -> Autorización central -> RBAC + ABAC
                                               -> Auditoría
                     Controladores -> Repositorios -> PostgreSQL
```

Consulta [la arquitectura detallada](docs/arquitectura.md) y [el modelo de datos](docs/modelo-base-datos.md).

## Estructura del proyecto

```text
securedocs/
├── database/                Esquema y datos iniciales
├── docs/                    Matrices, diagramas y guías
├── scripts/                 Verificación automática de escenarios
├── src/
│   ├── config/              Conexión PostgreSQL
│   ├── controllers/         Casos de uso HTTP
│   ├── middleware/          JWT, autorización y errores
│   ├── policies/            Ocho políticas ABAC
│   ├── repositories/        Consultas SQL parametrizadas
│   ├── routes/              Rutas Express
│   ├── services/            RBAC, ABAC, autorización y auditoría
│   └── utils/               Validaciones y utilidades
├── test/                    Pruebas unitarias
├── compose.yaml
├── Dockerfile
└── SecureDocs.postman_collection.json
```

## Requisitos previos

Para desarrollo local:

- Node.js 22 o posterior
- PostgreSQL 18 en `localhost:5432`
- npm

Para la entrega reproducible:

- Docker Desktop con Docker Compose
- Postman opcional para pruebas manuales

## Instalación

```powershell
npm install
Copy-Item .env.example .env
```

Completa `.env`. El archivo real está ignorado por Git.

## Variables de entorno

| Variable | Uso | Desarrollo local | Docker |
|---|---|---|---|
| `PORT` | Puerto HTTP | `3000` | `3000` |
| `DB_HOST` | Servidor PostgreSQL | `localhost` | Se reemplaza por `database` |
| `DB_PORT` | Puerto PostgreSQL | `5432` | Se reemplaza por `5432` interno |
| `DB_NAME` | Base de datos | `securedocs_db` | `securedocs_db` |
| `DB_USER` | Usuario | `postgres` | `postgres` |
| `DB_PASSWORD` | Contraseña | Valor local | Valor local de `.env` |
| `JWT_SECRET` | Firma de tokens | Cadena secreta larga | Valor local de `.env` |
| `JWT_EXPIRES_IN` | Duración JWT | `2h` | `2h` |
| `POSTGRES_HOST_PORT` | Puerto del contenedor DB | No aplica | `5433` |

## PostgreSQL local con PgAdmin

El modo local usa el servidor PostgreSQL instalado en Windows. La configuración esperada es:

```text
Host: localhost
Puerto: 5432
Base: securedocs_db
Usuario: postgres
```

### Crear la base de datos

Desde PgAdmin, abre Query Tool sobre la base `postgres` y ejecuta:

```sql
CREATE DATABASE securedocs_db;
```

Después abre Query Tool sobre `securedocs_db` y ejecuta, en este orden:

1. `database/schema.sql`
2. `database/seed.sql`

También puedes usar PowerShell:

```powershell
$env:PGPASSWORD='TU_PASSWORD'
& 'C:\Program Files\PostgreSQL\18\bin\createdb.exe' -h localhost -U postgres securedocs_db
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d securedocs_db -f database/schema.sql
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d securedocs_db -f database/seed.sql
```

Los scripts son repetibles: usan `IF NOT EXISTS` y `ON CONFLICT`.

## Inicio local

```powershell
npm run dev
```

La API estará en `http://localhost:3000`. Comprueba `GET http://localhost:3000/health`.

## Ejecución completa con Docker Desktop

Docker levanta API y PostgreSQL en conjunto. Como PostgreSQL local ocupa `5432`, el contenedor publica su base en `5433`.

```powershell
docker compose up -d --build
docker compose ps
```

Servicios:

- API: `http://localhost:3000`
- PostgreSQL del proyecto: `localhost:5433`

Para registrar la base Docker en PgAdmin:

```text
Nombre: SecureDocs Docker
Host: localhost
Puerto: 5433
Base inicial: securedocs_db
Usuario: postgres
Contraseña: la definida en .env
```

Para detener sin borrar datos:

```powershell
docker compose stop
```

`docker compose down -v` elimina el volumen y reinicia los datos; úsalo únicamente cuando quieras una base limpia.

## Roles

- `ADMINISTRADOR`: gestiona usuarios y todas las operaciones documentales.
- `GERENTE`: supervisa y elimina documentos de su área.
- `SUPERVISOR`: revisa y aprueba documentos de su área.
- `EMPLEADO`: crea, consulta y modifica documentos propios de su área.
- `AUDITOR`: consulta documentos autorizados y auditoría.
- `INVITADO`: consulta temporalmente documentos públicos de nivel 1.

La [matriz RBAC](docs/matriz-rbac.md) contiene los permisos exactos.

## Políticas ABAC

Se evalúan de forma centralizada:

1. Estado activo del usuario.
2. Departamento.
3. Nivel de seguridad.
4. Propiedad para modificaciones de empleados.
5. Horario de 08:00 a 18:00 para niveles 4 y 5.
6. País del usuario y ubicación.
7. Dispositivo corporativo para niveles 4 y 5.
8. Restricciones de invitados.

Consulta la [matriz ABAC](docs/matriz-abac.md).

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | Iniciar sesión y obtener JWT |
| POST | `/auth/logout` | Registrar cierre de sesión |
| GET | `/usuarios` | Listar usuarios |
| GET | `/usuarios/:id` | Consultar usuario |
| POST | `/usuarios` | Crear usuario |
| PUT | `/usuarios/:id` | Modificar usuario |
| PATCH | `/usuarios/:id/estado` | Activar, suspender o desactivar |
| GET | `/documentos` | Listar únicamente documentos autorizados |
| GET | `/documentos/:id` | Consultar documento |
| POST | `/documentos` | Crear documento pendiente |
| PUT | `/documentos/:id` | Modificar documento |
| DELETE | `/documentos/:id` | Eliminar documento |
| POST | `/documentos/:id/aprobar` | Aprobar documento pendiente |
| GET | `/auditoria` | Consultar auditoría; acepta `limite`, `resultado` y `usuario_id` |

Excepto login, raíz y health, las rutas requieren:

```text
Authorization: Bearer TOKEN
```

## Usuarios de prueba

Todos usan la contraseña `Demo1234!`.

| Correo | Rol | Área | Nivel | Estado |
|---|---|---|---:|---|
| `admin@securedocs.com` | ADMINISTRADOR | FINANZAS | 5 | ACTIVO |
| `gerente@securedocs.com` | GERENTE | FINANZAS | 5 | ACTIVO |
| `supervisor@securedocs.com` | SUPERVISOR | FINANZAS | 4 | ACTIVO |
| `empleado@securedocs.com` | EMPLEADO | FINANZAS | 2 | ACTIVO |
| `empleado2@securedocs.com` | EMPLEADO | FINANZAS | 3 | ACTIVO |
| `auditor@securedocs.com` | AUDITOR | LEGAL | 5 | ACTIVO |
| `invitado@securedocs.com` | INVITADO | FINANZAS | 1 | ACTIVO |
| `inactivo@securedocs.com` | EMPLEADO | RRHH | 2 | INACTIVO |
| `rrhh@securedocs.com` | EMPLEADO | RRHH | 2 | ACTIVO |

Las claves se guardan como hash bcrypt, nunca como texto plano.

## Ejemplo de login en Postman

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "correo": "admin@securedocs.com",
  "password": "Demo1234!"
}
```

Copia `token` y úsalo como Bearer Token. La colección incluida guarda automáticamente los tokens en variables.

## Headers especiales para ABAC

| Header | Ejemplo | Descripción |
|---|---|---|
| `x-dispositivo` | `CORPORATIVO` | Tipo de dispositivo |
| `x-ubicacion` | `PERU` | Ubicación de la petición |
| `x-hora-prueba` | `11:30` | Hora simulada `HH:mm` para pruebas |

Si no envías `x-hora-prueba`, la API usa la hora actual de `America/Lima`. Si omites ubicación o dispositivo, las políticas que los requieren pueden denegar el acceso.

## Casos de prueba

Con la API activa:

```powershell
npm test
npm run verify
```

`npm test` valida el motor ABAC. `npm run verify` autentica usuarios y ejecuta los 17 escenarios contra la API. La descripción completa está en [casos de prueba](docs/casos-prueba.md).

También puedes importar `SecureDocs.postman_collection.json` y ejecutar las carpetas en orden después de reiniciar la base de datos.

## Auditoría

Cada decisión de autorización registra:

- usuario y correo;
- recurso y acción;
- fecha y hora;
- resultado `PERMITIDO` o `DENEGADO`;
- tipo `RBAC`, `ABAC`, `AUTENTICACION` o `RECURSO`;
- motivo;
- IP, ubicación y dispositivo.

Las denegaciones se escriben antes de devolver `403`.

## Estructura de seguridad

- Passwords con bcrypt, factor 10.
- JWT con identificador mínimo del usuario y expiración.
- Secretos fuera del repositorio mediante `.env`.
- Consultas SQL parametrizadas.
- Estado del usuario verificado al autenticar y en cada petición.
- RBAC consultado en PostgreSQL.
- ABAC centralizado y reutilizable.
- Errores sin stack traces ni secretos.
- Auditoría de decisiones permitidas y denegadas.
- Límite de cuerpo JSON de 100 KB.

## Evidencias y demostración

- [Guía de capturas](docs/evidencias.md)
- [Guía para el video](docs/guia-video.md)

## Propuesta de commits progresivos

```text
chore: crear estructura inicial de SecureDocs
feat: configurar Express PostgreSQL y Docker
feat: implementar modelo de datos y seeds
feat: implementar autenticacion JWT
feat: implementar gestion de usuarios
feat: implementar control de acceso RBAC
feat: implementar motor de politicas ABAC
feat: implementar gestion y aprobacion de documentos
feat: implementar registro de auditoria
test: agregar casos de prueba de autorizacion
docs: agregar Postman arquitectura matrices y README
```

## Integrantes

- Jaime Farfán

## Conclusiones

SecureDocs separa autenticación, permisos por rol y políticas contextuales. La autorización no depende de condicionales de rol dispersos y cada decisión deja evidencia. La misma solución funciona con PostgreSQL local para desarrollo y con Docker Compose para una entrega reproducible.

