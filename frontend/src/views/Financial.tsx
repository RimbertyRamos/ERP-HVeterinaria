import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Icons } from '../constants';
import { cn } from '../utils/cn';
import { api } from '../utils/api';
import { ReciboCaja } from '../types';

type Periodo = 'Semana' | 'Mes' | 'Año';

const METODO_LABEL: Record<string, string> = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', QR: 'QR' };

const formatFecha = (iso: string) => {
  const d = new Date(iso);
  const diffDias = Math.floor((Date.now() - d.getTime()) / 86400000);
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (diffDias === 0) return `Hoy, ${hora}`;
  if (diffDias === 1) return `Ayer, ${hora}`;
  return `${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}, ${hora}`;
};

export const Financial: React.FC = () => {
  const [recibos, setRecibos] = useState<ReciboCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>('Semana');

  useEffect(() => {
    api.getRecibos()
      .then(setRecibos)
      .finally(() => setLoading(false));
  }, []);

  const recibosPagados = useMemo(() =>
    recibos.filter(r => r.estado === 'PAGADO'),
    [recibos]
  );

  const recibosFiltrados = useMemo(() => {
    const dias = periodo === 'Semana' ? 7 : periodo === 'Mes' ? 30 : 365;
    const corte = new Date(Date.now() - dias * 86400000);
    return recibosPagados.filter(r => new Date(r.fecha_pago) >= corte);
  }, [recibosPagados, periodo]);

  const totalIngresos = useMemo(
    () => recibosFiltrados.reduce((s, r) => s + Number(r.total), 0),
    [recibosFiltrados]
  );

  const promedioCobro = recibosFiltrados.length > 0 ? totalIngresos / recibosFiltrados.length : 0;

  const chartData = useMemo(() => {
    if (periodo === 'Semana') {
      return Array.from({ length: 7 }, (_, i) => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - (6 - i));
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        const total = recibosPagados
          .filter(r => { const f = new Date(r.fecha_pago); return f >= start && f < end; })
          .reduce((s, r) => s + Number(r.total), 0);
        return { dia: start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }), ingresos: total };
      });
    }
    if (periodo === 'Mes') {
      return Array.from({ length: 4 }, (_, i) => {
        const wEnd = new Date(); wEnd.setHours(23, 59, 59, 999); wEnd.setDate(wEnd.getDate() - i * 7);
        const wStart = new Date(wEnd); wStart.setDate(wEnd.getDate() - 6); wStart.setHours(0, 0, 0, 0);
        const total = recibosPagados
          .filter(r => { const f = new Date(r.fecha_pago); return f >= wStart && f <= wEnd; })
          .reduce((s, r) => s + Number(r.total), 0);
        return { dia: `Sem ${4 - i}`, ingresos: total };
      }).reverse();
    }
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (11 - i));
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const total = recibosPagados
        .filter(r => { const f = new Date(r.fecha_pago); return f >= mStart && f <= mEnd; })
        .reduce((s, r) => s + Number(r.total), 0);
      return { dia: meses[d.getMonth()], ingresos: total };
    });
  }, [recibosPagados, periodo]);

  const ultimos = recibosFiltrados.slice(0, 8);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Finanzas y Reportes</h2>
          <p className="text-slate-500 dark:text-slate-400">Análisis de ingresos y cobros</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {(['Semana', 'Mes', 'Año'] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={cn(
                'px-4 py-1.5 text-xs font-bold rounded-md transition-all',
                periodo === p
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-emerald-500 text-white rounded-lg"><Icons.TrendingUp size={20} /></div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{periodo}</span>
          </div>
          <p className="text-emerald-700 dark:text-emerald-400 text-sm font-bold">Ingresos del Período</p>
          <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
            {loading ? '—' : `Bs.${totalIngresos.toFixed(2)}`}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-blue-500 text-white rounded-lg"><Icons.CreditCard size={20} /></div>
            <span className="text-xs font-bold text-blue-600">{loading ? '—' : `${recibosFiltrados.length} cobros`}</span>
          </div>
          <p className="text-blue-700 dark:text-blue-400 text-sm font-bold">Promedio por Cobro</p>
          <p className="text-3xl font-black text-blue-900 dark:text-blue-100 mt-1">
            {loading ? '—' : `Bs.${promedioCobro.toFixed(2)}`}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/30">
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-purple-500 text-white rounded-lg"><Icons.History size={20} /></div>
          </div>
          <p className="text-purple-700 dark:text-purple-400 text-sm font-bold">Total Recibos Emitidos</p>
          <p className="text-3xl font-black text-purple-900 dark:text-purple-100 mt-1">
            {loading ? '—' : recibosPagados.length}
          </p>
        </div>
      </div>

      {/* Chart + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Flujo de Ingresos</h3>
            <div className="flex items-center gap-2 text-xs font-bold">
              <div className="size-3 rounded-full bg-primary" />
              <span className="text-slate-500">Ingresos (Bs.)</span>
            </div>
          </div>
          {loading ? (
            <div className="h-[280px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${v}`} />
                  <Tooltip
                    formatter={(value: number) => [`Bs.${value.toFixed(2)}`, 'Ingresos']}
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="ingresos" stroke="#a3e635" strokeWidth={3} fillOpacity={1} fill="url(#gradIngresos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Últimos Cobros</h3>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : ultimos.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-400 text-center">Sin cobros en este período</p>
            </div>
          ) : (
            <div className="space-y-5 flex-1 overflow-y-auto">
              {ultimos.map((r) => {
                const descripcion = r.ficha?.mascota?.nombre ?? r.nombre_cliente ?? 'Venta Directa';
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex-shrink-0">
                        <Icons.ArrowUpRight size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{descripcion}</p>
                        <p className="text-xs text-slate-500">{formatFecha(r.fecha_pago)} · {METODO_LABEL[r.metodo_pago] ?? r.metodo_pago}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-emerald-600 flex-shrink-0">
                      +Bs.{Number(r.total).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
