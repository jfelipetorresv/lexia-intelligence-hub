-- CreateTable
CREATE TABLE "valor_smmlv" (
    "id" SERIAL NOT NULL,
    "anio" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "decreto" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "valor_smmlv_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "valor_smmlv_anio_key" ON "valor_smmlv"("anio");
