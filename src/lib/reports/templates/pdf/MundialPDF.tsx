import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { MundialInformeData } from "../../types/mundial";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingRight: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#060606",
  },
  headerBar: {
    backgroundColor: "#060606",
    height: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  headerLogo: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 4,
  },
  headerSubtitle: {
    fontSize: 8,
    color: "#008080",
    letterSpacing: 6,
    marginTop: 2,
  },
  headerContact: {
    fontSize: 7,
    color: "#FFFFFF",
    textAlign: "right",
  },
  tealLine: {
    height: 2,
    backgroundColor: "#008080",
    marginBottom: 10,
  },
  title: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: "#008080",
    marginTop: 10,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#060606",
    marginBottom: 14,
  },
  separator: {
    height: 0.5,
    backgroundColor: "#E0E0E0",
    marginVertical: 6,
  },
  fieldLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#060606",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: 7.5,
    color: "#060606",
    marginBottom: 6,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
  },
  footerLine: {
    height: 1,
    backgroundColor: "#008080",
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.5,
    color: "#8B8C8E",
  },
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function Sep() {
  return <View style={styles.separator} />;
}

export function MundialPDFDocument({ data }: { data: MundialInformeData }) {
  const riesgoLabel =
    data.calificacionRiesgo === "PROBABLE"
      ? "[PROBABLE]  Eventual  Remota"
      : data.calificacionRiesgo === "EVENTUAL"
        ? "Probable  [EVENTUAL]  Remota"
        : "Probable  Eventual  [REMOTA]";

  return (
    <Document
      title={`Informe de proceso — Mundial — ${data.radicado}`}
      author="Lexia Abogados"
    >
      <Page size="A4" style={styles.page}>
        {/* Membrete */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.headerLogo}>LEXIA</Text>
            <Text style={styles.headerSubtitle}>ABOGADOS</Text>
          </View>
          <Text style={styles.headerContact}>
            www.lexia.co | info@lexia.co | (317) 655-4145
          </Text>
        </View>
        <View style={styles.tealLine} />

        {/* Titulo */}
        <Text style={styles.title}>INFORME DE PROCESO</Text>
        <Text style={styles.subtitle}>
          COMPAÑÍA MUNDIAL DE SEGUROS S.A.
        </Text>

        {/* Identificación */}
        <Field label="RADICADO" value={data.radicado} />
        <Field label="JUZGADO / TRIBUNAL / ÁRBITRO" value={data.juzgado} />
        <Field label="CLASE DE PROCESO" value={data.claseProceso} />
        <Sep />

        {/* Partes */}
        <Field label="DEMANDANTE" value={data.demandante} />
        <Field label="DEMANDADO" value={data.demandado} />
        <Field label="AFIANZADO" value={data.afianzado} />
        <Sep />

        {/* Póliza */}
        <Field label="SUCURSAL PÓLIZA" value={data.sucursalPoliza} />
        <Field label="NÚMERO DE PÓLIZA" value={data.numeroPoliza} />
        <Field label="OBJETO DE LA PÓLIZA" value={data.objetoPoliza} />
        <Field label="RAMO" value={data.ramo} />
        <Field label="VIGENCIA DE LA PÓLIZA" value={data.vigenciaPoliza} />
        <Field label="VALOR ASEGURADO" value={data.valorAsegurado} />
        <Sep />

        {/* Pretensiones y excepciones */}
        <Field label="PRETENSIONES" value={data.pretensiones} />
        <Field label="EXCEPCIONES PROPUESTAS" value={data.excepcionesPropuestas} />
        <Sep />

        {/* Calificación y estado */}
        <Field label="CALIFICACIÓN DE RIESGO" value={riesgoLabel} />
        <Field label="ESTADO ACTUAL" value={data.estadoActual} />
        <Field label="ÚLTIMAS ACTUACIONES" value={data.ultimasActuaciones} />
        <Field label="PRÓXIMOS VENCIMIENTOS" value={data.proximosVencimientos} />
        <Sep />

        {/* Cierre */}
        <Field label="PROPUESTA DE HONORARIOS" value={data.propuestaHonorarios} />
        <Field label="OBSERVACIONES" value={data.observaciones} />

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLine} />
          <View style={styles.footerRow}>
            <Text>
              Lexia Abogados SAS | (317) 655-4145 | Av Cra 19 #100-45, WeWork, Bogota
            </Text>
            <Text render={({ pageNumber }) => `Pagina ${pageNumber}`} />
            <Text>Documento confidencial</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
