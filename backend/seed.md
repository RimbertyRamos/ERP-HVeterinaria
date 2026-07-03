# Documentación de Datos Precargados (Seeder)

El sistema cuenta con un seeder (`seed.ts` y `seedTransaccional.ts`) que precarga una base de datos robusta, diseñada para simular el uso real de una clínica veterinaria. Los datos abarcan desde catálogos básicos hasta un flujo clínico y financiero completo durante los meses de **Mayo, Junio y Julio de 2026**.

---

## 1. Credenciales de Acceso

Todos los usuarios tienen la contraseña predeterminada que corresponde a su rol.

| Rol | Usuario | Email | Contraseña |
| :--- | :--- | :--- | :--- |
| **Administrador** | Administrador | `admin@vetcare.com` | `admin123` |
| **Veterinario** | Dr. Carlos Mamani | `carlos.mamani@vetcare.com` | `vet123` |
| **Veterinario** | Dra. Paola Ríos | `paola.rios@vetcare.com` | `vet123` |
| **Recepcionista**| María Gómez | `maria.gomez@vetcare.com` | `recep123` |
| **Cajero** | Luis Roca | `luis.roca@vetcare.com` | `caja123` |
| **Cliente** | Juan Vaca Quiroga | `juan.vaca@gmail.com` | `cliente123` |
| **Cliente** | Patricia Colque | `patricia.colque@gmail.com` | `cliente123` |
| **Cliente** | Fernando Pinto | `fernando.pinto@gmail.com` | `cliente123` |

*(Hay 2 clientes adicionales registrados: `ana.torrico@gmail.com` y `roberto.diaz@gmail.com`)*

---

## 2. Flujo Clínico y Transaccional (Mayo, Junio y Julio 2026)

Los datos simulan el ciclo de vida completo de la atención veterinaria, demostrando cómo interactúan los distintos módulos (Recepción $\rightarrow$ Agenda $\rightarrow$ Consulta $\rightarrow$ Caja $\rightarrow$ Inventario).

### **Hitos de Mayo 2026:**
* **Mayo 4 (Consulta General):** El perro **Rocky** asiste a su revisión anual con el Dr. Carlos. Se genera la ficha `C-01`, el médico completa el registro **SOAP** e Historia Clínica. El propietario califica la atención con 5 estrellas tras pagar en efectivo.
* **Mayo 6 (Cirugía):** La perrita **Luna** es intervenida por la Dra. Paola para extraer un lipoma (`C-02`). En quirófano se registra el consumo de medicamentos (*Meloxicam, Amoxicilina, Suero*), lo que automáticamente **reduce el stock** en el módulo de inventario. Se paga un total alto con tarjeta.
* **Mayo 15 (Caja):** Se realiza una **venta directa** por farmacia a un cliente ocasional, seguida por el **Cierre de Caja Quincenal** por parte del cajero.
* **Mayo 22 (Vacunación):** El cachorro **Max** asiste por su primera vacuna (`C-03`). Se registran en su historial las dosis de *Rabia* y *Polivalente*, programando automáticamente la fecha de su próxima dosis en 2027.
* **Mayo 28 (Pendiente):** El gato **Mishi** asiste al laboratorio (`L-01`), pero su estado queda **EN CURSO**. Su historia clínica está en "Borrador" y su pago está "Pendiente" en caja (Ideal para probar flujos inconclusos).
* **Mayo 31 (Caja):** Segundo cierre de caja mensual.

### **Hitos de Junio 2026:**
* **Junio 4 (Especialista):** El ave **Piolín** acude por estrés y pérdida de plumaje (`C-04`). Se le receta cambio de dieta y suplementos. Pagado vía QR.
* **Junio 5 (Alta Médica):** **Luna** regresa a control post-cirugía (`C-05`). Es una consulta de seguimiento (exenta de cobro). Se registran las **evoluciones del tratamiento** (retiro de puntos) y el sistema le envía una **notificación** de Alta Médica a la dueña.
* **Junio 12 - 15 (Inasistencias):** Varias citas programadas que terminaron en estado `CANCELADA` o `NO_ASISTIO` para observar las métricas de ausentismo en los reportes.

### **Hitos de Julio 2026:**
* **Julio 2 (Pago Atrasado):** El dueño del gato **Mishi** cancela en caja la deuda pendiente de su consulta de laboratorio de mayo (`L-01`). El estado de cobro pasa a `PAGADO` y la ficha a `COMPLETADA`.
* **Julio 10 (Emergencia):** El perro **Rocky** asiste de urgencia por vómitos agudos. Se le asigna la ficha `E-01` con prioridad `URGENTE`. Se le aplican sueros, agotando parte del inventario, e ingresa a hospitalización/tratamiento ambulatorio.
* **Julio 31 (Caja):** Cierre de caja mensual de julio, consolidando los pagos de la deuda de Mishi y la emergencia de Rocky.

---

## 3. ¿Qué verá cada usuario al Iniciar Sesión?

El sistema implementa **RBAC (Control de Acceso Basado en Roles)**, por lo que la interfaz y los datos cambian radicalmente según el usuario.

### 👑 Administrador (`admin@vetcare.com`)
* **Dashboard Completo:** Verá métricas financieras, ingresos mensuales de mayo, junio y julio, cantidad de consultas, y stock de productos en alerta (ej. *Amoxicilina* si bajó del stock mínimo).
* **Auditoría (Bitácora):** Podrá revisar todo el historial de acciones: quién cerró caja, quién creó las fichas de Rocky y Luna, y los inicios de sesión fallidos o exitosos.
* **Gestión Total:** Acceso a CRUD de Usuarios, Roles, Permisos, y configuración de catálogos base.

### 🩺 Veterinario (`carlos.mamani@vetcare.com` / `paola.rios@vetcare.com`)
* **Agenda y Fichas:** Verá su propio horario de trabajo y las citas asignadas a su consultorio (Sala 1 o Sala 2).
* **Sala de Espera:** Verá los pacientes listos para ser atendidos. (La Dra. Paola verá la ficha de *Mishi* en curso).
* **Historias Clínicas:** Acceso al registro SOAP, diagnósticos, recetas y posibilidad de registrar consumos médicos que se reflejarán en caja. *No tiene acceso a los montos cobrados ni a la gestión de roles.*

### 🛎️ Recepcionista (`maria.gomez@vetcare.com`)
* **Calendario Global:** Visión panorámica de todos los consultorios para agendar nuevas citas.
* **Gestión de Pacientes:** Lista completa de clientes (como Patricia y Fernando) y sus mascotas (Luna, Max).
* **Fichaje:** Creador de Fichas de Atención para derivar pacientes a los médicos. *No puede redactar historias clínicas médicas.*

### 💵 Cajero (`luis.roca@vetcare.com`)
* **Módulo de Cobros:** Pantalla con las cuentas por cobrar. Verá cómo la ficha de Mishi del 28 de Mayo se pagó en Julio.
* **Ventas Directas:** Acceso al Punto de Venta (POS) para vender productos de mostrador sin ficha médica.
* **Cierre de Caja:** Historial de sus cierres de caja (quincenales y mensuales de mayo, junio y julio). *No tiene acceso a diagnósticos médicos por privacidad.*

### 🐾 Cliente / Propietario (`patricia.colque@gmail.com`)
* **Portal del Dueño:** Al ingresar verá el perfil de "Luna".
* **Historial e Interacciones:** Verá las notificaciones de su cita de junio y la notificación de su Alta Médica. También podrá revisar su historial de vacunas, su diagnóstico de cirugía, e incluso podrá acceder a calificar atenciones finalizadas.
