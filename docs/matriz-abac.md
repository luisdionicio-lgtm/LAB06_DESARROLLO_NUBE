# Matriz ABAC de SecureDocs

Las políticas están centralizadas en `src/policies/abac.policies.js` y las ejecuta `src/services/abac.service.js`.

| Política | Condición | Aplica a | Resultado si no cumple |
|---|---|---|---|
| Estado del usuario | `usuario.estado == ACTIVO` | Todas las solicitudes | Denegado: usuario inactivo o suspendido |
| Departamento | El departamento del usuario coincide con el documento | Gerente, supervisor y empleado en operaciones documentales | Denegado: documento de otra área |
| Nivel de seguridad | `nivel_seguridad >= nivel_confidencialidad` | Operaciones sobre documentos | Denegado: nivel insuficiente |
| Propiedad | El empleado es propietario | Modificación realizada por empleados | Denegado: documento ajeno |
| Horario | Entre 08:00 y 18:00 | Consulta de documentos nivel 4 o 5 | Denegado: fuera de horario |
| País | País del usuario y ubicación coinciden con el documento | Operaciones sobre documentos | Denegado: país o ubicación diferente |
| Dispositivo | `CORPORATIVO` | Consulta de documentos nivel 4 o 5 | Denegado: dispositivo no corporativo |
| Invitados | Contrato externo, nivel 1 y estado publicado | Consulta realizada por invitados | Denegado: acceso temporal no permitido |

## Decisiones de alcance

- Administrador y auditor no están limitados por departamento. Gerente, supervisor y empleado sí trabajan dentro de su área.
- El país del usuario siempre debe coincidir con el documento. Si se envía `x-ubicacion`, también debe coincidir.
- Horario y dispositivo se evalúan al consultar documentos de nivel 4 o 5.
- Gerente y administrador están exceptuados únicamente de la política de propiedad.

