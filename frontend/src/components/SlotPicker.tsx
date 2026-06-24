import React, { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { api } from "../utils/api";

interface Slot {
  hora: string;
  libre: boolean;
}

/**
 * Muestra los horarios del día como botones y permite elegir un hueco LIBRE.
 * Los ocupados/pasados salen deshabilitados. Vuelve a consultar al cambiar
 * fecha, doctor o duración.
 */
export const SlotPicker: React.FC<{
  fecha: string;
  doctorId?: string;
  duracion: number;
  value: string;
  onChange: (hora: string) => void;
}> = ({ fecha, doctorId, duracion, value, onChange }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fecha) return;
    let cancel = false;
    setLoading(true);
    api
      .getDisponibilidad(fecha, doctorId || undefined, duracion)
      .then((s: Slot[]) => {
        if (!cancel) setSlots(s);
      })
      .catch(() => {
        if (!cancel) setSlots([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [fecha, doctorId, duracion]);

  if (loading)
    return (
      <p className="text-xs text-slate-400 italic">Cargando horarios…</p>
    );
  if (slots.length === 0)
    return (
      <p className="text-xs text-slate-400 italic">
        No hay horarios disponibles para esta fecha.
      </p>
    );

  return (
    <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
      {slots.map((s) => (
        <button
          key={s.hora}
          type="button"
          disabled={!s.libre}
          onClick={() => onChange(s.hora)}
          className={cn(
            "py-2 rounded-lg text-xs font-bold border transition-colors",
            !s.libre
              ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-transparent cursor-not-allowed line-through"
              : value === s.hora
                ? "bg-primary text-slate-900 border-primary"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary",
          )}
        >
          {s.hora}
        </button>
      ))}
    </div>
  );
};
