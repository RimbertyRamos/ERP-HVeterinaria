import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Icons } from "../constants";
import { cn } from "../utils/cn";
import { api } from "../utils/api";
import { FichaPendiente, ReciboCaja } from "../types";
import { ArqueoModal } from "../components/ArqueoModal";

type MetodoPago = "EFECTIVO" | "TARJETA" | "QR";
type Tab = "CONSULTAS" | "VENTA_DIRECTA" | "HISTORIAL";
type FiltroPeriodo = "DIA" | "MES" | "ANIO";

interface Producto {
  id: string;
  nombre: string;
  precio_venta: number | string;
  stock_actual: number;
  categoria?: { nombre: string };
}

interface CartItem {
  producto: Producto;
  cantidad: number;
}

const calcTotalFicha = (ficha: FichaPendiente) => {
  let t = Number(ficha.servicio.precio_base);
  for (const s of ficha.servicios_realizados ?? [])
    t += Number(s.precio) * s.cantidad;
  for (const c of ficha.consumos ?? [])
    t += Number(c.producto.precio_venta) * c.cantidad;
  return t;
};

const buildLineasFicha = (ficha: FichaPendiente) => {
  const lines: { desc: string; subtotal: number; tipo: string }[] = [];
  lines.push({
    tipo: "SERVICIO",
    desc: ficha.servicio.nombre,
    subtotal: Number(ficha.servicio.precio_base),
  });
  for (const s of ficha.servicios_realizados ?? [])
    lines.push({
      tipo: "SERVICIO",
      desc:
        s.cantidad > 1
          ? `${s.servicio.nombre} x${s.cantidad}`
          : s.servicio.nombre,
      subtotal: Number(s.precio) * s.cantidad,
    });
  for (const c of ficha.consumos ?? [])
    lines.push({
      tipo: "SUMINISTRO",
      desc: `${c.producto.nombre} x${c.cantidad}`,
      subtotal: Number(c.producto.precio_venta) * c.cantidad,
    });
  return lines;
};

