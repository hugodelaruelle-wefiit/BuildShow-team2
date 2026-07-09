import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Coach Soutenances — WeFiiT",
  description:
    "Entraînez-vous à pitcher : un coach IA joue le client sceptique et débriefe le fond et la forme de votre soutenance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col bg-blanc text-fg">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
