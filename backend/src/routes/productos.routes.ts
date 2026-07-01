import { Router } from "express";
import { productoController } from "../container";
import { validate } from "../middlewares/validate.middleware";
import {
  createProductoSchema,
  updateProductoSchema,
  ajustarStockSchema,
} from "../schemas/producto.schema";

const router = Router();

router.get("/", productoController.getProductos);
router.post("/", validate(createProductoSchema), productoController.createProducto);
router.get("/:id", productoController.getProductoById);
router.put("/:id", validate(updateProductoSchema), productoController.updateProducto);
router.delete("/:id", productoController.deleteProducto);
router.post(
  "/:id/stock",
  validate(ajustarStockSchema),
  productoController.ajustarStock,
);

export default router;
