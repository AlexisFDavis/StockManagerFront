import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TooltipFormatter from "./components/TooltipFormatter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stock Manager - Sistema de Alquileres",
  description: "Sistema de gestión de stock y alquileres",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <TooltipFormatter />
        {children}
      </body>
    </html>
  );
}

