# Diseño Conceptual de Base de Datos (ERP Veterinario)

A continuación tienes el Diagrama Entidad-Relación (ER) conceptual basado en nuestra estructura actual de Prisma. Este diagrama muestra cómo se conectan los diferentes módulos del sistema (Mascotas, Usuarios, Consultas, Caja y Laboratorio).

```mermaid
erDiagram
    Role ||--o{ Usuario : "tiene"
    Usuario ||--o{ Mascota : "propietario de"
    Usuario ||--o{ Atencion : "doctor en"
    Usuario ||--o{ TicketCaja : "cajero de"
    Mascota ||--o{ Atencion : "recibe"
    Consultorio ||--o{ Atencion : "lugar de"
    Atencion ||--o{ ConsumoAtencion : "incluye"
    Producto ||--o{ ConsumoAtencion : "consumido en"
    Atencion ||--o| TicketCaja : "genera"
    Atencion ||--o{ OrdenLaboratorio : "solicita"

    Role {
        String id PK
        String nombre
        Json permisos
    }
    Usuario {
        String id PK
        String nombre
        String email
        String telefono
        String rol_id FK
    }
    Mascota {
        String id PK
        String nombre
        String especie
        String sexo
        String propietario_id FK
    }
    Consultorio {
        String id PK
        String nombre
        Enum estado
    }
    Atencion {
        String id PK
        String mascota_id FK
        String doctor_id FK
        String consultorio_id FK
        String motivo
        Enum estado_pago
    }
    Producto {
        String id PK
        String nombre
        Decimal precio_venta
        Int stock_actual
    }
    ConsumoAtencion {
        String id PK
        String atencion_id FK
        String producto_id FK
        Int cantidad
    }
    TicketCaja {
        String id PK
        String atencion_id FK
        Decimal total
        Enum estado_ticket
    }
    OrdenLaboratorio {
        String id PK
        String tipo_examen
        Enum estado_examen
    }
```

## Pruebas en un Gestor de Bases de Datos (DBeaver, pgAdmin, DataGrip)

Como ya conectamos el proyecto a **Neon (en la nube)** usando Prisma (`npx prisma db push`), **todas estas tablas, llaves foráneas y relaciones ya fueron creadas automáticamente en tu base de datos**. No necesitas correr scripts SQL manualmente.

### ¿Cómo conectarse para probar y revisar?

Para ver la base de datos, insertar datos de prueba o revisar las relaciones gráficamente, simplemente abre tu gestor SQL favorito (como **DBeaver** o **TablePlus**) y crea una conexión nueva usando **exactamente la misma URL** de Neon que tienes en tu archivo `.env`:

```text
postgresql://neondb_owner:npg_qhs4SjlKndU2@ep-red-waterfall-acq0vky2-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Si tu gestor te pide los campos separados (Host, Port, User...):**
- **Host / Server:** `ep-red-waterfall-acq0vky2-pooler.sa-east-1.aws.neon.tech`
- **Puerto:** `5432`
- **Base de Datos / Database:** `neondb`
- **Usuario:** `neondb_owner`
- **Contraseña:** `npg_qhs4SjlKndU2`
- **SSL:** `Require`

Simplemente conéctate y verás el esquema `public` con todas las tablas perfectamente creadas y estructuradas gracias a Prisma.
