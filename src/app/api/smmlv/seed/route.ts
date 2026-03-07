import { NextResponse } from "next/server";
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

export async function POST() {
  try {
    const results = [];
    for (const item of VALORES_SMMLV) {
      const record = await db.valorSMMLV.upsert({
        where: { anio: item.anio },
        update: { valor: item.valor, decreto: item.decreto },
        create: item,
      });
      results.push(record);
    }
    return NextResponse.json({ message: "Seed completado", count: results.length, results });
  } catch (error) {
    console.error("Error en seed SMMLV:", error);
    return NextResponse.json(
      { error: "Error al ejecutar seed SMMLV" },
      { status: 500 }
    );
  }
}
