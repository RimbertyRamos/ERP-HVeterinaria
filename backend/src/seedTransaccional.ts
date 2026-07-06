import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

export async function seedTransaccional(prisma: PrismaClient) {
  console.log("\n🌱 Iniciando seed transaccional (Mayo y Junio 2026)...");

  // ===========================
  // VERIFICAR IDEMPOTENCIA
  // ===========================
  if ((await prisma.fichaAtencion.count()) > 0) {
    console.log("↪️  Datos transaccionales ya existen — se omiten");
    return;
  }

  // Recuperar referencias base
  const roleCliente = await prisma.role.findUnique({ where: { nombre: "CLIENTE" } });
  
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // ===========================
  // 1. PROPIETARIOS Y MASCOTAS NUEVAS
  // ===========================
  const [prop4, prop5] = await Promise.all([
    prisma.usuario.upsert({
      where: { email: "patricia.colque@gmail.com" },
      update: {},
      create: {
        nombre: "Patricia Colque",
        email: "patricia.colque@gmail.com",
        password_hash: await hash("cliente123"),
        telefono: "79988112",
        ci: "5566778",
        rol_id: roleCliente!.id,
        debe_cambiar_password: true,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "fernando.pinto@gmail.com" },
      update: {},
      create: {
        nombre: "Fernando Pinto",
        email: "fernando.pinto@gmail.com",
        password_hash: await hash("cliente123"),
        telefono: "71223344",
        ci: "9988776",
        rol_id: roleCliente!.id,
        debe_cambiar_password: true,
      },
    }),
  ]);

  const especieCanino = await prisma.especie.findUnique({ where: { nombre: "Canino" } });
  const razaGolden = await prisma.raza.findFirst({ where: { nombre: "Golden Retriever" } });
  const razaBeagle = await prisma.raza.findFirst({ where: { nombre: "Beagle" } });
  const colorDorado = await prisma.colorMascota.findFirst({ where: { descripcion: "Dorado / Golden" } });
  const colorAtigrado = await prisma.colorMascota.findFirst({ where: { descripcion: "Atigrado" } });
  
  const alergiaPolen = await prisma.alergia.findFirst({ where: { nombre: "Polen" } });

  const luna = await prisma.mascota.create({
    data: {
      nombre: "Luna",
      especie_id: especieCanino!.id,
      raza_id: razaGolden!.id,
      color_id: colorDorado!.id,
      sexo: "H",
      peso_actual: 22.5,
      fecha_nacimiento: new Date("2021-05-10"),
      propietario_id: prop4.id,
      esterilizado: true,
      alergias: {
        create: { alergia_id: alergiaPolen!.id, severidad: "Media" }
      }
    },
  });

  const max = await prisma.mascota.create({
    data: {
      nombre: "Max",
      especie_id: especieCanino!.id,
      raza_id: razaBeagle!.id,
      color_id: colorAtigrado!.id,
      sexo: "M",
      peso_actual: 14.2,
      fecha_nacimiento: new Date("2024-02-15"),
      propietario_id: prop5.id,
      esterilizado: false,
    },
  });
  
  const rocky = await prisma.mascota.findFirst({ where: { nombre: "Rocky" } });
  const mishi = await prisma.mascota.findFirst({ where: { nombre: "Mishi" } });
  const piolin = await prisma.mascota.findFirst({ where: { nombre: "Piolín" } });
  
  console.log("✅ Propietarios y mascotas nuevas creadas");

  // ===========================
  // REFERENCIAS DE STAFF Y CATÁLOGOS
  // ===========================
  const vet1 = await prisma.usuario.findUnique({ where: { email: "carlos.mamani@vetcare.com" } });
  const vet2 = await prisma.usuario.findUnique({ where: { email: "paola.rios@vetcare.com" } });
  const admin = await prisma.usuario.findUnique({ where: { email: "admin@vetcare.com" } });
  const recep1 = await prisma.usuario.findUnique({ where: { email: "maria.gomez@vetcare.com" } });
  const cajero1 = await prisma.usuario.findUnique({ where: { email: "luis.roca@vetcare.com" } });

  const salaCons1 = await prisma.consultorio.findUnique({ where: { id: "cons-sala-1" } });
  const salaCons2 = await prisma.consultorio.findUnique({ where: { id: "cons-sala-2" } });
  const salaCirugia = await prisma.consultorio.findUnique({ where: { id: "cons-cirugia" } });
  
  const servGeneral = await prisma.catalogoServicio.findUnique({ where: { nombre: "Consulta General" } });
  const servEspecialista = await prisma.catalogoServicio.findUnique({ where: { nombre: "Consulta Especialista" } });
  const servCirugia = await prisma.catalogoServicio.findUnique({ where: { nombre: "Cirugía Menor" } });
  const servLab = await prisma.catalogoServicio.findUnique({ where: { nombre: "Laboratorio (Perfil Básico)" } });
  const servVacuna = await prisma.catalogoServicio.findUnique({ where: { nombre: "Vacunación" } });

  const prodAmox = await prisma.producto.findFirst({ where: { nombre: "Amoxicilina 250mg" } });
  const prodMelox = await prisma.producto.findFirst({ where: { nombre: "Meloxicam 2mg/ml" } });
  const prodSuero = await prisma.producto.findFirst({ where: { nombre: "Suero Fisiológico 500ml" } });
  const prodVacuna = await prisma.producto.findFirst({ where: { nombre: "Vacuna Polivalente Canina" } });

  const cajaPrin = await prisma.puntoCaja.findFirst({ where: { nombre: "Caja Principal 01" } });

  const vacRabia = await prisma.vacuna.findFirst({ where: { nombre: "Rabia" } });
  const vacPoli = await prisma.vacuna.findFirst({ where: { nombre: "Quíntuple / Polivalente" } });

  // ===========================
  // 2. HORARIOS DE CONSULTORIOS (Mayo y Junio)
  // ===========================
  // Dr. Carlos: Lunes a Viernes 08:00 - 12:00 en Sala 1
  // Dra. Paola: Lunes a Viernes 14:00 - 18:00 en Sala 2
  const horariosData = [];
  const startDate = new Date("2026-05-01T00:00:00Z");
  for (let i = 0; i < 92; i++) { // 92 días (Mayo, Junio, Julio)
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const day = currentDate.getDay(); // 0 = Domingo, 1 = Lunes...
    
    if (day >= 1 && day <= 5) { // Lunes a Viernes
      const inicioManana = new Date(currentDate);
      inicioManana.setUTCHours(12, 0, 0, 0); // 08:00 BOT (UTC-4) -> 12:00 UTC
      const finManana = new Date(currentDate);
      finManana.setUTCHours(16, 0, 0, 0); // 12:00 BOT -> 16:00 UTC
      
      horariosData.push({
        consultorio_id: salaCons1!.id,
        doctor_id: vet1!.id,
        inicio: inicioManana,
        fin: finManana,
        nota: "Turno mañana habitual"
      });

      const inicioTarde = new Date(currentDate);
      inicioTarde.setUTCHours(18, 0, 0, 0); // 14:00 BOT -> 18:00 UTC
      const finTarde = new Date(currentDate);
      finTarde.setUTCHours(22, 0, 0, 0); // 18:00 BOT -> 22:00 UTC
      
      horariosData.push({
        consultorio_id: salaCons2!.id,
        doctor_id: vet2!.id,
        inicio: inicioTarde,
        fin: finTarde,
        nota: "Turno tarde habitual"
      });
    }
  }

  await prisma.horarioConsultorio.createMany({ data: horariosData });
  console.log("✅ Horarios de consultorios creados (Mayo y Junio 2026)");

  // ===========================
  // Helper functions para fechas y códigos
  // ===========================
  const tzDate = (dateStr: string) => new Date(dateStr + "T00:00:00-04:00");
  const tzDateTime = (dateTimeStr: string) => new Date(dateTimeStr + "-04:00");

  let codC = 1;
  let codL = 1;
  let codE = 1;
  const genCod = (prefix: string) => {
    if (prefix === "C") return `C-${String(codC++).padStart(2, "0")}`;
    if (prefix === "L") return `L-${String(codL++).padStart(2, "0")}`;
    return `E-${String(codE++).padStart(2, "0")}`;
  };

  let numRec = 1;
  const genRecibo = () => `REC-${String(numRec++).padStart(5, "0")}`;

  // ===========================
  // 3. DATOS DE MAYO 2026
  // ===========================

  // -- Ficha 1: Rocky, Consulta General (Mayo 4)
  const f1 = await prisma.fichaAtencion.create({
    data: {
      cod_ficha: genCod("C"),
      mascota_id: rocky!.id,
      doctor_id: vet1!.id,
      consultorio_id: salaCons1!.id,
      servicio_id: servGeneral!.id,
      creado_por_id: recep1!.id,
      motivo: "Revisión anual",
      estado: "COMPLETADA",
      prioridad: "NORMAL",
      estado_cobro: "PAGADO",
      fecha_hora: tzDateTime("2026-05-04T09:30:00"),
      soap: {
        create: {
          motivo_detalle: "Revisión anual de rutina",
          anamnesis: "Comiendo y bebiendo normal. Sin cambios en la actividad.",
          peso: 28.5,
          temperatura: 38.5,
          fc: 80,
          fr: 20,
          hallazgos: "Todo normal",
          diagnostico: "Paciente sano",
          tratamiento: "Ninguno",
          created_at: tzDateTime("2026-05-04T10:00:00")
        }
      },
      historia: {
        create: {
          mascota_id: rocky!.id,
          atendido_por_id: vet1!.id,
          propietario_nombre: "Juan Vaca Quiroga",
          motivo_consulta: "Revisión anual",
          diagnostico_presuntivo: "Sano",
          estado: "FINALIZADA",
          created_by_id: vet1!.id,
          finalized_by_id: vet1!.id,
          finalized_at: tzDateTime("2026-05-04T10:15:00"),
          fecha: tzDateTime("2026-05-04T09:30:00")
        }
      },
      calificacion: {
        create: {
          propietario_id: rocky!.propietario_id,
          puntaje: 5,
          comentario: "Excelente atención del Dr. Carlos",
          fecha: tzDateTime("2026-05-04T11:00:00")
        }
      }
    }
  });

  const rec1 = await prisma.reciboCaja.create({
    data: {
      num_recibo: genRecibo(),
      ficha_id: f1.id,
      cajero_id: cajero1!.id,
      punto_caja_id: cajaPrin!.id,
      total: 180,
      metodo_pago: "EFECTIVO",
      monto_recibido: 200,
      cambio_devuelto: 20,
      estado: "PAGADO",
      fecha_pago: tzDateTime("2026-05-04T10:30:00"),
      detalles: {
        create: [
          {
            tipo: "SERVICIO",
            descripcion: servGeneral!.nombre,
            precio_unit: 180,
            cantidad: 1,
            subtotal: 180
          }
        ]
      }
    }
  });

  // Cita asociada a f1
  await prisma.cita.create({
    data: {
      mascota_id: rocky!.id,
      doctor_id: vet1!.id,
      consultorio_id: salaCons1!.id,
      fecha_hora: tzDateTime("2026-05-04T09:30:00"),
      tipo: "CONSULTA",
      motivo: "Revisión anual",
      estado: "COMPLETADA",
    }
  });

  // -- Ficha 2: Luna, Cirugía Menor (Mayo 6)
  const f2 = await prisma.fichaAtencion.create({
    data: {
      cod_ficha: genCod("C"),
      mascota_id: luna.id,
      doctor_id: vet2!.id,
      consultorio_id: salaCirugia!.id,
      servicio_id: servCirugia!.id,
      creado_por_id: recep1!.id,
      motivo: "Extracción de masa cutánea",
      estado: "COMPLETADA",
      prioridad: "NORMAL",
      estado_cobro: "PAGADO",
      fecha_hora: tzDateTime("2026-05-06T15:00:00"),
      soap: {
        create: {
          motivo_detalle: "Masa en flanco izquierdo",
          anamnesis: "Crecimiento lento en los últimos 2 meses",
          peso: 22.5,
          temperatura: 38.8,
          hallazgos: "Masa subcutánea de 3cm",
          diagnostico: "Lipoma (presuntivo)",
          tratamiento: "Cirugía de extracción",
          created_at: tzDateTime("2026-05-06T16:30:00")
        }
      },
      consumos: {
        create: [
          { producto_id: prodMelox!.id, cantidad: 1 },
          { producto_id: prodAmox!.id, cantidad: 1 },
          { producto_id: prodSuero!.id, cantidad: 1 }
        ]
      },
      historia: {
        create: {
          mascota_id: luna.id,
          atendido_por_id: vet2!.id,
          propietario_nombre: "Patricia Colque",
          motivo_consulta: "Masa cutánea",
          diagnostico_presuntivo: "Lipoma",
          tratamiento: "Extracción. Reposo. Meloxicam y Amoxicilina",
          estado: "FINALIZADA",
          created_by_id: vet2!.id,
          finalized_by_id: vet2!.id,
          finalized_at: tzDateTime("2026-05-06T17:00:00"),
          fecha: tzDateTime("2026-05-06T15:00:00"),
          evoluciones: {
            create: [
              {
                descripcion: "Procedimiento quirúrgico sin complicaciones. Masa enviada a patología. Recuperación anestésica favorable.",
                fecha: tzDateTime("2026-05-06T16:45:00")
              }
            ]
          }
        }
      }
    }
  });

  const rec2 = await prisma.reciboCaja.create({
    data: {
      num_recibo: genRecibo(),
      ficha_id: f2.id,
      cajero_id: cajero1!.id,
      punto_caja_id: cajaPrin!.id,
      total: 800 + 120 + 45 + 25, // Cirugia + Melox + Amox + Suero
      metodo_pago: "TARJETA",
      monto_recibido: 990,
      cambio_devuelto: 0,
      estado: "PAGADO",
      fecha_pago: tzDateTime("2026-05-06T17:15:00"),
      detalles: {
        create: [
          { tipo: "SERVICIO", descripcion: servCirugia!.nombre, precio_unit: 800, cantidad: 1, subtotal: 800 },
          { tipo: "SUMINISTRO", descripcion: prodMelox!.nombre, precio_unit: 120, cantidad: 1, subtotal: 120, producto_id: prodMelox!.id },
          { tipo: "SUMINISTRO", descripcion: prodAmox!.nombre, precio_unit: 45, cantidad: 1, subtotal: 45, producto_id: prodAmox!.id },
          { tipo: "SUMINISTRO", descripcion: prodSuero!.nombre, precio_unit: 25, cantidad: 1, subtotal: 25, producto_id: prodSuero!.id }
        ]
      }
    }
  });

  // Movimientos de inventario para la cirugía
  await prisma.kardexMovimiento.createMany({
    data: [
      { producto_id: prodMelox!.id, tipo: "SALIDA", cantidad: 1, saldo_final: prodMelox!.stock_actual - 1, motivo: `Consumo ficha ${f2.cod_ficha}`, created_at: tzDateTime("2026-05-06T17:15:00") },
      { producto_id: prodAmox!.id, tipo: "SALIDA", cantidad: 1, saldo_final: prodAmox!.stock_actual - 1, motivo: `Consumo ficha ${f2.cod_ficha}`, created_at: tzDateTime("2026-05-06T17:15:00") },
      { producto_id: prodSuero!.id, tipo: "SALIDA", cantidad: 1, saldo_final: prodSuero!.stock_actual - 1, motivo: `Consumo ficha ${f2.cod_ficha}`, created_at: tzDateTime("2026-05-06T17:15:00") }
    ]
  });

  // -- Ficha 3: Max, Vacunación (Mayo 22)
  const f3 = await prisma.fichaAtencion.create({
    data: {
      cod_ficha: genCod("C"),
      mascota_id: max.id,
      doctor_id: vet1!.id,
      consultorio_id: salaCons1!.id,
      servicio_id: servVacuna!.id,
      creado_por_id: recep1!.id,
      motivo: "Vacuna anual",
      estado: "COMPLETADA",
      prioridad: "NORMAL",
      estado_cobro: "PAGADO",
      fecha_hora: tzDateTime("2026-05-22T10:00:00"),
      soap: {
        create: {
          motivo_detalle: "Vacunación polivalente y rabia",
          anamnesis: "Sin novedades",
          peso: 14.5,
          temperatura: 38.6,
          hallazgos: "Sano, apto para vacuna",
          diagnostico: "Profilaxis",
          tratamiento: "Aplicación de vacunas",
          created_at: tzDateTime("2026-05-22T10:30:00")
        }
      },
      consumos: {
        create: [
          { producto_id: prodVacuna!.id, cantidad: 1 }
        ]
      },
      historia: {
        create: {
          mascota_id: max.id,
          atendido_por_id: vet1!.id,
          propietario_nombre: "Fernando Pinto",
          motivo_consulta: "Vacunación",
          diagnostico_presuntivo: "Profilaxis",
          estado: "FINALIZADA",
          created_by_id: vet1!.id,
          finalized_by_id: vet1!.id,
          finalized_at: tzDateTime("2026-05-22T10:45:00"),
          fecha: tzDateTime("2026-05-22T10:00:00"),
          vacunas: {
            create: [
              { vacuna_id: vacPoli!.id, fecha_aplicacion: tzDateTime("2026-05-22T10:20:00"), proxima_dosis: tzDateTime("2027-05-22T10:00:00") },
              { vacuna_id: vacRabia!.id, fecha_aplicacion: tzDateTime("2026-05-22T10:25:00"), proxima_dosis: tzDateTime("2027-05-22T10:00:00") }
            ]
          }
        }
      }
    }
  });

  const rec3 = await prisma.reciboCaja.create({
    data: {
      num_recibo: genRecibo(),
      ficha_id: f3.id,
      cajero_id: cajero1!.id,
      punto_caja_id: cajaPrin!.id,
      total: 90 + 65, // Servicio Vacunación + Producto Vacuna
      metodo_pago: "QR",
      monto_recibido: 155,
      cambio_devuelto: 0,
      estado: "PAGADO",
      fecha_pago: tzDateTime("2026-05-22T11:00:00"),
      detalles: {
        create: [
          { tipo: "SERVICIO", descripcion: servVacuna!.nombre, precio_unit: 90, cantidad: 1, subtotal: 90 },
          { tipo: "SUMINISTRO", descripcion: prodVacuna!.nombre, precio_unit: 65, cantidad: 1, subtotal: 65, producto_id: prodVacuna!.id }
        ]
      }
    }
  });

  await prisma.kardexMovimiento.createMany({
    data: [
      { producto_id: prodVacuna!.id, tipo: "SALIDA", cantidad: 1, saldo_final: prodVacuna!.stock_actual - 1, motivo: `Consumo ficha ${f3.cod_ficha}`, created_at: tzDateTime("2026-05-22T11:00:00") }
    ]
  });

  // -- Ficha 4: Mishi, Laboratorio (Mayo 28)
  const f4 = await prisma.fichaAtencion.create({
    data: {
      cod_ficha: genCod("L"),
      mascota_id: mishi!.id,
      doctor_id: vet2!.id,
      consultorio_id: salaCons2!.id,
      servicio_id: servLab!.id,
      creado_por_id: recep1!.id,
      motivo: "Análisis de sangre de rutina",
      estado: "EN_CURSO", // Dejamos una en curso
      prioridad: "NORMAL",
      estado_cobro: "PENDIENTE",
      fecha_hora: tzDateTime("2026-05-28T16:00:00"),
      historia: {
        create: {
          mascota_id: mishi!.id,
          atendido_por_id: vet2!.id,
          propietario_nombre: "Ana Torrico Vásquez",
          motivo_consulta: "Laboratorio pre-quirúrgico",
          estado: "BORRADOR",
          created_by_id: vet2!.id,
          fecha: tzDateTime("2026-05-28T16:00:00")
        }
      }
    }
  });

  // Venta directa (sin ficha) en Mayo
  const recPOS1 = await prisma.reciboCaja.create({
    data: {
      num_recibo: genRecibo(),
      cajero_id: cajero1!.id,
      punto_caja_id: cajaPrin!.id,
      nombre_cliente: "Cliente Ocasional",
      total: 45, // Amoxicilina
      metodo_pago: "EFECTIVO",
      monto_recibido: 50,
      cambio_devuelto: 5,
      estado: "PAGADO",
      fecha_pago: tzDateTime("2026-05-15T14:20:00"),
      detalles: {
        create: [
          { tipo: "FARMACIA", descripcion: prodAmox!.nombre, precio_unit: 45, cantidad: 1, subtotal: 45, producto_id: prodAmox!.id }
        ]
      }
    }
  });

  // Cierres de Caja de Mayo (15 y 31)
  await prisma.cierreCaja.create({
    data: {
      cajero_id: cajero1!.id,
      fecha_desde: tzDateTime("2026-05-01T00:00:00"),
      fecha_hasta: tzDateTime("2026-05-15T23:59:59"),
      total_efectivo: 180 + 45, // rec1 y recPOS1
      total_tarjeta: 990, // rec2
      total_qr: 0,
      total_general: 180 + 45 + 990,
      cantidad_recibos: 3,
      efectivo_contado: 225,
      diferencia: 0,
      observaciones: "Cierre quincenal mayo correcto",
      created_at: tzDateTime("2026-05-15T18:00:00")
    }
  });

  await prisma.cierreCaja.create({
    data: {
      cajero_id: cajero1!.id,
      fecha_desde: tzDateTime("2026-05-16T00:00:00"),
      fecha_hasta: tzDateTime("2026-05-31T23:59:59"),
      total_efectivo: 0,
      total_tarjeta: 0,
      total_qr: 155, // rec3
      total_general: 155,
      cantidad_recibos: 1,
      efectivo_contado: 0,
      diferencia: 0,
      observaciones: "Cierre fin de mayo",
      created_at: tzDateTime("2026-05-31T18:00:00")
    }
  });


  // ===========================
  // 4. DATOS DE JUNIO 2026
  // ===========================

  // -- Ficha 5: Piolín, Consulta Especialista (Junio 4)
  const f5 = await prisma.fichaAtencion.create({
    data: {
      cod_ficha: genCod("C"),
      mascota_id: piolin!.id,
      doctor_id: vet2!.id,
      consultorio_id: salaCons2!.id,
      servicio_id: servEspecialista!.id,
      creado_por_id: recep1!.id,
      motivo: "Apatía y pérdida de plumas",
      estado: "COMPLETADA",
      prioridad: "NORMAL",
      estado_cobro: "PAGADO",
      fecha_hora: tzDateTime("2026-06-04T15:00:00"),
      soap: {
        create: {
          motivo_detalle: "Pérdida de plumas en zona del pecho",
          anamnesis: "Desde hace 1 semana, menos canto",
          peso: 0.015,
          hallazgos: "Alopecia localizada, estrés",
          diagnostico: "Picaje por estrés",
          tratamiento: "Cambio de jaula, suplemento vitamínico",
          created_at: tzDateTime("2026-06-04T15:45:00")
        }
      },
      historia: {
        create: {
          mascota_id: piolin!.id,
          atendido_por_id: vet2!.id,
          propietario_nombre: "Roberto Díaz Salinas",
          motivo_consulta: "Pérdida de plumas",
          diagnostico_presuntivo: "Estrés / Picaje",
          tratamiento: "Suplemento vitamínico, mejorar entorno",
          estado: "FINALIZADA",
          created_by_id: vet2!.id,
          finalized_by_id: vet2!.id,
          finalized_at: tzDateTime("2026-06-04T16:00:00"),
          fecha: tzDateTime("2026-06-04T15:00:00"),
        }
      }
    }
  });

  const rec4 = await prisma.reciboCaja.create({
    data: {
      num_recibo: genRecibo(),
      ficha_id: f5.id,
      cajero_id: cajero1!.id,
      punto_caja_id: cajaPrin!.id,
      total: 250,
      metodo_pago: "QR",
      monto_recibido: 250,
      cambio_devuelto: 0,
      estado: "PAGADO",
      fecha_pago: tzDateTime("2026-06-04T16:10:00"),
      detalles: {
        create: [
          { tipo: "SERVICIO", descripcion: servEspecialista!.nombre, precio_unit: 250, cantidad: 1, subtotal: 250 }
        ]
      }
    }
  });

  // -- Ficha 6: Luna, Control post-cirugía (Junio 5)
  const f6 = await prisma.fichaAtencion.create({
    data: {
      cod_ficha: genCod("C"),
      mascota_id: luna.id,
      doctor_id: vet2!.id,
      consultorio_id: salaCons2!.id,
      servicio_id: servGeneral!.id,
      creado_por_id: recep1!.id,
      motivo: "Control post-operatorio",
      estado: "COMPLETADA",
      prioridad: "NORMAL",
      estado_cobro: "EXENTO", // No se cobra control
      fecha_hora: tzDateTime("2026-06-05T14:30:00"),
      soap: {
        create: {
          motivo_detalle: "Retiro de puntos",
          anamnesis: "Herida seca, sin inflamación",
          peso: 22.8,
          temperatura: 38.5,
          hallazgos: "Cicatrización favorable",
          diagnostico: "Recuperación óptima",
          tratamiento: "Alta médica",
          created_at: tzDateTime("2026-06-05T14:50:00")
        }
      },
      historia: {
        create: {
          mascota_id: luna.id,
          atendido_por_id: vet2!.id,
          propietario_nombre: "Patricia Colque",
          motivo_consulta: "Control 30 días",
          diagnostico_presuntivo: "Alta médica",
          estado: "FINALIZADA",
          created_by_id: vet2!.id,
          finalized_by_id: vet2!.id,
          finalized_at: tzDateTime("2026-06-05T15:00:00"),
          fecha: tzDateTime("2026-06-05T14:30:00"),
          evoluciones: {
            create: [
              {
                descripcion: "Herida completamente cicatrizada. Se retiran puntos. Paciente dado de alta.",
                fecha: tzDateTime("2026-06-05T14:45:00")
              }
            ]
          }
        }
      }
    }
  });

  // Citas adicionales de Junio
  await prisma.cita.createMany({
    data: [
      { mascota_id: luna.id, doctor_id: vet2!.id, consultorio_id: salaCons2!.id, fecha_hora: tzDateTime("2026-06-05T14:30:00"), tipo: "CONTROL", motivo: "Control cirugía", estado: "COMPLETADA" },
      { mascota_id: piolin!.id, doctor_id: vet2!.id, consultorio_id: salaCons2!.id, fecha_hora: tzDateTime("2026-06-04T15:00:00"), tipo: "CONSULTA", motivo: "Apatía", estado: "COMPLETADA" },
      { mascota_id: rocky!.id, doctor_id: vet1!.id, consultorio_id: salaCons1!.id, fecha_hora: tzDateTime("2026-06-12T10:00:00"), tipo: "CONTROL", motivo: "Chequeo peso", estado: "NO_ASISTIO" },
      { mascota_id: max.id, doctor_id: vet1!.id, consultorio_id: salaCons1!.id, fecha_hora: tzDateTime("2026-06-15T09:00:00"), tipo: "VACUNACION", motivo: "Refuerzo", estado: "CANCELADA" },
    ]
  });

  // ===========================
  // 5. NOTIFICACIONES
  // ===========================
  await prisma.notificacion.createMany({
    data: [
      { usuario_id: prop4.id, tipo: "CITA", titulo: "Cita confirmada", mensaje: "Su cita para Luna el 06-05 ha sido confirmada." },
      { usuario_id: prop4.id, tipo: "SISTEMA", titulo: "Alta médica", mensaje: "Luna ha recibido el alta médica. ¡Felicidades!" },
      { usuario_id: prop5.id, tipo: "RECORDATORIO", titulo: "Vacunación Max", mensaje: "Recuerde la vacuna anual de Max para el 22-05." },
      { usuario_id: admin!.id, tipo: "SISTEMA", titulo: "Cierre de caja", mensaje: "Se realizó el cierre quincenal de mayo exitosamente." },
    ]
  });

  // ===========================
  // 6. BITÁCORA DE AUDITORÍA
  // ===========================
  await prisma.bitacora.createMany({
    data: [
      { usuario_id: vet1!.id, actor_email: vet1!.email, actor_nombre: vet1!.nombre, actor_rol: "VETERINARIO", accion: "LOGIN", descripcion: "Inicio de sesión", ip: "192.168.1.10", fecha_hora: tzDateTime("2026-05-04T08:00:00") },
      { usuario_id: recep1!.id, actor_email: recep1!.email, actor_nombre: recep1!.nombre, actor_rol: "RECEPCIONISTA", accion: "CREAR", entidad: "FichaAtencion", entidad_id: f1.id, descripcion: "Ficha creada para Rocky", ip: "192.168.1.12", fecha_hora: tzDateTime("2026-05-04T09:25:00") },
      { usuario_id: cajero1!.id, actor_email: cajero1!.email, actor_nombre: cajero1!.nombre, actor_rol: "CAJERO", accion: "CREAR", entidad: "ReciboCaja", entidad_id: rec1.id, descripcion: "Recibo emitido", ip: "192.168.1.15", fecha_hora: tzDateTime("2026-05-04T10:30:00") },
      { usuario_id: vet2!.id, actor_email: vet2!.email, actor_nombre: vet2!.nombre, actor_rol: "VETERINARIO", accion: "CREAR", entidad: "HistoriaClinica", descripcion: "Historia finalizada para Luna", ip: "192.168.1.11", fecha_hora: tzDateTime("2026-05-06T17:00:00") },
      { usuario_id: cajero1!.id, actor_email: cajero1!.email, actor_nombre: cajero1!.nombre, actor_rol: "CAJERO", accion: "CIERRE_CAJA", descripcion: "Cierre de caja quincenal", ip: "192.168.1.15", fecha_hora: tzDateTime("2026-05-15T18:00:00") },
    ]
  });

  // ===========================
  // 4B. DATOS DE JULIO 2026
  // ===========================

  // -- Ficha 7: Mishi, Pago de deuda pendiente (Julio 2)
  const rec5 = await prisma.reciboCaja.create({
    data: {
      num_recibo: genRecibo(),
      ficha_id: f4.id,
      cajero_id: cajero1!.id,
      punto_caja_id: cajaPrin!.id,
      total: 120, // Servicio Laboratorio
      metodo_pago: "EFECTIVO",
      monto_recibido: 150,
      cambio_devuelto: 30,
      estado: "PAGADO",
      fecha_pago: tzDateTime("2026-07-02T10:00:00"),
      detalles: {
        create: [
          { tipo: "SERVICIO", descripcion: servLab!.nombre, precio_unit: 120, cantidad: 1, subtotal: 120 }
        ]
      }
    }
  });

  await prisma.fichaAtencion.update({
    where: { id: f4.id },
    data: { estado_cobro: "PAGADO", estado: "COMPLETADA" }
  });

  // -- Ficha 8: Rocky, Emergencia (Julio 10)
  const f7 = await prisma.fichaAtencion.create({
    data: {
      cod_ficha: genCod("E"),
      mascota_id: rocky!.id,
      doctor_id: vet1!.id,
      consultorio_id: salaCirugia!.id,
      servicio_id: servGeneral!.id,
      creado_por_id: recep1!.id,
      motivo: "Vómitos y diarrea aguda",
      estado: "COMPLETADA",
      prioridad: "URGENTE",
      estado_cobro: "PAGADO",
      fecha_hora: tzDateTime("2026-07-10T20:30:00"),
      soap: {
        create: {
          motivo_detalle: "Vómitos severos desde hace 6 horas",
          anamnesis: "Posible intoxicación alimentaria",
          peso: 28.0,
          temperatura: 39.5,
          hallazgos: "Deshidratación moderada, dolor abdominal",
          diagnostico: "Gastroenteritis aguda",
          tratamiento: "Fluidoterapia y antieméticos",
          created_at: tzDateTime("2026-07-10T21:00:00")
        }
      },
      consumos: {
        create: [
          { producto_id: prodSuero!.id, cantidad: 2 }
        ]
      },
      historia: {
        create: {
          mascota_id: rocky!.id,
          atendido_por_id: vet1!.id,
          propietario_nombre: "Juan Vaca Quiroga",
          motivo_consulta: "Vómitos",
          diagnostico_presuntivo: "Gastroenteritis aguda",
          tratamiento: "Suero intravenoso, reposo gástrico",
          estado: "FINALIZADA",
          created_by_id: vet1!.id,
          finalized_by_id: vet1!.id,
          finalized_at: tzDateTime("2026-07-10T22:00:00"),
          fecha: tzDateTime("2026-07-10T20:30:00")
        }
      }
    }
  });

  const rec6 = await prisma.reciboCaja.create({
    data: {
      num_recibo: genRecibo(),
      ficha_id: f7.id,
      cajero_id: cajero1!.id,
      punto_caja_id: cajaPrin!.id,
      total: 180 + 50, // Consulta + 2 Sueros
      metodo_pago: "TARJETA",
      monto_recibido: 230,
      cambio_devuelto: 0,
      estado: "PAGADO",
      fecha_pago: tzDateTime("2026-07-10T22:15:00"),
      detalles: {
        create: [
          { tipo: "SERVICIO", descripcion: servGeneral!.nombre, precio_unit: 180, cantidad: 1, subtotal: 180 },
          { tipo: "SUMINISTRO", descripcion: prodSuero!.nombre, precio_unit: 25, cantidad: 2, subtotal: 50, producto_id: prodSuero!.id }
        ]
      }
    }
  });

  await prisma.kardexMovimiento.createMany({
    data: [
      { producto_id: prodSuero!.id, tipo: "SALIDA", cantidad: 2, saldo_final: prodSuero!.stock_actual - 2, motivo: `Consumo ficha ${f7.cod_ficha}`, created_at: tzDateTime("2026-07-10T22:15:00") }
    ]
  });

  // Cierre de Caja de Julio (31)
  await prisma.cierreCaja.create({
    data: {
      cajero_id: cajero1!.id,
      fecha_desde: tzDateTime("2026-07-01T00:00:00"),
      fecha_hasta: tzDateTime("2026-07-31T23:59:59"),
      total_efectivo: 120, // rec5
      total_tarjeta: 230, // rec6
      total_qr: 0, 
      total_general: 350,
      cantidad_recibos: 2,
      efectivo_contado: 120,
      diferencia: 0,
      observaciones: "Cierre fin de julio",
      created_at: tzDateTime("2026-07-31T18:00:00")
    }
  });

  // Notificaciones de Julio
  await prisma.notificacion.createMany({
    data: [
      { usuario_id: rocky!.propietario_id, tipo: "SISTEMA", titulo: "Seguimiento", mensaje: "Esperamos que Rocky se esté recuperando bien." },
    ]
  });

  console.log("✅ Datos transaccionales de Fichas, Citas, Cajas e Historias creados exitosamente");
}
