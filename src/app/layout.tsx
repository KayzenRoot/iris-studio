import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "IRIS Studio",
  description: "Seu estúdio local para criar sites completos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
