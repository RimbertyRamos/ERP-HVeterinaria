import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../utils/api";
import { StarRating } from "./StarRating";

interface CalificacionExistente {
  puntaje: number;
  comentario?: string | null;
}

export const CalificacionFicha: React.FC<{
  fichaId: string;
  servicioId?: string;
  yaCalificada?: CalificacionExistente | null;
  puedeCalificar: boolean;
}> = ({ fichaId, servicioId, yaCalificada, puedeCalificar }) => {
  const [rating, setRating] = useState(yaCalificada?.puntaje ?? 0);
  const [comentario, setComentario] = useState(yaCalificada?.comentario ?? "");
  const [saving, setSaving] = useState(false);
  const [hecha, setHecha] = useState<CalificacionExistente | null>(
    yaCalificada ?? null,
  );
  const [promedio, setPromedio] = useState<{
    promedio: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (!servicioId) return;
    api
      .getPromedioServicio(servicioId)
      .then((p: any) =>
        setPromedio({ promedio: Number(p?.promedio) || 0, total: p?.total ?? 0 }),
      )
      .catch(() => {});
  }, [servicioId]);

  if (!puedeCalificar) return null;

  const enviar = async () => {
    if (rating < 1) {
      toast.error("Selecciona de 1 a 5 estrellas");
      return;
    }
    setSaving(true);
    try {
      await api.calificar({
        ficha_id: fichaId,
        puntaje: rating,
        comentario: comentario.trim() || undefined,
      });
      setHecha({ puntaje: rating, comentario: comentario.trim() || null });
      toast.success("¡Gracias por tu calificación!");
    } catch (e: any) {
      const msg = e?.message ?? "";
      if (/calific/i.test(msg)) {
        setHecha({ puntaje: rating, comentario: comentario.trim() || null });
      }
      toast.error(msg || "No se pudo registrar la calificación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 border-t border-line pt-3">
      {hecha ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">
            Tu calificación:
          </span>
          <StarRating value={hecha.puntaje} readOnly size={18} />
          {hecha.comentario && (
            <span className="text-xs italic text-muted">
              "{hecha.comentario}"
            </span>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">
              Califica la atención:
            </span>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <textarea
            value={comentario ?? ""}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Comentario (opcional)"
            rows={2}
            maxLength={1000}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand text-ink"
          />
          <button
            type="button"
            onClick={enviar}
            disabled={saving}
            className="rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white hover:bg-brand-strong disabled:opacity-50 transition-colors"
          >
            {saving ? "Enviando…" : "Enviar calificación"}
          </button>
        </div>
      )}
      {promedio && promedio.total > 0 && (
        <p className="mt-2 text-[11px] text-muted">
          Promedio del servicio: {promedio.promedio.toFixed(1)}★ (
          {promedio.total} calificacion{promedio.total === 1 ? "" : "es"})
        </p>
      )}
    </div>
  );
};
