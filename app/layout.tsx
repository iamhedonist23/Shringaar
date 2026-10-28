import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shringaar — Imitation Jewellery",
    template: "%s | Shringaar",
  },
  description:
    "Explore imitation jewellery inspired by Indian craft, from everyday favourites to occasion-ready details.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
