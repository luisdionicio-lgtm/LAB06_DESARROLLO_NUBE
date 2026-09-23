# Matriz RBAC de SecureDocs

Los permisos se almacenan en PostgreSQL mediante `roles`, `permisos` y `rol_permisos`. La API no decide el acceso mediante condicionales de rol dispersos.

| Operación | Administrador | Gerente | Supervisor | Empleado | Auditor | Invitado |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Crear documento | Sí | Sí | Sí | Sí | No | No |
| Consultar documento | Sí | Sí | Sí | Sí | Sí | Sí |
| Modificar documento | Sí | Sí | Sí | Sí | No | No |
| Eliminar documento | Sí | Sí | No | No | No | No |
| Aprobar documento | Sí | Sí | Sí | No | No | No |
| Ver auditoría | Sí | Sí | No | No | Sí | No |
| Gestionar usuarios | Sí | No | No | No | No | No |
| Asignar roles | Sí | No | No | No | No | No |

RBAC es la primera etapa de autorización. Tener permiso RBAC no garantiza acceso: después deben cumplirse las políticas ABAC aplicables.

