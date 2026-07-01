import { Router } from "express";
import authRoutes from "./auth.routes";
import mascotasRoutes from "./mascotas.routes";
import fichasRoutes from "./fichas.routes";
import consultoriosRoutes from "./consultorios.routes";
import productosRoutes from "./productos.routes";
import serviciosRoutes from "./servicios.routes";
import historiasRoutes from "./historias.routes";
import cajaRoutes from "./caja.routes";
import catalogosRoutes from "./catalogos.routes";
import dashboardRoutes from "./dashboard.routes";
import usuariosRoutes from "./usuarios.routes";
import agendaRoutes from "./agenda.routes";
import chatbotRoutes from "./chatbot.routes";
import landingRoutes from "./landing.routes";
import calificacionesRoutes from "./calificaciones.routes";
import notificacionesRoutes from "./notificaciones.routes";
import bitacoraRoutes from "./bitacora.routes";
import horariosRoutes from "./horarios.routes";
import vacunasRoutes from "./vacunas.routes";
import {
  authMiddleware,
  roleMiddleware,
  permissionMiddleware,
  usuariosController,
  bitacoraMiddleware,
} from "../container";
import { validate } from "../middlewares/validate.middleware";
import { changePasswordSchema } from "../schemas/usuarios.schema";

const router = Router();

// Auditoría automática de escrituras (registra en res.finish; ver middleware).
// Se monta antes de las rutas para enganchar todas las peticiones /api.
router.use(bitacoraMiddleware.capturar);

// Públicas
router.use("/auth", authRoutes); // login público; register protegido dentro del archivo
router.use("/chatbot", chatbotRoutes); // asistente de emergencias de acceso público
router.use("/", landingRoutes); // landing pública: /leads, /checkout, /checkout/verify

// Solo requieren sesión válida (cualquier usuario logueado)
router.use("/dashboard", authMiddleware.authenticate, dashboardRoutes);
router.use("/mascotas", authMiddleware.authenticate, mascotasRoutes);
router.use("/fichas", authMiddleware.authenticate, fichasRoutes);
router.use("/catalogos", authMiddleware.authenticate, catalogosRoutes);
router.use("/agenda", authMiddleware.authenticate, agendaRoutes);
router.use("/productos", authMiddleware.authenticate, productosRoutes);
router.use("/historias", historiasRoutes);
router.use(
  "/calificaciones",
  authMiddleware.authenticate,
  calificacionesRoutes,
);
router.use(
  "/notificaciones",
  authMiddleware.authenticate,
  notificacionesRoutes,
);

// Perfil del usuario autenticado (cualquier rol): cambiar su propia contraseña
router.patch(
  "/perfil/password",
  authMiddleware.authenticate,
  validate(changePasswordSchema),
  usuariosController.changeMyPassword,
);

// Solo Administrador (todo el router)
router.use(
  "/usuarios",
  authMiddleware.authenticate,
  roleMiddleware.require("Admin"),
  usuariosRoutes,
);

// Protección mixta (authenticate global + requireRole por ruta, definido en el archivo)
router.use("/consultorios", consultoriosRoutes);
router.use("/servicios", serviciosRoutes);
router.use("/caja", cajaRoutes);

// Bitácora / auditoría del sistema — solo quien tenga el permiso "bitacora.ver"
// (asignado al ADMIN en el seed). No se hardcodea el nombre del rol.
router.use(
  "/bitacora",
  authMiddleware.authenticate,
  permissionMiddleware.require("bitacora.ver"),
  bitacoraRoutes,
);

// Programación horaria de consultorios — el permiso "gestionar_horarios" se exige
// por ruta dentro del router.
router.use("/horarios", authMiddleware.authenticate, horariosRoutes);

// Recordatorios de vacunas (RF14) — la sesión y el rol Admin se exigen dentro del router.
router.use("/vacunas", vacunasRoutes);

export default router;
