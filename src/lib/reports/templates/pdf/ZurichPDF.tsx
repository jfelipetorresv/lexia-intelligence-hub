import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ZurichInformeData } from "../../types/zurich";

// ── Styles ────────────────────────────────────────────────

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
  // Membrete
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
  // Título
  title: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: "#060606",
    marginTop: 10,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#008080",
    marginBottom: 10,
  },
  // Tabla
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
  tableContainer: {
    borderTop: "0.5pt solid #E0E0E0",
    borderLeft: "0.5pt solid #E0E0E0",
    borderRight: "0.5pt solid #E0E0E0",
  },
  // Footer
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

// ── Row component ─────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.labelCell}>{label}</Text>
      <Text style={styles.valueCell}>{value}</Text>
    </View>
  );
}

// ── Main document ─────────────────────────────────────────

export function ZurichPDFDocument({ data }: { data: ZurichInformeData }) {
  const tipoLabel =
    data.tipoInforme === "INICIAL" ? "INFORME INICIAL" : "INFORME INTERMEDIO";

  return (
    <Document
      title={`${tipoLabel} — Zurich — ${data.radicado}`}
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

        {/* Título */}
        <Text style={styles.title}>{tipoLabel}</Text>
        <Text style={styles.subtitle}>
          ZÚRICH COLOMBIA SEGUROS S.A.
        </Text>

        {/* Tabla principal */}
        <View style={styles.tableContainer}>
          <Row label="DESPACHO" value={data.despacho} />
          <Row label="ABOGADO ASIGNADO" value={data.abogadoAsignado} />
          <Row label="WORKFLOW" value={data.workflow} />
          <Row label="RADICADO" value={data.radicado} />
          <Row label="INSTANCIA DE PROCESO" value={data.instancia} />
          <Row label="DEMANDANTE" value={data.demandante} />
          <Row label="VÍCTIMA DIRECTA" value={data.victimaDirecta} />
          <Row label="ID VÍCTIMA DIRECTA" value={data.idVictimaDirecta} />
          <Row label="DEMANDADO" value={data.demandado} />
          <Row
            label="LLAMADO EN GTÍA (TERCERO CIVILMENTE RESPONSABLE)"
            value={data.llamadoEnGarantia}
          />
          <Row label="PÓLIZA" value={data.poliza} />
          <Row label="VIGENCIA DE LA PÓLIZA" value={data.vigenciaPoliza} />
          <Row label="RAMO" value={data.ramo} />
          <Row label="AMPARO" value={data.amparo} />
          <Row label="VALOR ASEGURADO" value={data.valorAsegurado} />
          <Row label="ASEGURADO" value={data.asegurado} />
          <Row label="SINIESTRO" value={data.resumenSiniestro} />
          <Row label="FECHA SINIESTRO" value={data.fechaSiniestro} />
          <Row label="FECHA DE NOTIFICACION" value={data.fechaNotificacion} />
          <Row
            label="COASEGURO (SI – NO) O N/A"
            value={data.coaseguro}
          />
          <Row
            label="NOMBRE COASEGURADORES"
            value={data.nombreCoaseguradores ?? "N/A"}
          />
          <Row
            label="PARTICIPACION PORCENTAJE COASEGURADORES"
            value={data.participacionCoaseguradores ?? "N/A"}
          />
          <Row
            label="¿COASEGURADOR PARTICIPA DENTRO DEL PROCESO?"
            value={data.coaseguradorParticipa ?? "N/A"}
          />
          <Row
            label="FECHA DE LA PRESENTACIÓN DE LA DEMANDA (AUTO DE APERTURA)"
            value={data.fechaPresentacionDemanda}
          />
          <Row label="PLACA" value={data.placa ?? "N/A"} />
          <Row
            label="RESUMEN DE LA CONTINGENCIA"
            value={data.resumenContingencia}
          />
          <Row
            label="PRETENSIONES (O VALOR DETRIMENTO RF)"
            value={data.pretensiones}
          />
          <Row
            label="CALIFICACION ARGUMENTADA DE LA CONTINGENCIA (PROBABLE, EVENTUAL Y REMOTA)"
            value={data.calificacionContingencia}
          />
          <Row
            label="MOTIVOS DE LA CALIFICACION DE LA CONTINGENCIA"
            value={data.motivosCalificacion}
          />
          <Row
            label="PRETENSIONES OBJETIVADAS (LA VERDADERA EXPOSICIÓN DE LA COMPAÑÍA)"
            value={data.pretensionesObjetivadas}
          />
          <Row
            label="TRATÁNDOSE DE PROCESOS DE RF (MOTIVACIÓN PARA NO PRESENTAR ARGUMENTOS)"
            value={data.motivacionSinArgumentosDefensa ?? ""}
          />
          <Row
            label="CALIFICACIÓN DE LA CONTINGENCIA LUEGO DE AUTO DE IMPUTACIÓN (AI)"
            value={data.calificacionLuegoAutoImputacion ?? ""}
          />
          <Row
            label="MOTIVOS DE LA CALIFICACION DE LA CONTINGENCIA LUEGO DE AI"
            value={data.motivosLuegoAutoImputacion ?? ""}
          />
          <Row
            label="OBSERVACIONES GENERALES"
            value={data.observacionesGenerales ?? ""}
          />
          <Row
            label="CALIFICACIÓN FINAL DEL PROCESO"
            value={data.calificacionFinal ?? ""}
          />
          <Row label="RESERVA SUGERIDA" value={data.reservaSugerida} />
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLine} />
          <View style={styles.footerRow}>
            <Text>
              Lexia Abogados SAS | (317) 655-4145 | Av Cra 19 #100-45, WeWork,
              Bogotá
            </Text>
            <Text
              render={({ pageNumber }) => `Página ${pageNumber}`}
            />
            <Text>Documento confidencial</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
