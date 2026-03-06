-- CreateTable
CREATE TABLE "tareas_ia" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "analisisId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tareas_ia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tareas_ia" ADD CONSTRAINT "tareas_ia_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas_ia" ADD CONSTRAINT "tareas_ia_analisisId_fkey" FOREIGN KEY ("analisisId") REFERENCES "analisis_ia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
