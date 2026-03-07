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
  title: "Keiro — Compara precios de medicamentos en Chile",
  description:
    "Compara precios reales de medicamentos en Cruz Verde, Salcobrand, Ahumada, Dr. Simi y más farmacias de Chile. Ahorra en tus remedios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geist.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        <Header />
        <main>{children}</main>
        <CartFab />
      </body>
    </html>
  );
}
