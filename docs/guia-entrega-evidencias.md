# Guía para preparar y adjuntar las evidencias

Esta guía organiza las pruebas que exige el Laboratorio 06. El objetivo es que cada imagen demuestre un requisito concreto y pueda verificarse sin depender del video.

## 1. Preparar una ejecución limpia

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
docker compose down -v
docker compose up -d --build
docker compose ps
```

Los dos servicios deben aparecer como `healthy`:

- `securedocs-api`
- `securedocs-db`

Abre `http://localhost:3000` y mantén Postman y PgAdmin disponibles.

## 2. Reglas para todas las capturas

- Usa formato PNG y una resolución legible.
- Muestra método, URL, estado HTTP y respuesta JSON en Postman.
- En pruebas ABAC, muestra los headers `x-ubicacion`, `x-dispositivo` o `x-hora-prueba` que originan la decisión.
- Oculta parte del JWT si la evidencia se publicará.
- Nunca muestres `.env`, `JWT_SECRET` ni la contraseña de PostgreSQL.
- Agrega debajo de cada captura un título y una conclusión de una oración.

Ejemplo de pie de imagen:

```text
Figura 5. Denegación RBAC al intentar aprobar como EMPLEADO.
El servidor devuelve 403 y explica que el rol no posee el permiso APROBAR_DOCUMENTO.
```

## 3. Capturas requeridas

Guarda las imágenes con estos nombres para mantenerlas ordenadas.

### E01 Docker

Archivo: `E01-docker-servicios.png`

Captura Docker Desktop o `docker compose ps` mostrando API y base de datos saludables.

### E02 Estado de la aplicación

Archivo: `E02-health.png`

Abre `GET http://localhost:3000/health`. Debe mostrar:

```json
{
  "status": "ok",
  "database": "connected"
}
```

### E03 Login y JWT

Archivo: `E03-login-jwt.png`

Ejecuta `POST /auth/login` con el administrador. Muestra estado 200, datos básicos y existencia del token. Oculta la mayor parte del token.

### E04 Panel web

Archivo: `E04-panel-web.png`

Inicia sesión en la web y captura el panel con documentos visibles, rol, nivel y cadena JWT → RBAC → ABAC → auditoría.

### E05 Acceso permitido por departamento

Archivo: `E05-permitido-departamento.png`

Como `empleado@securedocs.com`, consulta `GET /documentos/2` con ubicación Perú. Debe devolver 200.

### E06 Denegación por departamento

Archivo: `E06-abac-departamento.png`

Con el mismo empleado, consulta `GET /documentos/3`. Debe devolver 403, tipo ABAC y política `DEPARTAMENTO`.

### E07 Denegación RBAC

Archivo: `E07-rbac-aprobacion.png`

Como empleado, ejecuta `POST /documentos/2/aprobar`. Debe devolver 403 y tipo RBAC.

### E08 Denegación por nivel

Archivo: `E08-abac-nivel.png`

Como empleado nivel 2, consulta `GET /documentos/4`. Debe devolver 403 y política `NIVEL_SEGURIDAD`.

### E09 Denegación por horario

Archivo: `E09-abac-horario.png`

Como administrador, consulta `GET /documentos/4` con:

```text
x-ubicacion: PERU
x-dispositivo: CORPORATIVO
x-hora-prueba: 20:00
```

Debe devolver 403 y política `HORARIO`.

### E10 Denegación por dispositivo

Archivo: `E10-abac-dispositivo.png`

Como administrador, consulta `GET /documentos/5` a las 10:00 con `x-dispositivo: PERSONAL`. Debe devolver 403 y política `DISPOSITIVO`.

### E11 Invitado permitido y denegado

Archivos:

- `E11a-invitado-publico.png`: `GET /documentos/1`, estado 200.
- `E11b-invitado-confidencial.png`: `GET /documentos/4`, estado 403.

### E12 Auditoría

Archivo: `E12-auditoria.png`

Como auditor, abre la sección web Auditoría o ejecuta `GET /auditoria`. Muestra al menos una decisión permitida y una denegada con usuario, recurso, acción, fecha y motivo.

### E13 PostgreSQL en PgAdmin

Archivo: `E13-pgadmin.png`

Conecta PgAdmin a `localhost:5433`, base `securedocs_db`. Muestra las ocho tablas principales y el resultado de:

```sql
SELECT usuario_correo, recurso, accion, resultado, tipo, motivo, fecha
FROM auditorias
ORDER BY fecha DESC
LIMIT 20;
```

### E14 Pruebas automáticas

Archivo: `E14-pruebas-17-casos.png`

Ejecuta:

```powershell
npm test
npm run verify
```

La captura debe incluir `9` pruebas unitarias aprobadas y `17 de 17 casos completados correctamente`.

## 4. Cómo adjuntar las evidencias

1. Crea una copia del documento del laboratorio para no modificar el original.
2. Al final del procedimiento, agrega una sección llamada `Evidencias de funcionamiento`.
3. Inserta las figuras E01 a E14 en el mismo orden de esta guía.
4. Debajo de cada figura escribe el título, el resultado obtenido y el requisito demostrado.
5. Mantén cada captura junto con su explicación; evita que el pie quede en la siguiente página.
6. Agrega una sección final `Repositorio y ejecución` con el enlace:
   `https://github.com/luisdionicio-lgtm/LAB06_DESARROLLO_NUBE`
7. Incluye los comandos `docker compose up -d --build`, `npm test` y `npm run verify`.
8. Exporta el documento final a PDF y revisa que las capturas sean legibles al 100 %.

También puedes guardar copias de los PNG en `docs/capturas/`. No incluyas archivos con secretos ni tokens completos.

## 5. Orden sugerido del video

1. Explicar el problema y la diferencia RBAC/ABAC.
2. Mostrar Docker Desktop y el health check.
3. Iniciar sesión en SecureDocs.
4. Mostrar documentos y usuarios según rol.
5. Cambiar el contexto ABAC y demostrar horario o dispositivo.
6. Ejecutar una autorización permitida y denegaciones RBAC/ABAC.
7. Mostrar la auditoría en la web y en PgAdmin.
8. Ejecutar los 17 casos automáticos.
9. Mostrar el repositorio GitHub y el README.

La guía de exposición ampliada está en `docs/guia-video.md`.

