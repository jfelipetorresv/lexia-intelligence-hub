import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const plantilla = await prisma.plantillaInforme.create({
    data: {
      nombre: "Informe de Estado — Aseguradoras y Empresas",
      tipoCliente: "aseguradora",
      descripcion:
        "Plantilla base para informes de estado de procesos dirigidos a aseguradoras y empresas. Incluye membrete, resumen ejecutivo, partes, póliza, hitos, vencimientos, análisis IA, contingencia y pie de página.",
      activa: true,
      secciones: [
        { id: "membrete", nombre: "Membrete Lexia", activa: true, orden: 1 },
        { id: "encabezado", nombre: "Encabezado del informe", activa: true, orden: 2 },
        { id: "resumen_ejecutivo", nombre: "Resumen ejecutivo del proceso", activa: true, orden: 3 },
        { id: "partes", nombre: "Partes procesales", activa: true, orden: 4 },
        { id: "poliza", nombre: "Póliza vinculada", activa: true, orden: 5 },
        { id: "hitos_recientes", nombre: "Últimos 5 hitos procesales", activa: true, orden: 6 },
        { id: "proximos_vencimientos", nombre: "Próximos vencimientos", activa: true, orden: 7 },
        { id: "analisis_ia", nombre: "Análisis IA", activa: true, orden: 8 },
        { id: "contingencia", nombre: "Estimación de contingencia", activa: true, orden: 9 },
        { id: "pie", nombre: "Pie de página y confidencialidad", activa: true, orden: 10 },
      ],
    },
  });

  console.log(`Plantilla creada: ${plantilla.id} — ${plantilla.nombre}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
