import { Response } from "express";
import {
  Columna,
  ReporteMeta,
  toCSV,
  crearPdfConEncabezado,
} from "./report.util";

// Columnas de la bitácora (mismas que antes; datos_antes/despues van en el detalle).
const COLS: Columna[] = [
  { header: "fecha_hora", value: (r) => new Date(r.fecha_hora).toISOString() },
  { header: "actor_nombre", value: (r) => r.actor_nombre ?? "" },
  { header: "actor_email", value: (r) => r.actor_email ?? "" },
  { header: "actor_rol", value: (r) => r.actor_rol ?? "" },
  { header: "accion", value: (r) => r.accion ?? "" },
  { header: "entidad", value: (r) => r.entidad ?? "" },
  { header: "entidad_id", value: (r) => r.entidad_id ?? "" },
  { header: "descripcion", value: (r) => r.descripcion ?? "" },
  { header: "exito", value: (r) => String(r.exito) },
  { header: "ip", value: (r) => r.ip ?? "" },
  { header: "ruta", value: (r) => r.ruta ?? "" },
];

/** CSV de la bitácora (reutiliza el serializador genérico). */
export function bitacoraToCSV(rows: any[]): string {
  return toCSV(COLS, rows);
}

export type { ReporteMeta as ReportePdfMeta };

/** PDF de la bitácora: encabezado genérico + listado propio de eventos. */
export function bitacoraToPDF(
  res: Response,
  rows: any[],
  meta: ReporteMeta,
): void {
  const doc = crearPdfConEncabezado(
    res,
    "Bitácora de Auditoría — VET-ERP",
    meta,
    rows.length,
  );

  if (rows.length === 0) {
    doc
      .fontSize(11)
      .fillColor("#000")
      .text("Sin registros para el filtro seleccionado.");
  }

  for (const r of rows) {
    const fecha = new Date(r.fecha_hora)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);
    doc
      .fontSize(8)
      .fillColor("#111")
      .text(
        `${fecha} | ${r.accion} | ${r.actor_nombre ?? "sistema"} (${
          r.actor_rol ?? "-"
        }) | ${r.entidad ?? "-"}${r.entidad_id ? ` #${r.entidad_id}` : ""} | ${
          r.exito ? "OK" : "FALLO"
        }`,
      );
    doc.fontSize(8).fillColor("#444").text(`   ${r.descripcion ?? ""}`);
    doc.moveDown(0.15);
  }

  doc.end();
}
