import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons } from '../constants';
import { cn } from '../utils/cn';
import { api } from '../utils/api';
import { LaboratorioOrden, Mascota, CatalogoExamen, Consultorio } from '../types';
import { toast } from 'sonner';

const LAB_ROOM_ID = '114bda13-71b3-407e-bb3f-a74e316ef0c4'; // ID del Consultorio Laboratorio

export const Laboratory: React.FC = () => {
  const [orders, setOrders] = useState<LaboratorioOrden[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<LaboratorioOrden | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState({ hallazgos: '', observaciones: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Estados para Nueva Orden Directa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [examenes, setExamenes] = useState<CatalogoExamen[]>([]);
  const [searchMascota, setSearchMascota] = useState('');
  const [directOrderForm, setDirectOrderForm] = useState({
    mascota_id: '',
    examen_id: '',
    prioridad: 'NORMAL' as 'NORMAL' | 'URGENTE'
  });

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getOrdenes();
      setOrders(data);
    } catch (err) {
      console.error('Error cargando órdenes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    api.getExamenes().then(setExamenes);
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const filteredOrders = orders.filter(o => 
    o.cod_orden.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.ficha.mascota.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectOrder = async (order: LaboratorioOrden) => {
    setSelectedOrder(order);
    if (order.estado === 'SOLICITADO') {
      try {
        await api.updateEstadoOrden(order.id, 'EN_PROCESO');
        // Marcar laboratorio como ocupado si es un ingreso directo o si el paciente está ahí
        await api.updateConsultorioEstado(LAB_ROOM_ID, 'OCUPADO');
        loadOrders();
        toast.info(`Orden ${order.cod_orden} en proceso`);
      } catch {
        toast.error('Error al actualizar el estado');
      }
    }
    setResult({
      hallazgos: order.resultado?.hallazgos || '',
      observaciones: order.resultado?.observaciones || '',
    });
  };

  const handleFinalize = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    
    try {
      await api.cargarResultado(selectedOrder.id, {
        hallazgos: result.hallazgos,
        observaciones: result.observaciones
      });
      
      // IMPORTANTE: Liberar el laboratorio al terminar
      await api.updateConsultorioEstado(LAB_ROOM_ID, 'LIBRE');
      
      toast.success(`Resultados de ${selectedOrder.ficha.mascota.nombre} guardados con éxito`);
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      toast.error('Error al sincronizar resultados');
    } finally {
      setIsSaving(false);
    }
  };

  // Lógica para Orden Directa
  const handleSearchMascota = async () => {
    if (!searchMascota.trim()) return;
    const data = await api.getMascotas(searchMascota);
    setMascotas(data);
  };

  const handleCreateDirectOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Obtener servicio de laboratorio genérico
      const servicios = await api.getServicios();
      const servLab = servicios.find((s: any) => s.nombre.toLowerCase().includes('laboratorio')) || servicios[0];

      // 2. Crear ficha técnica asociada al Consultorio Laboratorio
      const ficha = await api.createFicha({
        mascota_id: directOrderForm.mascota_id,
        servicio_id: servLab.id,
        motivo: 'ANÁLISIS EXTERNO / INGRESO DIRECTO',
        consultorio_id: LAB_ROOM_ID
      });

      // 3. Crear la orden de laboratorio
      await api.createOrden({
        ficha_id: ficha.id,
        examen_id: directOrderForm.examen_id,
        prioridad: directOrderForm.prioridad
      });

      // 4. Marcar laboratorio como OCUPADO inmediatamente
      await api.updateConsultorioEstado(LAB_ROOM_ID, 'OCUPADO');

      toast.success('Orden directa creada. Laboratorio marcado como OCUPADO');
      setIsModalOpen(false);
      loadOrders();
      setDirectOrderForm({ mascota_id: '', examen_id: '', prioridad: 'NORMAL' });
      setSearchMascota('');
      setMascotas([]);
    } catch (err) {
      toast.error('Error al crear la orden directa');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestión de Laboratorio</h2>
          <p className="text-slate-500 dark:text-slate-400">Panel de procesamiento de muestras</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Icons.Plus size={20} />
            Nueva Orden Directa
          </button>
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none w-64 text-sm"
              placeholder="Buscar orden o paciente..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Listado de Órdenes */}
        <div className="xl:col-span-1 space-y-6">
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Icons.Clock className="text-amber-500" size={20} />
                Cola de Muestras
              </h3>
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold">
                {filteredOrders.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[calc(100vh-300px)] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-400 italic">Cargando muestras...</div>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={cn(
                      'w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-l-4',
                      selectedOrder?.id === order.id
                        ? 'bg-primary/5 border-primary'
                        : order.estado === 'SOLICITADO'
                          ? 'border-amber-400'
                          : order.estado === 'EN_PROCESO'
                            ? 'border-blue-500'
                            : 'border-emerald-500'
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">
                        {order.cod_orden}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest",
                        order.estado === 'SOLICITADO' ? "bg-amber-100 text-amber-700" :
                        order.estado === 'EN_PROCESO' ? "bg-blue-100 text-blue-700" :
                        "bg-emerald-100 text-emerald-700"
                      )}>
                        {order.estado}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{order.ficha.mascota.nombre}</h4>
                    <p className="text-xs text-slate-500 mb-2">{order.examen.nombre}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                      <Icons.User size={12} />
                      {order.ficha.doctor?.nombre || 'Ingreso Directo'}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Icons.Inbox size={40} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No hay órdenes pendientes</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Panel de Trabajo */}
        <div className="xl:col-span-2">
          {selectedOrder ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-primary h-12 w-12 rounded-lg flex items-center justify-center text-slate-900">
                    <Icons.FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedOrder.ficha.mascota.nombre}</h3>
                    <p className="text-slate-400 text-sm">
                      Examen: <span className="text-primary font-bold">{selectedOrder.examen.nombre}</span> | Prioridad: {selectedOrder.prioridad}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Muestra</p>
                      <p className="font-bold">{selectedOrder.examen.tipo_muestra || 'No especificada'}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Solicitado por</p>
                      <p className="font-bold">{selectedOrder.ficha.doctor?.nombre || 'Ingreso Directo'}</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase text-xs tracking-widest">
                    <Icons.Activity className="text-primary" size={16} />
                    Hallazgos del Análisis
                  </h4>
                  <textarea
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                    placeholder="Describe los resultados encontrados..."
                    rows={6}
                    value={result.hallazgos}
                    onChange={(e) => setResult({ ...result, hallazgos: e.target.value })}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase text-xs tracking-widest">
                    <Icons.Settings className="text-primary" size={16} />
                    Observaciones Adicionales
                  </h4>
                  <input
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none text-sm"
                    placeholder="Notas internas..."
                    value={result.observaciones}
                    onChange={(e) => setResult({ ...result, observaciones: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => setSelectedOrder(null)} className="px-6 py-2.5 rounded-lg text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
                  <button
                    onClick={handleFinalize}
                    disabled={isSaving || !result.hallazgos}
                    className="px-8 py-2.5 rounded-lg bg-primary text-slate-900 font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : 'Finalizar y Notificar'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-12 flex flex-col items-center justify-center text-center h-[500px]">
              <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                <Icons.FileText size={48} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Panel de Procesamiento</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs">Selecciona una orden de la cola para comenzar a registrar los resultados.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL NUEVA ORDEN DIRECTA */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
               <header className="p-6 bg-indigo-600 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Icons.Laboratory size={24} />
                     <h3 className="text-xl font-bold uppercase tracking-tight">Nueva Orden Directa</h3>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
                     <Icons.X size={24} />
                  </button>
               </header>

               <form onSubmit={handleCreateDirectOrder} className="p-8 space-y-6">
                  {/* Buscador de mascota */}
                  <div className="space-y-2">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Paso 1: Identificar Mascota *</label>
                     <div className="flex gap-2">
                        <input 
                           type="text" 
                           placeholder="Nombre o Propietario..."
                           value={searchMascota}
                           onChange={(e) => setSearchMascota(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchMascota())}
                           className="flex-1 h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <button type="button" onClick={handleSearchMascota} className="h-12 w-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
                           <Icons.Search size={20} />
                        </button>
                     </div>
                     {mascotas.length > 0 && (
                        <select 
                           value={directOrderForm.mascota_id} 
                           onChange={(e) => setDirectOrderForm({...directOrderForm, mascota_id: e.target.value})}
                           required
                           className="w-full h-12 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-200 dark:border-indigo-800 outline-none font-bold text-sm"
                        >
                           <option value="">— Seleccionar paciente —</option>
                           {mascotas.map(m => (
                              <option key={m.id} value={m.id}>{m.nombre} ({m.propietario.nombre})</option>
                           ))}
                        </select>
                     )}
                     <p className="text-[10px] text-slate-400 italic">Si la mascota no aparece, regístrala primero en el módulo de Clínica.</p>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Paso 2: Análisis Requerido *</label>
                     <select 
                        value={directOrderForm.examen_id} 
                        onChange={(e) => setDirectOrderForm({...directOrderForm, examen_id: e.target.value})}
                        required
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none text-sm font-bold"
                     >
                        <option value="">— Seleccionar examen del catálogo —</option>
                        {examenes.map(ex => <option key={ex.id} value={ex.id}>{ex.nombre} (Bs. {ex.precio})</option>)}
                     </select>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Paso 3: Prioridad</label>
                     <div className="flex gap-4">
                        {['NORMAL', 'URGENTE'].map(p => (
                           <button 
                              key={p} type="button"
                              onClick={() => setDirectOrderForm({...directOrderForm, prioridad: p as any})}
                              className={cn(
                                 "flex-1 py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all",
                                 directOrderForm.prioridad === p 
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                              )}
                           >
                              {p}
                           </button>
                        ))}
                     </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                  >
                     Crear Orden de Laboratorio
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
