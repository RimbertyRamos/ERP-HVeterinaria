import React, { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { api } from "../utils/api";

interface Slot {
  hora: string;
  libre: boolean;
}

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
    return <p className="text-xs text-muted italic">Cargando horarios…</p>;
  if (slots.length === 0)
    return (
      <p className="text-xs text-muted italic">
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
              ? "bg-surface-2 text-muted/40 border-transparent cursor-not-allowed line-through"
              : value === s.hora
                ? "bg-brand text-white border-brand"
                : "bg-surface text-ink border-line hover:border-brand",
          )}
        >
          {s.hora}
        </button>
      ))}
    </div>
  );
};
