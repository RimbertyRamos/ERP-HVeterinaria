import nodemailer, { Transporter } from "nodemailer";

/**
 * Servicio de correo (Nodemailer + Gmail SMTP).
 *
 * Si no hay credenciales (SMTP_USER / SMTP_PASS) el servicio NO falla: solo
 * registra en consola lo que enviaría. Así el resto del sistema funciona igual
 * y los correos se activan en cuanto se configuren las credenciales en el .env.
 */
export class MailService {
  private readonly transporter: Transporter | null = null;
  private readonly from: string;

  constructor(opts: { user?: string; pass?: string; from?: string }) {
    this.from = opts.from || opts.user || "VET-ERP";
    // Las App Passwords de Google se muestran con espacios (solo visuales): los quitamos.
    const pass = opts.pass ? opts.pass.replace(/\s+/g, "") : "";
    if (opts.user && pass) {
      this.transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: opts.user, pass },
      });
    }
  }

  /** Correo de confirmación (cuando la cita queda programada/confirmada). */
  async enviarConfirmacionCita(cita: any): Promise<void> {
    await this.enviar(cita, "confirmacion");
  }

  /** Correo de recordatorio (cita próxima). */
  async enviarRecordatorioCita(cita: any): Promise<void> {
    await this.enviar(cita, "recordatorio");
  }

  /**
   * Correo tras el pago de un plan: confirma la suscripción y, si se acaba de
   * crear la cuenta, incluye las credenciales de acceso. Nunca lanza.
   */
  async enviarPagoConfirmado(opts: {
    email: string;
    nombre?: string;
    plan: string;
    password?: string;
    loginUrl?: string;
  }): Promise<void> {
    try {
      const { email, plan, password } = opts;
      if (!email) return;
      const nombre = opts.nombre || "Estimado/a cliente";
      const loginUrl = opts.loginUrl || "http://localhost:5173";
      const asunto = `Pago confirmado — Plan ${plan} | VET-ERP`;

      const credText = password
        ? `\nYa creamos tu cuenta de acceso:\n  Usuario (correo): ${email}\n  Contraseña temporal: ${password}\n  Ingresa en: ${loginUrl}\n(Por seguridad, cambia tu contraseña al iniciar sesión.)\n`
        : `\nTu cuenta ya tiene acceso con este correo: ${email}\nIngresa en: ${loginUrl}\n`;

      const texto =
        `Hola ${nombre},\n\n¡Gracias! Tu pago del plan ${plan} fue confirmado y tu suscripción quedó activa.\n` +
        credText +
        `\nHospital Escuela de Veterinaria U.A.G.R.M.`;

      const credHtml = password
        ? `<div style="margin:16px 0;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
             <p style="margin:0 0 8px;font-weight:bold;color:#1e293b">Tus credenciales de acceso</p>
             <p style="margin:2px 0;font-size:14px">Usuario: <strong>${email}</strong></p>
             <p style="margin:2px 0;font-size:14px">Contraseña temporal: <strong>${password}</strong></p>
             <p style="margin:8px 0 0;font-size:12px;color:#64748b">Por seguridad, cambia tu contraseña al iniciar sesión.</p>
           </div>`
        : `<p style="font-size:14px;color:#334155">Tu cuenta ya tiene acceso con el correo <strong>${email}</strong>.</p>`;

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
          <div style="background:#facc15;padding:16px 24px">
            <h2 style="margin:0;color:#1e293b">¡Pago confirmado!</h2>
            <p style="margin:4px 0 0;color:#1e293b;font-size:13px">Plan ${plan} — VET-ERP</p>
          </div>
          <div style="padding:24px;color:#334155">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>¡Gracias! Tu pago del <strong>plan ${plan}</strong> fue confirmado y tu suscripción quedó activa.</p>
            ${credHtml}
            <p style="text-align:center;margin:20px 0">
              <a href="${loginUrl}" style="background:#facc15;color:#1e293b;text-decoration:none;font-weight:bold;padding:10px 24px;border-radius:8px;display:inline-block">Ingresar al sistema</a>
            </p>
          </div>
        </div>`;

      if (!this.transporter) {
        console.log(
          `[MailService] (sin credenciales SMTP) Se enviaría a ${email}: "${asunto}"`,
        );
        return;
      }
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: asunto,
        text: texto,
        html,
      });
      console.log(`[MailService] Pago confirmado enviado a ${email}`);
    } catch (err: any) {
      console.error(
        "[MailService] No se pudo enviar el correo de pago:",
        err?.message || err,
      );
    }
  }

  /**
   * Recordatorio de vencimiento de vacuna al propietario. Fail-safe: si no hay
   * credenciales SMTP solo lo registra en consola; nunca lanza.
   */
  async enviarRecordatorioVacuna(opts: {
    email?: string | null;
    nombre?: string | null;
    mascota: string;
    vacuna: string;
    fecha: string;
  }): Promise<void> {
    try {
      const email = opts.email;
      if (!email) return;
      const nombre = opts.nombre || "Estimado/a cliente";
      const asunto = `Recordatorio de vacunación — ${opts.mascota}`;
      const texto =
        `Hola ${nombre},\n\nLe recordamos que la vacuna "${opts.vacuna}" de ${opts.mascota} ` +
        `está próxima a vencer. Próxima dosis sugerida: ${opts.fecha}.\n` +
        `Le sugerimos agendar una cita para su aplicación.\n\n` +
        `Hospital Escuela de Veterinaria U.A.G.R.M.`;
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
          <div style="background:#facc15;padding:16px 24px">
            <h2 style="margin:0;color:#1e293b">Recordatorio de vacunación</h2>
            <p style="margin:4px 0 0;color:#1e293b;font-size:13px">Hospital Escuela de Veterinaria U.A.G.R.M.</p>
          </div>
          <div style="padding:24px;color:#334155">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>La vacuna <strong>${opts.vacuna}</strong> de <strong>${opts.mascota}</strong> está próxima a vencer.</p>
            <table style="margin:16px 0;font-size:15px">
              <tr><td style="padding:4px 0">💉 <strong>Vacuna:</strong></td><td style="padding:4px 0 4px 12px">${opts.vacuna}</td></tr>
              <tr><td style="padding:4px 0">📅 <strong>Próxima dosis:</strong></td><td style="padding:4px 0 4px 12px">${opts.fecha}</td></tr>
            </table>
            <p style="font-size:13px;color:#64748b">Le sugerimos agendar una cita para su aplicación.</p>
          </div>
        </div>`;

      if (!this.transporter) {
        console.log(
          `[MailService] (sin credenciales SMTP) Se enviaría a ${email}: "${asunto}"`,
        );
        return;
      }
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: asunto,
        text: texto,
        html,
      });
      console.log(`[MailService] Recordatorio de vacuna enviado a ${email}`);
    } catch (err: any) {
      console.error(
        "[MailService] No se pudo enviar el recordatorio de vacuna:",
        err?.message || err,
      );
    }
  }

  /**
   * Envía el COMPROBANTE (recibo) por correo al propietario/cliente tras el cobro.
   * Fail-safe: sin email o sin credenciales SMTP solo registra en consola; nunca
   * lanza (no debe afectar el cobro).
   */
  async enviarRecibo(opts: {
    email?: string | null;
    nombre?: string | null;
    num_recibo: string;
    fecha: Date | string;
    items: { descripcion: string; cantidad: number; subtotal: number }[];
    subtotal: number;
    descuento?: number;
    tipo_descuento?: string | null;
    total: number;
    metodo_pago: string;
  }): Promise<void> {
    try {
      const email = opts.email;
      if (!email) return;
      const nombre = opts.nombre || "Estimado/a cliente";
      const fecha = new Date(opts.fecha).toLocaleString("es-ES", {
        dateStyle: "long",
        timeStyle: "short",
      });
      const asunto = `Comprobante de pago — Recibo ${opts.num_recibo}`;
      const desc = Number(opts.descuento ?? 0);
      const money = (n: number) => `Bs.${Number(n).toFixed(2)}`;

      const filasTexto = opts.items
        .map(
          (i) =>
            `  - ${i.descripcion} x${i.cantidad}: ${money(i.subtotal)}`,
        )
        .join("\n");
      const descTexto =
        desc > 0
          ? `Descuento (${opts.tipo_descuento ?? "MONTO"}): -${money(opts.subtotal - opts.total)}\n`
          : "";
      const texto =
        `Hola ${nombre},\n\nGracias por su pago. Detalle del comprobante ${opts.num_recibo} (${fecha}):\n\n` +
        `${filasTexto}\n\n` +
        `Subtotal: ${money(opts.subtotal)}\n` +
        descTexto +
        `Total: ${money(opts.total)}\n` +
        `Método de pago: ${opts.metodo_pago}\n\n` +
        `Hospital Escuela de Veterinaria U.A.G.R.M.`;

      const filasHtml = opts.items
        .map(
          (i) =>
            `<tr><td style="padding:4px 0">${i.descripcion}</td><td style="text-align:center;padding:4px 8px">${i.cantidad}</td><td style="text-align:right;padding:4px 0">${money(i.subtotal)}</td></tr>`,
        )
        .join("");
      const descHtml =
        desc > 0
          ? `<tr><td colspan="2" style="text-align:right;padding:2px 8px;color:#059669">Descuento (${opts.tipo_descuento ?? "MONTO"}):</td><td style="text-align:right;color:#059669">-${money(opts.subtotal - opts.total)}</td></tr>`
          : "";
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
          <div style="background:#facc15;padding:16px 24px">
            <h2 style="margin:0;color:#1e293b">Comprobante de pago</h2>
            <p style="margin:4px 0 0;color:#1e293b;font-size:13px">Hospital Escuela de Veterinaria U.A.G.R.M.</p>
          </div>
          <div style="padding:24px;color:#334155">
            <p>Hola <strong>${nombre}</strong>, gracias por su pago.</p>
            <p style="font-size:13px;color:#64748b;margin:0 0 12px">Recibo <strong>${opts.num_recibo}</strong> · ${fecha}</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <thead>
                <tr style="border-bottom:1px solid #e2e8f0"><th style="text-align:left;padding:6px 0">Concepto</th><th style="padding:6px 8px">Cant.</th><th style="text-align:right;padding:6px 0">Importe</th></tr>
              </thead>
              <tbody>${filasHtml}</tbody>
              <tfoot style="border-top:1px solid #e2e8f0">
                <tr><td colspan="2" style="text-align:right;padding:6px 8px">Subtotal:</td><td style="text-align:right">${money(opts.subtotal)}</td></tr>
                ${descHtml}
                <tr><td colspan="2" style="text-align:right;padding:6px 8px;font-weight:bold">Total:</td><td style="text-align:right;font-weight:bold">${money(opts.total)}</td></tr>
              </tfoot>
            </table>
            <p style="font-size:13px;color:#64748b;margin-top:12px">Método de pago: <strong>${opts.metodo_pago}</strong></p>
          </div>
        </div>`;

      if (!this.transporter) {
        console.log(
          `[MailService] (sin credenciales SMTP) Se enviaría a ${email}: "${asunto}" (total ${money(opts.total)})`,
        );
        return;
      }
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: asunto,
        text: texto,
        html,
      });
      console.log(
        `[MailService] Comprobante ${opts.num_recibo} enviado a ${email}`,
      );
    } catch (err: any) {
      console.error(
        "[MailService] No se pudo enviar el comprobante:",
        err?.message || err,
      );
    }
  }

  private async enviar(
    cita: any,
    tipo: "confirmacion" | "recordatorio",
  ): Promise<void> {
    try {
      const email: string | undefined = cita?.mascota?.propietario?.email;
      if (!email) return;

      const nombre = cita?.mascota?.propietario?.nombre || "Estimado/a cliente";
      const mascota = cita?.mascota?.nombre || "su mascota";
      const fecha = new Date(cita.fecha_hora);
      const fechaStr = fecha.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const horaStr = fecha.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const esRec = tipo === "recordatorio";
      const titulo = esRec ? "Recordatorio de cita" : "Confirmación de cita";
      const asunto = `${titulo} — ${mascota}`;
      const intro = esRec
        ? `Le recordamos la próxima cita de ${mascota} en el Hospital Escuela de Veterinaria U.A.G.R.M.:`
        : `Le confirmamos la cita de ${mascota} en el Hospital Escuela de Veterinaria U.A.G.R.M.:`;

      const texto =
        `Hola ${nombre},\n\n${intro}\n\n` +
        `Fecha: ${fechaStr}\n` +
        `Hora: ${horaStr}\n` +
        (cita.motivo ? `Motivo: ${cita.motivo}\n` : "") +
        `\nPor favor llegue 10 minutos antes. Si no puede asistir, comuníquese para reprogramar.\n\n` +
        `Hospital Escuela de Veterinaria U.A.G.R.M.`;

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
          <div style="background:#facc15;padding:16px 24px">
            <h2 style="margin:0;color:#1e293b">${titulo}</h2>
            <p style="margin:4px 0 0;color:#1e293b;font-size:13px">Hospital Escuela de Veterinaria U.A.G.R.M.</p>
          </div>
          <div style="padding:24px;color:#334155">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>${intro}</p>
            <table style="margin:16px 0;font-size:15px">
              <tr><td style="padding:4px 0">📅 <strong>Fecha:</strong></td><td style="padding:4px 0 4px 12px">${fechaStr}</td></tr>
              <tr><td style="padding:4px 0">🕐 <strong>Hora:</strong></td><td style="padding:4px 0 4px 12px">${horaStr}</td></tr>
              ${cita.motivo ? `<tr><td style="padding:4px 0">📝 <strong>Motivo:</strong></td><td style="padding:4px 0 4px 12px">${cita.motivo}</td></tr>` : ""}
            </table>
            <p style="font-size:13px;color:#64748b">Por favor llegue 10 minutos antes. Si no puede asistir, comuníquese para reprogramar.</p>
          </div>
        </div>`;

      if (!this.transporter) {
        console.log(
          `[MailService] (sin credenciales SMTP) Se enviaría a ${email}: "${asunto}"`,
        );
        return;
      }

      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: asunto,
        text: texto,
        html,
      });
      console.log(
        `[MailService] ${esRec ? "Recordatorio" : "Confirmación"} enviado a ${email}`,
      );
    } catch (err: any) {
      // Nunca interrumpir el flujo de la cita por un fallo de correo.
      console.error(
        "[MailService] No se pudo enviar el correo:",
        err?.message || err,
      );
    }
  }
}
