import type { Metadata } from "next";
//import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/Auth";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import "./globals.css";
import { Montserrat } from "next/font/google";

//const inter = Inter({ subsets: ["latin"] });

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: [
    "100", "200", "300", "400", "500", "600", "700", "800", "900"
  ],
  style: ["normal", "italic"],
  variable: "--font-montserrat", // opzionale: variabile CSS
  display: "swap",
});

export const metadata: Metadata = {
  title: "MINT Agents",
  description: "AI-powered deep agent system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <AuthProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
