import { Router } from "express";
import { authController, authMiddleware, roleMiddleware } from "../container";
import { validate } from "../middlewares/validate.middleware";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

const router = Router();

router.post(
  "/register",
  authMiddleware.authenticate,
  roleMiddleware.require("Admin"),
  validate(registerSchema),
  authController.register,
);
router.post("/login", validate(loginSchema), authController.login);
// Logout: solo deja constancia en bitácora (el token se descarta en el cliente).
router.post("/logout", authMiddleware.authenticate, authController.logout);

export default router;
