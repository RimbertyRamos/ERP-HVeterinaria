import React, { useState, useEffect, useRef } from "react";
import { api } from "../utils/api";
import type {
  FichaAtencion,
  RegistroSOAP,
  ConsumoConsulta,
  Producto,
  CatalogoServicio,
  FichaServicio,
  HistoriaClinica,
} from "../types";
import {
  HistoriaClinicaFicha,
  type HistoriaFichaHandle,
} from "../components/HistoriaClinicaFicha";
import "./Consultation.scss";

function calcEdad(fechaNac?: string | null): string {
  if (!fechaNac) return "";
  const nac = new Date(fechaNac);
  if (isNaN(nac.getTime())) return "";
  const hoy = new Date();
  let anios = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth() - nac.getMonth();
  if (meses < 0) {
    anios--;
    meses += 12;
  }
  if (anios <= 0) return `${meses} mes(es)`;
  return meses > 0 ? `${anios} año(s) ${meses} mes(es)` : `${anios} año(s)`;
}

interface TabState {
  soap?: Partial<RegistroSOAP>;
  consumos: ConsumoConsulta[];
  servicios: FichaServicio[];
}

const Consultation: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rol = user?.rol?.nombre;

  const [fichas, setFichas] = useState<FichaAtencion[]>([]);
  const [selectedFicha, setSelectedFicha] = useState<FichaAtencion | null>(
    null,
  );
  const [tabs, setTabs] = useState<TabState>({
    consumos: [],
    servicios: [],
  });
  const [activeTab, setActiveTab] = useState<
    "historia" | "consumos" | "servicios"
  >("historia");
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showProductos, setShowProductos] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [historialFichas, setHistorialFichas] = useState<FichaAtencion[]>([]);
  const [completadas, setCompletadas] = useState<FichaAtencion[]>([]);
  const [catServicios, setCatServicios] = useState<CatalogoServicio[]>([]);
  const [historia, setHistoria] = useState<HistoriaClinica | null>(null);
  const historiaRef = useRef<HistoriaFichaHandle>(null);

  const isVeterinario = rol === "VETERINARIO";

  useEffect(() => {
    loadFichas();
    if (isVeterinario) {
      api
        .getProductos()
        .then((p) =>
          // Insumos/medicamentos administrables en consulta: todo menos alimentos.
          // (incluye MEDICAMENTO, INSUMO_MEDICO, VACUNA y productos sin categoría)
          setProductos(
            p.filter((x) => x.categoria?.tipo_item !== "ALIMENTO"),
          ),
        );
      api.getServiciosActivos().then(setCatServicios);
    }
    // Refresco silencioso para ver el estado de pago / liberación de sala al día.
    const interval = setInterval(() => loadFichas(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const loadFichas = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [enCurso, completadasRaw] = await Promise.all([
        api.getFichas({ estado: "EN_CURSO" }),
        api.getFichas({ estado: "COMPLETADA" }),
      ]);
      const mine = (arr: FichaAtencion[]) =>
        isVeterinario ? arr.filter((f) => f.doctor?.id === user.id) : arr;
      setFichas(mine(enCurso));
      setCompletadas(mine(completadasRaw).slice(0, 8));
    } catch (e: any) {
      console.error("Error cargando fichas:", e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadHistoria = async (ficha: FichaAtencion) => {
    try {
      let h = await api.getHistoriaByFicha(ficha.id);
      if (!h) {
        h = await api.createHistoria({
          mascota_id: ficha.mascota.id,
          ficha_id: ficha.id,
          propietario_nombre: ficha.mascota.propietario?.nombre,
          telefono: ficha.mascota.propietario?.telefono,
          edad: calcEdad(ficha.mascota.fecha_nacimiento),
        });
      }
      setHistoria(h);
    } catch (e) {
      console.error("Error cargando historia clínica:", e);
    }
  };

  const selectFicha = async (ficha: FichaAtencion) => {
    setSelectedFicha(ficha);
    setTabs({
      consumos: ficha.consumos || [],
      servicios: ficha.servicios_realizados || [],
    });
    setHistoria(null);
    if (isVeterinario && ficha.id) {
      loadHistoria(ficha);
      try {
        const [soapResult, consumosResult] = await Promise.allSettled([
          api.getSoap(ficha.id),
          api.getConsumos(ficha.id),
        ]);

        const soap =
          soapResult.status === "fulfilled" ? soapResult.value : undefined;
        const consumos =
          consumosResult.status === "fulfilled" ? consumosResult.value : [];

        setTabs((prev) => ({ ...prev, soap, consumos }));
        const prev3 = await api.getFichas({ estado: "COMPLETADA" });
        setHistorialFichas(
          prev3
            .filter((f: any) => f.mascota_id === ficha.mascota.id)
            .slice(0, 3),
        );
      } catch (e) {
        console.error("Error cargando detalles:", e);
      }
    }
  };

  const addConsumo = async (producto: Producto) => {
    if (!selectedFicha?.id) return;
    try {
      const consumo = await api.addConsumo(selectedFicha.id, {
        producto_id: producto.id,
        cantidad: 1,
      });
      setTabs((prev) => ({ ...prev, consumos: [...prev.consumos, consumo] }));
      setProductSearch("");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const removeConsumo = async (consumoId: string) => {
    if (!selectedFicha?.id) return;
    try {
      await api.removeConsumo(selectedFicha.id, consumoId);
      setTabs((prev) => ({
        ...prev,
        consumos: prev.consumos.filter((c) => c.id !== consumoId),
      }));
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const addServicio = async (servicio_id: string) => {
    if (!selectedFicha?.id || !servicio_id) return;
    try {
      const nuevo = await api.addFichaServicio(selectedFicha.id, {
        servicio_id,
      });
      setTabs((prev) => ({ ...prev, servicios: [...prev.servicios, nuevo] }));
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const removeServicio = async (id: string) => {
    if (!selectedFicha?.id) return;
    try {
      await api.removeFichaServicio(selectedFicha.id, id);
      setTabs((prev) => ({
        ...prev,
        servicios: prev.servicios.filter((s) => s.id !== id),
      }));
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const completarConsulta = async () => {
    if (!selectedFicha?.id) return;
    try {
      // Finaliza la historia clínica (guarda + bloquea) antes de cerrar el turno.
      if (historiaRef.current) {
        await historiaRef.current.commit(true);
      } else if (historia && historia.estado === "BORRADOR") {
        await api.finalizarHistoria(historia.id);
      }
      await api.completarFicha(selectedFicha.id);
      alert("Consulta completada");
      await loadFichas();
      setSelectedFicha(null);
      setHistoria(null);
      setTabs({ consumos: [], servicios: [] });
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  if (!isVeterinario) return <div>No tiene acceso a esta vista</div>;

  const precioServicio = selectedFicha
    ? Number(selectedFicha.servicio.precio_base)
    : 0;
  const totalServiciosRealizados = tabs.servicios.reduce(
    (s, x) => s + Number(x.precio) * x.cantidad,
    0,
  );
  const totalInsumos = tabs.consumos.reduce(
    (s, c) => s + Number(c.producto?.precio_venta ?? 0) * c.cantidad,
    0,
  );
  const totalConsulta =
    precioServicio + totalServiciosRealizados + totalInsumos;

  return (
    <div className="consultation">
      <div className="fichas-list">
        <h3>Consultas en curso</h3>
        {loading ? (
          <p>Cargando...</p>
        ) : fichas.length === 0 ? (
          <p>No hay consultas</p>
        ) : (
          <div className="fichas-grid">
            {fichas.map((f) => (
              <div
                key={f.id}
                className={`ficha-card ${selectedFicha?.id === f.id ? "active" : ""}`}
                onClick={() => selectFicha(f)}
              >
                <div className="mascota-name">{f.mascota.nombre}</div>
                <div className="propietario">
                  Dueño: {f.mascota.propietario.nombre}
                </div>
                <div className="estado">Estado: {f.estado}</div>
              </div>
            ))}
          </div>
        )}

        <h3 style={{ marginTop: 20 }}>Completadas — Estado de pago</h3>
        {completadas.length === 0 ? (
          <p style={{ opacity: 0.6 }}>Aún no hay consultas completadas.</p>
        ) : (
          <div className="fichas-grid">
            {completadas.map((f) => (
              <div
                key={f.id}
                className="ficha-card"
                style={{ cursor: "default" }}
              >
                <div className="mascota-name">{f.mascota.nombre}</div>
                <div className="propietario">
                  {f.cod_ficha} · {f.consultorio?.nombre ?? "Sin sala"}
                </div>
                <div className="estado">
                  Pago:{" "}
                  <strong
                    style={{
                      color:
                        f.estado_cobro === "PAGADO"
                          ? "#16a34a"
                          : f.estado_cobro === "EXENTO"
                            ? "#64748b"
                            : "#dc2626",
                    }}
                  >
                    {f.estado_cobro === "PAGADO"
                      ? "PAGADO ✓ (sala liberada)"
                      : f.estado_cobro === "EXENTO"
                        ? "EXENTO"
                        : "PENDIENTE DE COBRO"}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedFicha && isVeterinario && (
        <div className="consultation-panel">
          <div className="left-panel">
            <div className="patient-info">
              <h4>Datos del Paciente</h4>
              <p>
                <strong>Mascota:</strong> {selectedFicha.mascota.nombre}
              </p>
              <p>
                <strong>Especie:</strong> {selectedFicha.mascota.especie.nombre}
              </p>
              {selectedFicha.mascota.raza && (
                <p>
                  <strong>Raza:</strong> {selectedFicha.mascota.raza.nombre}
                </p>
              )}
              <p>
                <strong>Sexo:</strong> {selectedFicha.mascota.sexo}
              </p>
              {selectedFicha.mascota.alergias.length > 0 && (
                <p>
                  <strong>Alergias:</strong>{" "}
                  {selectedFicha.mascota.alergias
                    .map((a) => a.alergia.nombre)
                    .join(", ")}
                </p>
              )}
            </div>

            <div className="clinical-history">
              <h4>Historial Clínico (últimas 3 fichas)</h4>
              {historialFichas.length === 0 ? (
                <p>Sin historial previo</p>
              ) : (
                historialFichas.map((f) => (
                  <div key={f.id} className="history-item">
                    <p>
                      {new Date(f.fecha_hora).toLocaleDateString()} -{" "}
                      {f.servicio.nombre}
                    </p>
                    {f.soap?.diagnostico && (
                      <p className="diag">Diag: {f.soap.diagnostico}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="patient-info">
              <h4>Resumen de Cobro</h4>
              <p>
                <strong>{selectedFicha.servicio.nombre}:</strong> Bs.{" "}
                {precioServicio.toFixed(2)}
              </p>
              {tabs.servicios.map((s) => (
                <p key={s.id} style={{ opacity: 0.85 }}>
                  {s.servicio.nombre}
                  {s.cantidad > 1 ? ` x${s.cantidad}` : ""}: Bs.{" "}
                  {(Number(s.precio) * s.cantidad).toFixed(2)}
                </p>
              ))}
              {tabs.consumos.map((c) => (
                <p key={c.id} style={{ opacity: 0.85 }}>
                  {c.producto?.nombre} x{c.cantidad}: Bs.{" "}
                  {(Number(c.producto?.precio_venta ?? 0) * c.cantidad).toFixed(
                    2,
                  )}
                </p>
              ))}
              <p>
                <strong>Total: Bs. {totalConsulta.toFixed(2)}</strong>
              </p>
              <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                Al completar, este cobro pasa a Caja. La sala se libera
                automáticamente cuando el cajero registra el pago.
              </p>
            </div>
          </div>

          <div className="right-panel">
            <div className="tabs">
              <button
                className={`tab ${activeTab === "historia" ? "active" : ""}`}
                onClick={() => setActiveTab("historia")}
              >
                Historia Clínica
              </button>
              <button
                className={`tab ${activeTab === "consumos" ? "active" : ""}`}
                onClick={() => setActiveTab("consumos")}
              >
                Insumos
              </button>
              <button
                className={`tab ${activeTab === "servicios" ? "active" : ""}`}
                onClick={() => setActiveTab("servicios")}
              >
                Servicios
              </button>
            </div>

            <div className="tab-content">
              {/* Siempre montado (oculto si no es la pestaña activa) para no
                  perder lo escrito al cambiar de pestaña */}
              <div
                className={activeTab === "historia" ? "" : "hidden"}
                style={{ overflowY: "auto", maxHeight: "72vh" }}
              >
                {historia ? (
                  <HistoriaClinicaFicha
                    ref={historiaRef}
                    historia={historia}
                    mascota={selectedFicha.mascota}
                    readOnly={false}
                    onSaved={setHistoria}
                  />
                ) : (
                  <p>Cargando historia clínica…</p>
                )}
              </div>

              {activeTab === "consumos" && (
                <div className="consumos-form">
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Buscar producto o insumo… (clic para ver todos)"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      onFocus={() => setShowProductos(true)}
                      onBlur={() =>
                        setTimeout(() => setShowProductos(false), 150)
                      }
                    />
                    {showProductos &&
                      (() => {
                        const matches = productos.filter((p) =>
                          p.nombre
                            .toLowerCase()
                            .includes(productSearch.toLowerCase()),
                        );
                        return (
                          <div className="search-results">
                            {matches.length === 0 ? (
                              <div
                                className="search-result"
                                style={{ opacity: 0.6, cursor: "default" }}
                              >
                                {productos.length === 0
                                  ? "No hay productos en el inventario"
                                  : `Sin resultados para "${productSearch}"`}
                              </div>
                            ) : (
                              matches.map((p) => (
                                <div
                                  key={p.id}
                                  className="search-result"
                                  onClick={() => addConsumo(p)}
                                >
                                  {p.nombre} ({p.stock_actual} en stock)
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })()}
                  </div>
                  <div className="consumos-list">
                    {tabs.consumos.length === 0 ? (
                      <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>
                        Aún no se han agregado insumos a esta consulta.
                      </p>
                    ) : (
                      tabs.consumos.map((c) => (
                        <div key={c.id} className="consumo-item">
                          <span>
                            {c.producto.nombre} x{c.cantidad}
                          </span>
                          <button onClick={() => removeConsumo(c.id)}>✕</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "servicios" && (
                <div className="consumos-form">
                  <div style={{ marginBottom: 12 }}>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) addServicio(e.target.value);
                      }}
                      style={{ width: "100%" }}
                    >
                      <option value="">+ Agregar servicio realizado…</option>
                      {catServicios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} — Bs. {Number(s.precio_base).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="consumos-list">
                    {tabs.servicios.length === 0 ? (
                      <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>
                        Aún no se han agregado servicios a esta consulta.
                      </p>
                    ) : (
                      tabs.servicios.map((s) => (
                        <div key={s.id} className="consumo-item">
                          <span>
                            {s.servicio.nombre} — Bs.{" "}
                            {(Number(s.precio) * s.cantidad).toFixed(2)}
                          </span>
                          <button onClick={() => removeServicio(s.id)}>✕</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="btn-complete" onClick={completarConsulta}>
              Completar Consulta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultation;
