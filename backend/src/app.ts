// Carga las variables de entorno ANTES de cualquier import que las consuma.
// El composition root (container.ts, vía ./routes) lee process.env al instanciarse,
// por lo que dotenv debe ejecutarse primero — los imports corren en orden.
import "dotenv/config";
import express, { Application, Request, Response } from "express";
import { configureApp } from "./config/app.config";
import routes from "./routes";
import prisma from "./config/db";

const app: Application = express();

// Infraestructura: cors, parsers
configureApp(app);

// Healthcheck público (fuera de /api, sin auth): lo usa Render/monitoreo. Hace un
// chequeo ligero de la BD; el try/catch nunca lanza. Va ANTES de las rutas de la API.
app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: "error", db: "down" });
  }
});

// Rutas de la API
app.use("/api", routes);

export default app;
