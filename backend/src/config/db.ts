import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  // Neon es una BD remota: cada round-trip suma latencia y las transacciones
  // interactivas (fichas, caja, historia) superan con facilidad el default de
  // 5 s. Se amplía el margen a nivel global.
  transactionOptions: {
    maxWait: 10000,
    timeout: 20000,
  },
});

export default prisma;
