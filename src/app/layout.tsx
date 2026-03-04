import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lexia Intelligence Hub",
  description:
    "SaaS para la gestión integral de firmas de abogados boutique en Colombia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
