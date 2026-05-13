# Cronograma de Desarrollo: Sistema Veterinario Integral

Para asegurar el éxito de tu proyecto de grado, sugiero dividir el desarrollo en 5 fases incrementales. Esto te permitirá tener entregables funcionales en cada etapa.

## Fase 1: Cimientos y Seguridad (Semana 1-2)
*   **Backend**: Configuración de Node.js, Express y conexión a PostgreSQL.
*   **Base de Datos**: Creación de tablas de Usuarios y Roles.
*   **Funcionalidad**: Sistema de Login, Registro de Usuarios y gestión de perfiles (Admin, Doctor, etc.).
*   **Hito**: Puedes entrar al sistema con diferentes roles.

## Fase 2: Gestión de Pacientes y Consultorios (Semana 3-4)
*   **Módulos**: Registro de Dueños y Mascotas.
*   **Fichaje**: Sistema de estado de consultorios (Libre/Ocupado).
*   **Historia Clínica**: Formulario para que el Doctor registre diagnósticos.
*   **Hito**: Registro completo de una mascota y su primera consulta.

## Fase 3: Farmacia e Inventario (Semana 5)
*   **Módulos**: Catálogo de productos y control de stock.
*   **Integración**: Descuento automático de stock desde el formulario de consulta.
*   **Alertas**: Notificaciones visuales de stock bajo.
*   **Hito**: Una consulta exitosa descuenta automáticamente una jeringa o medicamento de la farmacia.

## Fase 4: Caja, Contabilidad y Laboratorio (Semana 6-7)
*   **Módulos**:
    *   **Laboratorio**: Registro de órdenes y resultados.
    *   **Caja**: Interfaz de cobro consolidado (Consulta + Farmacia + Lab).
*   **Contabilidad**: Auditoría de tickets y reportes de ingresos diarios.
*   **Hito**: Flujo completo: Consulta -> Lab -> Cobro en Caja.

## Fase 5: Reportes Finales y Pulido (Semana 8)
*   **Reportes**: Generación de PDF para recetas médicas y facturas.
*   **Estadísticas**: Gráficos de atenciones y ventas para el administrador.
*   **Pruebas**: Testeo de seguridad y validación de roles (RBAC).
*   **Hito**: Sistema completo listo para sustentación de grado.
