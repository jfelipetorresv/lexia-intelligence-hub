import * as React from "react";

interface AlertaVencimientoProps {
  abogadoNombre: string;
  procesoNombre: string;
  radicado: string;
  tipoActuacion: string;
  fechaVencimiento: string;
  diasRestantes: number;
  estadoTermino: "ROJO" | "NARANJA";
  procesoUrl: string;
}

export function AlertaVencimientoEmail({
  abogadoNombre,
  procesoNombre,
  radicado,
  tipoActuacion,
  fechaVencimiento,
  diasRestantes,
  estadoTermino,
  procesoUrl,
}: AlertaVencimientoProps) {
  const isRojo = estadoTermino === "ROJO";

  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: 600,
    backgroundColor: isRojo ? "#fee2e2" : "#ffedd5",
    color: isRojo ? "#dc2626" : "#ea580c",
  };

  const badgeLabel = isRojo ? "Vencido / Urgente" : "Proximo a vencer";

  const diasTexto =
    diasRestantes < 0
      ? `Vencido hace ${Math.abs(diasRestantes)} dia${Math.abs(diasRestantes) !== 1 ? "s" : ""}`
      : diasRestantes === 0
        ? "Vence hoy"
        : `Vence en ${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""}`;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f4f4f5",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: "#f4f4f5" }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "32px 16px" }}>
                <table
                  role="presentation"
                  width="600"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    overflow: "hidden",
                    maxWidth: "600px",
                  }}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td
                        style={{
                          backgroundColor: "#060606",
                          padding: "24px 32px",
                        }}
                      >
                        <span
                          style={{
                            color: "#ffffff",
                            fontSize: "20px",
                            fontWeight: 700,
                            letterSpacing: "4px",
                            fontFamily: "Arial, Helvetica, sans-serif",
                          }}
                        >
                          LEXIA
                        </span>
                      </td>
                    </tr>

                    {/* Body */}
                    <tr>
                      <td style={{ padding: "32px" }}>
                        {/* Badge */}
                        <div style={{ marginBottom: "24px" }}>
                          <span style={badgeStyle}>{badgeLabel}</span>
                        </div>

                        {/* Greeting */}
                        <p
                          style={{
                            fontSize: "15px",
                            color: "#060606",
                            margin: "0 0 16px",
                            lineHeight: "1.5",
                          }}
                        >
                          Hola <strong>{abogadoNombre}</strong>,
                        </p>

                        <p
                          style={{
                            fontSize: "15px",
                            color: "#3f3f46",
                            margin: "0 0 24px",
                            lineHeight: "1.5",
                          }}
                        >
                          Tienes un termino procesal que requiere tu atencion
                          inmediata.
                        </p>

                        {/* Info table */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          style={{
                            backgroundColor: "#fafafa",
                            borderRadius: "6px",
                            marginBottom: "24px",
                          }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: "20px" }}>
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellPadding={0}
                                  cellSpacing={0}
                                >
                                  <tbody>
                                    <InfoRow
                                      label="Proceso"
                                      value={procesoNombre}
                                    />
                                    <InfoRow
                                      label="Radicado"
                                      value={radicado}
                                    />
                                    <InfoRow
                                      label="Actuacion"
                                      value={tipoActuacion}
                                    />
                                    <InfoRow
                                      label="Vencimiento"
                                      value={fechaVencimiento}
                                    />
                                    <InfoRow
                                      label="Estado"
                                      value={diasTexto}
                                      isLast
                                    />
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* CTA Button */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                        >
                          <tbody>
                            <tr>
                              <td align="center">
                                <a
                                  href={procesoUrl}
                                  style={{
                                    display: "inline-block",
                                    backgroundColor: "#008080",
                                    color: "#ffffff",
                                    padding: "12px 32px",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    fontFamily:
                                      "Arial, Helvetica, sans-serif",
                                  }}
                                >
                                  Ver proceso
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td
                        style={{
                          padding: "20px 32px",
                          borderTop: "1px solid #e4e4e7",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#a1a1aa",
                            margin: 0,
                            textAlign: "center" as const,
                            lineHeight: "1.6",
                          }}
                        >
                          Lexia Abogados &middot; Av Cra 19 #100-45 &middot;
                          Bogota &middot; lexia.co
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

function InfoRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <tr>
      <td
        style={{
          padding: isLast ? "0" : "0 0 10px",
          fontSize: "12px",
          fontWeight: 600,
          color: "#71717a",
          textTransform: "uppercase" as const,
          letterSpacing: "0.5px",
          width: "120px",
          verticalAlign: "top",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: isLast ? "0" : "0 0 10px",
          fontSize: "14px",
          color: "#060606",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {value}
      </td>
    </tr>
  );
}
