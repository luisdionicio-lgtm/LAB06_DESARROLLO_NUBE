# SecureDocs

Aplicación web para gestionar documentos internos de TechCorp S.A. con autenticación JWT, autorización RBAC + ABAC y registro de auditoría.

## Funcionalidades

- Inicio de sesión con JWT y contraseñas bcrypt.
- Gestión de usuarios, roles y estados.
- Creación, consulta, modificación, eliminación y aprobación de documentos.
- Permisos RBAC almacenados en PostgreSQL.
- Ocho políticas ABAC centralizadas.
- Auditoría de accesos permitidos y denegados.
- Interfaz web responsive.
- Colección Postman y verificación automática de 17 casos.

## Tecnologías

- Node.js y Express
- PostgreSQL
- JWT y bcryptjs
- HTML, CSS y JavaScript
- Docker Desktop
- Postman

## Ejecución con Docker

### 1. Configurar variables

Copia `.env.example` como `.env` y configura la contraseña de PostgreSQL y el secreto JWT.

### 2. Levantar el proyecto

```powershell
docker compose up -d --build
docker compose ps
```

Servicios:

- Aplicación web: [http://localhost:3000](http://localhost:3000)
- Health check: [http://localhost:3000/health](http://localhost:3000/health)
- PostgreSQL Docker: `localhost:5433`

Para detenerlo:

```powershell
docker compose stop
```

Para reiniciar la base de datos desde cero:

```powershell
docker compose down -v
docker compose up -d --build
```

## Usuario inicial

```text
Correo: admin@securedocs.com
Contraseña: Demo1234!
```

Todos los usuarios de demostración utilizan `Demo1234!`.

| Usuario | Rol |
|---|---|
| `admin@securedocs.com` | Administrador |
| `gerente@securedocs.com` | Gerente |
| `supervisor@securedocs.com` | Supervisor |
| `empleado@securedocs.com` | Empleado |
| `auditor@securedocs.com` | Auditor |
| `invitado@securedocs.com` | Invitado |
| `inactivo@securedocs.com` | Usuario inactivo |

## Headers ABAC para pruebas

```text
x-ubicacion: PERU
x-dispositivo: CORPORATIVO
x-hora-prueba: 10:00
```

`x-hora-prueba` es opcional. Si no se envía, se utiliza la hora actual de Lima.

## API principal

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/auth/login` | Iniciar sesión |
| GET | `/usuarios` | Listar usuarios |
| POST | `/usuarios` | Crear usuario |
| PUT | `/usuarios/:id` | Actualizar usuario |
| GET | `/documentos` | Listar documentos autorizados |
| GET | `/documentos/:id` | Consultar documento |
| POST | `/documentos` | Crear documento |
| PUT | `/documentos/:id` | Modificar documento |
| DELETE | `/documentos/:id` | Eliminar documento |
| POST | `/documentos/:id/aprobar` | Aprobar documento |
| GET | `/auditoria` | Consultar auditoría |

## Seguridad

Una operación se permite únicamente cuando:

```text
JWT válido + permiso RBAC + políticas ABAC cumplidas
```

Las políticas ABAC verifican estado del usuario, departamento, nivel de seguridad, propiedad, horario, país, dispositivo e invitados.

## Pruebas

Con los contenedores activos:

```powershell
npm test
npm run verify
```

Resultado esperado:

```text
9 pruebas unitarias aprobadas
17 de 17 casos completados correctamente
```

También puedes importar [SecureDocs.postman_collection.json](SecureDocs.postman_collection.json) en Postman.

## Documentación

- [Arquitectura](docs/arquitectura.md)
- [Modelo de base de datos](docs/modelo-base-datos.md)
- [Matriz RBAC](docs/matriz-rbac.md)
- [Matriz ABAC](docs/matriz-abac.md)
- [Casos de prueba](docs/casos-prueba.md)
- [Guía para adjuntar evidencias](docs/guia-entrega-evidencias.md)
- [Guía para el video](docs/guia-video.md)

## Autor

Jaime Farfán — Laboratorio 06 Cloud Security
