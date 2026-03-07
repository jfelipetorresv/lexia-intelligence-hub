import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const clientes = [
  { nombre: "Zurich Colombia Seguros S.A.", tipo: "ASEGURADORA" as const, plantillaInforme: "ZURICH" as const },
  { nombre: "Seguros Generales Suramericana S.A.", tipo: "ASEGURADORA" as const, plantillaInforme: "SURA" as const },
  { nombre: "Seguros del Estado S.A.", tipo: "ASEGURADORA" as const, plantillaInforme: "SEGUROS_DEL_ESTADO" as const },
  { nombre: "HDI Seguros S.A.", tipo: "ASEGURADORA" as const, plantillaInforme: "HDI" as const },
  { nombre: "Compañía Mundial de Seguros S.A.", tipo: "ASEGURADORA" as const, plantillaInforme: "MUNDIAL" as const },
  { nombre: "Chubb Seguros Colombia S.A.", tipo: "ASEGURADORA" as const, plantillaInforme: "CHUBB" as const },
  { nombre: "Alfa Seguros", tipo: "ASEGURADORA" as const, plantillaInforme: "GENERAL" as const },
  { nombre: "Allianz Seguros S.A.", tipo: "ASEGURADORA" as const, plantillaInforme: "GENERAL" as const },
  { nombre: "Confianza S.A.", tipo: "ASEGURADORA" as const, plantillaInforme: "GENERAL" as const },
  { nombre: "Seguros Nacional S.A.", tipo: "ASEGURADORA" as const, plantillaInforme: "GENERAL" as const },
  { nombre: "La Previsora S.A.", tipo: "ASEGURADORA" as const, plantillaInforme: "GENERAL" as const },
  { nombre: "S Estado - Generales", tipo: "ASEGURADORA" as const, plantillaInforme: "GENERAL" as const },
];

async function main() {
  const org = await prisma.organizacion.findFirst();
  if (!org) {
    console.error("No organization found. Create one first.");
    process.exit(1);
  }

  for (const c of clientes) {
    const existing = await prisma.cliente.findFirst({
      where: { nombre: c.nombre, organizacionId: org.id },
      select: { id: true },
    });

    if (existing) {
      await prisma.cliente.update({
        where: { id: existing.id },
        data: { plantillaInforme: c.plantillaInforme },
      });
      console.log(`Updated: ${c.nombre} -> ${c.plantillaInforme}`);
    } else {
      await prisma.cliente.create({
        data: {
          organizacionId: org.id,
          nombre: c.nombre,
          tipo: c.tipo,
          plantillaInforme: c.plantillaInforme,
        },
      });
      console.log(`Created: ${c.nombre} -> ${c.plantillaInforme}`);
    }
  }

  // Migrate existing proceso -> cliente relations to ProcesoCliente join table
  const procesos = await prisma.proceso.findMany({
    select: { id: true, clienteId: true },
  });

  for (const p of procesos) {
    const exists = await prisma.procesoCliente.findUnique({
      where: { procesoId_clienteId: { procesoId: p.id, clienteId: p.clienteId } },
    });
    if (!exists) {
      await prisma.procesoCliente.create({
        data: { procesoId: p.id, clienteId: p.clienteId },
      });
    }
  }
  console.log(`\nMigrated ${procesos.length} existing proceso-cliente relations to ProcesoCliente`);

  // Update plantillaInforme for existing clients that match known names
  const nameToPlantilla: Record<string, string> = {
    zurich: "ZURICH",
    suramericana: "SURA",
    sura: "SURA",
    "seguros del estado": "SEGUROS_DEL_ESTADO",
    hdi: "HDI",
    mundial: "MUNDIAL",
    chubb: "CHUBB",
  };

  const existingClients = await prisma.cliente.findMany({ select: { id: true, nombre: true } });
  for (const ec of existingClients) {
    const lower = ec.nombre.toLowerCase();
    for (const [key, plantilla] of Object.entries(nameToPlantilla)) {
      if (lower.includes(key)) {
        await prisma.cliente.update({
          where: { id: ec.id },
          data: { plantillaInforme: plantilla as any },
        });
        console.log(`Updated existing: "${ec.nombre}" -> ${plantilla}`);
        break;
      }
    }
  }

  console.log("\nSeed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