export const POS: React.FC = () => {
  const [tab, setTab] = useState<Tab>("CONSULTAS");

  // -- ESTADOS DE FICHA --
  const [fichas, setFichas] = useState<FichaPendiente[]>([]);
  const [loadingFichas, setLoadingFichas] = useState(true);
  const [selectedFicha, setSelectedFicha] = useState<FichaPendiente | null>(
    null,
  );
  const [recibos, setRecibos] = useState<ReciboCaja[]>([]);
  const [loadingRecibos, setLoadingRecibos] = useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>("DIA");
  const [fechaFiltro, setFechaFiltro] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [lastRecibo, setLastRecibo] = useState<ReciboCaja | null>(null);

  // -- ESTADOS DE VENTA DIRECTA --
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [nombreCliente, setNombreCliente] = useState("");

  // -- ESTADOS DE PAGO COMPARTIDOS --
  const [metodo, setMetodo] = useState<MetodoPago>("EFECTIVO");
  const [procesando, setProcesando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [arqueoOpen, setArqueoOpen] = useState(false);

  const fetchPendientes = useCallback(() => {
    setLoadingFichas(true);
    api
      .getCajaPendientes()
      .then(setFichas)
      .finally(() => setLoadingFichas(false));
  }, []);

  const fetchProductos = useCallback(() => {
    setLoadingProductos(true);
    api
      .getProductos()
      .then(setProductos)
      .finally(() => setLoadingProductos(false));
  }, []);

  const fetchRecibos = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const rol = user?.rol?.nombre;
    setLoadingRecibos(true);
    api
      .getRecibos()
      .then((data: ReciboCaja[]) => {
        if (rol === "CAJERO") {
          setRecibos(data.filter((r) => r.cajero?.id === user.id));
        } else {
          setRecibos(data);
        }
      })
      .finally(() => setLoadingRecibos(false));
  }, []);

  useEffect(() => {
    if (tab === "CONSULTAS") fetchPendientes();
    else if (tab === "VENTA_DIRECTA" && productos.length === 0)
      fetchProductos();
    else if (tab === "HISTORIAL") fetchRecibos();
  }, [tab, fetchPendientes, fetchProductos, fetchRecibos, productos.length]);

  // Cálculos totales
  const totalCart = cart.reduce(
    (acc, item) => acc + Number(item.producto.precio_venta) * item.cantidad,
    0,
  );
  const total =
    tab === "CONSULTAS"
      ? selectedFicha
        ? calcTotalFicha(selectedFicha)
        : 0
      : totalCart;
  const handleSeleccionarFicha = (f: FichaPendiente) => {
    setSelectedFicha(f);
    setMetodo("EFECTIVO");
    setExito(null);
    setError(null);
  };

  const handleAddToCart = (p: Producto) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.producto.id === p.id);
      if (existing) {
        if (existing.cantidad >= p.stock_actual) return prev; // No exceder stock
        return prev.map((i) =>
          i.producto.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      if (p.stock_actual <= 0) return prev;
      return [...prev, { producto: p, cantidad: 1 }];
    });
    setExito(null);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.producto.id !== id));
  };

  const handleCobrar = async () => {
    if (tab === "CONSULTAS" && !selectedFicha) return;
    if (tab === "VENTA_DIRECTA" && cart.length === 0) return;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setProcesando(true);
    setError(null);
    try {
      let res;
      if (tab === "CONSULTAS") {
        res = await api.cobrarFicha({
          ficha_id: selectedFicha!.id,
          cajero_id: user.id,
          metodo_pago: metodo,
          monto_recibido: total,
        });
      } else {
        res = await api.ventaDirecta({
          cajero_id: user.id,
          nombre_cliente: nombreCliente || undefined,
          metodo_pago: metodo,
          monto_recibido: total,
          productos: cart.map((c) => ({
            id: c.producto.id,
            cantidad: c.cantidad,
          })),
        });
      }

      if (res.error) {
        setError(res.error);
        return;
      }
      setExito(res.num_recibo);
      setLastRecibo(res);

      if (tab === "CONSULTAS") {
        setSelectedFicha(null);
        fetchPendientes();
      } else {
        setCart([]);
        setNombreCliente("");
        fetchProductos(); // Refrescar stock
      }
      fetchRecibos();
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setProcesando(false);
    }
  };

  const printRecibo = (recibo: ReciboCaja) => {
    const fecha = new Date(recibo.fecha_pago).toLocaleString();
    const lineas = (recibo.detalles ?? [])
      .map(
        (d) =>
          `<tr><td>${d.tipo}</td><td>${d.descripcion}</td><td style="text-align:right;">${d.cantidad}</td><td style="text-align:right;">Bs.${Number(d.subtotal).toFixed(2)}</td></tr>`,
      )
      .join("");
    const html = `
      <html><head><title>${recibo.num_recibo}</title>
      <style>body{font-family:Arial;padding:16px;color:#111}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ddd;padding:6px;font-size:12px}h2,h3{margin:0 0 8px 0}</style>
      </head><body>
      <h2>Hospital Veterinario Integral</h2>
      <h3>Recibo ${recibo.num_recibo}</h3>
      <p>Fecha: ${fecha}</p>
      <p>Cajero: ${recibo.cajero?.nombre ?? "-"}</p>
      <table><thead><tr><th>Tipo</th><th>Detalle</th><th>Cant.</th><th>Subtotal</th></tr></thead><tbody>${lineas}</tbody></table>
      <p style="text-align:right;font-weight:bold;margin-top:12px;">Total: Bs.${Number(recibo.total).toFixed(2)}</p>
      <p style="text-align:right;">Recibido: Bs.${Number(recibo.monto_recibido ?? 0).toFixed(2)}</p>
      <p style="text-align:right;">Cambio: Bs.${Number(recibo.cambio_devuelto ?? 0).toFixed(2)}</p>
      </body></html>`;
    const w = window.open("", "_blank", "width=800,height=700");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const recibosFiltrados = recibos.filter((r) => {
    const f = new Date(r.fecha_pago);
    const ref = new Date(fechaFiltro);
    if (Number.isNaN(f.getTime()) || Number.isNaN(ref.getTime())) return false;
    if (filtroPeriodo === "DIA") {
      return f.toISOString().slice(0, 10) === ref.toISOString().slice(0, 10);
    }
    if (filtroPeriodo === "MES") {
      return (
        f.getFullYear() === ref.getFullYear() && f.getMonth() === ref.getMonth()
      );
    }
    return f.getFullYear() === ref.getFullYear();
  });

  const fichasFiltradas = fichas.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.mascota.nombre.toLowerCase().includes(q) ||
      f.mascota.propietario.nombre.toLowerCase().includes(q) ||
      f.cod_ficha.toLowerCase().includes(q)
    );
  });

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.categoria?.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full overflow-hidden"
    >
      {arqueoOpen && <ArqueoModal onClose={() => setArqueoOpen(false)} />}

      {/* ── Izquierda: Lista ── */}
      <section className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto p-8">
        <header className="mb-6">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Caja Central
              </h2>
              <button
                onClick={() => setArqueoOpen(true)}
                title="Arqueo y cierre de caja"
                className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                <Icons.POS size={16} />
                Arqueo / Cierre
              </button>
            </div>
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setTab("CONSULTAS")}
                className={cn(
                  "px-4 py-1.5 text-sm font-bold rounded-md transition-colors",
                  tab === "CONSULTAS"
                    ? "bg-primary text-slate-900"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                )}
              >
                Cobrar Consultas
              </button>
              <button
                onClick={() => setTab("VENTA_DIRECTA")}
                className={cn(
                  "px-4 py-1.5 text-sm font-bold rounded-md transition-colors",
                  tab === "VENTA_DIRECTA"
                    ? "bg-primary text-slate-900"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                )}
              >
                Venta Directa
              </button>
              <button
                onClick={() => setTab("HISTORIAL")}
                className={cn(
                  "px-4 py-1.5 text-sm font-bold rounded-md transition-colors",
                  tab === "HISTORIAL"
                    ? "bg-primary text-slate-900"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                )}
              >
                Historial
              </button>
            </div>
          </div>

          <div className="mt-4 relative">
            <Icons.Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full pl-11 pr-4 py-3 rounded-xl border-none bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none"
              placeholder={
                tab === "CONSULTAS"
                  ? "Buscar por paciente, dueño o código..."
                  : tab === "VENTA_DIRECTA"
                    ? "Buscar producto..."
                    : "Buscar por nro recibo, cliente o cajero..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        {exito && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-5 py-4 text-emerald-700 dark:text-emerald-400">
            <Icons.CheckCircle2 size={20} />
            <span className="font-bold">
              Transacción exitosa — Recibo {exito} generado
            </span>
            {lastRecibo && (
              <button
                onClick={() => printRecibo(lastRecibo)}
                className="ml-2 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1"
              >
                <Icons.Printer size={14} /> Imprimir
              </button>
            )}
            <button onClick={() => setExito(null)} className="ml-auto">
              <Icons.X size={16} />
            </button>
          </div>
        )}

        {/* CONTENIDO SEGUN TAB */}
        {tab === "CONSULTAS" ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Fichas Pendientes de Cobro{" "}
              {fichas.length > 0 && `(${fichas.length})`}
            </h3>
            {loadingFichas ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl bg-white dark:bg-slate-900 animate-pulse"
                />
              ))
            ) : fichasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                <Icons.CheckCircle2 size={48} className="opacity-20" />
                <p className="font-medium">No hay fichas pendientes de cobro</p>
              </div>
            ) : (
              fichasFiltradas.map((f) => {
                const t = calcTotalFicha(f);
                const isActive = selectedFicha?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => handleSeleccionarFicha(f)}
                    className={cn(
                      "bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border-2 transition-all cursor-pointer",
                      isActive
                        ? "border-primary shadow-primary/20 shadow-md"
                        : "border-transparent hover:border-primary/30",
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <Icons.Patients size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">
                            {f.mascota.nombre}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Dueño: {f.mascota.propietario.nombre}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 font-mono">
                          {f.cod_ficha}
                        </span>
                        <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                          Bs.{t.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {f.servicio.nombre}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : tab === "VENTA_DIRECTA" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loadingProductos
              ? [...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-32 rounded-xl bg-white dark:bg-slate-900 animate-pulse"
                  />
                ))
              : productosFiltrados.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all flex flex-col h-full text-center group relative overflow-hidden"
                  >
                    {p.stock_actual <= 0 && (
                      <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                          AGOTADO
                        </span>
                      </div>
                    )}
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                      💊
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex-1">
                      {p.nombre}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono my-1">
                      {p.categoria?.nombre || "General"}
                    </p>
                    <div className="mt-auto flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-medium text-slate-400">
                        Stock: {p.stock_actual}
                      </span>
                      <span className="text-sm font-extrabold text-primary">
                        Bs.{Number(p.precio_venta).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <select
                value={filtroPeriodo}
                onChange={(e) =>
                  setFiltroPeriodo(e.target.value as FiltroPeriodo)
                }
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="DIA">Por día</option>
                <option value="MES">Por mes</option>
                <option value="ANIO">Por año</option>
              </select>
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
            {loadingRecibos ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-white dark:bg-slate-900 animate-pulse"
                />
              ))
            ) : recibosFiltrados.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                No hay pagos para ese filtro.
              </div>
            ) : (
              recibosFiltrados
                .filter((r) => {
                  const q = search.toLowerCase();
                  if (!q) return true;
                  return (
                    r.num_recibo.toLowerCase().includes(q) ||
                    (r.nombre_cliente ?? "").toLowerCase().includes(q) ||
                    (r.cajero?.nombre ?? "").toLowerCase().includes(q)
                  );
                })
                .map((r) => (
                  <div
                    key={r.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {r.num_recibo}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(r.fecha_pago).toLocaleString()} · Cajero:{" "}
                          {r.cajero?.nombre}
                        </p>
                        {r.nombre_cliente && (
                          <p className="text-xs text-slate-500">
                            Cliente: {r.nombre_cliente}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold">
                          Bs.{Number(r.total).toFixed(2)}
                        </p>
                        <button
                          onClick={() => printRecibo(r)}
                          className="mt-1 text-xs font-bold text-primary flex items-center gap-1"
                        >
                          <Icons.Printer size={12} /> Imprimir
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </section>

      {/* ── Derecha: checkout ── */}
      <aside className="w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Detalle del Cobro
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {tab === "CONSULTAS"
              ? selectedFicha
                ? `${selectedFicha.cod_ficha} — ${selectedFicha.mascota.nombre}`
                : "Seleccione una ficha"
              : "Venta Directa de mostrador"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {tab === "CONSULTAS" ? (
            !selectedFicha ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Icons.POS size={48} className="opacity-20" />
                <p className="text-sm font-medium text-center">
                  Selecciona una ficha
                  <br />
                  de la lista para cobrar
                </p>
              </div>
            ) : (
              buildLineasFicha(selectedFicha).map((l, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800"
                >
                  <div>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 uppercase",
                        l.tipo === "SERVICIO" &&
                          "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                        l.tipo === "LAB" &&
                          "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                        l.tipo === "FARMACIA" &&
                          "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
                      )}
                    >
                      {l.tipo}
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {l.desc}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Bs.{l.subtotal.toFixed(2)}
                  </span>
                </div>
              ))
            )
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <Icons.POS size={48} className="opacity-20" />
              <p className="text-sm font-medium text-center">
                Agrega productos
                <br />
                haciendo clic en ellos
              </p>
            </div>
          ) : (
            cart.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 group"
              >
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-1 pr-2">
                      {item.producto.nombre}
                    </span>
                    <button
                      onClick={() => handleRemoveFromCart(item.producto.id)}
                      className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icons.X size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] font-mono text-slate-500">
                      {item.cantidad} x Bs.
                      {Number(item.producto.precio_venta).toFixed(2)}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Bs.
                      {(
                        item.cantidad * Number(item.producto.precio_venta)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {((tab === "CONSULTAS" && selectedFicha) ||
          (tab === "VENTA_DIRECTA" && cart.length > 0)) && (
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 space-y-4">
            {tab === "VENTA_DIRECTA" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cliente (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Nombre de cliente sin registro"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-end py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
              <span className="text-base font-bold text-slate-900 dark:text-white">
                Total a Pagar
              </span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Bs.{total.toFixed(2)}
              </span>
            </div>

            {/* Método de pago */}
            <div className="grid grid-cols-3 gap-2">
              {(["EFECTIVO", "TARJETA", "QR"] as MetodoPago[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetodo(m)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg border-2 text-xs font-bold transition-all",
                    metodo === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/40",
                  )}
                >
                  {m === "EFECTIVO" && <Icons.POS size={18} className="mb-1" />}
                  {m === "TARJETA" && (
                    <Icons.CreditCard size={18} className="mb-1" />
                  )}
                  {m === "QR" && <Icons.QrCode size={18} className="mb-1" />}
                  {m}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleCobrar}
              disabled={procesando}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold text-base py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              {procesando ? (
                <div className="h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Procesar Pago</span>
                  <Icons.ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </motion.div>
  );
};
