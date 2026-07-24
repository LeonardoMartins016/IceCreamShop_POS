import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Doce Sabor — PDV",
  description: "Sistema de Ponto de Venda da Sorveteria Doce Sabor",
  keywords: ["pdv", "sorveteria", "doce sabor", "ponto de venda"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-brand-bg">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 flex flex-col min-h-screen md:ml-64">
            {children}
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 500,
            },
            success: {
              iconTheme: { primary: "#C13B56", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
