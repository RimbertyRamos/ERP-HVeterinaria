# Plan de Implementación: Integración de Pacientes, Clínica y Caja

Actualmente tenemos el diseño visual integrado y el Backend base funcionando con Autenticación. El siguiente gran paso es darle vida a esas vistas conectándolas a la base de datos real.

Como el software se ha simplificado (dejando de lado Laboratorio y Farmacia por ahora), nos centraremos en el corazón de la clínica: **Pacientes, Consultas y Ventas/Pagos**.

## User Review Required
> [!IMPORTANT]
> Por favor, revisa este plan. Si estás de acuerdo con el orden de las tareas, aprébalo para que comience a programar.

## Fases de Implementación

### Fase 1: Integración del Módulo de Mascotas (Pacientes)
Conectaremos la vista de `Patients.tsx` (que actualmente tiene datos estáticos) con nuestro endpoint de backend `/api/mascotas`.
- Implementaremos llamadas fetch/axios para obtener la lista de pacientes desde Neon.
- Crearemos la funcionalidad para el botón "Nuevo Paciente", permitiendo registrar una Mascota y su Dueño en la base de datos directamente desde la interfaz.

### Fase 2: Módulo de Atención Clínica (Historial y Consultas)
La base de datos tiene la tabla `Atencion` que conecta a un Doctor, una Mascota, y un Consultorio.
- [Backend]: Crearemos `atencion.service.ts`, `atencion.controller.ts` y sus rutas respectivas.
- [Frontend]: Conectaremos el formulario tipo SOAP (Subjetivo, Objetivo, Examen Físico) que está dentro del detalle de Pacientes para que guarde cada consulta clínica en el historial del animal.

### Fase 3: Módulo POS (Caja) y Productos Base
Permitirá cobrar las consultas y algunos productos sueltos.
- [Backend]: Crearemos los endpoints para `Producto` y `TicketCaja`.
- [Frontend]: Enlazaremos la vista `POS.tsx` para listar productos, añadirlos al carrito y procesar el cobro (cambiando el estado del ticket a PAGADO).

## Open Questions
> [!NOTE]
> Cuando creemos un "Nuevo Paciente", ¿quieres que se pida registrar primero al dueño (Usuario Cliente) o prefieres crear el dueño y la mascota al mismo tiempo en el mismo formulario?

## Verification Plan
1. Se comprobará que la vista de Pacientes cargue correctamente la información de la base de datos usando el `browser_subagent`.
2. Se realizará una prueba completa insertando una nueva Mascota y registrando una consulta exitosamante.
