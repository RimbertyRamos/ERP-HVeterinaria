import PDFDocument from "pdfkit";
import { Response } from "express";

/**
 * Utilidades GENÉRICAS de exportación (CSV + PDF con encabezado). Extraídas para
 * que tanto la Bitácora como Finanzas reutilicen el MISMO generador de PDF/CSV
 * sin duplicarlo. Cada dominio solo define sus columnas.
 */

export interface Columna {
  header: string;
  value: (row: any) => string;
}

export interface ReporteMeta {
  desde?: Date;
  hasta?: Date;
  generadoPor: string;
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serializa filas a CSV (UTF-8) según las columnas dadas. */
export function toCSV(columns: Columna[], rows: any[]): string {
  const head = columns.map((c) => csvCell(c.header)).join(",");
  const body = rows
    .map((r) => columns.map((c) => csvCell(c.value(r))).join(","))
    .join("\n");
  return `${head}\n${body}\n`;
}

/**
 * Crea un PDF con el encabezado estándar (título, rango de fechas, quién lo
 * generó y cuándo, total de registros) y lo pipe-ea al response. Devuelve el doc
 * para que el llamador agregue su contenido y luego invoque `doc.end()`.
 */
export function crearPdfConEncabezado(
  res: Response,
  titulo: string,
  meta: ReporteMeta,
  total: number,
  layout: "portrait" | "landscape" = "landscape",
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 36, size: "A4", layout });
  doc.pipe(res);
  doc.fontSize(16).fillColor("#111").text(titulo, { align: "center" });
  doc.moveDown(0.3);
  doc
    .fontSize(9)
    .fillColor("#555")
    .text(
      `Rango: ${meta.desde ? meta.desde.toISOString().slice(0, 10) : "inicio"} a ${
        meta.hasta ? meta.hasta.toISOString().slice(0, 10) : "hoy"
      }`,
      { align: "center" },
    )
    .text(
      `Generado por: ${meta.generadoPor}  ·  ${new Date()
        .toISOString()
        .replace("T", " ")
        .slice(0, 19)}`,
      { align: "center" },
    )
    .text(`Total de registros: ${total}`, { align: "center" });
  doc.moveDown(0.6).fillColor("#000");
  return doc;
}

/**
 * PDF TABULAR genérico: encabezado estándar + (resumen opcional) + tabla de
 * columnas (fila de títulos + filas de datos, separadas por " | "). Ideal para
 * datos tabulares como el reporte de finanzas.
 */
export function streamTablaPDF(
  res: Response,
  opts: {
    titulo: string;
    meta: ReporteMeta;
    columns: Columna[];
    rows: any[];
    resumen?: string[];
    layout?: "portrait" | "landscape";
  },
): void {
  const doc = crearPdfConEncabezado(
    res,
    opts.titulo,
    opts.meta,
    opts.rows.length,
    opts.layout ?? "landscape",
  );

  if (opts.resumen?.length) {
    doc.fontSize(10).fillColor("#111");
    for (const linea of opts.resumen) doc.text(linea);
    doc.moveDown(0.4);
  }

  const linea = (cells: string[]) =>
    doc.fontSize(8).text(cells.join("  |  "));

  doc.font("Helvetica-Bold").fillColor("#111");
  linea(opts.columns.map((c) => c.header));
  doc.font("Helvetica").fillColor("#333");

  if (opts.rows.length === 0) {
    doc.text("Sin registros para el filtro seleccionado.");
  }
  for (const r of opts.rows) {
    linea(opts.columns.map((c) => c.value(r)));
  }

  doc.end();
}
