import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { HdiInformeData } from "../../types/hdi";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingRight: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    fontFamily: "Helvetica",
    fontSize: 7.5,
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
  headerRight: {
    width: "40%",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerParaLabel: {
    fontSize: 6,
    color: "#8B8C8E",
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerClienteName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
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
    marginBottom: 10,
  },
  tableContainer: {
    borderTop: "0.5pt solid #E0E0E0",
    borderLeft: "0.5pt solid #E0E0E0",
    borderRight: "0.5pt solid #E0E0E0",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #E0E0E0",
  },
  labelCell: {
    width: "35%",
    backgroundColor: "#F5F5F5",
    padding: 4,
    borderRight: "0.5pt solid #E0E0E0",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#060606",
  },
  valueCell: {
    width: "65%",
    padding: 4,
    fontSize: 7.5,
    color: "#060606",
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.labelCell}>{label}</Text>
      <Text style={styles.valueCell}>{value}</Text>
    </View>
  );
}

export function HdiPDFDocument({ data }: { data: HdiInformeData }) {
  return (
    <Document
      title={`Informe de proceso — HDI — ${data.radicado}`}
      author="Lexia Abogados"
    >
      <Page size="A4" style={styles.page}>
        {/* Membrete */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.headerLogo}>LEXIA</Text>
            <Text style={styles.headerSubtitle}>ABOGADOS</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerParaLabel}>PARA:</Text>
            <Text style={styles.headerClienteName}>{data.clienteNombre}</Text>
          </View>
        </View>
        <View style={styles.tealLine} />

        {/* Titulo */}
        <Text style={styles.title}>INFORME DE PROCESO</Text>
        <Text style={styles.subtitle}>
          HDI Seguros S.A. (antes Liberty Seguros)
        </Text>

        {/* Tabla principal */}
        <View style={styles.tableContainer}>
          <Row label="Radicado" value={data.radicado} />
          <Row label="Juzgado / Tribunal / Arbitro" value={data.juzgado} />
          <Row label="Clase de proceso" value={data.claseProces} />
          <Row label="Jurisdiccion" value={data.jurisdiccion} />
          <Row label="Tipo de vinculacion" value={data.tipoVinculacion} />
          <Row label="Demandante" value={data.demandante} />
          <Row label="Demandado" value={data.demandado} />
          <Row label="Asegurado / Tomador" value={data.aseguradoTomador} />
          <Row label="Numero de poliza" value={data.numeroPoliza} />
          <Row label="Ramo" value={data.ramo} />
          <Row label="Fecha de notificacion de la demanda" value={data.fechaNotificacionDemanda} />
          <Row label="Fecha de notificacion de vinculacion a HDI" value={data.fechaNotificacionHdi} />
          <Row label="Fecha de contestacion" value={data.fechaContestacion} />
          <Row label="Pretensiones" value={data.pretensiones} />
          <Row label="Excepciones propuestas" value={data.excepcionesPropuestas} />
          <Row label="Estado actual del proceso" value={data.estadoActualProceso} />
          <Row label="Ultimas actuaciones" value={data.ultimasActuaciones} />
          <Row label="Proximos vencimientos" value={data.proximosVencimientos} />
          <Row label="Valor reclamado" value={data.valorReclamado} />
          <Row label="Estimacion de contingencia" value={data.estimacionContingencia} />
          <Row label="Valor propuesta conciliatoria" value={data.valorPropuestaConciliatoria} />
          <Row label="Observaciones del abogado" value={data.observacionesAbogado} />
        </View>

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
