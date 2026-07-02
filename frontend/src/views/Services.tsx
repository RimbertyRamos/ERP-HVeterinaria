import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "../constants";
import { cn } from "../utils/cn";
import { api } from "../utils/api";
import { toast } from "sonner";
import { CatalogoServicio } from "../types";

type ModalMode = "none" | "create" | "edit";

interface ServicioForm {
  nombre: string;
  precio_base: string;
}

const EMPTY_FORM: ServicioForm = { nombre: "", precio_base: "" };

const inputCls =
  "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand text-ink";
const labelCls = "block text-xs font-bold text-muted mb-1";

export const Services: React.FC = () => {
  const [servicios, setServicios] = useState<CatalogoServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<ModalMode>("none");
  const [selected, setSelected] = useState<CatalogoServicio | null>(null);
  const [form, setForm] = useState<ServicioForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reload = () =>
    api
      .getServiciosCatalogo()
      .then(setServicios)
      .finally(() => setLoading(false));

  useEffect(() => {
    reload();
  }, []);

  const filtrados = servicios.filter((s) =>
    s.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError("");
    setModal("create");
  };

  const openEdit = (s: CatalogoServicio) => {
    setSelected(s);
    setForm({ nombre: s.nombre, precio_base: String(s.precio_base) });
    setError("");
    setModal("edit");
  };

  const closeModal = () => {
    setModal("none");
    setSelected(null);
    setError("");
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    if (!form.precio_base || Number(form.precio_base) < 0) {
      setError("El precio debe ser un valor válido");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = {
        nombre: form.nombre.trim(),
        precio_base: Number(form.precio_base),
      };
      if (modal === "create") {
        await api.createServicio(data);
        toast.success("Servicio creado");
      } else if (selected) {
        await api.updateServicio(selected.id, data);
        toast.success("Servicio actualizado");
      }
      await reload();
      closeModal();
    } catch (e: any) {
      setError(e.message ?? "Error al guardar el servicio");
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (s: CatalogoServicio) => {
    try {
      await api.updateServicio(s.id, { activo: !s.activo });
      await reload();
    } catch (e: any) {
      toast.error(e.message ?? "Error al cambiar el estado");
    }
  };

  const handleDelete = async (s: CatalogoServicio) => {
    if (!confirm(`¿Eliminar el servicio "${s.nombre}"?`)) return;
    try {
      await api.deleteServicio(s.id);
      toast.success("Servicio eliminado");
      await reload();
    } catch (e: any) {
      toast.error(e.message ?? "Error al eliminar");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Servicios</h2>
          <p className="text-muted">Catálogo de servicios y sus tarifas</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-strong transition-colors"
        >
          <Icons.Plus size={20} />
          <span>Nuevo Servicio</span>
        </button>
      </header>

      <div className="bg-surface rounded-card border border-line overflow-hidden">
        <div className="p-6 border-b border-line flex justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-ink">
            <Icons.FileText className="text-brand-ink" size={18} />
            Lista de Servicios
          </h3>
          <div className="relative">
            <Icons.Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              size={14}
            />
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-line bg-bg outline-none focus:ring-2 focus:ring-brand text-ink"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-surface-2 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-2/50 text-muted text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Servicio</th>
                  <th className="px-6 py-4 font-bold">Precio (Bs.)</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-muted text-sm"
                    >
                      No se encontraron servicios
                    </td>
                  </tr>
                ) : (
                  filtrados.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-surface-2/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-ink">
                          {s.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-ink tnum">
                        Bs.{Number(s.precio_base).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActivo(s)}
                          className={cn(
                            "px-2 py-1 text-[10px] font-bold rounded uppercase transition-colors",
                            s.activo === false
                              ? "bg-surface-2 text-muted"
                              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                          )}
                          title="Clic para activar/desactivar"
                        >
                          {s.activo === false ? "Inactivo" : "Activo"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(s)}
                            title="Editar servicio"
                            className="p-1.5 rounded-lg bg-surface-2 text-muted hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <Icons.Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            title="Eliminar servicio"
                            className="p-1.5 rounded-lg bg-surface-2 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Icons.Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modal !== "none" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-surface rounded-card shadow-2xl w-full max-w-md p-6 border border-line"
            >
              <h3 className="text-lg font-bold mb-6 text-ink">
                {modal === "create" ? "Nuevo Servicio" : "Editar Servicio"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Nombre *</label>
                  <input
                    className={inputCls}
                    placeholder="Ej: Consulta General"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nombre: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Precio (Bs.) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputCls}
                    placeholder="0.00"
                    value={form.precio_base}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, precio_base: e.target.value }))
                    }
                  />
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-line text-sm font-bold text-muted hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-strong transition-colors disabled:opacity-50"
                >
                  <Icons.Save size={16} />
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
