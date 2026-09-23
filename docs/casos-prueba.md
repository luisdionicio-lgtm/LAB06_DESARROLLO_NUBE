# Casos de prueba de SecureDocs

La colección `SecureDocs.postman_collection.json` contiene solicitudes preparadas. El comando `npm run verify` ejecuta los 17 casos automáticamente contra `http://localhost:3000`.

| Caso | Escenario | Usuario | Recurso | Esperado |
|---:|---|---|---|---|
| 1 | Empleado consulta documento de su área | empleado | Documento 2 | 200 permitido |
| 2 | Empleado consulta documento de otra área | empleado | Documento 3 | 403 ABAC departamento |
| 3 | Supervisor aprueba documento de su área | supervisor | Documento pendiente | 200 permitido |
| 4 | Empleado intenta aprobar documento | empleado | Documento 2 | 403 RBAC |
| 5 | Usuario nivel 2 consulta nivel 4 | empleado | Documento 4 | 403 ABAC nivel |
| 6 | Gerente elimina documento | gerente | Documento temporal | 200 permitido |
| 7 | Auditor intenta modificar documento | auditor | Documento 1 | 403 RBAC |
| 8 | Usuario inactivo intenta iniciar sesión | inactivo | Login | 403 ABAC estado |
| 9 | Confidencial fuera del horario | administrador | Documento 4 | 403 ABAC horario |
| 10 | Nivel 5 desde dispositivo personal | administrador | Documento 5 | 403 ABAC dispositivo |
| 11 | Invitado accede a documento público | invitado | Documento 1 | 200 permitido |
| 12 | Invitado accede a confidencial | invitado | Documento 4 | 403 ABAC |
| 13 | Administrador crea documento | administrador | Documento nuevo | 201 permitido |
| 14 | Empleado modifica documento ajeno | empleado | Documento de empleado2 | 403 ABAC propiedad |
| 15 | Supervisor nivel 4 consulta nivel 3 | supervisor | Documento 9 | 200 permitido |
| 16 | Usuario Perú consulta documento Chile | administrador | Documento 6 | 403 ABAC país |
| 17 | Auditor consulta registros | auditor | Auditoría | 200 permitido |

## Encabezados de contexto

Para resultados deterministas se usan:

```text
x-ubicacion: PERU
x-dispositivo: CORPORATIVO
x-hora-prueba: 10:00
```

Los casos 9 y 10 cambian respectivamente la hora a `20:00` y el dispositivo a `PERSONAL`.

