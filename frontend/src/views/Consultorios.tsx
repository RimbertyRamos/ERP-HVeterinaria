import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons } from '../constants';
import { cn } from '../utils/cn';
import { api } from '../utils/api';
import { Consultorio, TipoSala, UsuarioResumen } from '../types';
import { toast } from 'sonner';

const TIPO_ICONS: Record<TipoSala, any> = {
  CONSULTORIO: Icons.Clinical,
  LABORATORIO: Icons.Laboratory,
  QUIROFANO: Icons.Activity,
  SALA_ESPERA: Icons.WaitingRoom,
  OTRO: Icons.Settings
};

const ESTADO_COLORS: Record<string, string> = {
  LIBRE: 'bg-emerald-500',
  OCUPADO: 'bg-red-500',
  MANTENIMIENTO: 'bg-amber-500',
  LIMPIEZA: 'bg-blue-500'
};

export const Consultorios: React.FC = () => {
  const [rooms, setRooms] = useState<Consultorio[]>([]);
  const [users, setUsers] = useState<UsuarioResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Consultorio | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    especialidad: '',
    tipo: 'CONSULTORIO' as TipoSala,
    responsable_id: '',
    estado: 'LIBRE' as any
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsData, usersData] = await Promise.all([
        api.getConsultorios(),
        api.getUsuarios()
      ]);
      setRooms(roomsData);
      setUsers(usersData);
    } catch (err) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (room?: Consultorio) => {
    if (room) {
      setEditTarget(room);
      setForm({
        nombre: room.nombre,
        especialidad: room.especialidad || '',
        tipo: room.tipo,
        responsable_id: room.responsable_id || '',
        estado: room.estado
      });
    } else {
      setEditTarget(null);
      setForm({ nombre: '', especialidad: '', tipo: 'CONSULTORIO', responsable_id: '', estado: 'LIBRE' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        responsable_id: form.responsable_id || undefined
      };

      if (editTarget) {
        await api.updateConsultorio(editTarget.id, payload);
        toast.success('Sala actualizada correctamente');
      } else {
        await api.createConsultorio(payload);
        toast.success('Nueva sala creada con éxito');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta sala?')) return;
    try {
      await api.deleteConsultorio(id);
      toast.success('Sala eliminada');
      fetchData();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Infraestructura y Salas</h2>
          <p className="text-slate-500 dark:text-slate-400">Gestión de consultorios, laboratorios y quirófanos</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-slate-900 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
        >
          <Icons.Plus size={20} />
          Registrar Nueva Sala
        </button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3].map(i => <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const Icon = TIPO_ICONS[room.tipo] || Icons.Settings;
            return (
              <div 
                key={room.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                   <div className={cn(
                     "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                     room.estado === 'LIBRE' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-red-50 dark:bg-red-900/20 text-red-600"
                   )}>
                      <Icon size={24} />
                   </div>
                   <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", ESTADO_COLORS[room.estado] || 'bg-slate-400')} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{room.estado}</span>
                   </div>
                </div>

                <div className="space-y-1 mb-6">
                   <h3 className="font-black text-slate-900 dark:text-white uppercase truncate text-lg tracking-tight">{room.nombre}</h3>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{room.tipo}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                   <div className="flex items-center gap-2 text-xs">
                      <Icons.User size={14} className="text-slate-400" />
                      <span className="text-slate-500">Encargado:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                         {room.responsable?.nombre || 'Sin asignar'}
                      </span>
                   </div>
                   <div className="flex items-center gap-2 text-xs">
                      <Icons.Activity size={14} className="text-slate-400" />
                      <span className="text-slate-500">Especialidad:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                         {room.especialidad || 'General'}
                      </span>
                   </div>
                </div>

                <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={() => openModal(room)}
                     className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-primary hover:text-slate-900 transition-colors"
                   >
                     Configurar
                   </button>
                   <button 
                     onClick={() => handleDelete(room.id)}
                     className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                   >
                     <Icons.Trash2 size={14} />
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL GESTIÓN SALA */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
               <header className="p-6 bg-slate-900 text-white flex items-center justify-between">
                  <h3 className="text-xl font-bold">{editTarget ? 'Editar Configuración' : 'Nueva Sala de Hospital'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                     <Icons.X size={24} />
                  </button>
               </header>

               <form onSubmit={handleSave} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2 col-span-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nombre de la Sala *</label>
                        <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary" placeholder="Ej: Consultorio 10 - Felinos" />
                     </div>
                     
                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Tipo de Recurso</label>
                        <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value as TipoSala})} className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none">
                           <option value="CONSULTORIO">Consultorio Médico</option>
                           <option value="LABORATORIO">Laboratorio</option>
                           <option value="QUIROFANO">Quirófano</option>
                           <option value="SALA_ESPERA">Sala de Espera</option>
                           <option value="OTRO">Otro / Técnico</option>
                        </select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Estado Actual</label>
                        <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value as any})} className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none">
                           <option value="LIBRE">Libre</option>
                           <option value="OCUPADO">Ocupado</option>
                           <option value="LIMPIEZA">Limpieza</option>
                           <option value="MANTENIMIENTO">Mantenimiento</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Personal Responsable</label>
                     <select value={form.responsable_id} onChange={e => setForm({...form, responsable_id: e.target.value})} className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none">
                        <option value="">— Sin responsable fijo —</option>
                        {users.map(u => (
                           <option key={u.id} value={u.id}>{u.nombre} ({(u as any).rol?.nombre})</option>
                        ))}
                     </select>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Especialidad / Nota</label>
                     <input type="text" value={form.especialidad} onChange={e => setForm({...form, especialidad: e.target.value})} className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none" placeholder="Ej: Traumatología, Cirugía Mayor..." />
                  </div>

                  <button 
                    type="submit" disabled={saving}
                    className="w-full py-4 rounded-2xl bg-primary text-slate-900 font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                     {saving ? 'Guardando...' : (editTarget ? 'Actualizar Configuración' : 'Crear Sala')}
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
