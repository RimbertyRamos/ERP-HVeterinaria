# Diagrama de Actividad — Modelo de Negocio del Hospital Veterinario

## 1. Flujo Principal del Negocio (Vista General)

Este diagrama muestra el proceso completo desde que un cliente llega al hospital con su mascota hasta que se retira con el tratamiento.

```mermaid
flowchart TD
    START(("🟢 Inicio")) --> A1{"¿El cliente ya está<br/>registrado?"}

    A1 -->|No| A2["📋 Registrar Cliente<br/>y Mascota en el sistema"]
    A1 -->|Sí| A3["🔍 Buscar paciente<br/>en el sistema"]
    A2 --> A3

    A3 --> A4{"¿Es una<br/>emergencia?"}

    A4 -->|Sí - Emergencia| E1["🚨 Asignar prioridad<br/>URGENTE"]
    A4 -->|No - Consulta regular| A5["📝 Registrar en<br/>Sala de Espera"]

    E1 --> A6
    A5 --> WAIT{"¿Hay consultorio<br/>disponible?"}

    WAIT -->|No| W1["⏳ Esperar turno<br/>en Sala de Espera"]
    W1 --> WAIT
    WAIT -->|Sí| A6["🏥 Asignar Consultorio<br/>(Estado: OCUPADO)"]

    A6 --> A7["👨‍⚕️ Consulta Veterinaria<br/>(Método SOAP)"]

    A7 --> A8{"¿Requiere<br/>tratamiento?"}

    A8 -->|No - Solo chequeo| A12["📄 Registrar<br/>diagnóstico y cierre"]
    A8 -->|Sí| A9["💊 Prescribir<br/>tratamiento"]

    A9 --> A10{"¿Requiere<br/>productos/medicamentos?"}

    A10 -->|Sí| A11["📦 Registrar consumo<br/>de productos"]
    A10 -->|No| A12

    A11 --> A12

    A12 --> A13["🏥 Liberar Consultorio<br/>(Estado: LIBRE)"]

    A13 --> A14["🧾 Generar Ticket<br/>de Cobro"]

    A14 --> A15{"💳 ¿Forma<br/>de pago?"}

    A15 -->|Efectivo| A16["💵 Cobro en efectivo"]
    A15 -->|Tarjeta/Transferencia| A17["💳 Cobro electrónico"]

    A16 --> A18["✅ Ticket PAGADO"]
    A17 --> A18

    A18 --> A19["📋 Entregar indicaciones<br/>y receta al cliente"]

    A19 --> FIN(("🔴 Fin"))
```

---

## 2. Flujo de Emergencias con Chatbot (Nuevo Módulo)

Este diagrama muestra cómo el chatbot de IA asiste al cliente ANTES de llegar al hospital.

```mermaid
flowchart TD
    START(("🟢 Cliente detecta<br/>emergencia")) --> B1{"¿Tiene acceso<br/>al sistema VET-ERP?"}

    B1 -->|No| B2["📞 Llamar al hospital<br/>por teléfono"]
    B2 --> B7

    B1 -->|Sí| B3["💬 Abrir Chat de<br/>Emergencias en VET-ERP"]

    B3 --> B4["🤖 Chatbot pregunta:<br/>¿Qué le sucede a tu mascota?"]

    B4 --> B5["👤 Cliente describe<br/>la situación"]

    B5 --> B6["🤖 Chatbot brinda<br/>instrucciones de<br/>primeros auxilios"]

    B6 --> B6A{"¿El cliente tiene<br/>más preguntas?"}

    B6A -->|Sí| B5
    B6A -->|No| B7["🚗 Cliente se dirige<br/>al hospital"]

    B7 --> B8["🏥 Llegada al hospital"]

    B8 --> B9["🚨 Recepción registra<br/>como EMERGENCIA"]

    B9 --> B10["👨‍⚕️ Atención<br/>inmediata prioritaria"]

    B10 --> FIN(("🔴 Continúa con<br/>flujo de consulta"))
```

---

## 3. Detalle: Proceso de Registro de Paciente

```mermaid
flowchart TD
    START(("🟢 Inicio")) --> C1["Recepcionista selecciona<br/>Nuevo Paciente"]

    C1 --> C2["Ingresar datos<br/>de la mascota"]

    C2 --> C3["Nombre, Especie, Raza,<br/>Sexo, Peso, Fecha Nac.,<br/>Alergias"]

    C3 --> C4{"¿El propietario ya<br/>existe en el sistema?"}

    C4 -->|Sí| C5["Seleccionar propietario<br/>existente por email"]
    C4 -->|No| C6["Registrar nuevo<br/>propietario"]

    C6 --> C7["Nombre, Email,<br/>Teléfono, Contraseña"]

    C7 --> C8["Sistema crea usuario<br/>con Rol: Cliente"]
    C5 --> C9
    C8 --> C9["Sistema asocia mascota<br/>al propietario"]

    C9 --> C10["✅ Paciente registrado<br/>exitosamente"]

    C10 --> FIN(("🔴 Fin"))
```

