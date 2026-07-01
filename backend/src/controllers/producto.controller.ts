import { Request, Response } from "express";
import { ProductoService } from "../services/producto.service";
import { ErrorHandler } from "../middlewares/error.middleware";
import { bitacora, metaBitacora } from "../services/bitacora.singleton";

export class ProductoController {
  constructor(
    private readonly productoService: ProductoService,
    private readonly errors: ErrorHandler,
  ) {}

  getProductos = async (req: Request, res: Response) => {
    try {
      const { search, categoria_id } = req.query as Record<string, string>;
      const productos = await this.productoService.getProductos(
        search,
        categoria_id,
      );
      res.json(productos);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getProductoById = async (req: Request, res: Response) => {
    try {
      const producto = await this.productoService.getProductoById(
        req.params.id as string,
      );
      if (!producto) return this.errors.e404(req, res);
      res.json(producto);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  createProducto = async (req: Request, res: Response) => {
    try {
      const producto = await this.productoService.createProducto(req.body);
      res.status(201).json(producto);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateProducto = async (req: Request, res: Response) => {
    try {
      const producto = await this.productoService.updateProducto(
        req.params.id as string,
        req.body,
      );
      res.json(producto);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  deleteProducto = async (req: Request, res: Response) => {
    try {
      await this.productoService.deleteProducto(req.params.id as string);
      res.json({ ok: true });
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  ajustarStock = async (req: Request, res: Response) => {
    try {
      const { cantidad, tipo, motivo } = req.body;
      const producto = await this.productoService.ajustarStock(
        req.params.id as string,
        cantidad,
        tipo,
        motivo,
      );
      void bitacora.registrar({
        ...metaBitacora(req),
        accion: "ACTUALIZAR",
        entidad: "producto",
        entidad_id: req.params.id as string,
        descripcion: `Ajuste de stock (${tipo} ${cantidad}) en ${(producto as any)?.nombre ?? req.params.id}${motivo ? `: ${motivo}` : ""}`,
        datos_despues: {
          tipo,
          cantidad,
          motivo,
          stock_actual: (producto as any)?.stock_actual,
        },
      });
      res.json(producto);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
