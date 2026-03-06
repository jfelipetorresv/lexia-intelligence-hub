-- CreateTable
CREATE TABLE "analisis_ia" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "contenidoRaw" TEXT NOT NULL,
    "resultado" JSONB NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'completado',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analisis_ia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "analisis_ia" ADD CONSTRAINT "analisis_ia_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
