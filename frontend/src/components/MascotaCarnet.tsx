import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icons } from "../constants";
import { api } from "../utils/api";

interface CarnetMascota {
  id: string;
  nombre: string;
  especie: { nombre: string } | string | null;
  raza: { nombre: string } | string | null;
  sexo?: string | null;
  fecha_nacimiento?: string | null;
  peso_actual?: number | string | null;
  propietario: {
    nombre: string;
    email?: string | null;
    telefono?: string | null;
    ci?: string | null;
  };
}

const nombreDe = (x: { nombre: string } | string | null | undefined): string =>
  !x ? "" : typeof x === "string" ? x : x.nombre;

const safe = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");

const sexoLabel = (s?: string | null) =>
  s === "M" || s === "MACHO" ? "Macho" : s === "H" || s === "HEMBRA" ? "Hembra" : s || "—";

const calcEdad = (iso?: string | null): string => {
  if (!iso) return "—";
  const nac = new Date(iso);
  if (Number.isNaN(nac.getTime())) return "—";
  const ahora = new Date();
  let meses =
    (ahora.getFullYear() - nac.getFullYear()) * 12 +
    (ahora.getMonth() - nac.getMonth());
  if (ahora.getDate() < nac.getDate()) meses -= 1;
  if (meses < 0) return "—";
  const a = Math.floor(meses / 12);
  const m = meses % 12;
  if (a <= 0) return `${m} mes${m === 1 ? "" : "es"}`;
  return m > 0 ? `${a} año${a === 1 ? "" : "s"} ${m} m` : `${a} año${a === 1 ? "" : "s"}`;
};

// Estilos de impresión GATEADOS por `body.carnet-printing`: solo se activan durante
// la impresión del carné, para no chocar con el @media print del historial
// (HistoriaClinicaFicha) que puede estar montado a la vez. La especificidad extra
// (body.carnet-printing …) gana a las reglas del historial.
const PRINT_CSS = `
  .carnet-print-portal { display: none; }
  @media print {
    body.carnet-printing > *:not(.carnet-print-portal) { display: none !important; }
    body.carnet-printing .carnet-print-portal { display: block !important; }
    body.carnet-printing .carnet-no-print { display: none !important; }
    body.carnet-printing .carnet-print-portal,
    body.carnet-printing .carnet-print-portal * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

/**
 * Botón + credencial imprimible (carné) de una mascota. Reutiliza el patrón del
 * historial: contenido en un portal a document.body, oculto salvo en @media print.
 * Trae best-effort las últimas vacunas desde la historia clínica (no toca backend).
 */
export const MascotaCarnet: React.FC<{ mascota: CarnetMascota }> = ({
  mascota,
}) => {
  const [vacunas, setVacunas] = useState<string[]>([]);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const historias: any[] = await api.getHistoriasMascota(mascota.id);
        if (!historias?.length) return;
        // getByMascota ordena por fecha desc → la primera es la más reciente.
        const full: any = await api.getHistoria(historias[0].id);
        if (activo && Array.isArray(full?.vacunas_nombres)) {
          setVacunas(full.vacunas_nombres.filter(Boolean));
        }
      } catch {
        /* el carné funciona sin vacunas */
      }
    })();
    return () => {
      activo = false;
    };
  }, [mascota.id]);

  const handlePrint = () => {
    const prev = document.title;
    document.title = `Carnet-${safe(mascota.nombre) || "mascota"}`;
    document.body.classList.add("carnet-printing");
    const restore = () => {
      document.title = prev;
      document.body.classList.remove("carnet-printing");
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  const dato = (label: string, valor: React.ReactNode) => (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="text-[12px] font-semibold text-slate-800">{valor || "—"}</p>
    </div>
  );

  const carnet = (
    <div className="carnet-sheet mx-auto w-[340px] rounded-2xl border border-slate-300 bg-white p-5 text-slate-900">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div>
          <p className="text-[12px] font-black uppercase tracking-wide text-primary">
            Hospital Veterinario Integral
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Carné de Paciente
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl">
          🐾
        </div>
      </div>

      {/* Nombre */}
      <div className="mt-3">
        <h3 className="text-xl font-black leading-tight text-slate-900">
          {mascota.nombre}
        </h3>
        <p className="text-[11px] text-slate-500">
          {nombreDe(mascota.especie)}
          {nombreDe(mascota.raza) ? ` · ${nombreDe(mascota.raza)}` : ""}
        </p>
      </div>

      {/* Datos */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {dato("Sexo", sexoLabel(mascota.sexo))}
        {dato("Edad", calcEdad(mascota.fecha_nacimiento))}
        {dato(
          "Peso",
          mascota.peso_actual != null && mascota.peso_actual !== ""
            ? `${mascota.peso_actual} kg`
            : "—",
        )}
        {dato(
          "Nacimiento",
          mascota.fecha_nacimiento
            ? new Date(mascota.fecha_nacimiento).toLocaleDateString("es-BO")
            : "—",
        )}
      </div>

      {/* Propietario */}
      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          Propietario
        </p>
        <p className="text-[13px] font-bold text-slate-800">
          {mascota.propietario.nombre}
        </p>
        <p className="text-[10px] text-slate-500">
          {[
            mascota.propietario.telefono,
            mascota.propietario.ci ? `CI ${mascota.propietario.ci}` : null,
            mascota.propietario.email,
          ]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      </div>

      {/* Vacunas (si están disponibles) */}
      {vacunas.length > 0 && (
        <div className="mt-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Últimas vacunas
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {vacunas.slice(0, 8).map((v, i) => (
              <span
                key={i}
                className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 border-t border-slate-200 pt-2 text-[9px] text-slate-400">
        Emitido el {new Date().toLocaleDateString("es-BO")}
      </p>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <button
        type="button"
        onClick={handlePrint}
        className="carnet-no-print inline-flex items-center gap-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-100 hover:opacity-90 transition-opacity"
      >
        <Icons.Printer size={14} />
        Imprimir carnet
      </button>
      {createPortal(
        <div className="carnet-print-portal">
          <div className="p-6">{carnet}</div>
        </div>,
        document.body,
      )}
    </>
  );
};
