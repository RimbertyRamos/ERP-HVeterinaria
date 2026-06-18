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
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Públicas
router.use('/auth', authRoutes);       // login público; register protegido dentro del archivo
router.use('/chatbot', chatbotRoutes); // asistente de emergencias de acceso público

// Solo requieren sesión válida (cualquier usuario logueado)
router.use('/dashboard', authenticate, dashboardRoutes);
router.use('/mascotas', authenticate, mascotasRoutes);
router.use('/fichas', authenticate, fichasRoutes);
router.use('/catalogos', authenticate, catalogosRoutes);
router.use('/agenda', authenticate, agendaRoutes);
router.use('/laboratorio', authenticate, laboratorioRoutes);
router.use('/farmacia', authenticate, farmaciaRoutes);
router.use('/productos', authenticate, productosRoutes);

// Solo Administrador (todo el router)
router.use('/usuarios', authenticate, requireRole('Admin'), usuariosRoutes);

// Protección mixta (authenticate global + requireRole por ruta, definido en el archivo)
router.use('/consultorios', consultoriosRoutes);
router.use('/caja', cajaRoutes);

export default router;
