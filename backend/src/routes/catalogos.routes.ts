import { Router } from 'express';
import * as ctrl from '../controllers/catalogo.controller';

const router = Router();

router.get('/especies', ctrl.getEspecies);
router.get('/razas', ctrl.getRazas);
router.get('/colores', ctrl.getColores);
router.get('/alergias', ctrl.getAlergias);
router.get('/servicios', ctrl.getServicios);
router.get('/examenes', ctrl.getExamenes);
router.get('/categorias', ctrl.getCategorias);
router.get('/roles', ctrl.getRoles);

export default router;
