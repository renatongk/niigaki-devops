import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CEASA SaaS - Controle de Compras",
  description: "Sistema multi-tenant para controle de compras do CEASA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
