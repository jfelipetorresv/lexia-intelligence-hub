// Seed script para valores históricos de SMMLV
// Ejecutar una sola vez: npx tsx src/lib/seedSMMLV.ts

import { db } from "@/lib/db";

const VALORES_SMMLV = [
  { anio: 2020, valor: 877803, decreto: "Decreto 2360 de 2019" },
  { anio: 2021, valor: 908526, decreto: "Decreto 1785 de 2020" },
  { anio: 2022, valor: 1000000, decreto: "Decreto 1619 de 2021" },
  { anio: 2023, valor: 1160000, decreto: "Decreto 2613 de 2022" },
  { anio: 2024, valor: 1300000, decreto: "Decreto 2292 de 2023" },
  { anio: 2025, valor: 1423500, decreto: "Decreto 2641 de 2024" },
  { anio: 2026, valor: 1750905, decreto: "Decreto 1469 del 29 dic 2025" },
];

async function seed() {
  console.log("Sembrando valores SMMLV...");
  for (const item of VALORES_SMMLV) {
    await db.valorSMMLV.upsert({
      where: { anio: item.anio },
      update: { valor: item.valor, decreto: item.decreto },
      create: item,
    });
    console.log(`  SMMLV ${item.anio}: $${item.valor.toLocaleString("es-CO")} — ${item.decreto}`);
  }
  console.log("Seed completado.");
}

seed()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
