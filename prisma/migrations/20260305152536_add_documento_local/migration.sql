-- CreateTable
CREATE TABLE "documentos_locales" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamano" INTEGER,
    "tipo" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_locales_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "documentos_locales" ADD CONSTRAINT "documentos_locales_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
