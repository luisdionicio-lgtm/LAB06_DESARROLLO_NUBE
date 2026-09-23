# Modelo de base de datos de SecureDocs

```mermaid
erDiagram
    DEPARTAMENTOS ||--o{ USUARIOS : pertenece
    DEPARTAMENTOS ||--o{ DOCUMENTOS : clasifica
    ROLES ||--o{ USUARIOS : asigna
    ROLES ||--o{ ROL_PERMISOS : contiene
    PERMISOS ||--o{ ROL_PERMISOS : relaciona
    USUARIOS ||--o{ DOCUMENTOS : posee
    USUARIOS ||--o{ AUDITORIAS : genera

    DEPARTAMENTOS {
      int id PK
      varchar nombre UK
    }
    ROLES {
      int id PK
      varchar nombre UK
    }
    PERMISOS {
      int id PK
      varchar codigo UK
    }
    ROL_PERMISOS {
      int rol_id PK,FK
      int permiso_id PK,FK
    }
    USUARIOS {
      int id PK
      varchar correo UK
      varchar password_hash
      int rol_id FK
      int departamento_id FK
      int nivel_seguridad
      varchar pais
      varchar tipo_contrato
      varchar estado
    }
    DOCUMENTOS {
      int id PK
      int propietario_id FK
      int departamento_id FK
      int nivel_confidencialidad
      varchar estado
      varchar pais
    }
    AUDITORIAS {
      bigint id PK
      int usuario_id FK
      varchar recurso
      varchar accion
      varchar resultado
      varchar tipo
      text motivo
      timestamptz fecha
    }
    POLITICAS {
      int id PK
      varchar codigo UK
      boolean activa
    }
```

Las tablas incluyen claves foráneas, restricciones de nivel y estado, índices para consultas frecuentes y marcas de tiempo. `auditorias.usuario_id` admite `NULL` para conservar intentos de autenticación cuando el correo no existe.

