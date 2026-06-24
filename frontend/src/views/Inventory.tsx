import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "../constants";
import { cn } from "../utils/cn";
import { api } from "../utils/api";
import { Producto, CategoriaProducto } from "../types";

type ModalMode = "none" | "create" | "edit" | "stock";

interface ProductoForm {
  nombre: string;
  descripcion: string;
  categoria_id: string;
  precio_venta: string;
  stock_actual: string;
  stock_minimo: string;
}

interface StockForm {
  tipo: "INGRESO" | "SALIDA";
  cantidad: string;
  motivo: string;
}

const EMPTY_FORM: ProductoForm = {
  nombre: "",
  descripcion: "",
  categoria_id: "",
  precio_venta: "",
  stock_actual: "0",
  stock_minimo: "5",
};

const tipoLabel = (tipo_item?: string) => {
  const map: Record<string, string> = {
    MEDICAMENTO: "MEDICAMENTO",
    INSUMO_MEDICO: "INSUMO",
    VACUNA: "VACUNA",
    ALIMENTO: "ALIMENTO",
  };
  return map[tipo_item ?? ""] ?? "OTRO";
};

const tipoColor = (tipo_item?: string) => {
  if (tipo_item === "MEDICAMENTO")
    return "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
  if (tipo_item === "VACUNA")
    return "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
  if (tipo_item === "INSUMO_MEDICO")
    return "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400";
  if (tipo_item === "ALIMENTO")
    return "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
};

const inputCls =
  "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-slate-100";
const labelCls =
  "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1";

