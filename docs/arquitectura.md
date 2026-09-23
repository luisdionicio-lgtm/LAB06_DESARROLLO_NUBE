# Arquitectura de SecureDocs

SecureDocs usa una arquitectura REST modular. El middleware de autorización recibe usuario, recurso, acción y entorno; primero consulta RBAC en PostgreSQL, luego evalúa las políticas ABAC y finalmente registra la decisión antes de continuar o devolver `403`.

```mermaid
flowchart TD
    C[Cliente o Postman] --> API[Express REST API]
    API --> AUTH[Autenticación JWT]
    AUTH --> AZ[Autorización central]
    AZ --> RBAC[Servicio RBAC]
    AZ --> ABAC[Motor ABAC]
    RBAC --> AUD[Servicio de auditoría]
    ABAC --> AUD
    AZ --> CTRL[Controladores]
    CTRL --> UR[Repositorio de usuarios]
    CTRL --> DR[Repositorio de documentos]
    CTRL --> AR[Repositorio de auditoría]
    UR --> PG[(PostgreSQL)]
    DR --> PG
    AR --> PG
    AUD --> AR
```

## Flujo de autorización

```mermaid
flowchart TD
    A[Solicitud] --> B[Validar JWT y cargar usuario]
    B --> C{Usuario activo}
    C -- No --> D[Auditar y denegar por ABAC]
    C -- Sí --> E{Permiso RBAC en base de datos}
    E -- No --> F[Auditar y denegar por RBAC]
    E -- Sí --> G{Políticas ABAC aplicables}
    G -- No --> H[Auditar y denegar por ABAC]
    G -- Sí --> I[Auditar autorización]
    I --> J[Ejecutar controlador]
```

La capa de repositorios concentra consultas parametrizadas. Los controladores validan entradas y orquestan casos de uso, pero no contienen reglas RBAC o ABAC dispersas.

