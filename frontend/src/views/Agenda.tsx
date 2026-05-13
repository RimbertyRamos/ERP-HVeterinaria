import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons } from '../constants';
import { cn } from '../utils/cn';
import { api } from '../utils/api';
import { Cita, Mascota, UsuarioResumen } from '../types';
import { toast } from 'sonner';

export const Agenda: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const rol = user?.rol?.nombre;
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Formulario para nueva cita
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [doctores, setDoctores] = useState<UsuarioResumen[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [searchMascota, setSearchMascota] = useState('');
  const [form, setForm] = useState({
    mascota_id: '',
    doctor_id: '',
    consultorio_id: '',
    fecha: selectedDate,
    hora: '09:00',
    motivo: '',
    notas: ''
  });

  const loadCitas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCitas(selectedDate, rol === 'VETERINARIO' ? user.id : undefined);
      setCitas(data);
    } catch (err) {
      console.error('Error cargando citas:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, rol, user.id]);

  useEffect(() => {
    loadCitas();
  }, [loadCitas]);

  useEffect(() => {
    if (isModalOpen) {
      api.getUsuarios('VETERINARIO').then(setDoctores).catch(console.error);
      api.getConsultorios().then(setConsultorios).catch(console.error);
      // Carga inicial de mascotas para que el selector esté listo
      api.getMascotas().then(setMascotas).catch(console.error);
    }
  }, [isModalOpen]);

  const handleSearchMascota = async () => {
    try {
      const data = await api.getMascotas(searchMascota.trim() || undefined);
      setMascotas(data);
    } catch (err: any) {
      toast.error(err.message ?? 'Error buscando pacientes');
    }
  };

  const handleCreateCita = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCita({
        mascota_id: form.mascota_id,
        doctor_id: form.doctor_id || undefined,
        consultorio_id: form.consultorio_id || undefined,
        fecha_hora: `${form.fecha}T${form.hora}:00`,
        motivo: form.motivo,
        notas: form.notas
      });
      setIsModalOpen(false);
      toast.success('Cita programada correctamente');
      loadCitas();
      setForm({ ...form, mascota_id: '', consultorio_id: '', motivo: '', notas: '' });
      setSearchMascota('');
    } catch (err) {
      toast.error('Error al crear la cita');
    }
  };

  const handleUpdateEstado = async (id: string, estado: Cita['estado']) => {
    try {
      await api.updateEstadoCita(id, estado);
      toast.success(`Cita marcada como ${estado.toLowerCase()}`);
      loadCitas();
    } catch (err) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleCheckIn = async (cita: Cita) => {
    try {
      // 1. Obtener servicio consulta
      const servicios = await api.getServicios();
      const servicio = servicios.find((s: any) => s.nombre.toLowerCase().includes('consulta')) || servicios[0];

      // 2. Crear ficha
      await api.createFicha({
        mascota_id: cita.mascota_id,
        servicio_id: servicio.id,
        motivo: `CITA: ${cita.motivo}`
      });

      // 3. Marcar cita como completada
      await api.updateEstadoCita(cita.id, 'COMPLETADA');
      
      toast.success(`Check-in exitoso: ${cita.mascota.nombre} en espera`, {
        description: 'Se ha creado la ficha de atención correctamente.'
      });
      loadCitas();
    } catch (err) {
      toast.error('Error al procesar check-in');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8 h-full flex flex-col">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Agenda Médica</h2>
          <p className="text-slate-500 dark:text-slate-400">Gestión de citas y programación de servicios</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-slate-900 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
        >
          <Icons.Plus size={20} />
          Nueva Cita
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-hidden">
        {/* Calendario lateral y filtros */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
             <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Icons.Agenda size={18} className="text-primary" />
                Seleccionar Fecha
             </h3>
             <input 
               type="date" 
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
             />
             <div className="mt-6 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Atajos</p>
                <button 
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hoy
                </button>
                <button 
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setSelectedDate(tomorrow.toISOString().split('T')[0]);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Mañana
                </button>
             </div>
          </section>

          <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
             <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2">Resumen del Día</h4>
             <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Citas</span>
                   <span className="text-lg font-black">{citas.length}</span>
                </div>
                <div className="flex justify-between items-center text-amber-600">
                   <span className="text-xs font-bold uppercase tracking-wider">Pendientes</span>
                   <span className="text-lg font-black">{citas.filter(c => c.estado === 'PROGRAMADA').length}</span>
                </div>
             </div>
          </section>
        </div>

        {/* Lista de Citas */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest text-sm">
                Citas para el {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
             </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
             {loading ? (
                <div className="h-full flex items-center justify-center text-slate-400 italic">Cargando agenda...</div>
             ) : citas.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                   <Icons.Agenda size={64} />
                   <p className="font-bold">No hay citas programadas para esta fecha.</p>
                </div>
             ) : (
                <div className="space-y-4">
                   {citas.map((cita) => (
                      <div 
                        key={cita.id}
                        className={cn(
                          "group flex items-center gap-6 p-5 rounded-2xl border-2 transition-all hover:shadow-md",
                          cita.estado === 'COMPLETADA' ? "bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-60" :
                          cita.estado === 'CANCELADA' ? "bg-red-50 dark:bg-red-900/10 border-transparent opacity-40" :
                          "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/30"
                        )}
                      >
                         <div className="flex flex-col items-center justify-center w-20 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-black">
                            <span className="text-lg leading-none">{new Date(cita.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>

                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                               <h4 className="font-black text-slate-900 dark:text-white uppercase truncate">{cita.mascota.nombre}</h4>
                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">{cita.mascota.especie.nombre}</span>
                            </div>
                            <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
                               <Icons.User size={12} />
                               {cita.mascota.propietario.nombre}
                            </p>
                            <p className="text-xs text-slate-400 mt-2 italic truncate">{cita.motivo}</p>
                         </div>

                         <div className="flex-shrink-0 flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                               <span className={cn(
                                 "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border",
                                 cita.estado === 'PROGRAMADA' ? "bg-amber-50 text-amber-600 border-amber-200" :
                                 cita.estado === 'CONFIRMADA' ? "bg-blue-50 text-blue-600 border-blue-200" :
                                 cita.estado === 'COMPLETADA' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                 "bg-slate-100 text-slate-500 border-slate-200"
                               )}>
                                  {cita.estado}
                               </span>
                            </div>

                            {cita.estado === 'PROGRAMADA' && (
                               <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleUpdateEstado(cita.id, 'CONFIRMADA')}
                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    title="Confirmar Cita"
                                  >
                                     <Icons.CheckCircle2 size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleCheckIn(cita)}
                                    className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                                  >
                                     Check-in
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateEstado(cita.id, 'CANCELADA')}
                                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    title="Cancelar Cita"
                                  >
                                     <Icons.X size={18} />
                                  </button>
                               </div>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      </div>

      {/* MODAL NUEVA CITA */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            >
               <header className="p-6 bg-slate-900 text-white flex items-center justify-between">
                  <h3 className="text-xl font-bold">Programar Nueva Cita</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                     <Icons.X size={24} />
                  </button>
               </header>

               <form onSubmit={handleCreateCita} className="p-8 space-y-6 overflow-y-auto">
                  {/* Buscador de mascota */}
                  <div className="space-y-2">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Mascota *</label>
                     <div className="flex gap-2">
                        <input 
                           type="text" 
                           placeholder="Nombre de mascota o dueño..."
                           value={searchMascota}
                           onChange={(e) => setSearchMascota(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchMascota())}
                           className="flex-1 h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button 
                           type="button" onClick={handleSearchMascota}
                           className="h-12 w-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"
                        >
                           <Icons.Search size={20} />
                        </button>
                     </div>
                     <select
                        value={form.mascota_id}
                        onChange={(e) => setForm({...form, mascota_id: e.target.value})}
                        required
                        className="w-full h-12 px-4 rounded-xl bg-primary/5 border-2 border-primary/20 outline-none font-bold text-sm"
                     >
                        <option value="">— Seleccionar mascota —</option>
                        {mascotas.map(m => (
                           <option key={m.id} value={m.id}>{m.nombre} ({m.propietario.nombre})</option>
                        ))}
                     </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Fecha</label>
                        <input type="date" value={form.fecha} onChange={(e) => setForm({...form, fecha: e.target.value})} required className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Hora</label>
                        <input type="time" value={form.hora} onChange={(e) => setForm({...form, hora: e.target.value})} required className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none" />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Veterinario Asignado</label>
                     <select 
                        value={form.doctor_id} 
                        onChange={(e) => setForm({...form, doctor_id: e.target.value})}
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none"
                     >
                        <option value="">— Cualquier doctor disponible —</option>
                        {doctores.map(doc => <option key={doc.id} value={doc.id}>Dr. {doc.nombre}</option>)}
                     </select>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Motivo</label>
                     <input type="text" value={form.motivo} onChange={(e) => setForm({...form, motivo: e.target.value})} required placeholder="Ej: Vacunación Séxtuple, Control post-operatorio..." className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none" />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-primary text-slate-900 font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                     Programar Cita
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