export const Inventory: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("Todo");
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<ModalMode>("none");
  const [selected, setSelected] = useState<Producto | null>(null);
  const [form, setForm] = useState<ProductoForm>(EMPTY_FORM);
  const [stockForm, setStockForm] = useState<StockForm>({
    tipo: "INGRESO",
    cantidad: "",
    motivo: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getProductos(), api.getCategorias()])
      .then(([prods, cats]) => {
        setProductos(prods);
        setCategorias(cats);
      })
      .finally(() => setLoading(false));
  }, []);

  const reload = () => api.getProductos().then(setProductos);

  const categoriasNombres = [
    "Todo",
    ...Array.from(new Set(productos.map((p) => p.categoria.nombre))),
  ];

  const filtrados = productos.filter((p) => {
    const matchCat = filtro === "Todo" || p.categoria.nombre === filtro;
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const bajoStock = productos.filter(
    (p) => p.stock_actual <= p.stock_minimo,
  ).length;
  const valorInventario = productos.reduce(
    (s, p) => s + Number(p.precio_venta) * p.stock_actual,
    0,
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError("");
    setModal("create");
  };

  const openEdit = (p: Producto) => {
    setSelected(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      categoria_id: p.categoria_id ?? "",
      precio_venta: String(p.precio_venta),
      stock_actual: String(p.stock_actual),
      stock_minimo: String(p.stock_minimo),
    });
    setError("");
    setModal("edit");
  };

  const openStock = (p: Producto) => {
    setSelected(p);
    setStockForm({ tipo: "INGRESO", cantidad: "", motivo: "" });
    setError("");
    setModal("stock");
  };

  const closeModal = () => {
    setModal("none");
    setSelected(null);
    setError("");
  };

  const setField = (f: Partial<ProductoForm>) =>
    setForm((prev) => ({ ...prev, ...f }));

  const handleSaveProducto = async () => {
    if (!form.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    if (!form.precio_venta || Number(form.precio_venta) <= 0) {
      setError("El precio debe ser mayor a 0");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        categoria_id: form.categoria_id || undefined,
        precio_venta: Number(form.precio_venta),
        stock_actual: Number(form.stock_actual) || 0,
        stock_minimo: Number(form.stock_minimo) || 5,
      };
      if (modal === "create") {
        await api.createProducto(data);
      } else if (selected) {
        await api.updateProducto(selected.id, data);
      }
      await reload();
      closeModal();
    } catch {
      setError("Error al guardar el producto. Intente de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleAjustarStock = async () => {
    const cant = Number(stockForm.cantidad);
    if (!cant || cant <= 0) {
      setError("Ingrese una cantidad válida mayor a 0");
      return;
    }
    if (
      stockForm.tipo === "SALIDA" &&
      selected &&
      cant > selected.stock_actual
    ) {
      setError(
        `Stock insuficiente. Disponible: ${selected.stock_actual} unidades`,
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.ajustarStock(selected!.id, {
        cantidad: cant,
        tipo: stockForm.tipo,
        motivo: stockForm.motivo.trim() || undefined,
      });
      await reload();
      closeModal();
    } catch {
      setError("Error al ajustar el stock. Intente de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`))
      return;
    try {
      await api.deleteProducto(p.id);
      await reload();
    } catch {
      alert("Error al eliminar el producto.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Inventario
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Gestión de stock y suministros
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Icons.Download size={18} />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-slate-900 hover:bg-primary-dark transition-colors shadow-sm"
          >
            <Icons.Plus size={20} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
              <Icons.AlertTriangle size={18} />
            </div>
            {bajoStock > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                Atención
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm font-medium">Bajo Stock</p>
          <p className="text-2xl font-bold mt-1">
            {loading
              ? "—"
              : `${bajoStock} Producto${bajoStock !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/20 text-primary rounded-lg">
              <Icons.POS size={18} />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Valor Inventario</p>
          <p className="text-2xl font-bold mt-1">
            {loading ? "—" : `Bs.${valorInventario.toFixed(0)}`}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <Icons.FileText size={18} />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Productos</p>
          <p className="text-2xl font-bold mt-1">
            {loading ? "—" : productos.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
              <Icons.History size={18} />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Categorías</p>
          <p className="text-2xl font-bold mt-1">
            {loading ? "—" : categorias.length}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Icons.FileText className="text-primary" size={18} />
            Stock Detallado
          </h3>
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Icons.Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {categoriasNombres.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltro(cat)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                    filtro === cat
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Producto</th>
                  <th className="px-6 py-4 font-bold">Categoría</th>
                  <th className="px-6 py-4 font-bold">Tipo</th>
                  <th className="px-6 py-4 font-bold">Stock</th>
                  <th className="px-6 py-4 font-bold">Mínimo</th>
                  <th className="px-6 py-4 font-bold">Precio</th>
                  <th className="px-6 py-4 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-slate-400 text-sm"
                    >
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  filtrados.map((p) => {
                    const critico = p.stock_actual <= p.stock_minimo;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {p.nombre}
                          </span>
                          {p.descripcion && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {p.descripcion}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-[10px] font-bold rounded uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {p.categoria.nombre}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "px-2 py-1 text-[10px] font-bold rounded uppercase",
                              tipoColor(p.categoria.tipo_item),
                            )}
                          >
                            {tipoLabel(p.categoria.tipo_item)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-sm font-bold",
                                critico
                                  ? "text-red-600"
                                  : "text-slate-900 dark:text-slate-100",
                              )}
                            >
                              {p.stock_actual}
                            </span>
                            <div className="w-14 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  critico ? "bg-red-500" : "bg-primary",
                                )}
                                style={{
                                  width: `${Math.min((p.stock_actual / Math.max(p.stock_minimo * 2, 1)) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            {critico && (
                              <Icons.AlertTriangle
                                size={12}
                                className="text-red-500"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">
                          {p.stock_minimo}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">
                          Bs.{Number(p.precio_venta).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openStock(p)}
                              title="Ajustar stock"
                              className={cn(
                                "p-1.5 rounded-lg text-xs font-bold transition-colors",
                                critico
                                  ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                                  : "bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary dark:bg-slate-800",
                              )}
                            >
                              <Icons.History size={14} />
                            </button>
                            <button
                              onClick={() => openEdit(p)}
                              title="Editar producto"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 transition-colors"
                            >
                              <Icons.Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              title="Eliminar producto"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 transition-colors"
                            >
                              <Icons.Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modales ── */}
      <AnimatePresence>
        {(modal === "create" || modal === "edit") && (
          <ModalOverlay onClose={closeModal}>
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-slate-100">
              {modal === "create" ? "Nuevo Producto" : "Editar Producto"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nombre *</label>
                <input
                  className={inputCls}
                  placeholder="Ej: Amoxicilina 500mg"
                  value={form.nombre}
                  onChange={(e) => setField({ nombre: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>Descripción</label>
                <textarea
                  className={cn(inputCls, "resize-none")}
                  rows={2}
                  placeholder="Descripción opcional..."
                  value={form.descripcion}
                  onChange={(e) => setField({ descripcion: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>Categoría</label>
                <select
                  className={inputCls}
                  value={form.categoria_id}
                  onChange={(e) => setField({ categoria_id: e.target.value })}
                >
                  <option value="">— Sin categoría —</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Precio Venta (Bs.) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputCls}
                    placeholder="0.00"
                    value={form.precio_venta}
                    onChange={(e) => setField({ precio_venta: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    {modal === "create" ? "Stock Inicial" : "Stock Actual"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    placeholder="0"
                    value={form.stock_actual}
                    onChange={(e) => setField({ stock_actual: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Stock Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    placeholder="5"
                    value={form.stock_minimo}
                    onChange={(e) => setField({ stock_minimo: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProducto}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-slate-900 text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Icons.Save size={16} />
                {saving
                  ? "Guardando..."
                  : modal === "create"
                    ? "Crear Producto"
                    : "Guardar Cambios"}
              </button>
            </div>
          </ModalOverlay>
        )}

        {modal === "stock" && selected && (
          <ModalOverlay onClose={closeModal}>
            <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-slate-100">
              Ajustar Stock
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {selected.nombre}
              </span>
              {" · "}Stock actual:{" "}
              <span
                className={cn(
                  "font-bold",
                  selected.stock_actual <= selected.stock_minimo
                    ? "text-red-600"
                    : "text-slate-700 dark:text-slate-300",
                )}
              >
                {selected.stock_actual}
              </span>{" "}
              unidades
            </p>

            <div className="space-y-4">
              {/* Tipo de movimiento */}
              <div>
                <label className={labelCls}>Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["INGRESO", "SALIDA"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setStockForm((s) => ({ ...s, tipo: t }))}
                      className={cn(
                        "flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all",
                        stockForm.tipo === t
                          ? t === "INGRESO"
                            ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300",
                      )}
                    >
                      {t === "INGRESO" ? (
                        <>
                          <Icons.TrendingUp size={16} /> Ingreso
                        </>
                      ) : (
                        <>
                          <Icons.TrendingDown size={16} /> Salida
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Cantidad *</label>
                <input
                  type="number"
                  min="1"
                  className={inputCls}
                  placeholder="0"
                  value={stockForm.cantidad}
                  onChange={(e) =>
                    setStockForm((s) => ({ ...s, cantidad: e.target.value }))
                  }
                />
                {stockForm.tipo === "INGRESO" && stockForm.cantidad && (
                  <p className="text-xs text-green-600 mt-1">
                    Stock resultante:{" "}
                    {selected.stock_actual + (Number(stockForm.cantidad) || 0)}{" "}
                    unidades
                  </p>
                )}
                {stockForm.tipo === "SALIDA" && stockForm.cantidad && (
                  <p
                    className={cn(
                      "text-xs mt-1",
                      Number(stockForm.cantidad) > selected.stock_actual
                        ? "text-red-600"
                        : "text-slate-500",
                    )}
                  >
                    Stock resultante:{" "}
                    {selected.stock_actual - (Number(stockForm.cantidad) || 0)}{" "}
                    unidades
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>Motivo / Referencia</label>
                <input
                  className={inputCls}
                  placeholder="Ej: Compra a proveedor, ajuste de inventario..."
                  value={stockForm.motivo}
                  onChange={(e) =>
                    setStockForm((s) => ({ ...s, motivo: e.target.value }))
                  }
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAjustarStock}
                disabled={saving}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50",
                  stockForm.tipo === "INGRESO"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white",
                )}
              >
                {stockForm.tipo === "INGRESO" ? (
                  <Icons.TrendingUp size={16} />
                ) : (
                  <Icons.TrendingDown size={16} />
                )}
                {saving
                  ? "Guardando..."
                  : stockForm.tipo === "INGRESO"
                    ? "Registrar Ingreso"
                    : "Registrar Salida"}
              </button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface ModalOverlayProps {
  children: React.ReactNode;
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ type: "spring", duration: 0.3 }}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800"
    >
      {children}
    </motion.div>
  </motion.div>
);
