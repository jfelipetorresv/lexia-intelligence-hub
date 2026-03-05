import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, RolSistema, RolAbogado, TipoCliente, TipoProceso, ClaseProceso, EstadoProceso, ResultadoProceso, RamoPoliza, RolEnCaso, EstadoTermino } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed de Lexia Intelligence Hub...')

  // 1. Organización
  const lexia = await prisma.organizacion.upsert({
    where: { nit: '900123456-1' },
    update: {},
    create: {
      nombre: 'Lexia Abogados SAS',
      nit: '900123456-1',
      email: 'contacto@lexia.co',
      telefono: '+57 601 1234567',
      activa: true,
    },
  })
  console.log('✅ Organización creada:', lexia.nombre)

  // 2. Clientes
  const sura = await prisma.cliente.upsert({
    where: { id: 'cliente-sura' },
    update: {},
    create: {
      id: 'cliente-sura',
      organizacionId: lexia.id,
      nombre: 'Seguros Sura SA',
      nit: '860002471-9',
      tipo: TipoCliente.ASEGURADORA,
      sector: 'Seguros',
      contactoNombre: 'María Fernanda Ríos',
      contactoEmail: 'mrios@sura.com.co',
      contactoTel: '+57 312 5550001',
    },
  })

  const liberty = await prisma.cliente.upsert({
    where: { id: 'cliente-liberty' },
    update: {},
    create: {
      id: 'cliente-liberty',
      organizacionId: lexia.id,
      nombre: 'Liberty Seguros SA',
      nit: '860006797-9',
      tipo: TipoCliente.ASEGURADORA,
      sector: 'Seguros',
      contactoNombre: 'Carlos Andrés Mejía',
      contactoEmail: 'cmejia@liberty.com.co',
      contactoTel: '+57 314 5550002',
    },
  })

  const constructora = await prisma.cliente.upsert({
    where: { id: 'cliente-constructora' },
    update: {},
    create: {
      id: 'cliente-constructora',
      organizacionId: lexia.id,
      nombre: 'Constructora Bolívar SA',
      nit: '860007386-7',
      tipo: TipoCliente.EMPRESA,
      sector: 'Construcción',
      contactoNombre: 'Andrés Felipe Torres',
      contactoEmail: 'atorres@constructorabolivar.com',
      contactoTel: '+57 310 5550003',
    },
  })
  console.log('✅ Clientes creados: Sura, Liberty, Constructora Bolívar')

  // 3. Pólizas
  const polizaSura = await prisma.poliza.upsert({
    where: { id: 'poliza-sura-rc' },
    update: {},
    create: {
      id: 'poliza-sura-rc',
      organizacionId: lexia.id,
      clienteId: sura.id,
      numeroPoliza: 'RC-2023-00456',
      ramo: RamoPoliza.RESPONSABILIDAD_CIVIL,
      aseguradora: 'Seguros Sura SA',
      vigenciaDesde: new Date('2023-01-01'),
      vigenciaHasta: new Date('2024-01-01'),
      cobertura: 500000000,
    },
  })

  const polizaLiberty = await prisma.poliza.upsert({
    where: { id: 'poliza-liberty-cum' },
    update: {},
    create: {
      id: 'poliza-liberty-cum',
      organizacionId: lexia.id,
      clienteId: liberty.id,
      numeroPoliza: 'CUM-2022-00789',
      ramo: RamoPoliza.CUMPLIMIENTO,
      aseguradora: 'Liberty Seguros SA',
      vigenciaDesde: new Date('2022-06-01'),
      vigenciaHasta: new Date('2023-06-01'),
      cobertura: 1200000000,
    },
  })
  console.log('✅ Pólizas creadas')

  // 4. Abogados (sin usuario por ahora — se vinculan en Nivel 10)
  const abogado1 = await prisma.abogado.upsert({
    where: { id: 'abogado-jft' },
    update: {},
    create: {
      id: 'abogado-jft',
      organizacionId: lexia.id,
      nombre: 'Juan Felipe Torres',
      email: 'jftorres@lexia.co',
      telefono: '+57 315 5550010',
      rol: RolAbogado.SOCIO,
      especialidad: 'Derecho de Seguros y CPACA',
      activo: true,
    },
  })

  const abogado2 = await prisma.abogado.upsert({
    where: { id: 'abogado-lmv' },
    update: {},
    create: {
      id: 'abogado-lmv',
      organizacionId: lexia.id,
      nombre: 'Laura Marcela Vargas',
      email: 'lmvargas@lexia.co',
      telefono: '+57 316 5550011',
      rol: RolAbogado.ASOCIADO,
      especialidad: 'Litigios Contencioso Administrativo',
      activo: true,
    },
  })

  const abogado3 = await prisma.abogado.upsert({
    where: { id: 'abogado-cam' },
    update: {},
    create: {
      id: 'abogado-cam',
      organizacionId: lexia.id,
      nombre: 'Camilo Andrés Mora',
      email: 'camora@lexia.co',
      telefono: '+57 317 5550012',
      rol: RolAbogado.ASISTENTE,
      especialidad: 'Apoyo Procesal',
      activo: true,
    },
  })
  console.log('✅ Abogados creados: Torres (Socio), Vargas (Asociado), Mora (Asistente)')

  // 5. Procesos
  const proceso1 = await prisma.proceso.upsert({
    where: { radicado: '11001333500120230012300' },
    update: {},
    create: {
      organizacionId: lexia.id,
      clienteId: sura.id,
      radicado: '11001333500120230012300',
      tipoProceso: TipoProceso.CONTENCIOSO_ADMINISTRATIVO,
      claseProceso: ClaseProceso.REPARACION_DIRECTA,
      juzgado: 'Tribunal Administrativo de Cundinamarca - Sección Tercera',
      magistrado: 'Dra. Patricia Inés Ojeda Morales',
      ciudad: 'Bogotá D.C.',
      demandante: 'Héctor Fabio Guzmán Pérez y otros',
      demandado: 'Nación - Ministerio de Transporte y Seguros Sura SA',
      cuantia: 850000000,
      estadoActual: EstadoProceso.ACTIVO,
      resultado: ResultadoProceso.PENDIENTE,
      fechaApertura: new Date('2023-03-15'),
      descripcion: 'Acción de reparación directa por accidente de tránsito en vía concesionada. Se demanda responsabilidad extracontractual del Estado y del asegurador.',
    },
  })

  const proceso2 = await prisma.proceso.upsert({
    where: { radicado: '05001233300020220034100' },
    update: {},
    create: {
      organizacionId: lexia.id,
      clienteId: liberty.id,
      radicado: '05001233300020220034100',
      tipoProceso: TipoProceso.CIVIL,
      claseProceso: ClaseProceso.ORDINARIO,
      juzgado: 'Juzgado 15 Civil del Circuito de Medellín',
      magistrado: 'Dr. Rodrigo Emilio Castillo',
      ciudad: 'Medellín',
      demandante: 'Constructora del Norte SAS',
      demandado: 'Liberty Seguros SA',
      cuantia: 1200000000,
      estadoActual: EstadoProceso.ACTIVO,
      resultado: ResultadoProceso.PENDIENTE,
      fechaApertura: new Date('2022-09-01'),
      descripcion: 'Proceso ordinario de mayor cuantía por incumplimiento de póliza de cumplimiento. El demandante reclama el amparo de anticipo no justificado.',
    },
  })

  const proceso3 = await prisma.proceso.upsert({
    where: { radicado: '11001334306220210098700' },
    update: {},
    create: {
      organizacionId: lexia.id,
      clienteId: constructora.id,
      radicado: '11001334306220210098700',
      tipoProceso: TipoProceso.CONTENCIOSO_ADMINISTRATIVO,
      claseProceso: ClaseProceso.NULIDAD_RESTABLECIMIENTO,
      juzgado: 'Consejo de Estado - Sección Primera',
      magistrado: 'Dr. Hernando Sánchez Sánchez',
      ciudad: 'Bogotá D.C.',
      demandante: 'Constructora Bolívar SA',
      demandado: 'Superintendencia de Industria y Comercio',
      cuantia: 320000000,
      estadoActual: EstadoProceso.TRASLADO_PREVIO,
      resultado: ResultadoProceso.PENDIENTE,
      fechaApertura: new Date('2021-04-20'),
      descripcion: 'Nulidad y restablecimiento del derecho contra acto administrativo sancionatorio de la SIC. Se impugna multa por presunta infracción a normas de protección al consumidor.',
    },
  })
  console.log('✅ Procesos creados: 3 expedientes')

  // 6. Vincular pólizas a procesos
  await prisma.procesoPoliza.upsert({
    where: { procesoId_polizaId: { procesoId: proceso1.id, polizaId: polizaSura.id } },
    update: {},
    create: { procesoId: proceso1.id, polizaId: polizaSura.id },
  })

  await prisma.procesoPoliza.upsert({
    where: { procesoId_polizaId: { procesoId: proceso2.id, polizaId: polizaLiberty.id } },
    update: {},
    create: { procesoId: proceso2.id, polizaId: polizaLiberty.id },
  })
  console.log('✅ Pólizas vinculadas a procesos')

  // 7. Asignaciones
  await prisma.asignacion.upsert({
    where: { procesoId_abogadoId: { procesoId: proceso1.id, abogadoId: abogado1.id } },
    update: {},
    create: { procesoId: proceso1.id, abogadoId: abogado1.id, rolEnCaso: RolEnCaso.LIDER },
  })
  await prisma.asignacion.upsert({
    where: { procesoId_abogadoId: { procesoId: proceso1.id, abogadoId: abogado2.id } },
    update: {},
    create: { procesoId: proceso1.id, abogadoId: abogado2.id, rolEnCaso: RolEnCaso.APOYO },
  })
  await prisma.asignacion.upsert({
    where: { procesoId_abogadoId: { procesoId: proceso2.id, abogadoId: abogado2.id } },
    update: {},
    create: { procesoId: proceso2.id, abogadoId: abogado2.id, rolEnCaso: RolEnCaso.LIDER },
  })
  await prisma.asignacion.upsert({
    where: { procesoId_abogadoId: { procesoId: proceso3.id, abogadoId: abogado1.id } },
    update: {},
    create: { procesoId: proceso3.id, abogadoId: abogado1.id, rolEnCaso: RolEnCaso.SUPERVISOR },
  })
  await prisma.asignacion.upsert({
    where: { procesoId_abogadoId: { procesoId: proceso3.id, abogadoId: abogado3.id } },
    update: {},
    create: { procesoId: proceso3.id, abogadoId: abogado3.id, rolEnCaso: RolEnCaso.APOYO },
  })
  console.log('✅ Asignaciones creadas')

  // 8. Hitos procesales
  await prisma.hitoProcesal.createMany({
    data: [
      {
        procesoId: proceso1.id,
        tipoActuacion: 'Admisión de la demanda',
        fecha: new Date('2023-04-10'),
        descripcion: 'Auto admisorio de la demanda. Notificado al Ministerio de Transporte y a Seguros Sura.',
        estadoTermino: EstadoTermino.VERDE,
        notificado: true,
      },
      {
        procesoId: proceso1.id,
        tipoActuacion: 'Contestación de la demanda',
        fecha: new Date('2023-06-15'),
        descripcion: 'Presentada contestación de la demanda con excepciones de mérito. Propuesta excepción de falta de legitimación en la causa.',
        estadoTermino: EstadoTermino.VERDE,
        notificado: true,
      },
      {
        procesoId: proceso1.id,
        tipoActuacion: 'Audiencia inicial',
        fecha: new Date('2024-02-20'),
        descripcion: 'Audiencia inicial programada. Pendiente fijación de litigio y decreto de pruebas.',
        plazoVencimiento: new Date('2024-02-20'),
        estadoTermino: EstadoTermino.NARANJA,
        notificado: false,
      },
      {
        procesoId: proceso2.id,
        tipoActuacion: 'Notificación del auto admisorio',
        fecha: new Date('2022-10-05'),
        descripcion: 'Liberty Seguros SA notificada personalmente del auto admisorio.',
        estadoTermino: EstadoTermino.VERDE,
        notificado: true,
      },
      {
        procesoId: proceso2.id,
        tipoActuacion: 'Vencimiento traslado de excepciones',
        fecha: new Date('2024-03-15'),
        descripcion: 'Vence el término para pronunciarse sobre las excepciones de mérito propuestas por la demandada.',
        plazoVencimiento: new Date('2024-03-15'),
        estadoTermino: EstadoTermino.ROJO,
        notificado: false,
      },
      {
        procesoId: proceso3.id,
        tipoActuacion: 'Traslado previo para alegatos',
        fecha: new Date('2024-01-08'),
        descripcion: 'Proceso en traslado para que las partes presenten alegatos de conclusión. Término: 10 días hábiles.',
        plazoVencimiento: new Date('2024-01-22'),
        estadoTermino: EstadoTermino.NARANJA,
        notificado: true,
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Hitos procesales creados')

  console.log('\n🎉 Seed completado exitosamente.')
  console.log('   Organización: 1')
  console.log('   Clientes: 3')
  console.log('   Pólizas: 2')
  console.log('   Abogados: 3')
  console.log('   Procesos: 3')
  console.log('   Hitos procesales: 6')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
