import React, { useCallback, useEffect, useState } from "react";
import { api } from "../utils/api";
import { toast } from "sonner";

const ACCIONES = [
  "LOGIN",
  "LOGOUT",
  "LOGIN_FALLIDO",
  "CAMBIO_PASSWORD",
  "CREAR",
  "ACTUALIZAR",
  "ELIMINAR",
  "CAMBIO_ESTADO",
  "CAMBIO_ROL",
  "APLICAR_DESCUENTO",
  "ANULAR",
  "CIERRE_CAJA",
  "EXPORTAR",
  "ACCESO_HISTORIA",
];

interface Registro {
  id: string;
  fecha_hora: string;
  actor_nombre: string | null;
  actor_email: string | null;
  actor_rol: string | null;
  accion: string;
  entidad: string | null;
  entidad_id: string | null;
  descripcion: string;
  datos_antes: string | null;
  datos_despues: string | null;
  exito: boolean;
  ip: string | null;
  ruta: string | null;
}

interface Filtros {
  desde: string;
  hasta: string;
  usuario_id: string;
  accion: string;
  entidad: string;
  exito: string;
  texto: string;
}

const FILTROS_INI: Filtros = {
  desde: "",
  hasta: "",
  usuario_id: "",
  accion: "",
  entidad: "",
  exito: "",
  texto: "",
};

const PAGE_SIZE = 25;

// Construye el querystring desde los filtros activos (omite vacíos).
function buildQS(f: Filtros, page: number): string {
  const p = new URLSearchParams();
  if (f.desde) p.set("desde", f.desde);
  if (f.hasta) p.set("hasta", `${f.hasta}T23:59:59`); // incluye el día completo
  if (f.usuario_id) p.set("usuario_id", f.usuario_id);
  if (f.accion) p.set("accion", f.accion);
  if (f.entidad) p.set("entidad", f.entidad);
  if (f.exito) p.set("exito", f.exito);
  if (f.texto) p.set("texto", f.texto);
  p.set("page", String(page));
  p.set("pageSize", String(PAGE_SIZE));
  return p.toString();
}

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleString("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const pretty = (json: string | null) => {
  if (!json) return "—";
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
};

