import { Router } from 'express';
import * as ctrl from '../controllers/producto.controller';

const router = Router();

router.get('/', ctrl.getProductos);
router.post('/', ctrl.createProducto);
router.get('/:id', ctrl.getProductoById);
router.put('/:id', ctrl.updateProducto);
router.delete('/:id', ctrl.deleteProducto);
router.post('/:id/stock', ctrl.ajustarStock);

export default router;
