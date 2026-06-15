import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BondhuOS AI Command Center",
  description: "AI-powered CRM, Broadcast and Automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} h-screen flex overflow-hidden bg-black text-white`}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-black">
          {children}
        </main>
      </body>
    </html>
  );
}
