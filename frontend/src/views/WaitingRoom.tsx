import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons } from '../constants';
import { cn } from '../utils/cn';
import { api } from '../utils/api';
import { toast } from 'sonner';

interface WaitingFicha {
  id: string;
  cod_ficha: string;
  mascota: { nombre: string; especie: { nombre: string } };
  prioridad: 'NORMAL' | 'URGENTE';
  estado: string;
  servicio: { nombre: string };
  consultorio?: { nombre: string };
  doctor?: { nombre: string };
  fecha_hora: string;
}

interface SalaOption { id: string; nombre: string; tipo: string; estado: string }
interface DoctorOption { id: string; nombre: string }

export const WaitingRoom: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [fichas, setFichas] = useState<WaitingFicha[]>([]);
  const [calling, setCalling] = useState<WaitingFicha | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal: iniciar atención
  const [iniciarId, setIniciarId] = useState<string | null>(null);
  const [salas, setSalas] = useState<SalaOption[]>([]);
  const [doctores, setDoctores] = useState<DoctorOption[]>([]);
  const [iniciarForm, setIniciarForm] = useState({ doctor_id: '', consultorio_id: '' });
  const [isSaving, setIsSaving] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isManager = user?.rol?.nombre === 'ADMIN' || user?.rol?.nombre === 'RECEPCIONISTA';

  // Ref para evitar el loop infinito en useCallback
  const callingRef = useRef<WaitingFicha | null>(null);
  const lastAutoCalledIdRef = useRef<string | null>(null);
  useEffect(() => { callingRef.current = calling; }, [calling]);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getFichas();
      const active = (data as WaitingFicha[]).filter(f => f.estado === 'ESPERA' || f.estado === 'EN_CURSO');
      setFichas(active);

      const enCurso = active.find(f => f.estado === 'EN_CURSO');
      // Auto-llamar solo cuando cambia el paciente actualmente en curso.
      if (enCurso && lastAutoCalledIdRef.current !== enCurso.id) {
        lastAutoCalledIdRef.current = enCurso.id;
        setCalling(enCurso);
        setTimeout(() => setCalling(null), 8000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencia en `calling` — usa ref

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Carga salas y doctores al abrir el modal
  useEffect(() => {
    if (!iniciarId) return;
    Promise.all([
      api.getConsultorios(),
      api.getUsuarios('VETERINARIO'),
    ]).then(([cons, docs]) => {
      setSalas((cons as SalaOption[]).filter(c => c.estado === 'LIBRE'));
      setDoctores(docs as DoctorOption[]);
      setIniciarForm({ doctor_id: '', consultorio_id: '' });
    }).catch(console.error);
  }, [iniciarId]);

  const handleManualCall = (ficha: WaitingFicha) => {
    setCalling(ficha);
    setTimeout(() => setCalling(null), 8000);
    toast.info(`Re-llamando a ${ficha.mascota.nombre}...`);
  };

  const handleTogglePrioridad = async (ficha: WaitingFicha) => {
    const nueva = ficha.prioridad === 'URGENTE' ? 'NORMAL' : 'URGENTE';
    try {
      await api.updateFicha(ficha.id, { prioridad: nueva });
      toast.success(`Prioridad cambiada a ${nueva}`);
      loadData();
    } catch (e: any) {
      toast.error(e.message ?? 'Error al actualizar prioridad');
    }
  };

  const handleCancelar = async (id: string) => {
    if (!window.confirm('¿Anular este turno de espera?')) return;
    try {
      await api.cancelarFicha(id);
      setFichas(prev => prev.filter(f => f.id !== id));
      toast.success('Paciente retirado de la cola');
    } catch (e: any) {
      toast.error(e.message ?? 'Error al cancelar');
    }
  };

  const handleIniciarAtencion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iniciarId || !iniciarForm.doctor_id || !iniciarForm.consultorio_id) return;
    setIsSaving(true);
    try {
      const ficha = fichas.find(f => f.id === iniciarId);
      await api.iniciarFicha(iniciarId, {
        doctor_id: iniciarForm.doctor_id,
        consultorio_id: iniciarForm.consultorio_id,
      });
      toast.success(`¡Atención iniciada para ${ficha?.mascota.nombre}!`);
      setIniciarId(null);
      loadData();
    } catch (e: any) {
      toast.error(e.message ?? 'Error al iniciar atención');
    } finally {
      setIsSaving(false);
    }
  };

  const fichaModal = fichas.find(f => f.id === iniciarId);
  const enEspera = fichas.filter(f => f.estado === 'ESPERA');
  const enCurso = fichas.filter(f => f.estado === 'EN_CURSO');

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-white overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative flex h-24 items-center justify-between px-12 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center text-slate-900 shadow-[0_0_30px_rgba(163,230,53,0.4)]">
            <Icons.WaitingRoom size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white">SALA DE ESPERA</h1>
            <p className="text-primary font-bold text-xs uppercase tracking-[0.3em]">Hospital Veterinario Integral</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black tabular-nums text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Atención en Tiempo Real</p>
        </div>
      </header>

      {/* Main */}
      <main className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Turnos en espera */}
        <div className="lg:col-span-7 p-12 overflow-y-auto">
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-500 mb-8">
            Próximos Turnos
            <span className="ml-3 text-base text-primary">({enEspera.length})</span>
          </h2>
          <div className="space-y-4">
            {enEspera.map(ficha => {
              const minutos = Math.round((Date.now() - new Date(ficha.fecha_hora).getTime()) / 60000);
              return (
                <motion.div
                  key={ficha.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'group flex items-center justify-between p-6 rounded-3xl border-2 transition-all',
                    ficha.prioridad === 'URGENTE'
                      ? 'bg-red-500/5 border-red-500/40'
                      : 'bg-white/5 border-white/5 hover:border-white/10'
                  )}
                >
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      'h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0',
                      ficha.prioridad === 'URGENTE' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'
                    )}>
                      {ficha.cod_ficha.slice(-2)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">{ficha.mascota.nombre}</h3>
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">{ficha.servicio.nombre}</p>
                      <p className="text-slate-600 font-bold text-[10px] mt-0.5">
                        {minutos < 1 ? 'Recién llegado' : `Esperando ${minutos} min`}
                        {minutos >= 30 && <span className="text-amber-500 ml-2">⚠ Espera prolongada</span>}
                      </p>
                    </div>
                  </div>

                  {isManager && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setIniciarId(ficha.id)}
                        className="px-3 py-2 bg-primary text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:bg-primary/80 transition-colors"
                        title="Asignar sala e iniciar atención"
                      >
                        <Icons.ChevronRight size={14} /> Iniciar
                      </button>
                      <button
                        onClick={() => handleManualCall(ficha)}
                        className="p-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                        title="Llamar al paciente"
                      >
                        <Icons.Bell size={18} />
                      </button>
                      <button
                        onClick={() => handleTogglePrioridad(ficha)}
                        className={cn(
                          'p-3 rounded-xl transition-colors',
                          ficha.prioridad === 'URGENTE'
                            ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                        )}
                        title={ficha.prioridad === 'URGENTE' ? 'Quitar urgencia' : 'Marcar como urgente'}
                      >
                        <Icons.AlertTriangle size={18} />
                      </button>
                      <button
                        onClick={() => handleCancelar(ficha.id)}
                        className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                        title="Cancelar turno"
                      >
                        <Icons.Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {!loading && enEspera.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 opacity-20 space-y-4">
                <Icons.Inbox size={64} />
                <p className="font-bold uppercase tracking-widest text-sm">No hay pacientes en espera</p>
              </div>
            )}
          </div>
        </div>

        {/* Atendiendo ahora */}
        <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border-l border-white/5 p-12 overflow-y-auto">
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-500 mb-8">Atendiendo Ahora</h2>
          <div className="space-y-4">
            {enCurso.map(ficha => (
              <div key={ficha.id} className="p-8 rounded-[40px] bg-gradient-to-br from-primary to-emerald-500 text-slate-950">
                <h3 className="text-5xl font-black uppercase tracking-tighter mb-2">{ficha.mascota.nombre}</h3>
                <p className="text-lg font-bold opacity-70 mb-6 uppercase tracking-widest italic">{ficha.mascota.especie.nombre}</p>
                <p className="text-xl font-black">{ficha.consultorio?.nombre ?? 'CONSULTORIO'}</p>
                {ficha.doctor && (
                  <p className="text-sm font-bold opacity-70 mt-1">Dr. {ficha.doctor.nombre}</p>
                )}
              </div>
            ))}
            {enCurso.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 opacity-20 space-y-4">
                <Icons.Clinical size={64} />
                <p className="font-bold uppercase tracking-widest text-sm">Sin atenciones activas</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Overlay de llamado */}
      <AnimatePresence>
        {calling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-primary flex flex-col items-center justify-center text-slate-950 text-center cursor-pointer"
            onClick={() => setCalling(null)}
          >
            <p className="text-2xl font-black uppercase tracking-[0.5em] opacity-60 mb-4">LLAMANDO AHORA</p>
            <h2 className="text-[10rem] font-black leading-none uppercase tracking-tighter">{calling.mascota.nombre}</h2>
            <p className="text-4xl font-black uppercase italic mt-4">{calling.consultorio?.nombre ?? 'CONSULTORIO'}</p>
            <p className="text-sm font-bold opacity-40 mt-8 uppercase tracking-widest">Toca para cerrar</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Iniciar Atención */}
      <AnimatePresence>
        {iniciarId && fichaModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIniciarId(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <header className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-white">Iniciar Atención</h3>
                  <p className="text-primary font-bold text-sm mt-0.5">
                    {fichaModal.mascota.nombre} · {fichaModal.cod_ficha}
                  </p>
                </div>
                <button onClick={() => setIniciarId(null)} className="text-slate-500 hover:text-white transition-colors">
                  <Icons.X size={24} />
                </button>
              </header>

              <form onSubmit={handleIniciarAtencion} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Doctor / Veterinario *
                  </label>
                  <select
                    required
                    value={iniciarForm.doctor_id}
                    onChange={e => setIniciarForm(f => ({ ...f, doctor_id: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-slate-800 border border-white/10 text-white outline-none focus:border-primary transition-colors"
                  >
                    <option value="">— Seleccionar doctor —</option>
                    {doctores.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.nombre}</option>
                    ))}
                  </select>
                  {doctores.length === 0 && (
                    <p className="text-xs text-amber-400 font-bold">No se encontraron veterinarios registrados</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Consultorio / Sala *
                  </label>
                  <select
                    required
                    value={iniciarForm.consultorio_id}
                    onChange={e => setIniciarForm(f => ({ ...f, consultorio_id: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-slate-800 border border-white/10 text-white outline-none focus:border-primary transition-colors"
                  >
                    <option value="">— Seleccionar sala libre —</option>
                    {salas.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre} ({s.tipo})</option>
                    ))}
                  </select>
                  {salas.length === 0 && (
                    <p className="text-xs text-red-400 font-bold">No hay salas libres disponibles</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSaving || !iniciarForm.doctor_id || !iniciarForm.consultorio_id}
                  className="w-full py-4 rounded-2xl bg-primary text-slate-900 font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  {isSaving ? 'Iniciando...' : '▶  Llamar y Asignar Sala'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer ticker */}
      <footer className="h-16 bg-slate-900 border-t border-white/5 flex items-center overflow-hidden flex-shrink-0">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-20">
          <span className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-slate-400">
            <Icons.Activity className="text-primary" size={16} /> Bienvenido al Hospital Veterinario Integral
          </span>
          <span className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-slate-400">
            <Icons.ShieldAlert className="text-red-500" size={16} /> Atención de emergencias 24 horas
          </span>
          <span className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-slate-400">
            <Icons.Laboratory className="text-blue-500" size={16} /> Laboratorio clínico avanzado disponible
          </span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 30s linear infinite; }
        `,
      }} />
    </div>
  );
};
