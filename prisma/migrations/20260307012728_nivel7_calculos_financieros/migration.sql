/*
  Warnings:

  - You are about to drop the column `createdAt` on the `calculos_financieros` table. All the data in the column will be lost.
  - You are about to drop the column `detalle` on the `calculos_financieros` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `calculos_financieros` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `calculos_financieros` table. All the data in the column will be lost.
  - Added the required column `actualizadoEn` to the `calculos_financieros` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `calculos_financieros` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoCalculo` to the `calculos_financieros` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCalculado` to the `calculos_financieros` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resultado` to the `calculos_financieros` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "calculos_financieros" DROP COLUMN "createdAt",
DROP COLUMN "detalle",
DROP COLUMN "tipo",
DROP COLUMN "updatedAt",
ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nombre" TEXT NOT NULL,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "tipoCalculo" TEXT NOT NULL,
ADD COLUMN     "totalCalculado" DOUBLE PRECISION NOT NULL,
DROP COLUMN "resultado",
ADD COLUMN     "resultado" JSONB NOT NULL;

-- DropEnum
DROP TYPE "TipoCalculo";

-- CreateTable
CREATE TABLE "indice_ipc" (
    "id" SERIAL NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "fuente" TEXT NOT NULL DEFAULT 'DANE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indice_ipc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "indice_ipc_anio_mes_key" ON "indice_ipc"("anio", "mes");
