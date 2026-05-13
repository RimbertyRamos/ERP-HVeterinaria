import { Router } from 'express';
import authRoutes from './auth.routes';
import mascotasRoutes from './mascotas.routes';
import fichasRoutes from './fichas.routes';
import consultoriosRoutes from './consultorios.routes';
import productosRoutes from './productos.routes';
import cajaRoutes from './caja.routes';
import laboratorioRoutes from './laboratorio.routes';
import catalogosRoutes from './catalogos.routes';
import dashboardRoutes from './dashboard.routes';
import usuariosRoutes from './usuarios.routes';
import agendaRoutes from './agenda.routes';
import chatbotRoutes from './chatbot.routes';
import farmaciaRoutes from './farmacia.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/mascotas', mascotasRoutes);
router.use('/fichas', fichasRoutes);
router.use('/consultorios', consultoriosRoutes);
router.use('/productos', productosRoutes);
router.use('/caja', cajaRoutes);
router.use('/laboratorio', laboratorioRoutes);
router.use('/catalogos', catalogosRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/agenda', agendaRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/farmacia', farmaciaRoutes);

export default router;
