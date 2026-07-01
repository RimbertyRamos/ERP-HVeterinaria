import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "../constants";
import { cn } from "../utils/cn";
import { api } from "../utils/api";
import { toast } from "sonner";

interface UserRole {
  id: string;
  nombre: string;
}
interface Usuario {
  id: string;
  nombre: string;
  email: string;
  ci?: string;
  telefono?: string;
  rol: UserRole;
  created_at: string;
  activo?: boolean;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Usuario | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    ci: "",
    telefono: "",
    rol_id: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uData, rData] = await Promise.all([
        api.getUsuarios(),
        api.getRoles(),
      ]);
      setUsers(uData);
      setRoles(rData);
    } catch (err) {
      toast.error("Error al cargar personal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (u?: Usuario) => {
    if (u) {
      setEditTarget(u);
      setForm({
        nombre: u.nombre,
        email: u.email,
        password: "", // No se edita la pass aquí por seguridad
        ci: u.ci || "",
        telefono: u.telefono || "",
        rol_id: u.rol.id,
      });
    } else {
      setEditTarget(null);
      setForm({
        nombre: "",
        email: "",
        password: "",
        ci: "",
        telefono: "",
        rol_id: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        // En edición no mandamos password a menos que se quiera implementar un reset
        const { password: _password, ...payload } = form;
        await api.updateUsuario(editTarget.id, payload);
        toast.success("Usuario actualizado correctamente");
      } else {
        await api.createUsuario(form);
        toast.success("Nuevo usuario registrado con éxito");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Error al guardar usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (u: Usuario) => {
    const desactivar = u.activo !== false; // por defecto activo
    try {
      await api.updateUsuario(u.id, { activo: !desactivar });
      toast.success(desactivar ? "Usuario desactivado" : "Usuario reactivado");
      fetchData();
    } catch {
      toast.error("No se pudo cambiar el estado del usuario");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "¿Eliminar este acceso de usuario? El empleado ya no podrá entrar al sistema.",
      )
    )
      return;
    try {
      await api.deleteUsuario(id);
      toast.success("Usuario eliminado");
      fetchData();
    } catch (err) {
      toast.error("Error al eliminar");
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Gestión de Personal
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Administra usuarios, accesos y roles del sistema
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-slate-900 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
        >
          <Icons.Plus size={20} />
          Registrar Nuevo Empleado
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">CI / Identidad</th>
              <th className="px-6 py-4">Cargo / Rol</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading
              ? [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4 animate-pulse">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                    </td>
                  </tr>
                ))
              : users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {u.nombre}
                          </p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {u.ci || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          u.rol.nombre === "ADMIN"
                            ? "bg-red-100 text-red-700"
                            : u.rol.nombre === "VETERINARIO"
                              ? "bg-blue-100 text-blue-700"
                              : u.rol.nombre === "RECEPCIONISTA"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {u.rol.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {u.telefono || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleActivo(u)}
                          title={
                            u.activo === false
                              ? "Reactivar acceso"
                              : "Desactivar acceso"
                          }
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-opacity hover:opacity-80",
                            u.activo === false
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700",
                          )}
                        >
                          {u.activo === false ? "Inactivo" : "Activo"}
                        </button>
                        <button
                          onClick={() => openModal(u)}
                          className="p-2 text-slate-400 hover:text-primary transition-colors"
                        >
                          <Icons.Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Icons.Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* MODAL GESTIÓN USUARIO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden font-sans"
            >
              <header className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="text-xl font-bold uppercase tracking-tight">
                  {editTarget ? "Actualizar Datos" : "Nuevo Acceso al Sistema"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Icons.X size={24} />
                </button>
              </header>

              <form onSubmit={handleSave} className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm({ ...form, nombre: e.target.value })
                    }
                    required
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Dr. Ricardo López"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      Email / Login *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      required
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary"
                      placeholder="ricardo@vet-erp.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      Password {!editTarget && "*"}
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      required={!editTarget}
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary"
                      placeholder={
                        editTarget ? "••••••••" : "Password temporal"
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      CI / Carnet
                    </label>
                    <input
                      type="text"
                      value={form.ci}
                      onChange={(e) => setForm({ ...form, ci: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      Cargo / Rol *
                    </label>
                    <select
                      value={form.rol_id}
                      onChange={(e) =>
                        setForm({ ...form, rol_id: e.target.value })
                      }
                      required
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-sm"
                    >
                      <option value="">— Elegir Rol —</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) =>
                      setForm({ ...form, telefono: e.target.value })
                    }
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+591 ..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 rounded-2xl bg-primary text-slate-900 font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 mt-4"
                >
                  {saving
                    ? "Procesando..."
                    : editTarget
                      ? "Guardar Cambios"
                      : "Crear Acceso de Empleado"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