export const Bitacora: React.FC = () => {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INI);
  const [items, setItems] = useState<Registro[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);

  const cargar = useCallback(async (f: Filtros, pg: number) => {
    setLoading(true);
    try {
      const res: any = await api.getBitacora(buildQS(f, pg));
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
      setPage(res.page ?? pg);
    } catch (e: any) {
      toast.error(e.message ?? "Error al cargar la bitácora");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar(FILTROS_INI, 1);
  }, [cargar]);

  const aplicar = (e: React.FormEvent) => {
    e.preventDefault();
    setExpandido(null);
    cargar(filtros, 1);
  };

  const limpiar = () => {
    setFiltros(FILTROS_INI);
    setExpandido(null);
    cargar(FILTROS_INI, 1);
  };

  const irA = (pg: number) => {
    if (pg < 1 || pg > totalPages) return;
    setExpandido(null);
    cargar(filtros, pg);
  };

  const exportar = async (formato: "csv" | "pdf") => {
    setDescargando(true);
    try {
      // Se exporta con los MISMOS filtros activos (sin paginación).
      const p = new URLSearchParams(buildQS(filtros, 1));
      p.delete("page");
      p.delete("pageSize");
      await api.descargarBitacora(p.toString(), formato);
      toast.success(`Exportación ${formato.toUpperCase()} generada`);
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo exportar");
    } finally {
      setDescargando(false);
    }
  };

  const set = (k: keyof Filtros, v: string) =>
    setFiltros((f) => ({ ...f, [k]: v }));

  const inputCls =
    "h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary transition-colors";

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Bitácora de Auditoría
          </h1>
          <p className="text-sm text-slate-500">
            Registro de eventos del sistema · {total} registro(s)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportar("csv")}
            disabled={descargando}
            className="h-10 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => exportar("pdf")}
            disabled={descargando}
            className="h-10 px-4 rounded-lg bg-primary text-sm font-bold text-slate-900 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <form
        onSubmit={aplicar}
        className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 items-end bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800"
      >
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
          Desde
          <input
            type="date"
            value={filtros.desde}
            onChange={(e) => set("desde", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
          Hasta
          <input
            type="date"
            value={filtros.hasta}
            onChange={(e) => set("hasta", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
          Acción
          <select
            value={filtros.accion}
            onChange={(e) => set("accion", e.target.value)}
            className={inputCls}
          >
            <option value="">Todas</option>
            {ACCIONES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
          Entidad
          <input
            type="text"
            placeholder="usuario, recibo…"
            value={filtros.entidad}
            onChange={(e) => set("entidad", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
          Éxito
          <select
            value={filtros.exito}
            onChange={(e) => set("exito", e.target.value)}
            className={inputCls}
          >
            <option value="">Todos</option>
            <option value="true">Solo éxito</option>
            <option value="false">Solo fallos</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
          Buscar
          <input
            type="text"
            placeholder="en descripción"
            value={filtros.texto}
            onChange={(e) => set("texto", e.target.value)}
            className={inputCls}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="h-10 flex-1 px-4 rounded-lg bg-primary text-sm font-black text-slate-900 hover:opacity-90 transition-opacity"
          >
            Filtrar
          </button>
          <button
            type="button"
            onClick={limpiar}
            className="h-10 px-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:opacity-90 transition-opacity"
          >
            Limpiar
          </button>
        </div>
      </form>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <th className="p-3 font-bold">Fecha / Hora</th>
              <th className="p-3 font-bold">Usuario</th>
              <th className="p-3 font-bold">Rol</th>
              <th className="p-3 font-bold">Acción</th>
              <th className="p-3 font-bold">Entidad</th>
              <th className="p-3 font-bold">Descripción</th>
              <th className="p-3 font-bold text-center">Éxito</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Cargando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Sin registros para el filtro seleccionado.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <React.Fragment key={r.id}>
                  <tr
                    onClick={() =>
                      setExpandido((id) => (id === r.id ? null : r.id))
                    }
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  >
                    <td className="p-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {fmtFecha(r.fecha_hora)}
                    </td>
                    <td className="p-3">
                      {r.actor_nombre ?? (
                        <span className="text-slate-400 italic">
                          sistema/anónimo
                        </span>
                      )}
                      {r.actor_email && (
                        <span className="block text-xs text-slate-400">
                          {r.actor_email}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">{r.actor_rol ?? "—"}</td>
                    <td className="p-3">
                      <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                        {r.accion}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {r.entidad ?? "—"}
                      {r.entidad_id && (
                        <span className="block text-[10px] text-slate-400 truncate max-w-[120px]">
                          {r.entidad_id}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 max-w-md">
                      {r.descripcion}
                    </td>
                    <td className="p-3 text-center">
                      {r.exito ? (
                        <span className="text-emerald-500 font-bold">✓</span>
                      ) : (
                        <span className="text-red-500 font-bold">✗</span>
                      )}
                    </td>
                  </tr>
                  {expandido === r.id && (
                    <tr className="bg-slate-50 dark:bg-slate-950/40">
                      <td colSpan={7} className="p-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                              Datos antes
                            </p>
                            <pre className="text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-64">
                              {pretty(r.datos_antes)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                              Datos después
                            </p>
                            <pre className="text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-64">
                              {pretty(r.datos_despues)}
                            </pre>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-3">
                          IP: {r.ip ?? "—"} · Ruta: {r.ruta ?? "—"}
                        </p>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => irA(page - 1)}
            disabled={page <= 1 || loading}
            className="h-9 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Anterior
          </button>
          <button
            onClick={() => irA(page + 1)}
            disabled={page >= totalPages || loading}
            className="h-9 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default Bitacora;
