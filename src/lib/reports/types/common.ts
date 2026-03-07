// Tipos compartidos entre todos los templates de reportes

export interface SeccionPlantilla {
  id: string;
  nombre: string;
  activa: boolean;
  orden: number;
}

export interface PlantillaConfig {
  id: string;
  nombre: string;
  tipoCliente: string;
  secciones: SeccionPlantilla[];
}

export type FormatoSalida = "pdf" | "docx";
