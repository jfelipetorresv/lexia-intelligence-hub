-- CreateTable
CREATE TABLE "chat_mensajes" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_mensajes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "chat_mensajes" ADD CONSTRAINT "chat_mensajes_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
