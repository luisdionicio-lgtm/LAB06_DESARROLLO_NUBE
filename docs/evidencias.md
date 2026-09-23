# Guía de evidencias de SecureDocs

Guarda las capturas en una carpeta externa al repositorio o en `docs/evidencias/` si el docente solicita incluirlas.

## Capturas recomendadas

1. Docker Desktop con `securedocs-api` y `securedocs-db` en ejecución y estado saludable.
2. `GET /health` con API y base de datos conectadas.
3. Login exitoso y JWT del administrador, ocultando parte del token si la imagen será pública.
4. Caso permitido por área, mostrando estado `200`.
5. Denegación RBAC al empleado que intenta aprobar.
6. Denegación ABAC por departamento.
7. Denegación ABAC por nivel de seguridad.
8. Denegación por horario usando `x-hora-prueba: 20:00`.
9. Denegación por dispositivo usando `x-dispositivo: PERSONAL`.
10. Acceso permitido y denegado del invitado.
11. Consulta `GET /auditoria` mostrando decisiones permitidas y denegadas.
12. PgAdmin mostrando las tablas y algunos registros de `auditorias`.
13. Terminal con `npm test` y `npm run verify`, incluyendo `17 de 17 casos`.
14. Aplicación web mostrando el panel principal, contexto ABAC, matrices de seguridad y centro de evidencias.

Cada captura debe mostrar método, URL, encabezados relevantes, cuerpo enviado, estado HTTP y respuesta JSON. Evita publicar la contraseña de PostgreSQL, el contenido completo del JWT o el valor de `JWT_SECRET`.
