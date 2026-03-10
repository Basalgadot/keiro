import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import CartFab from "@/components/carrito/CartFab";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keiro — Compara precios de medicamentos y suplementos en Chile",
  description:
    "Compara precios reales de medicamentos y suplementos alimenticios en farmacias, MercadoLibre y más tiendas de Chile. Proteínas, vitaminas, magnesio y mucho más.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geist.variable} font-sans antialiased bg-surface text-grafito`}>
        <Header />
        <main>{children}</main>
        <CartFab />
      </body>
    </html>
  );
}
