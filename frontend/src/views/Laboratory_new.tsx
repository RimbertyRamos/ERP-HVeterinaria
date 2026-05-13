import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Icons } from '../constants';
import { cn } from '../utils/cn';
import { api } from '../utils/api';

interface LabOrder {
  id: string;
  patient: string;
  breed: string;
  vet: string;
  tests: string[];
  time: string;
  status: 'new' | 'processing' | 'pending';
}

interface LabResult {
  id: string;
  patient: string;
  order: string;
  status: 'en_proceso' | 'completado';
}

const initialOrders: LabOrder[] = [
  { id: 'ORD-2941-LAB', patient: 'Bruno', breed: 'Bulldog Francés', vet: 'Dr. Méndez', tests: ['Hemograma', 'Bioquímica'], time: '15 min', status: 'new' },
  { id: 'ORD-2938-LAB', patient: 'Luna', breed: 'Siamés', vet: 'Dra. Espino', tests: ['Citología'], time: 'En proceso', status: 'processing' },
  { id: 'ORD-2935-LAB', patient: 'Thor', breed: 'Golden Retriever', vet: 'Dr. Méndez', tests: ['Urianálisis'], time: '1 hora', status: 'pending' },
];

export const Laboratory: React.FC = () => {
  const [orders, setOrders] = useState<LabOrder[]>(initialOrders);
  const [filteredOrders, setFilteredOrders] = useState<LabOrder[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(initialOrders[1]);
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState({
    glóbulos_rojos: '6.52',
    hemoglobina: '12.4',
    leucocitos: '',
    observaciones: '',
    estado: 'en_proceso' as 'en_proceso' | 'completado',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Filtrar órdenes según búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = orders.filter(
      (order) =>
        order.id.toLowerCase().includes(query) ||
        order.patient.toLowerCase().includes(query) ||
        order.breed.toLowerCase().includes(query)
    );
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  // Actualizar orden seleccionada cuando cambia el estado
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  const handleSelectOrder = (order: LabOrder) => {
    setSelectedOrder(order);
    // Resetear resultados cuando cambias de orden
    setResult({
      glóbulos_rojos: '',
      hemoglobina: '',
      leucocitos: '',
      observaciones: '',
      estado: 'en_proceso',
    });
  };

  const handleSaveDraft = async () => {
    if (!selectedOrder) return;
    try {
      // Simular guardado
      alert('✅ Borrador guardado correctamente');
    } catch (err) {
      console.error('Error guardando:', err);
      alert('❌ Error al guardar');
    }
  };

  const handleFinalize = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      // Validar que al menos un campo está lleno
      if (!result.glóbulos_rojos && !result.hemoglobina && !result.leucocitos) {
        alert('⚠️ Ingresa al menos un valor para los parámetros');
        setIsSaving(false);
        return;
      }

      // Simular sincronización
      setTimeout(() => {
        // Marcar orden como completada
        const updatedOrders = orders.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, status: 'pending' as const, time: '✓ Completado' }
            : o
        );
        setOrders(updatedOrders);
        setSelectedOrder(null);
        alert('✅ Resultados finalizados y sincronizados correctamente');
        setResult({
          glóbulos_rojos: '',
          hemoglobina: '',
          leucocitos: '',
          observaciones: '',
          estado: 'en_proceso',
        });
      }, 1000);
    } catch (err) {
      console.error('Error finalizando:', err);
      alert('❌ Error al finalizar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestión de Laboratorio</h2>
          <p className="text-slate-500 dark:text-slate-400">Procesamiento de muestras y resultados</p>
        </div>
        <div className="relative">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none w-64"
            placeholder="Buscar orden, mascota..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Pending List */}
        <div className="xl:col-span-1 space-y-6">
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Icons.Clock className="text-amber-500" size={20} />
                Muestras Pendientes
              </h3>
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold">
                {filteredOrders.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((lab) => (
                  <button
                    key={lab.id}
                    onClick={() => handleSelectOrder(lab)}
                    className={cn(
                      'w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-l-4',
                      selectedOrder?.id === lab.id
                        ? 'bg-primary/5 border-primary'
                        : lab.status === 'new'
                          ? 'border-amber-400'
                          : lab.status === 'processing'
                            ? 'border-primary'
                            : 'border-slate-300'
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-slate-400">{lab.id}</span>
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded uppercase font-bold',
                          lab.status === 'processing'
                            ? 'text-primary italic'
                            : 'bg-slate-100 dark:bg-slate-800'
                        )}
                      >
                        {lab.time}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{lab.patient}</h4>
                    <p className="text-sm text-slate-500 mb-3">{lab.breed}</p>
                    <div className="flex flex-wrap gap-1">
                      {lab.tests.map((test, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase"
                        >
                          {test}
                        </span>
                      ))}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <p className="text-sm">No hay órdenes que coincidan</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Result Entry */}
        <div className="xl:col-span-2">
          {selectedOrder ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-primary h-12 w-12 rounded-lg flex items-center justify-center text-slate-900">
                    <Icons.FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedOrder.patient}</h3>
                    <p className="text-slate-400 text-sm">
                      Orden: #{selectedOrder.id} | Médico: {selectedOrder.vet}
                    </p>
                  </div>
                </div>
                <select
                  value={result.estado}
                  onChange={(e) =>
                    setResult({
                      ...result,
                      estado: e.target.value as 'en_proceso' | 'completado',
                    })
                  }
                  className="bg-slate-800 border-none rounded-lg text-sm font-bold focus:ring-primary px-4 py-2 outline-none"
                >
                  <option value="en_proceso">En Proceso</option>
                  <option value="completado">Completado</option>
                </select>
              </div>

              <div className="p-8 space-y-8">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <Icons.Activity className="text-primary" size={20} />
                    Parámetros de Análisis
                  </h4>
                  <div className="space-y-4">
                    {[
                      {
                        name: 'Glóbulos Rojos (RBC)',
                        ref: '5.0 - 10.0 x10^6/uL',
                        key: 'glóbulos_rojos',
                      },
                      { name: 'Hemoglobina', ref: '8.0 - 15.0 g/dL', key: 'hemoglobina' },
                      {
                        name: 'Leucocitos',
                        ref: '5.5 - 19.5 x10^3/uL',
                        key: 'leucocitos',
                      },
                    ].map((param) => (
                      <div key={param.key} className="grid grid-cols-3 gap-6 items-center">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {param.name}
                        </p>
                        <input
                          className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none"
                          type="text"
                          value={result[param.key as keyof typeof result]}
                          onChange={(e) =>
                            setResult({
                              ...result,
                              [param.key]: e.target.value,
                            })
                          }
                          placeholder="--"
                        />
                        <p className="text-xs text-slate-500 italic">{param.ref}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Icons.FileText className="text-primary" size={20} />
                      Observaciones
                    </h4>
                    <textarea
                      className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none text-sm"
                      placeholder="Comentarios del patólogo..."
                      rows={4}
                      value={result.observaciones}
                      onChange={(e) =>
                        setResult({ ...result, observaciones: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Icons.CheckCircle2 className="text-primary" size={20} />
                      Estado del Análisis
                    </h4>
                    <div className="p-6 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full bg-primary"></div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Muestras recibidas
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full bg-slate-300"></div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Procesando...
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 italic pt-3">
                        Los datos se sincronizarán automáticamente al finalizar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleSaveDraft}
                    className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Icons.Save size={16} className="inline mr-2" />
                    Guardar Borrador
                  </button>
                  <button
                    onClick={handleFinalize}
                    disabled={isSaving}
                    className="px-8 py-2.5 rounded-lg bg-primary text-slate-900 font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Sincronizando...' : 'Finalizar y Sincronizar'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-12 flex flex-col items-center justify-center text-center h-96">
              <Icons.FileText size={48} className="text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Selecciona una orden
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Haz clic en una muestra de la izquierda para cargar los resultados.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
