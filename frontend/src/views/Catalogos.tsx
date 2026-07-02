import React, { useCallback, useEffect, useState } from "react";
import { Icons } from "../constants";
import { api } from "../utils/api";
import { toast } from "sonner";

interface Especie {
  id: string;
  nombre: string;
}
interface Raza {
  id: string;
  nombre: string;
  especie_id: string;
  especie?: { nombre: string };
}

export const Catalogos: React.FC = () => {
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [razas, setRazas] = useState<Raza[]>([]);
  const [filtroEspecie, setFiltroEspecie] = useState<string>("");
  const [nuevaEspecie, setNuevaEspecie] = useState("");
  const [razaForm, setRazaForm] = useState({ nombre: "", especie_id: "" });
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [esp, raz] = await Promise.all([
        api.getEspecies(),
        api.getRazas(),
      ]);
      setEspecies(esp as Especie[]);
      setRazas(raz as Raza[]);
    } catch (e: any) {
      toast.error(e.message ?? "Error al cargar catálogos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const addEspecie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaEspecie.trim()) return;
    try {
      await api.createEspecie({ nombre: nuevaEspecie.trim() });
      setNuevaEspecie("");
      toast.success("Especie creada");
      cargar();
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo crear la especie");
    }
  };

  const editEspecie = async (esp: Especie) => {
    const nombre = window.prompt("Nuevo nombre de la especie:", esp.nombre);
    if (!nombre || nombre.trim() === esp.nombre) return;
    try {
      await api.updateEspecie(esp.id, { nombre: nombre.trim() });
      toast.success("Especie actualizada");
      cargar();
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo actualizar");
    }
  };

  const delEspecie = async (esp: Especie) => {
    if (!window.confirm(`¿Eliminar la especie "${esp.nombre}"?`)) return;
    try {
      await api.deleteEspecie(esp.id);
      toast.success("Especie eliminada");
      cargar();
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo eliminar");
    }
  };

  const addRaza = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaForm.nombre.trim() || !razaForm.especie_id) {
      toast.error("Indica nombre y especie");
      return;
    }
    try {
      await api.createRaza({
        nombre: razaForm.nombre.trim(),
        especie_id: razaForm.especie_id,
      });
      setRazaForm({ nombre: "", especie_id: razaForm.especie_id });
      toast.success("Raza creada");
      cargar();
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo crear la raza");
    }
  };

  const editRaza = async (r: Raza) => {
    const nombre = window.prompt("Nuevo nombre de la raza:", r.nombre);
    if (!nombre || nombre.trim() === r.nombre) return;
    try {
      await api.updateRaza(r.id, { nombre: nombre.trim() });
      toast.success("Raza actualizada");
      cargar();
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo actualizar");
    }
  };

  const delRaza = async (r: Raza) => {
    if (!window.confirm(`¿Eliminar la raza "${r.nombre}"?`)) return;
    try {
      await api.deleteRaza(r.id);
      toast.success("Raza eliminada");
      cargar();
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo eliminar");
    }
  };

  const razasVisibles = filtroEspecie
    ? razas.filter((r) => r.especie_id === filtroEspecie)
    : razas;

  const inputCls =
    "h-10 px-3 rounded-lg bg-bg border border-line text-sm text-ink outline-none focus:border-brand transition-colors";
  const btnIcon = "p-2 text-muted hover:text-brand-ink transition-colors";

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-ink">Catálogos base</h1>
        <p className="text-sm text-muted">Gestiona especies y razas del sistema</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ESPECIES */}
        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="text-lg font-bold text-ink mb-3">
            Especies ({especies.length})
          </h2>
          <form onSubmit={addEspecie} className="flex gap-2 mb-4">
            <input
              value={nuevaEspecie}
              onChange={(e) => setNuevaEspecie(e.target.value)}
              placeholder="Nueva especie (p. ej. Canino)"
              className={`${inputCls} flex-1`}
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-brand text-sm font-black text-white hover:bg-brand-strong transition-colors"
            >
              Agregar
            </button>
          </form>
          <div className="divide-y divide-line max-h-[420px] overflow-y-auto">
            {loading ? (
              <p className="py-6 text-center text-muted text-sm">Cargando…</p>
            ) : especies.length === 0 ? (
              <p className="py-6 text-center text-muted text-sm">Sin especies.</p>
            ) : (
              especies.map((esp) => (
                <div
                  key={esp.id}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm font-medium text-ink">
                    {esp.nombre}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => editEspecie(esp)}
                      className={btnIcon}
                      title="Editar"
                    >
                      <Icons.Edit size={16} />
                    </button>
                    <button
                      onClick={() => delEspecie(esp)}
                      className="p-2 text-muted hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Icons.Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* RAZAS */}
        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="text-lg font-bold text-ink mb-3">
            Razas ({razasVisibles.length})
          </h2>
          <form onSubmit={addRaza} className="flex flex-wrap gap-2 mb-3">
            <input
              value={razaForm.nombre}
              onChange={(e) =>
                setRazaForm((f) => ({ ...f, nombre: e.target.value }))
              }
              placeholder="Nueva raza"
              className={`${inputCls} flex-1 min-w-[120px]`}
            />
            <select
              value={razaForm.especie_id}
              onChange={(e) =>
                setRazaForm((f) => ({ ...f, especie_id: e.target.value }))
              }
              className={inputCls}
            >
              <option value="">— Especie —</option>
              {especies.map((esp) => (
                <option key={esp.id} value={esp.id}>
                  {esp.nombre}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-brand text-sm font-black text-white hover:bg-brand-strong transition-colors"
            >
              Agregar
            </button>
          </form>

          <div className="mb-2">
            <select
              value={filtroEspecie}
              onChange={(e) => setFiltroEspecie(e.target.value)}
              className={`${inputCls} w-full`}
            >
              <option value="">Todas las especies</option>
              {especies.map((esp) => (
                <option key={esp.id} value={esp.id}>
                  Filtrar: {esp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="divide-y divide-line max-h-[360px] overflow-y-auto">
            {loading ? (
              <p className="py-6 text-center text-muted text-sm">Cargando…</p>
            ) : razasVisibles.length === 0 ? (
              <p className="py-6 text-center text-muted text-sm">Sin razas.</p>
            ) : (
              razasVisibles.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-ink">
                    {r.nombre}
                    <span className="text-xs text-muted ml-2">
                      {r.especie?.nombre ??
                        especies.find((e) => e.id === r.especie_id)?.nombre ??
                        ""}
                    </span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => editRaza(r)}
                      className={btnIcon}
                      title="Editar"
                    >
                      <Icons.Edit size={16} />
                    </button>
                    <button
                      onClick={() => delRaza(r)}
                      className="p-2 text-muted hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Icons.Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Catalogos;
