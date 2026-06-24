import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { api } from "../utils/api";
import { toast } from "sonner";
import type { HistoriaClinica, EvolucionTratamiento, Mascota } from "../types";

const VACUNAS = ["Parvovirus", "Múltiple", "Antirrábica", "Bordetella"];
const ESTADO_GENERAL = ["Bueno", "Malo", "Regular", "Sobrepeso"];
const APETITO = ["Normal", "Anorexia", "Disminuido", "Polifagia"];
const HIDRATACION = ["Normal", "D. moderada", "Desh. leve", "Desh. grave"];
const MUCOSA = ["Rosada", "Ictérica", "Pálida", "Cianótica", "Congestionada"];

interface Props {
  historia: HistoriaClinica;
  mascota?: Mascota;
  readOnly: boolean;
  /** Llamado tras guardar o finalizar, con la historia actualizada. */
  onSaved?: (h: HistoriaClinica) => void;
}

const v = (x: any) => (x === null || x === undefined ? "" : x);

export interface HistoriaFichaHandle {
  commit: (finalize: boolean) => Promise<HistoriaClinica>;
}

export const HistoriaClinicaFicha = forwardRef<HistoriaFichaHandle, Props>(
  ({ historia, mascota, readOnly, onSaved }, ref) => {
  const [form, setForm] = useState<any>(historia);
  const [evoluciones, setEvoluciones] = useState<EvolucionTratamiento[]>(
    historia.evoluciones ?? [],
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(historia);
    setEvoluciones(historia.evoluciones ?? []);
  }, [historia]);

  const ro = readOnly || historia.estado === "FINALIZADA";

  const set = (k: string, val: any) => setForm((f: any) => ({ ...f, [k]: val }));
  const toggleVacuna = (vac: string) =>
    setForm((f: any) => {
      const cur: string[] = f.vacunas ?? [];
      return {
        ...f,
        vacunas: cur.includes(vac)
          ? cur.filter((x) => x !== vac)
          : [...cur, vac],
      };
    });

  const especie =
    (mascota?.especie as any)?.nombre ?? (historia.mascota?.especie as any)?.nombre ?? "";
  const raza =
    (mascota?.raza as any)?.nombre ?? (historia.mascota?.raza as any)?.nombre ?? "";
  const sexo = String(mascota?.sexo ?? historia.mascota?.sexo ?? "");
  const sexoLabel =
    sexo === "M" || sexo === "MACHO"
      ? "Macho"
      : sexo === "H" || sexo === "HEMBRA"
        ? "Hembra"
        : sexo;
  const nombrePaciente = mascota?.nombre ?? historia.mascota?.nombre ?? "";

  const num = (x: any) => (x === "" || x === null || x === undefined ? null : Number(x));

  const buildPayload = () => ({
    ...form,
    peso: num(form.peso),
    temperatura: num(form.temperatura),
    fc: num(form.fc),
    fr: num(form.fr),
    evoluciones: evoluciones.filter((e) => e.descripcion?.trim()),
  });

  // Guarda el borrador y, si finalize=true, lo finaliza. Expuesto por ref
  // para que "Completar Consulta" pueda finalizar con los datos actuales.
  const commit = async (finalize: boolean): Promise<HistoriaClinica> => {
    setSaving(true);
    try {
      let h: HistoriaClinica = await api.updateHistoria(
        historia.id,
        buildPayload(),
      );
      if (finalize) h = await api.finalizarHistoria(historia.id);
      onSaved?.(h);
      return h;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ commit }));

  const guardar = async () => {
    try {
      await commit(false);
      toast.success("Historia clínica guardada");
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar la historia");
    }
  };

  const finalizar = async () => {
    if (
      !window.confirm(
        "Una vez finalizada, la historia clínica NO podrá modificarse. ¿Continuar?",
      )
    )
      return;
    try {
      const h = await commit(true);
      toast.success(`Historia clínica Nº ${h.folio} finalizada`);
    } catch (e: any) {
      toast.error(e.message ?? "Error al finalizar la historia");
    }
  };

  const folioStr = useMemo(
    () => String(historia.folio).padStart(6, "0"),
    [historia.folio],
  );

  const inputCls =
    "border-b border-slate-400 bg-transparent outline-none px-1 text-sm disabled:text-slate-700";
  const areaCls =
    "w-full border border-slate-300 rounded bg-transparent outline-none px-2 py-1 text-sm resize-none disabled:text-slate-700";
  const celdaInputCls =
    "w-full h-5 leading-5 border-b border-slate-400 bg-transparent text-sm font-medium text-slate-800 outline-none disabled:text-slate-800 px-0";

  // Imprime/guarda como PDF con un nombre ÚNICO por historia (el navegador usa
  // document.title como nombre de archivo sugerido), y luego restaura el título.
  const handlePrint = () => {
    const prev = document.title;
    const safe = (s: string) =>
      (s || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\w]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const fecha = new Date(historia.fecha).toISOString().slice(0, 10);
    document.title = `Historia-Clinica-${folioStr}-${
      safe(nombrePaciente) || "paciente"
    }-${fecha}`;
    const restore = () => {
      document.title = prev;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  const Opciones = ({
    titulo,
    campo,
    opciones,
  }: {
    titulo: string;
    campo: string;
    opciones: string[];
  }) => (
    <div className="hc-block">
      <p className="font-bold text-[11px] uppercase tracking-wide mb-1">
        {titulo}
      </p>
      <div className="space-y-0.5">
        {opciones.map((op) => (
          <label
            key={op}
            className="flex min-h-6 items-start gap-1.5 text-xs leading-tight"
          >
            <input
              type="radio"
              className="mt-0.5 shrink-0"
              checked={form[campo] === op}
              disabled={ro}
              onChange={() => set(campo, op)}
            />
            <span>{op}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const hoja = (
    <div className="hc-sheet bg-white text-slate-900 border border-slate-300 rounded-lg p-6 max-w-[820px] mx-auto text-sm">
      {/* Encabezado */}
      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs text-center leading-tight">
            HEV<br />UAGRM
          </div>
          <div>
            <p className="font-black leading-tight">
              Hospital Escuela de Veterinaria — UAGRM
            </p>
            <h2 className="text-lg font-black uppercase tracking-tight">
              Historia Clínica de Consulta Externa
            </h2>
          </div>
        </div>
        <div className="text-right text-xs">
          <p>
            <span className="font-bold">Nº</span>{" "}
            <span className="font-mono text-base">{folioStr}</span>
          </p>
          <p>
            <span className="font-bold">FECHA:</span>{" "}
            {new Date(historia.fecha).toLocaleDateString()}
          </p>
          {ro && (
            <span className="hc-no-print inline-block mt-1 px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">
              Solo lectura
            </span>
          )}
        </div>
      </div>

      {/* Datos generales */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3">
        <Linea label="ATENDIDO POR">
          <input
            className={inputCls + " w-full"}
            value={v(historia.atendido_por?.nombre ?? form.propietario_nombre)}
            disabled
            readOnly
          />
        </Linea>
        <Linea label="PROPIETARIO">
          <input
            className={inputCls + " w-full"}
            value={v(form.propietario_nombre)}
            disabled={ro}
            onChange={(e) => set("propietario_nombre", e.target.value)}
          />
        </Linea>
        <Linea label="DOMICILIO">
          <input
            className={inputCls + " w-full"}
            value={v(form.domicilio)}
            disabled={ro}
            onChange={(e) => set("domicilio", e.target.value)}
          />
        </Linea>
        <div className="grid grid-cols-2 gap-2">
          <Linea label="TELÉFONO">
            <input
              className={inputCls + " w-full"}
              value={v(form.telefono)}
              disabled={ro}
              onChange={(e) => set("telefono", e.target.value)}
            />
          </Linea>
          <Linea label="CELULAR">
            <input
              className={inputCls + " w-full"}
              value={v(form.celular)}
              disabled={ro}
              onChange={(e) => set("celular", e.target.value)}
            />
          </Linea>
        </div>
      </div>

      {/* Datos del paciente — todas las celdas con el mismo formato y línea base */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-2 mt-3 border border-slate-300 rounded p-3 bg-slate-50">
        <CeldaPaciente label="NOMBRE" valor={nombrePaciente} />
        <CeldaPaciente label="ESPECIE" valor={especie} />
        <CeldaPaciente label="RAZA" valor={raza} />
        <CeldaPaciente label="SEXO" valor={sexoLabel} />
        <CeldaPaciente label="EDAD">
          <input
            className={celdaInputCls}
            value={v(form.edad)}
            disabled={ro}
            placeholder="ej: 3 años"
            onChange={(e) => set("edad", e.target.value)}
          />
        </CeldaPaciente>
        <CeldaPaciente label="PESO (kg)">
          <input
            type="number"
            step="0.01"
            className={celdaInputCls}
            value={v(form.peso)}
            disabled={ro}
            onChange={(e) => set("peso", e.target.value)}
          />
        </CeldaPaciente>
      </div>

      {/* ANAMNESIS */}
      <Seccion titulo="ANAMNESIS" />
      <Bloque label="MOTIVO DE CONSULTA">
        <textarea
          rows={2}
          className={areaCls}
          value={v(form.motivo_consulta)}
          disabled={ro}
          onChange={(e) => set("motivo_consulta", e.target.value)}
        />
      </Bloque>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <p className="font-bold text-[11px] uppercase mb-1">Vacunas</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {VACUNAS.map((vac) => (
              <label
                key={vac}
                className="flex items-center gap-1.5 text-xs leading-tight"
              >
                <input
                  type="checkbox"
                  className="shrink-0"
                  checked={(form.vacunas ?? []).includes(vac)}
                  disabled={ro}
                  onChange={() => toggleVacuna(vac)}
                />
                <span>{vac}</span>
              </label>
            ))}
          </div>
          <div className="mt-1">
            <span className="text-[11px] font-bold">Otras: </span>
            <input
              className={inputCls}
              value={v(form.vacunas_otras)}
              disabled={ro}
              onChange={(e) => set("vacunas_otras", e.target.value)}
            />
          </div>
        </div>
        <div>
          <p className="font-bold text-[11px] uppercase mb-1">Desparasitación</p>
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                className="shrink-0"
                checked={form.desparasitacion === true}
                disabled={ro}
                onChange={() => set("desparasitacion", true)}
              />
              Sí
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                className="shrink-0"
                checked={form.desparasitacion === false}
                disabled={ro}
                onChange={() => set("desparasitacion", false)}
              />
              No
            </label>
          </div>
          <div className="mt-1">
            <span className="text-[11px] font-bold">¿Cuándo? </span>
            <input
              className={inputCls}
              value={v(form.desparasitacion_cuando)}
              disabled={ro}
              onChange={(e) => set("desparasitacion_cuando", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <Bloque label="ENFERMEDADES PREVIAS">
          <textarea
            rows={2}
            className={areaCls}
            value={v(form.enfermedades_previas)}
            disabled={ro}
            onChange={(e) => set("enfermedades_previas", e.target.value)}
          />
        </Bloque>
        <Bloque label="INTERVENCIONES PREVIAS">
          <textarea
            rows={2}
            className={areaCls}
            value={v(form.intervenciones_previas)}
            disabled={ro}
            onChange={(e) => set("intervenciones_previas", e.target.value)}
          />
        </Bloque>
      </div>

      {/* EXAMEN FÍSICO */}
      <Seccion titulo="EXAMEN FÍSICO" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
        <Opciones titulo="Estado General" campo="estado_general" opciones={ESTADO_GENERAL} />
        <Opciones titulo="Apetito" campo="apetito" opciones={APETITO} />
        <Opciones titulo="Hidratación" campo="hidratacion" opciones={HIDRATACION} />
        <Opciones titulo="Mucosa" campo="mucosa" opciones={MUCOSA} />
      </div>

      <div className="grid grid-cols-1 gap-2 mt-3">
        <Bloque label="AP. DIGESTIVO">
          <textarea
            rows={2}
            className={areaCls}
            value={v(form.ap_digestivo)}
            disabled={ro}
            onChange={(e) => set("ap_digestivo", e.target.value)}
          />
        </Bloque>
        <Bloque label="AP. GENITOURINARIO">
          <textarea
            rows={2}
            className={areaCls}
            value={v(form.ap_genitourinario)}
            disabled={ro}
            onChange={(e) => set("ap_genitourinario", e.target.value)}
          />
        </Bloque>
        <Bloque label="AP. RESPIRATORIO">
          <textarea
            rows={2}
            className={areaCls}
            value={v(form.ap_respiratorio)}
            disabled={ro}
            onChange={(e) => set("ap_respiratorio", e.target.value)}
          />
        </Bloque>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-2">
        <Bloque label="TEMPERATURA (°C)">
          <input
            type="number"
            step="0.1"
            className={inputCls + " w-full"}
            value={v(form.temperatura)}
            disabled={ro}
            onChange={(e) => set("temperatura", e.target.value)}
          />
        </Bloque>
        <Bloque label="F.C. (lpm)">
          <input
            type="number"
            className={inputCls + " w-full"}
            value={v(form.fc)}
            disabled={ro}
            onChange={(e) => set("fc", e.target.value)}
          />
        </Bloque>
        <Bloque label="F.R. (rpm)">
          <input
            type="number"
            className={inputCls + " w-full"}
            value={v(form.fr)}
            disabled={ro}
            onChange={(e) => set("fr", e.target.value)}
          />
        </Bloque>
      </div>

      <Bloque label="OBSERVACIÓN CLÍNICA">
        <textarea
          rows={2}
          className={areaCls}
          value={v(form.observacion_clinica)}
          disabled={ro}
          onChange={(e) => set("observacion_clinica", e.target.value)}
        />
      </Bloque>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <Bloque label="PRUEBAS COMPLEMENTARIAS">
          <textarea
            rows={2}
            className={areaCls}
            value={v(form.pruebas_complementarias)}
            disabled={ro}
            onChange={(e) => set("pruebas_complementarias", e.target.value)}
          />
        </Bloque>
        <Bloque label="PRONÓSTICO">
          <textarea
            rows={2}
            className={areaCls}
            value={v(form.pronostico)}
            disabled={ro}
            onChange={(e) => set("pronostico", e.target.value)}
          />
        </Bloque>
        <Bloque label="DIAGNÓSTICO PRESUNTIVO">
          <textarea
            rows={2}
            className={areaCls}
            value={v(form.diagnostico_presuntivo)}
            disabled={ro}
            onChange={(e) => set("diagnostico_presuntivo", e.target.value)}
          />
        </Bloque>
        <Bloque label="DIAGNÓSTICO CONFIRMATIVO">
          <textarea
            rows={2}
            className={areaCls}
            value={v(form.diagnostico_confirmativo)}
            disabled={ro}
            onChange={(e) => set("diagnostico_confirmativo", e.target.value)}
          />
        </Bloque>
      </div>

      {/* TRATAMIENTO Y EVOLUCIÓN */}
      <Seccion titulo="TRATAMIENTO Y EVOLUCIÓN" />
      <Bloque label="TRATAMIENTO">
        <textarea
          rows={3}
          className={areaCls}
          value={v(form.tratamiento)}
          disabled={ro}
          onChange={(e) => set("tratamiento", e.target.value)}
        />
      </Bloque>

      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-[11px] uppercase">Evoluciones</p>
          {!ro && (
            <button
              className="hc-no-print text-xs font-bold text-emerald-700"
              onClick={() =>
                setEvoluciones((prev) => [
                  ...prev,
                  { fecha: new Date().toISOString().slice(0, 10), descripcion: "" },
                ])
              }
            >
              + Agregar evolución
            </button>
          )}
        </div>
        {evoluciones.length === 0 ? (
          <p className="text-xs text-slate-400">Sin evoluciones registradas.</p>
        ) : (
          <div className="space-y-1">
            {evoluciones.map((ev, i) => (
              <div key={i} className="flex items-start gap-2">
                <input
                  type="date"
                  className={inputCls}
                  value={v((ev.fecha ?? "").slice(0, 10))}
                  disabled={ro}
                  onChange={(e) =>
                    setEvoluciones((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, fecha: e.target.value } : x,
                      ),
                    )
                  }
                />
                <input
                  className={inputCls + " flex-1"}
                  placeholder="Descripción de la evolución…"
                  value={v(ev.descripcion)}
                  disabled={ro}
                  onChange={(e) =>
                    setEvoluciones((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, descripcion: e.target.value } : x,
                      ),
                    )
                  }
                />
                {!ro && (
                  <button
                    className="hc-no-print text-red-500 text-xs"
                    onClick={() =>
                      setEvoluciones((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pie: médico + firma + nota */}
      <div className="mt-6 flex items-end justify-between">
        <div className="text-xs">
          <p className="border-t border-slate-500 pt-1 w-56 text-center">
            {v(historia.atendido_por?.nombre)}
          </p>
          <p className="text-center text-[10px] uppercase text-slate-500">
            Médico Clínico — Firma
          </p>
        </div>
        {historia.estado === "FINALIZADA" && (
          <div className="text-[10px] text-slate-500 text-right">
            <p>
              Finalizada por {v(historia.finalized_by?.nombre)}{" "}
              {historia.finalized_at
                ? `el ${new Date(historia.finalized_at).toLocaleString()}`
                : ""}
            </p>
            <p>Creada por {v(historia.created_by?.nombre)}</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-[10px] italic text-slate-500 border-t pt-2">
        Esta ficha es de uso exclusivo del Hospital Escuela de Veterinaria y es
        válida sólo por el tiempo que dure el tratamiento.
      </p>

      {/* Acciones */}
      <div className="hc-no-print mt-4 flex justify-end gap-3">
        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          Imprimir / PDF
        </button>
        {!ro && (
          <>
            <button
              onClick={guardar}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 text-sm font-bold hover:bg-slate-300 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>
            <button
              onClick={finalizar}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              Finalizar historia
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `.hc-print-portal { display: none; }
            @media print {
              /* Oculta toda la app; solo se imprime la copia en portal (fluye en varias páginas) */
              body > *:not(.hc-print-portal) { display: none !important; }
              .hc-print-portal { display: block !important; }
              .hc-print-portal .hc-sheet { border: none !important; border-radius: 0 !important; padding: 0 !important; max-width: none !important; margin: 0 auto !important; }
              .hc-no-print { display: none !important; }
              /* Nunca partir un bloque etiqueta+campo, ni una fila/grupo, entre páginas */
              .hc-print-portal .grid,
              .hc-print-portal .grid > *,
              .hc-print-portal .hc-block,
              .hc-print-portal label { break-inside: avoid; page-break-inside: avoid; }
              .hc-print-portal .hc-section { break-after: avoid; page-break-after: avoid; }
              /* Imprimir las marcas de checkboxes/radios y los fondos tal cual */
              .hc-print-portal,
              .hc-print-portal * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }`,
        }}
      />
      {hoja}
      {createPortal(
        <div className="hc-print-portal">{hoja}</div>,
        document.body,
      )}
    </>
  );
  },
);

HistoriaClinicaFicha.displayName = "HistoriaClinicaFicha";

const Linea: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap">
      {label}:
    </span>
    <div className="flex-1">{children}</div>
  </div>
);

const CeldaPaciente: React.FC<{
  label: string;
  valor?: string;
  children?: React.ReactNode;
}> = ({ label, valor, children }) => (
  <div className="hc-block flex flex-col">
    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">
      {label}
    </span>
    {children ?? (
      <span className="h-5 leading-5 text-sm font-medium text-slate-800 truncate">
        {valor || "—"}
      </span>
    )}
  </div>
);

const Seccion: React.FC<{ titulo: string }> = ({ titulo }) => (
  <div className="hc-section mt-4 mb-1 bg-slate-800 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">
    {titulo}
  </div>
);

const Bloque: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="hc-block mt-1">
    <p className="text-[11px] font-bold uppercase text-slate-600 mb-0.5">
      {label}
    </p>
    {children}
  </div>
);
