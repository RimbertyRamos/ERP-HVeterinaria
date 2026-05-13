# Pendiente de implementación — VET-ERP

Sesión interrumpida. Todo lo de abajo está **sin hacer**. Retomar en orden.

---

## ✅ Ya completado esta sesión

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `prisma/schema.prisma` | + `ConsumoConsulta`, `consultorio_id` en Cita, `estado_entrega` en RecetaMedica, enum `SUMINISTRO`, Prisma Client regenerado |
| 2 | `services/ficha.service.ts` | + include `consumos` en fichaInclude; + `getConsumos`, `addConsumo`, `removeConsumo` |
| 3 | `services/caja.service.ts` | + SUMINISTRO en factura; **eliminado** descuento de stock para FARMACIA (ahora lo hace Farmacia) |
| 4 | `services/farmacia.service.ts` | **NUEVO** — `getRecetasPendientes`, `dispensarReceta` (descuenta stock + insumos) |
| 5 | `controllers/farmacia.controller.ts` | **NUEVO** |
| 6 | `routes/farmacia.routes.ts` | **NUEVO** |
| 7 | `controllers/ficha.controller.ts` | + `getConsumos`, `addConsumo`, `removeConsumo` |
| 8 | `routes/fichas.routes.ts` | + rutas `GET/POST/DELETE /:id/consumos` |
| 9 | `services/agenda.service.ts` | + `consultorio_id`, filtro `doctor_id`, función `checkInCita` |
| 10 | `controllers/agenda.controller.ts` | + `updateCita`, `checkIn` |
| 11 | `routes/agenda.routes.ts` | + `PUT /:id`, `POST /:id/checkin` |
| 12 | `routes/index.ts` | + registro `/farmacia` |

---

## 🔴 PENDIENTE — Backend

### 1. Verificar compilación TypeScript
```bash
cd backend
npx tsc --noEmit
```
Corregir errores si los hay antes de continuar.

### 2. `services/caja.service.ts` — `getFichasPendientePago`
Agregar `consumos` al include para que el POS pueda mostrar y sumar los suministros:
```ts
// Dentro de getFichasPendientePago, en el include de fichaAtencion.findMany:
consumos: { include: { producto: true } },
```

### 3. Iniciar el servidor backend
```bash
npm run dev
```

---

## 🔴 PENDIENTE — Frontend

### 4. `src/types.ts` — Agregar tipos nuevos

```ts
// Agregar a ViewType:
| 'consultation' | 'farmacia'

// Agregar interface:
export interface ConsumoConsulta {
  id: string;
  ficha_id: string;
  producto: Producto;
  cantidad: number;
}

// Modificar FichaAtencion:
consumos: ConsumoConsulta[];

// Modificar FichaPendiente (para POS):
consumos: { producto: { nombre: string; precio_venta: string | number }; cantidad: number }[];

// Modificar Cita:
consultorio?: { id: string; nombre: string; tipo: string };

// Modificar RecetaMedica:
estado_entrega: 'PENDIENTE' | 'ENTREGADO' | 'PARCIAL';

// Modificar DetalleCobro tipo:
tipo: 'SERVICIO' | 'LABORATORIO' | 'FARMACIA' | 'SUMINISTRO';
```

### 5. `src/utils/api.ts` — Agregar endpoints nuevos

```ts
// Consumos en consulta
getConsumos: (ficha_id: string) => get(`/fichas/${ficha_id}/consumos`),
addConsumo: (ficha_id: string, data: { producto_id: string; cantidad: number }) =>
  post(`/fichas/${ficha_id}/consumos`, data),
removeConsumo: (ficha_id: string, consumoId: string) =>
  del(`/fichas/${ficha_id}/consumos/${consumoId}`),

// Farmacia
getRecetasPendientes: () => get('/farmacia/recetas'),
dispensarReceta: (id: string) => put(`/farmacia/recetas/${id}/dispensar`),

// Agenda (actualizar firma existente y agregar)
getCitas: (fecha?: string, doctor_id?: string) => { ... añadir doctor_id al qs ... },
updateCita: (id: string, data: unknown) => put(`/agenda/${id}`, data),
checkInCita: (id: string) => post(`/agenda/${id}/checkin`, {}),
```

---

### 6. `src/views/Consultation.tsx` — NUEVA VISTA (la más grande)

**Para VETERINARIO** — muestra fichas `EN_CURSO` donde `doctor_id === user.id`:

**Panel izquierdo:**
- Datos del paciente (mascota, propietario, alergias, especie)
- Historial clínico resumido (últimas 3 fichas anteriores)

**Panel derecho (tabs):**
- **Tab SOAP**: campos S/O/A/P (peso, temp, fc, fr, motivo, anamnesis, hallazgos, diagnóstico, tratamiento). Botón "Guardar SOAP" → `api.upsertSoap`.
- **Tab Insumos**: lista de consumos registrados + botón "Agregar Insumo" (buscador de productos tipo INSUMO_MEDICO / VACUNA). Botón eliminar por item → `api.removeConsumo`.
- **Tab Laboratorio**: botón "Solicitar Examen" (seleccionar de CatalogoExamen) → `api.createOrden`. Lista de órdenes activas con estado. Si tiene resultado, mostrar hallazgos.
- **Tab Receta**: lista de medicamentos. Agregar producto → `api.createReceta`. Indicaciones generales.

**Botón principal "Completar Consulta"** → `api.completarFicha(id)` → redirige a vista list.

