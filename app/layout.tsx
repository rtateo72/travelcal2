import type { Metadata } from "next";
import { Nunito, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TravelCal — Plan trips together",
  description: "Coordinate availability with your travel crew, effortlessly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${playfair.variable}`}>
      <body className="font-sans bg-sand-50 text-gray-900 antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              color: "#fff",
              borderRadius: "12px",
              fontFamily: "var(--font-nunito)",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}