// dotenv debe cargarse antes de importar la app (que construye el contenedor de DI).
import "dotenv/config";
import cron from "node-cron";
import app from "./app";
import { vacunaService } from "./container";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// RF14 — cron in-process: barrido diario de vencimientos de vacunas a las 08:00.
// NOTA: en Render el servicio puede dormirse; el endpoint POST /vacunas/
// revisar-vencimientos permite además dispararlo por un cron externo (Render Cron).
// Fail-safe: el service traga sus errores; el cron nunca tumba el servidor.
cron.schedule("0 8 * * *", () => {
  void vacunaService.revisarVencimientosVacunas();
});
