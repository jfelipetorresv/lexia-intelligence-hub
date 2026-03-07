-- CreateTable
CREATE TABLE "plantillas_informe" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoCliente" TEXT NOT NULL,
    "descripcion" TEXT,
    "secciones" JSONB NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantillas_informe_pkey" PRIMARY KEY ("id")
);
