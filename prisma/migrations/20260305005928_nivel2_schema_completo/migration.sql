-- CreateEnum
CREATE TYPE "RolSistema" AS ENUM ('SUPER_ADMIN', 'ADMIN_ORG', 'SOCIO', 'ASOCIADO', 'ASISTENTE');

-- CreateEnum
CREATE TYPE "RolAbogado" AS ENUM ('SOCIO', 'ASOCIADO', 'ASISTENTE');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('ASEGURADORA', 'EMPRESA', 'PERSONA_NATURAL', 'ENTIDAD_PUBLICA', 'OTRO');

-- CreateEnum
CREATE TYPE "RamoPoliza" AS ENUM ('VIDA', 'AUTOS', 'RESPONSABILIDAD_CIVIL', 'CUMPLIMIENTO', 'SOAT', 'TODO_RIESGO', 'INCENDIO', 'TRANSPORTE', 'SALUD', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoProceso" AS ENUM ('CIVIL', 'CONTENCIOSO_ADMINISTRATIVO', 'ARBITRAL', 'LABORAL', 'PENAL', 'RESPONSABILIDAD_FISCAL', 'PROCEDIMIENTO_ADMINISTRATIVO_SANCIONATORIO', 'PASC', 'EJECUTIVO', 'DISCIPLINARIO', 'CONSTITUCIONAL', 'OTRO');

-- CreateEnum
CREATE TYPE "ClaseProceso" AS ENUM ('ORDINARIO', 'VERBAL', 'EJECUTIVO', 'NULIDAD_RESTABLECIMIENTO', 'REPARACION_DIRECTA', 'REPARACION_DIRECTA_CONTRACTUAL', 'ARBITRAMENTO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoProceso" AS ENUM ('ACTIVO', 'SUSPENDIDO', 'TRASLADO_PREVIO', 'TERMINADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "ResultadoProceso" AS ENUM ('FAVORABLE', 'DESFAVORABLE', 'PARCIAL', 'CONCILIADO', 'DESISTIDO', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "EstadoTermino" AS ENUM ('VERDE', 'NARANJA', 'ROJO');

-- CreateEnum
CREATE TYPE "RolEnCaso" AS ENUM ('LIDER', 'APOYO', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "TipoCalculo" AS ENUM ('INDEXACION_IPC', 'LUCRO_CESANTE', 'PERJUICIOS_MORALES', 'INTERESES_MORATORIOS');

-- CreateTable
CREATE TABLE "organizaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizacionId" TEXT NOT NULL,
    "rol" "RolSistema" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abogados" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "organizacionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" "RolAbogado" NOT NULL,
    "especialidad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abogados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "organizacionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "tipo" "TipoCliente" NOT NULL,
    "sector" TEXT,
    "contactoNombre" TEXT,
    "contactoEmail" TEXT,
    "contactoTel" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polizas" (
    "id" TEXT NOT NULL,
    "organizacionId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numeroPoliza" TEXT NOT NULL,
    "ramo" "RamoPoliza",
    "aseguradora" TEXT,
    "vigenciaDesde" TIMESTAMP(3),
    "vigenciaHasta" TIMESTAMP(3),
    "cobertura" DECIMAL(15,2),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polizas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procesos" (
    "id" TEXT NOT NULL,
    "organizacionId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "radicado" TEXT,
    "tipoProceso" "TipoProceso" NOT NULL,
    "claseProceso" "ClaseProceso",
    "juzgado" TEXT,
    "magistrado" TEXT,
    "ciudad" TEXT,
    "demandante" TEXT,
    "demandado" TEXT,
    "cuantia" DECIMAL(15,2),
    "estadoActual" "EstadoProceso" NOT NULL DEFAULT 'ACTIVO',
    "resultado" "ResultadoProceso" NOT NULL DEFAULT 'PENDIENTE',
    "fechaApertura" TIMESTAMP(3),
    "fechaCierre" TIMESTAMP(3),
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procesos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proceso_polizas" (
    "procesoId" TEXT NOT NULL,
    "polizaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proceso_polizas_pkey" PRIMARY KEY ("procesoId","polizaId")
);

-- CreateTable
CREATE TABLE "hitos_procesales" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "tipoActuacion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "documentoUrl" TEXT,
    "plazoVencimiento" TIMESTAMP(3),
    "estadoTermino" "EstadoTermino",
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hitos_procesales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "abogadoId" TEXT NOT NULL,
    "rolEnCaso" "RolEnCaso" NOT NULL,
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "asignaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_tiempo" (
    "id" TEXT NOT NULL,
    "abogadoId" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horas" DECIMAL(4,2) NOT NULL,
    "descripcion" TEXT,
    "facturable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_tiempo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT,
    "url" TEXT NOT NULL,
    "tamanio" INTEGER,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculos_financieros" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "tipo" "TipoCalculo" NOT NULL,
    "parametros" JSONB NOT NULL,
    "resultado" DECIMAL(20,2),
    "detalle" JSONB,
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calculos_financieros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizaciones_nit_key" ON "organizaciones"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_userId_key" ON "usuarios"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "abogados_usuarioId_key" ON "abogados"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "procesos_radicado_key" ON "procesos"("radicado");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_procesoId_abogadoId_key" ON "asignaciones"("procesoId", "abogadoId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abogados" ADD CONSTRAINT "abogados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abogados" ADD CONSTRAINT "abogados_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polizas" ADD CONSTRAINT "polizas_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polizas" ADD CONSTRAINT "polizas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procesos" ADD CONSTRAINT "procesos_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procesos" ADD CONSTRAINT "procesos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proceso_polizas" ADD CONSTRAINT "proceso_polizas_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proceso_polizas" ADD CONSTRAINT "proceso_polizas_polizaId_fkey" FOREIGN KEY ("polizaId") REFERENCES "polizas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hitos_procesales" ADD CONSTRAINT "hitos_procesales_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_abogadoId_fkey" FOREIGN KEY ("abogadoId") REFERENCES "abogados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_tiempo" ADD CONSTRAINT "registros_tiempo_abogadoId_fkey" FOREIGN KEY ("abogadoId") REFERENCES "abogados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_tiempo" ADD CONSTRAINT "registros_tiempo_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculos_financieros" ADD CONSTRAINT "calculos_financieros_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