---

## 4. Detalle: Proceso de Atención Clínica (Método SOAP)

```mermaid
flowchart TD
    START(("🟢 Paciente asignado<br/>a consultorio")) --> D1["👨‍⚕️ Doctor abre ficha<br/>del paciente"]

    D1 --> D2["📖 Revisar historial<br/>de consultas anteriores"]

    D2 --> S["<b>S - SUBJETIVO</b><br/>Anamnesis"]

    S --> S1["Registrar motivo<br/>de consulta"]
    S1 --> S2["Anotar observaciones<br/>del propietario"]

    S2 --> O["<b>O - OBJETIVO</b><br/>Examen Físico"]

    O --> O1["Registrar signos vitales:<br/>Peso, Temperatura,<br/>Frec. Cardíaca, Frec. Resp."]
    O1 --> O2["Documentar hallazgos<br/>clínicos"]

    O2 --> A["<b>A - ASSESSMENT</b><br/>Diagnóstico"]

    A --> A1["Formular diagnóstico<br/>presuntivo o definitivo"]

    A1 --> P["<b>P - PLAN</b><br/>Tratamiento"]

    P --> P1{"¿Requiere<br/>medicamentos?"}

    P1 -->|Sí| P2["Prescribir medicamentos<br/>y registrar consumo"]
    P1 -->|No| P3["Indicar cuidados<br/>y seguimiento"]

    P2 --> P3

    P3 --> D3["Guardar consulta<br/>en el historial"]

    D3 --> D4["Finalizar atención<br/>y liberar consultorio"]

    D4 --> FIN(("🔴 Enviar a Caja"))
```

---

## 5. Detalle: Proceso de Caja / POS

```mermaid
flowchart TD
    START(("🟢 Paciente llega<br/>a Caja")) --> F1["Cajero busca la atención<br/>del paciente"]

    F1 --> F2["Sistema muestra:<br/>• Consulta médica<br/>• Productos consumidos<br/>• Total a pagar"]

    F2 --> F3{"¿El cliente acepta<br/>el monto?"}

    F3 -->|No| F4["Revisar detalle<br/>con el doctor"]
    F4 --> F2

    F3 -->|Sí| F5["Generar Ticket<br/>(Estado: EMITIDO)"]

    F5 --> F6{"💳 Método de pago"}

    F6 -->|Efectivo| F7["Registrar pago<br/>en efectivo"]
    F6 -->|Tarjeta| F8["Procesar pago<br/>con tarjeta"]
    F6 -->|Transferencia| F9["Verificar<br/>transferencia"]

    F7 --> F10
    F8 --> F10
    F9 --> F10

    F10["✅ Ticket marcado<br/>como PAGADO"]

    F10 --> F11["Imprimir/enviar<br/>comprobante"]

    F11 --> FIN(("🔴 Fin - Cliente<br/>se retira"))
```

---

## 6. Actores del Sistema

| Actor | Rol | Acciones principales |
|---|---|---|
| **Recepcionista** | Registro y gestión de turnos | Registrar pacientes, gestionar sala de espera, asignar consultorios |
| **Veterinario** | Atención clínica | Realizar consultas (SOAP), diagnosticar, prescribir tratamiento |
| **Cajero** | Facturación y cobro | Generar tickets, cobrar, anular tickets |
| **Administrador** | Gestión integral | Acceso completo al sistema, reportes financieros, gestión de usuarios |
| **Cliente/Propietario** | Dueño de la mascota | Consultar chatbot de emergencias, ver historial de su mascota |
| **Chatbot (IA)** | Asistente virtual | Orientar en emergencias veterinarias con primeros auxilios |

---

## 7. Resumen del Modelo de Negocio

```mermaid
flowchart LR
    subgraph "📱 CANAL DIGITAL"
        CH["💬 Chatbot<br/>Emergencias"]
    end

    subgraph "🏥 HOSPITAL VETERINARIO"
        REC["📋 Recepción<br/>y Registro"]
        SE["⏳ Sala de<br/>Espera"]
        CON["🏥 Consultorio<br/>(SOAP)"]
        CAJ["🧾 Caja<br/>(POS)"]
    end

    CH -->|"Cliente llega<br/>al hospital"| REC
    REC --> SE
    SE --> CON
    CON --> CAJ
    CAJ -->|"Cliente se<br/>retira"| FIN["✅ Fin"]
```
