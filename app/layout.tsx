import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMART Relatos | Análise de ocorrências",
  description: "Protótipo acadêmico de análise multimodal de possíveis ocorrências de alagamento.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