**Para LABORATORISTA** — muestra `LaboratorioOrden` con estado `SOLICITADO` o `EN_PROCESO` donde el `consultorio` de la ficha es el consultorio del user (responsable_id):
- Tarjeta por orden: paciente, examen, prioridad
- Botón "Iniciar" → `api.updateEstadoOrden(id, 'EN_PROCESO')`
- Botón "Cargar Resultado" → modal con campos hallazgos, observaciones → `api.cargarResultado`

---

### 7. `src/views/Agenda.tsx` — Fix + mejoras

**Fix crítico: búsqueda de mascotas**
- El problema actual: el handler de búsqueda tiene early return en string vacío
- Fix: en el `useEffect` del modal, cargar todas las mascotas al abrir: `api.getMascotas().then(setMascotas)`
- Asegurarse que el input de búsqueda filtra localmente desde `mascotas` cargadas

**Campo consultorio en formulario de cita:**
```tsx
// Agregar estado:
const [consultorios, setConsultorios] = useState([]);
// Al abrir modal: api.getConsultorios().then(setConsultorios)
// Campo select en el form: consultorio_id
```

**Botón Check-in en cada cita:**
```tsx
<button onClick={() => handleCheckIn(cita.id)}>
  ✓ Check-in (crear turno)
</button>
```
Handler → `api.checkInCita(id)` → toast + recargar fichas de WaitingRoom

**Filtro por doctor:**
- Si el usuario logueado es VETERINARIO, la agenda carga con `getCitas(fecha, user.id)` automáticamente (solo ve sus citas)

---

### 8. `src/views/Inventory.tsx` — Nueva tab "Farmacia"

Agregar tab `'FARMACIA'` junto a las existentes:

```tsx
// Estado adicional:
const [recetas, setRecetas] = useState([]);

// Al activar tab FARMACIA:
api.getRecetasPendientes().then(setRecetas);

// Vista: tarjeta por receta con:
// - Nombre mascota / propietario
// - Número de recibo pagado
// - Lista de medicamentos con cantidades
// - Botón "Dispensar" → api.dispensarReceta(id) → toast + recargar
```

---

### 9. `src/views/POS.tsx` — Mostrar SUMINISTROS en factura

En `calcTotalFicha` y `buildLineasFicha` agregar:
```ts
// En calcTotalFicha:
for (const c of ficha.consumos ?? []) t += Number(c.producto.precio_venta) * c.cantidad;

// En buildLineasFicha:
for (const c of ficha.consumos ?? [])
  lines.push({ tipo: 'SUMINISTRO', desc: `${c.producto.nombre} x${c.cantidad}`, subtotal: ... });
```

---

### 10. `src/App.tsx` + `src/components/Sidebar.tsx` — Menú por rol

**App.tsx:**
- Agregar `'consultation'` y `'farmacia'` al tipo ViewType (ya en types.ts)
- Importar y renderizar `<Consultation />` y el tab farmacia dentro de `<Inventory />`

**Sidebar.tsx — Menú visible según rol:**

| Rol | Vistas visibles |
|-----|----------------|
| ADMIN | Todo |
| RECEPCIONISTA | Dashboard, Sala Espera, Pacientes, Agenda |
| VETERINARIO | **Mi Consulta**, Pacientes (solo historial), Agenda, Laboratorio |
| LABORATORISTA | **Mi Consulta** (vista lab), Laboratorio |
| CAJERO | Caja |
| FARMACEUTICO | Inventario (abre en tab Farmacia directamente) |

```tsx
// Leer rol del localStorage:
const user = JSON.parse(localStorage.getItem('user') || '{}');
const rol = user?.rol?.nombre;

// Filtrar items del menú según rol
const menuItems = ALL_MENU_ITEMS.filter(item => item.roles.includes(rol) || rol === 'ADMIN');
```

---

### 11. `src/views/WaitingRoom.tsx` — Filtrar fichas por rol

Si el user es VETERINARIO:
```tsx
// Mostrar solo fichas EN_CURSO asignadas a este doctor
// y fichas ESPERA que no tienen doctor asignado aún (para que las vea la recepcionista)
// El vet solo ve sus fichas EN_CURSO + las ESPERA generales
```

---

## Orden sugerido para retomar

1. Backend compilación (`npx tsc --noEmit`) + fix de `getFichasPendientePago`
2. `types.ts` (base para todo lo frontend)
3. `api.ts` (endpoints nuevos)
4. `Consultation.tsx` (nueva vista — el núcleo del flujo)
5. `App.tsx` + `Sidebar.tsx` (registrar la nueva vista y menú por rol)
6. `Agenda.tsx` (fix búsqueda + consultorio + check-in)
7. `Inventory.tsx` (tab farmacia)
8. `POS.tsx` (suministros en factura)
9. `WaitingRoom.tsx` (filtro por rol)

---

## Notas importantes

- **Opción B de stock**: los suministros y receta médica NO descuentan stock en Caja. Solo al dispensar en Farmacia.
- `caja.service.ts` fue modificado — ya no descuenta stock al cobrar, solo registra los detalles.
- La vista `Consultation.tsx` es visible para VETERINARIO y LABORATORISTA pero con paneles diferentes.
- El `checkInCita` crea una `FichaAtencion` con cod_ficha tipo `C-XX` automáticamente.
- Los insumos de consulta (ConsumoConsulta) también se descuentan en `dispensarReceta` junto con la receta.
