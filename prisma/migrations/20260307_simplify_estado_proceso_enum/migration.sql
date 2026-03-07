-- Update existing rows that use removed enum values
UPDATE "procesos" SET "estadoActual" = 'ACTIVO' WHERE "estadoActual" = 'SUSPENDIDO';
UPDATE "procesos" SET "estadoActual" = 'TERMINADO' WHERE "estadoActual" = 'ARCHIVADO';

-- Create new enum
CREATE TYPE "EstadoProceso_new" AS ENUM ('TRASLADO_PREVIO', 'ACTIVO', 'TERMINADO');

-- Drop default, alter column, re-add default
ALTER TABLE "procesos" ALTER COLUMN "estadoActual" DROP DEFAULT;
ALTER TABLE "procesos" ALTER COLUMN "estadoActual" TYPE "EstadoProceso_new" USING ("estadoActual"::text::"EstadoProceso_new");
ALTER TABLE "procesos" ALTER COLUMN "estadoActual" SET DEFAULT 'ACTIVO'::"EstadoProceso_new";

-- Drop old enum and rename new one
DROP TYPE "EstadoProceso";
ALTER TYPE "EstadoProceso_new" RENAME TO "EstadoProceso";
